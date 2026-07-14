/**
 * @module filesystem
 * Renderer-side access to chat logs, per-character settings, and drafts.
 *
 * * All file IO lives in the main process (electron/filesystem-host.ts);
 * * this module proxies over IPC and only reattaches live character objects
 * * to the plain records that come back.
 */

import { ipcRenderer } from './host-bridge';
import { Message as MessageImpl } from '../chat/common';
import core from '../chat/core';
import { Conversation, Logs as Logging, Settings } from '../chat/interfaces';
import l from '../chat/localize';
import { GeneralSettings } from './common';
import type { PlainLogMessage } from './log-format';

declare module '../chat/interfaces' {
  interface State {
    generalSettings?: GeneralSettings;
  }
}

export type Message =
  | Conversation.EventMessage
  | Conversation.BcastMessage
  | {
      readonly sender: { readonly name: string };
      readonly text: string;
      readonly time: Date;
      readonly type: Conversation.Message.Type;
    };

function toMessage(plain: PlainLogMessage): Conversation.Message {
  return new MessageImpl(
    <Conversation.Message.Type>plain.type,
    core.characters.get(plain.sender),
    plain.text,
    new Date(plain.time)
  );
}

function alertCorruption(e: unknown): void {
  console.error(e);
  core.notifications.alert(l('logs.corruption.desktop'));
}

export async function fixLogs(character: string): Promise<void> {
  await ipcRenderer.invoke('logs-fix', character);
}

export class Logs implements Logging {
  canZip = true;

  constructor() {
    core.connection.onEvent('connecting', async () => {
      const hadErrors = <boolean>(
        await ipcRenderer.invoke('logs-init', core.connection.character)
      );
      if (hadErrors) core.notifications.alert(l('logs.corruption.desktop'));
    });
  }

  async getBacklog(
    conversation: Conversation
  ): Promise<ReadonlyArray<Conversation.Message>> {
    try {
      const plain = <PlainLogMessage[]>(
        await ipcRenderer.invoke(
          'logs-get-backlog',
          core.connection.character,
          conversation.key
        )
      );
      return plain.map(toMessage);
    } catch (e) {
      alertCorruption(e);
      return [];
    }
  }

  async getLogDates(
    character: string,
    key: string
  ): Promise<ReadonlyArray<Date>> {
    const dates = <number[]>(
      await ipcRenderer.invoke('logs-get-log-dates', character, key)
    );
    return dates.map(time => new Date(time));
  }

  async getLogs(
    character: string,
    key: string,
    date: Date
  ): Promise<ReadonlyArray<Conversation.Message>> {
    try {
      const plain = <PlainLogMessage[]>(
        await ipcRenderer.invoke(
          'logs-get-logs',
          character,
          key,
          date.getTime()
        )
      );
      return plain.map(toMessage);
    } catch (e) {
      alertCorruption(e);
      return [];
    }
  }

  logMessage(
    conversation: { key: string; name: string },
    message: Message
  ): void {
    const plain: PlainLogMessage = {
      type: message.type,
      sender:
        message.type !== Conversation.Message.Type.Event
          ? message.sender.name
          : '',
      text: message.text,
      time: message.time.getTime()
    };
    ipcRenderer.send(
      'logs-log-message',
      core.connection.character,
      { key: conversation.key, name: conversation.name },
      plain
    );
  }

  async getConversations(
    character: string
  ): Promise<ReadonlyArray<{ key: string; name: string }>> {
    return ipcRenderer.invoke('logs-get-conversations', character);
  }

  async getAvailableCharacters(): Promise<ReadonlyArray<string>> {
    return ipcRenderer.invoke('logs-get-available-characters');
  }
}

export class SettingsStore implements Settings.Store {
  async get<K extends keyof Settings.Keys>(
    key: K,
    character: string = core.connection.character
  ): Promise<Settings.Keys[K] | undefined> {
    try {
      const raw = <string | undefined>(
        await ipcRenderer.invoke('settings-get', character, key)
      );
      if (raw === undefined) return undefined;
      return <Settings.Keys[K]>JSON.parse(raw);
    } catch (e) {
      console.error('READ KEY FAILURE', e, key, character);
      return undefined;
    }
  }

  async getAvailableCharacters(): Promise<ReadonlyArray<string>> {
    return ipcRenderer.invoke('logs-get-available-characters');
  }

  async set<K extends keyof Settings.Keys>(
    key: K,
    value: Settings.Keys[K]
  ): Promise<void> {
    await ipcRenderer.invoke(
      'settings-set',
      core.connection.character,
      key,
      JSON.stringify(value)
    );
  }
}

/**
 * Directly fetch the previously saved drafts from disk and return the
 * resulting object to the cache. Synchronous because the draft cache loads
 * it inline during connect; the file is small.
 * @internal
 */
export function getDrafts(): any {
  const raw = <string | null>(
    ipcRenderer.sendSync('drafts-get-sync', core.connection.character)
  );
  //tslint:disable-next-line:no-null-keyword
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error encountered when parsing drafts: ${e}`);
    return null; //tslint:disable-line:no-null-keyword
  }
}

/** Persists the conversation draft cache as raw JSON. @internal */
export async function saveDrafts(drafts: any): Promise<void> {
  ipcRenderer.send(
    'drafts-set',
    core.connection.character,
    JSON.stringify(drafts)
  );
}

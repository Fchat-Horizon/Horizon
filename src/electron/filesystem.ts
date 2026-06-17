/**
 * @module filesystem
 * Renderer-side access to chat logs, per-character settings, and drafts.
 *
 * * All file IO lives in the main process (electron/filesystem-host.ts);
 * * this module proxies over IPC and only reattaches live character objects
 * * to the plain records that come back.
 */

import { ipcRenderer } from 'electron';
import { Message as MessageImpl } from '@horizon/shared/chat/common';
import core from '@horizon/shared/chat/core';
import {
  Conversation,
  Logs as Logging,
  Settings
} from '@horizon/shared/chat/interfaces';
import l from '@horizon/shared/chat/localize';
import { GeneralSettings } from '@horizon/shared/common';
import type { PlainLogMessage } from './log-format';

declare module '@horizon/shared/chat/interfaces' {
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

import * as _ from 'lodash';

import { Message as MessageImpl } from '../chat/common';
import core from '../chat/core';
import { Conversation, Logs as Logging, Settings } from '../chat/interfaces';
import l from '../chat/localize';

declare global {
  const NativeFile: {
    read(name: string): Promise<string | undefined>;
    write(name: string, data: string): Promise<void>;
    listDirectories(name: string): Promise<string[]>;
    listFiles(name: string): Promise<string[]>;
    getSize(name: string): Promise<number>;
    ensureDirectory(name: string): Promise<void>;
  };
  type NativeMessage = {
    time: number;
    type: number;
    sender: string;
    text: string;
  };
  const NativeLogs: {
    init(character: string): Promise<Index>;
    getCharacters(): Promise<ReadonlyArray<string>>;
    loadIndex(character: string): Promise<Index>;
    logMessage(
      key: string,
      conversation: string,
      time: number,
      type: Conversation.Message.Type,
      sender: string,
      message: string
    ): Promise<void>;
    getBacklog(key: string): Promise<ReadonlyArray<NativeMessage>>;
    getLogs(
      character: string,
      key: string,
      date: number
    ): Promise<ReadonlyArray<NativeMessage>>;
    repair(character: string): Promise<void>;
  };
}

const dayMs = 86400000;
export const appVersion = (<{ version: string }>require('./package.json'))
  .version; //tslint:disable-line:no-require-imports

export class GeneralSettings {
  account = '';
  password = '';
  host = 'wss://chat.f-list.net/chat2';
  theme = 'default';
  version = appVersion;
}

type Index = { [key: string]: { name: string; dates: number[] } | undefined };

export class Logs implements Logging {
  canZip = false;
  private index: Index = {};
  private loadedIndex?: Index;
  private loadedCharacter?: string;
  attemptedFix = false;

  constructor() {
    core.connection.onEvent('connecting', async () => {
      this.attemptedFix = false;
      try {
        this.index = await NativeLogs.init(core.connection.character);
      } catch {
        await this.fixLogs(core.connection.character);
      }
    });
  }

  async logMessage(
    conversation: Conversation,
    message: Conversation.Message
  ): Promise<void> {
    const time = message.time.getTime();
    const date = Math.floor(time / dayMs);
    let index = this.index[conversation.key];
    if (index === undefined)
      index = this.index[conversation.key] = {
        name: conversation.name,
        dates: []
      };
    if (index.dates[index.dates.length - 1] !== date) index.dates.push(date);
    return NativeLogs.logMessage(
      conversation.key,
      conversation.name,
      time / 1000,
      message.type,
      message.type === Conversation.Message.Type.Event
        ? ''
        : message.sender.name,
      message.text
    );
  }

  async getBacklog(
    conversation: Conversation
  ): Promise<ReadonlyArray<Conversation.Message>> {
    try {
      return (await NativeLogs.getBacklog(conversation.key)).map(
        x =>
          new MessageImpl(
            x.type,
            core.characters.get(x.sender),
            x.text,
            new Date(x.time * 1000)
          )
      );
    } catch {
      await this.fixLogs(this.loadedCharacter!);
      return [];
    }
  }

  private async getIndex(name: string): Promise<Index> {
    if (this.loadedCharacter === name) return this.loadedIndex!;
    this.loadedCharacter = name;
    try {
      return (this.loadedIndex =
        name === core.connection.character
          ? this.index
          : await NativeLogs.loadIndex(name));
    } catch {
      await this.fixLogs(name);
      return {};
    }
  }

  async getLogs(
    character: string,
    key: string,
    date: Date
  ): Promise<ReadonlyArray<Conversation.Message>> {
    try {
      await NativeLogs.loadIndex(character);
      return (
        await NativeLogs.getLogs(
          character,
          key,
          Math.floor(date.getTime() / dayMs - date.getTimezoneOffset() / 1440)
        )
      ).map(
        x =>
          new MessageImpl(
            x.type,
            core.characters.get(x.sender),
            x.text,
            new Date(x.time * 1000)
          )
      );
    } catch {
      await this.fixLogs(character);
      return [];
    }
  }

  async getLogDates(
    character: string,
    key: string
  ): Promise<ReadonlyArray<Date>> {
    const entry = (await this.getIndex(character))[key];
    if (entry === undefined) return [];
    return entry.dates.map(x => {
      const date = new Date(x * dayMs);
      return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    });
  }

  async getConversations(
    character: string
  ): Promise<ReadonlyArray<{ key: string; name: string }>> {
    const index = await this.getIndex(character);
    const conversations: { key: string; name: string }[] = [];
    for (const key in index)
      conversations.push({ key, name: index[key]!.name });
    return conversations;
  }

  async getAvailableCharacters(): Promise<ReadonlyArray<string>> {
    return NativeLogs.getCharacters();
  }

  async fixLogs(character: string): Promise<void> {
    if (this.attemptedFix) return alert(l('logs.corruption.mobile.error'));
    this.attemptedFix = true;
    alert(l('logs.corruption.mobile'));
    try {
      await NativeLogs.repair(character);
      this.index = await NativeLogs.init(core.connection.character);
      alert(l('logs.corruption.mobile.success'));
    } catch {
      alert(l('logs.corruption.mobile.error'));
    }
  }
}

export async function getGeneralSettings(): Promise<
  GeneralSettings | undefined
> {
  const file = await NativeFile.read('!settings');
  if (file === undefined) return undefined;
  const settings = <GeneralSettings>(
    _.merge(new GeneralSettings(), JSON.parse(file))
  );
  if (settings.host === 'wss://chat.f-list.net:9799')
    settings.host = 'wss://chat.f-list.net/chat2';
  return settings;
}

export async function setGeneralSettings(
  value: GeneralSettings
): Promise<void> {
  return NativeFile.write('!settings', JSON.stringify(value));
}

export class SettingsStore implements Settings.Store {
  async get<K extends keyof Settings.Keys>(
    key: K,
    character: string = core.connection.character
  ): Promise<Settings.Keys[K] | undefined> {
    const file = await NativeFile.read(`${character}/${key}`);
    if (file === undefined) return undefined;
    return <Settings.Keys[K]>JSON.parse(file);
  }

  async set<K extends keyof Settings.Keys>(
    key: K,
    value: Settings.Keys[K]
  ): Promise<void> {
    return NativeFile.write(
      `${core.connection.character}/${key}`,
      JSON.stringify(value)
    );
  }

  async getAvailableCharacters(): Promise<string[]> {
    return NativeFile.listDirectories('/');
  }
}

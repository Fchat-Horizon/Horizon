import { EventMessage, Message, Settings as SettingsImpl } from '../chat/common';
import core from '../chat/core';
import { Conversation, Logs as Logging, Settings } from '../chat/interfaces';
import l from '../chat/localize';

type StoredConversation = { id: number; key: string; name: string };
type StoredMessage = {
  id: number;
  conversation: number;
  type: Conversation.Message.Type;
  sender: string;
  text: string;
  time: Date;
  day: number | string;
};

async function promisifyRequest<T>(req: IDBRequest): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(<T>req.result);
    req.onerror = () => reject(req.error);
  });
}

async function iterate<S, T>(request: IDBRequest, map: (stored: S) => T, count: number = -1): Promise<T[]> {
  const array: T[] = [];
  return new Promise<T[]>((resolve, reject) => {
    request.onsuccess = function (): void {
      const c = <IDBCursorWithValue | undefined>this.result;
      if (!c || (count !== -1 && array.length >= count)) return resolve(array); //tslint:disable-line:strict-boolean-expressions
      array.push(map(<S>c.value));
      c.continue();
    };
    request.onerror = () => reject(request.error);
  });
}

const dayMs = 86400000;
const charactersKey = 'fchat.characters';
let hasComposite = true;
let getComposite: (conv: number, day: number) => string | number[] = (conv, day) => [conv, day];
const decode = (str: string) => (str.charCodeAt(0) << 16) + str.charCodeAt(1);
try {
  IDBKeyRange.only([]);
} catch {
  hasComposite = false;
  const encode = (num: number) => String.fromCharCode((num >> 16) % 65536) + String.fromCharCode(num % 65536);
  getComposite = (conv, day) => `${encode(conv)}${encode(day)}`;
}

type Index = { [key: string]: StoredConversation | undefined };

async function openDatabase(character: string): Promise<IDBDatabase> {
  const request = window.indexedDB.open(`logs-${character}`);
  request.onupgradeneeded = () => {
    const db = request.result;
    const logsStore = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
    logsStore.createIndex('conversation', 'conversation');
    logsStore.createIndex('conversation-day', hasComposite ? ['conversation', 'day'] : 'day');
    db.createObjectStore('conversations', { keyPath: 'id', autoIncrement: true });
  };
  return promisifyRequest<IDBDatabase>(request);
}

async function getIndex(db: IDBDatabase): Promise<Index> {
  try {
    const trans = db.transaction(['conversations']);
    const index: Index = {};
    await iterate(trans.objectStore('conversations').openCursor(), (x: StoredConversation) => (index[x.key] = x));
    return index;
  } catch {
    alert(l('logs.corruption.web'));
    return {};
  }
}

export class Logs implements Logging {
  canZip = true;
  index?: Index;
  loadedDb?: IDBDatabase;
  loadedCharacter?: string;
  loadedIndex?: Index;
  db?: IDBDatabase;

  constructor() {
    core.connection.onEvent('connecting', async () => {
      const characters = await this.getAvailableCharacters();
      if (characters.indexOf(core.connection.character) === -1)
        window.localStorage.setItem(charactersKey, JSON.stringify(characters.concat(core.connection.character)));
      try {
        this.db = await openDatabase(core.connection.character);
        this.index = await getIndex(this.db);
      } catch (e) {
        console.error(e);
      }
    });
  }

  async logMessage(conversation: Conversation, message: Conversation.Message): Promise<void> {
    if (this.db === undefined) return;
    let conv = this.index![conversation.key];
    if (conv === undefined) {
      const cTrans = this.db.transaction(['conversations'], 'readwrite');
      const convId = await promisifyRequest<number>(
        cTrans.objectStore('conversations').add({ key: conversation.key, name: conversation.name })
      );
      this.index![conversation.key] = conv = { id: convId, key: conversation.key, name: conversation.name };
    }
    const lTrans = this.db.transaction(['logs'], 'readwrite');
    const sender = message.type === Conversation.Message.Type.Event ? undefined : message.sender.name;
    const day = Math.floor(message.time.getTime() / dayMs - message.time.getTimezoneOffset() / 1440);
    const dayValue = hasComposite ? day : getComposite(conv.id, day);
    await promisifyRequest<number>(
      lTrans
        .objectStore('logs')
        .put({ conversation: conv.id, type: message.type, sender, text: message.text, time: message.time, day: dayValue })
    );
  }

  async getBacklog(conversation: Conversation): Promise<ReadonlyArray<Conversation.Message>> {
    if (this.db === undefined) return [];
    const trans = this.db.transaction(['logs']);
    const conv = this.index![conversation.key];
    if (conv === undefined) return [];
    return (
      await iterate(
        trans.objectStore('logs').index('conversation').openCursor(conv.id, 'prev'),
        (value: StoredMessage) =>
          value.type === Conversation.Message.Type.Event
            ? new EventMessage(value.text, value.time)
            : new Message(value.type, core.characters.get(value.sender), value.text, value.time),
        20
      )
    ).reverse();
  }

  private async loadIndex(character: string): Promise<Index> {
    if (character === this.loadedCharacter) return this.loadedIndex!;
    if (character === core.connection.character) {
      this.loadedDb = this.db;
      this.loadedIndex = this.index;
    } else
      try {
        this.loadedDb = await openDatabase(character);
        this.loadedIndex = await getIndex(this.loadedDb);
      } catch (e) {
        console.error(e);
        return {};
      }
    this.loadedCharacter = character;
    return this.loadedIndex!;
  }

  async getConversations(character: string): Promise<ReadonlyArray<{ key: string; name: string }>> {
    const index = await this.loadIndex(character);
    return Object.keys(index).map(k => index[k]!);
  }

  async getLogs(character: string, key: string, date: Date): Promise<ReadonlyArray<Conversation.Message>> {
    await this.loadIndex(character);
    if (this.loadedDb === undefined) return [];
    const id = this.loadedIndex![key]!.id;
    const trans = this.loadedDb.transaction(['logs']);
    const day = Math.floor(date.getTime() / dayMs - date.getTimezoneOffset() / 1440);
    return iterate(trans.objectStore('logs').index('conversation-day').openCursor(getComposite(id, day)), (value: StoredMessage) =>
      value.type === Conversation.Message.Type.Event
        ? new EventMessage(value.text, value.time)
        : new Message(value.type, core.characters.get(value.sender), value.text, value.time)
    );
  }

  async getLogDates(character: string, key: string): Promise<ReadonlyArray<Date>> {
    await this.loadIndex(character);
    if (this.loadedDb === undefined) return [];
    const id = this.loadedIndex![key]!.id;
    const trans = this.loadedDb.transaction(['logs']);
    const bound = IDBKeyRange.bound(getComposite(id, 0), getComposite(id, 1000000));
    return iterate(trans.objectStore('logs').index('conversation-day').openCursor(bound, 'nextunique'), (value: StoredMessage) => {
      const date = new Date((hasComposite ? <number>value.day : decode((<string>value.day).substr(2))) * dayMs);
      return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    });
  }

  async getAvailableCharacters(): Promise<ReadonlyArray<string>> {
    const stored = window.localStorage.getItem(charactersKey);
    return stored !== null ? (JSON.parse(stored) as string[]) : [];
  }
}

export class SettingsStore implements Settings.Store {
  async get<K extends keyof Settings.Keys>(key: K, character: string = core.connection.character): Promise<Settings.Keys[K] | undefined> {
    const stored = window.localStorage.getItem(`${character}.settings.${key}`);
    if (stored === null) {
      if (key === 'pinned') {
        const tabs20 = window.localStorage.getItem(`tabs_${character.toLowerCase().replace(' ', '_')}`);
        if (tabs20 !== null)
          try {
            const tabs = JSON.parse(tabs20) as { type: string; id: string; title: string }[];
            const pinned: Settings.Keys['pinned'] = { channels: [], private: [] };
            pinned.channels = tabs.filter(x => x.type === 'channel').map(x => x.id.toLowerCase());
            pinned.private = tabs.filter(x => x.type === 'user').map(x => x.title);
            return pinned as Settings.Keys[K];
          } catch {
            return undefined;
          }
      } else if (key === 'settings') {
        const settings20 = window.localStorage.getItem(`chat_settings`);
        if (settings20 !== null)
          try {
            const old = JSON.parse(settings20) as {
              animatedIcons: boolean;
              autoIdle: boolean;
              autoIdleTime: number;
              delimit: boolean;
              disableIconTag: boolean;
              enableLogging: boolean;
              highlightMentions: boolean;
              highlightWords: string[];
              html5Audio: boolean;
              joinLeaveAlerts: boolean;
              leftClickOpensFlist: boolean;
            };
            const settings = new SettingsImpl();
            settings.animatedEicons = old.animatedIcons;
            if (old.autoIdle) settings.idleTimer = old.autoIdleTime / 60000;
            settings.messageSeparators = old.delimit;
            if (old.disableIconTag) settings.disallowedTags.push('icon');
            settings.logMessages = old.enableLogging;
            settings.highlight = old.highlightMentions;
            settings.highlightWords = old.highlightWords;
            settings.playSound = old.html5Audio;
            settings.joinMessages = old.joinLeaveAlerts;
            settings.clickOpensMessage = !old.leftClickOpensFlist;
            return settings as unknown as Settings.Keys[K];
          } catch {
            return undefined;
          }
      }
      return undefined;
    }
    return JSON.parse(stored) as Settings.Keys[K];
  }

  async set<K extends keyof Settings.Keys>(key: K, value: Settings.Keys[K]): Promise<void> {
    window.localStorage.setItem(`${core.connection.character}.settings.${key}`, JSON.stringify(value));
    return Promise.resolve();
  }

  async getAvailableCharacters(): Promise<ReadonlyArray<string>> {
    const stored = window.localStorage.getItem(charactersKey);
    return stored !== null ? (JSON.parse(stored) as string[]) : [];
  }
}

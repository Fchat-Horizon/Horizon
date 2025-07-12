import * as remote from '@electron/remote';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { Message as MessageImpl } from '../chat/common';
import core from '../chat/core';
import {
  Character,
  Conversation,
  Logs as Logging,
  Settings
} from '../chat/interfaces';
import l from '../chat/localize';
import { GeneralSettings } from './common';

declare module '../chat/interfaces' {
  interface State {
    generalSettings?: GeneralSettings;
  }
}

const dayMs = 86400000;
const read = promisify(fs.read);

function writeFile(
  p: fs.PathLike | number,
  data: string | NodeJS.ArrayBufferView,
  options?: fs.WriteFileOptions
): void {
  try {
    fs.writeFileSync(p, data, options);
  } catch (e) {
    remote.dialog.showErrorBox(l('fs.error'), (<Error>e).message);
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

interface IndexItem {
  index: { [key: number]: number | undefined };
  name: string;
  offsets: number[];
}

interface Index {
  [key: string]: IndexItem | undefined;
}

export function getLogDir(this: void, character: string): string {
  const dir = path.join(
    core.state.generalSettings!.logDirectory,
    character,
    'logs'
  );
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getLogFile(this: void, character: string, key: string): string {
  return path.join(getLogDir(character), key);
}

function getDraftFile(character: string): string {
  return path.join(
    core.state.generalSettings!.logDirectory,
    character,
    'drafts.txt'
  );
}

export function checkIndex(
  this: void,
  index: Index,
  message: Message,
  key: string,
  name: string,
  size: number | (() => number)
): Buffer | undefined {
  const date = Math.floor(
    message.time.getTime() / dayMs - message.time.getTimezoneOffset() / 1440
  );
  let buffer: Buffer,
    offset = 0;
  let item = index[key];
  if (item !== undefined) {
    if (item.index[date] !== undefined) return;
    buffer = Buffer.allocUnsafe(7);
  } else {
    index[key] = item = { name, index: {}, offsets: [] };
    const nameLength = Buffer.byteLength(name);
    buffer = Buffer.allocUnsafe(nameLength + 8);
    buffer.writeUInt8(nameLength, 0);
    buffer.write(name, 1);
    offset = nameLength + 1;
  }
  const newValue = typeof size === 'function' ? size() : size;
  item.index[date] = item.offsets.length;
  item.offsets.push(newValue);
  buffer.writeUInt16LE(date, offset);
  buffer.writeUIntLE(newValue, offset + 2, 5);
  return buffer;
}

export function serializeMessage(message: Message): {
  serialized: Buffer;
  size: number;
} {
  const name =
    message.type !== Conversation.Message.Type.Event ? message.sender.name : '';
  const senderLength = Buffer.byteLength(name);
  const messageLength = Buffer.byteLength(message.text);
  const buffer = Buffer.allocUnsafe(senderLength + messageLength + 10);
  buffer.writeUInt32LE(message.time.getTime() / 1000, 0);
  buffer.writeUInt8(message.type, 4);
  buffer.writeUInt8(senderLength, 5);
  buffer.write(name, 6);
  let offset = senderLength + 6;
  buffer.writeUInt16LE(messageLength, offset);
  buffer.write(message.text, (offset += 2));
  buffer.writeUInt16LE((offset += messageLength), offset);
  return { serialized: buffer, size: offset + 2 };
}

function deserializeMessage(
  buffer: Buffer,
  offset: number = 0,
  characterGetter: (name: string) => Character = name =>
    core.characters.get(name)
): { size: number; message: Conversation.Message } {
  const time = buffer.readUInt32LE(offset);
  const type = buffer.readUInt8((offset += 4));
  const senderLength = buffer.readUInt8((offset += 1));
  const sender = buffer.toString(
    'utf8',
    (offset += 1),
    (offset += senderLength)
  );
  const messageLength = buffer.readUInt16LE(offset);
  const text = buffer.toString('utf8', (offset += 2), offset + messageLength);
  const message = new MessageImpl(
    type,
    characterGetter(sender),
    text,
    new Date(time * 1000)
  );
  return { message, size: senderLength + messageLength + 10 };
}

export function fixLogs(character: string): void {
  const dir = getLogDir(character);
  const files = fs.readdirSync(dir);
  const buffer = Buffer.allocUnsafe(50100);
  for (const file of files) {
    const full = path.join(dir, file);
    if (file.substr(-4) === '.idx') {
      if (!fs.existsSync(full.slice(0, -4))) fs.unlinkSync(full);
      continue;
    }
    const fd = fs.openSync(full, 'r+');
    const indexPath = path.join(dir, `${file}.idx`);
    if (!fs.existsSync(indexPath)) {
      fs.unlinkSync(full);
      continue;
    }
    const indexFd = fs.openSync(indexPath, 'r+');
    fs.readSync(indexFd, buffer, 0, 1, 0);
    let pos = 0,
      lastDay = 0;
    const nameEnd = buffer.readUInt8(0) + 1;
    fs.ftruncateSync(indexFd, nameEnd);
    fs.readSync(indexFd, buffer, 0, nameEnd, null); //tslint:disable-line:no-null-keyword
    const size = fs.fstatSync(fd).size;
    try {
      while (pos < size) {
        buffer.fill(-1);
        fs.readSync(fd, buffer, 0, 50100, pos);
        const deserialized = deserializeMessage(buffer, 0, name => ({
          gender: 'None',
          status: 'online',
          statusText: '',
          isFriend: false,
          isBookmarked: false,
          isChatOp: false,
          isIgnored: false,
          name,
          overrides: {}
        }));
        const time = deserialized.message.time;
        const day = Math.floor(
          time.getTime() / dayMs - time.getTimezoneOffset() / 1440
        );
        if (day > lastDay) {
          buffer.writeUInt16LE(day, 0);
          buffer.writeUIntLE(pos, 2, 5);
          fs.writeSync(indexFd, buffer, 0, 7);
          lastDay = day;
        }
        if (
          buffer.readUInt16LE(deserialized.size - 2) !==
          deserialized.size - 2
        )
          throw new Error();
        pos += deserialized.size;
      }
    } catch {
      fs.ftruncateSync(fd, pos);
    } finally {
      fs.closeSync(fd);
      fs.closeSync(indexFd);
    }
  }
}

function loadIndex(name: string): Index {
  const index: Index = {};
  const dir = getLogDir(name);
  const files = fs.readdirSync(dir);
  for (const file of files)
    if (file.substr(-4) === '.idx')
      try {
        const content = fs.readFileSync(path.join(dir, file));
        let offset = content.readUInt8(0) + 1;
        const item: IndexItem = {
          name: content.toString('utf8', 1, offset),
          index: {},
          offsets: new Array(content.length - offset)
        };
        for (; offset < content.length; offset += 7) {
          const key = content.readUInt16LE(offset);
          item.index[key] = item.offsets.length;
          item.offsets.push(content.readUIntLE(offset + 2, 5));
        }
        index[file.slice(0, -4).toLowerCase()] = item;
      } catch (e) {
        console.error(e);
        alert(l('logs.corruption.desktop'));
      }
  return index;
}

export class Logs implements Logging {
  canZip = true;
  private index: Index = {};
  private loadedIndex?: Index;
  private loadedCharacter?: string;

  constructor() {
    core.connection.onEvent('connecting', () => {
      this.index = loadIndex(core.connection.character);
    });
  }

  async getBacklog(
    conversation: Conversation
  ): Promise<ReadonlyArray<Conversation.Message>> {
    const file = getLogFile(core.connection.character, conversation.key);
    if (!fs.existsSync(file)) return [];
    let count = 20;
    let messages = new Array<Conversation.Message>(count);
    const fd = fs.openSync(file, 'r');
    try {
      let pos = fs.fstatSync(fd).size;
      const buffer = Buffer.allocUnsafe(65536);
      while (pos > 0 && count > 0) {
        fs.readSync(fd, buffer, 0, 2, pos - 2);
        const length = buffer.readUInt16LE(0);
        pos = pos - length - 2;
        fs.readSync(fd, buffer, 0, length, pos);
        messages[--count] = deserializeMessage(buffer).message;
      }
      if (count !== 0) messages = messages.slice(count);
      return messages;
    } catch (e) {
      console.error(e);
      alert(l('logs.corruption.desktop'));
      return [];
    } finally {
      fs.closeSync(fd);
    }
  }

  private getIndex(name: string): Index {
    if (this.loadedCharacter === name) return this.loadedIndex!;
    this.loadedCharacter = name;
    return (this.loadedIndex =
      name === core.connection.character ? this.index : loadIndex(name));
  }

  async getLogDates(
    character: string,
    key: string
  ): Promise<ReadonlyArray<Date>> {
    const entry = this.getIndex(character)[key];
    if (entry === undefined) return [];
    const dates = [];
    for (const item in entry.index) {
      const date = new Date(parseInt(item, 10) * dayMs);
      dates.push(new Date(date.getTime() + date.getTimezoneOffset() * 60000));
    }
    return dates;
  }

  async getLogs(
    character: string,
    key: string,
    date: Date
  ): Promise<ReadonlyArray<Conversation.Message>> {
    const index = this.getIndex(character)[key];
    if (index === undefined) return [];
    const dateOffset =
      index.index[
        Math.floor(date.getTime() / dayMs - date.getTimezoneOffset() / 1440)
      ];
    if (dateOffset === undefined) return [];
    const messages: Conversation.Message[] = [];
    const pos = index.offsets[dateOffset];
    const fd = fs.openSync(getLogFile(character, key), 'r');
    try {
      const end =
        dateOffset + 1 < index.offsets.length
          ? index.offsets[dateOffset + 1]
          : fs.fstatSync(fd).size;
      const length = end - pos;
      const buffer = Buffer.allocUnsafe(length);
      await read(fd, buffer, 0, length, pos);
      let offset = 0;
      while (offset < length) {
        const deserialized = deserializeMessage(buffer, offset);
        messages.push(deserialized.message);
        offset += deserialized.size;
      }
      return messages;
    } catch (e) {
      console.error(e);
      alert(l('logs.corruption.desktop'));
      return [];
    } finally {
      fs.closeSync(fd);
    }
  }

  logMessage(
    conversation: { key: string; name: string },
    message: Message
  ): void {
    const file = getLogFile(core.connection.character, conversation.key);
    const buffer = serializeMessage(message).serialized;
    const hasIndex = this.index[conversation.key] !== undefined;
    const indexBuffer = checkIndex(
      this.index,
      message,
      conversation.key,
      conversation.name,
      () => (fs.existsSync(file) ? fs.statSync(file).size : 0)
    );
    if (indexBuffer !== undefined)
      writeFile(`${file}.idx`, indexBuffer, { flag: hasIndex ? 'a' : 'wx' });
    writeFile(file, buffer, { flag: 'a' });
  }

  async getConversations(
    character: string
  ): Promise<ReadonlyArray<{ key: string; name: string }>> {
    const index = this.getIndex(character);
    const conversations: { key: string; name: string }[] = [];
    for (const key in index)
      conversations.push({ key, name: index[key]!.name });
    return conversations;
  }

  async getAvailableCharacters(): Promise<ReadonlyArray<string>> {
    const baseDir = core.state.generalSettings!.logDirectory;
    fs.mkdirSync(baseDir, { recursive: true });
    return fs
      .readdirSync(baseDir)
      .filter(x => fs.statSync(path.join(baseDir, x)).isDirectory());
  }
}

function getSettingsDir(character: string = core.connection.character): string {
  const dir = path.join(
    core.state.generalSettings!.logDirectory,
    character,
    'settings'
  );
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export class SettingsStore implements Settings.Store {
  async get<K extends keyof Settings.Keys>(
    key: K,
    character?: string
  ): Promise<Settings.Keys[K] | undefined> {
    try {
      const file = path.join(getSettingsDir(character), key);

      if (!fs.existsSync(file)) {
        return undefined;
      }

      return <Settings.Keys[K]>JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      console.error('READ KEY FAILURE', e, key, character);
      return undefined;
    }
  }

  async getAvailableCharacters(): Promise<ReadonlyArray<string>> {
    const baseDir = core.state.generalSettings!.logDirectory;
    return fs
      .readdirSync(baseDir)
      .filter(x => fs.statSync(path.join(baseDir, x)).isDirectory());
  }

  //tslint:disable-next-line:no-async-without-await
  async set<K extends keyof Settings.Keys>(
    key: K,
    value: Settings.Keys[K]
  ): Promise<void> {
    writeFile(path.join(getSettingsDir(), key), JSON.stringify(value));
  }
}

export function getDrafts(): any {
  const file = getDraftFile(core.connection.character);
  if (!fs.existsSync(file)) return null;

  // This is a simple JSON parse in this case, we're much less worried about corruption or serialization issues for drafts.
  // The file should be quite small, so a full load should be very safe. Potential edge case is where a user maintains thousands of
  // drafts for some reason, but that could be rectified with some kind of limit or user-controlled setting.
  const fd = fs.readFileSync(file, 'utf8');
  try {
    const drafts = JSON.parse(fd);
    return drafts;
  } catch (e) {
    console.error(`Error encountered when parsing drafts from ${file}: ${e}`);
    return null;
  }
}

//tslint:disable-next-line:no-async-without-await
export async function saveDrafts(drafts: any): Promise<void> {
  const file = getDraftFile(core.connection.character);

  // Note: this is actually a wrapper around fs.writeFileSync, NOT the async method. If we get blocked loop, suspect this line.
  // This function is cargo-culted from SettingsStore at the moment to maintain uniform behavior. TBH we're likely not
  // concerned with any data loss here, consider async to prevent random freezes if the application locks up during normal use.
  writeFile(file, JSON.stringify(drafts));
}

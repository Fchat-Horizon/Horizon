/**
 * @module log-format
 * The binary chat log format: serialization, index files, and repair.
 *
 * Pure fs/Buffer logic with no dependency on renderer state, so it can be used
 * both by the main-process filesystem host and by the renderer-side Slimcat
 * importer. Callers supply the log directory and resolve character objects.
 */

import * as fs from 'fs';
import * as path from 'path';

const dayMs = 86400000;

/*
! Mirrors Conversation.Message.Type.Event. Kept as a literal because any
! import of chat/interfaces (even type-only, for tsc) would drag the renderer
! module graph - Vue components included - into the main-process build.
*/
const EVENT_MESSAGE_TYPE = 5;

/**
 * The minimal shape the serializer needs; Conversation.Message objects and
 * the plain records built by importers are both structurally compatible.
 */
export interface LogMessage {
  readonly sender?: { readonly name: string };
  readonly text: string;
  readonly time: Date;
  readonly type: number;
}

/**
 * A log message as parsed from disk, before the renderer attaches a live
 * character object to it. Serializable across IPC.
 */
export interface PlainLogMessage {
  type: number;
  sender: string;
  text: string;
  time: number;
}

export interface IndexItem {
  index: { [key: number]: number | undefined };
  name: string;
  offsets: number[];
}

export interface Index {
  [key: string]: IndexItem | undefined;
}

/**
 * Resolves and creates the log directory for a character.
 */
export function getLogDir(logDirectory: string, character: string): string {
  const dir = path.join(logDirectory, character, 'logs');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function checkIndex(
  index: Index,
  message: { time: Date },
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

export function serializeMessage(message: LogMessage): {
  serialized: Buffer;
  size: number;
} {
  const name =
    message.type !== EVENT_MESSAGE_TYPE && message.sender !== undefined
      ? message.sender.name
      : '';
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

export function deserializeMessage(
  buffer: Buffer,
  offset: number = 0
): { size: number; message: PlainLogMessage } {
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
  return {
    message: { type, sender, text, time: time * 1000 },
    size: senderLength + messageLength + 10
  };
}

/**
 * Loads all conversation indexes from a character's log directory.
 * Corrupt index files are skipped; the caller decides how to surface that.
 */
export function loadIndex(dir: string): { index: Index; hadErrors: boolean } {
  const index: Index = {};
  let hadErrors = false;
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
        hadErrors = true;
      }
  return { index, hadErrors };
}

/**
 * Rebuilds index files and truncates trailing corruption in a character's
 * log directory.
 */
export function fixLogs(dir: string): void {
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
      const nameBuffer = Buffer.allocUnsafe(file.length + 1);
      nameBuffer.writeUInt8(file.length, 0);
      nameBuffer.write(file, 1);
      fs.writeFileSync(indexPath, nameBuffer);
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
        const deserialized = deserializeMessage(buffer, 0);
        const time = new Date(deserialized.message.time);
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

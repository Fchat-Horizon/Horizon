/**
 * @license MPL-2.0
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * @copyright 2024-2026 Sylvia Roselie & Respective Horizon Contributors
 * @version 1.0
 * @see {@link https://github.com/Fchat-Horizon/Horizon|GitHub repo}
 *
 * Conversion helpers between the binary chat log format, the JSON log format
 * used inside export ZIPs, and the `.idx` sidecar files the log viewer needs.
 *
 * ^ Binary record layout must stay in sync with serializeMessage in
 *   electron/filesystem.ts:
 *   u32LE time (seconds) | u8 type | u8 senderLength | sender |
 *   u16LE textLength | text | u16LE recordLength - 2
 * ^ Index layout must stay in sync with checkIndex/loadIndex in
 *   electron/filesystem.ts:
 *   u8 nameLength | name | 7-byte entries of u16LE day + u40LE offset
 *
 * ! NEVER IMPORT ELECTRON HERE! This must ALSO WORK FOR THE CLI!!!!!!!!!!!!!!!!!!!!1
 */

import fs from 'fs';
import path from 'path';

/** One message inside a JSON log file. Times are seconds since epoch. */
export interface JsonLogMessage {
  time: number;
  type: number;
  sender: string;
  text: string;
}

/**
 * One JSON log file inside an export ZIP, normalized.
 *
 * ! Exports must stay bare arrays: released clients strip the .json suffix
 *   and write any other shape verbatim to the binary log path. The optional
 *   name only tolerates hand-made { name, messages } files on import.
 */
export interface JsonLog {
  name?: string;
  messages: JsonLogMessage[];
}

/**
 * Per-character sidecar mapping log file names to display names. Old
 * importers ignore it, so new exports stay safe on old clients.
 */
export const conversationNamesFile = 'conversation-names.json';

/**
 * ^ Filesystem litter (.DS_Store, ._* AppleDouble, Thumbs.db) is never a log:
 *   log names are channel keys, lowercased character names, or `_`, none of
 *   which can start with a dot. Old imports copied litter verbatim (#886), so
 *   every seam that treats a file as a log must screen through this.
 */
export function isFilesystemArtifact(fileName: string): boolean {
  return /^\.|^(thumbs\.db|desktop\.ini)(\.json)?$/i.test(fileName);
}

const dayMs = 86400000;

function localDay(timeSeconds: number): number {
  const date = new Date(timeSeconds * 1000);
  return Math.floor(date.getTime() / dayMs - date.getTimezoneOffset() / 1440);
}

/**
 * Validates trailing length markers the way fixLogs does and stops at the
 * first malformed record, so non-log files yield no messages instead of
 * garbage.
 */
export function binaryLogToJson(buffer: Buffer): JsonLogMessage[] {
  const messages: JsonLogMessage[] = [];
  let offset = 0;
  while (offset + 10 <= buffer.length) {
    const time = buffer.readUInt32LE(offset);
    const type = buffer.readUInt8(offset + 4);
    const senderLength = buffer.readUInt8(offset + 5);
    if (offset + 6 + senderLength + 2 > buffer.length) break;
    const sender = buffer.toString(
      'utf8',
      offset + 6,
      offset + 6 + senderLength
    );
    const textLength = buffer.readUInt16LE(offset + 6 + senderLength);
    const textStart = offset + 6 + senderLength + 2;
    const next = textStart + textLength + 2;
    if (next > buffer.length) break;
    if (buffer.readUInt16LE(next - 2) !== next - offset - 2) break;
    const text = buffer.toString('utf8', textStart, textStart + textLength);
    messages.push({ time, type, sender, text });
    offset = next;
  }
  return messages;
}

/**
 * Byte-identical to what the client itself would have written. Throws on
 * out-of-range values (e.g. millisecond timestamps); callers treat the whole
 * file as corrupt.
 */
export function jsonLogToBinary(json: JsonLogMessage[]): Buffer {
  const chunks: Buffer[] = [];
  for (const msg of json) {
    const sender = msg.sender || '';
    const senderLength = Buffer.byteLength(sender);
    const textLength = Buffer.byteLength(msg.text);
    const buf = Buffer.allocUnsafe(senderLength + textLength + 10);
    buf.writeUInt32LE(msg.time, 0);
    buf.writeUInt8(msg.type, 4);
    buf.writeUInt8(senderLength, 5);
    buf.write(sender, 6);
    let offset = 6 + senderLength;
    buf.writeUInt16LE(textLength, offset);
    buf.write(msg.text, offset + 2);
    offset += 2 + textLength;
    buf.writeUInt16LE(offset, offset);
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

/** Accepts both the legacy bare-array format and { name, messages }. */
export function parseJsonLog(raw: Buffer | string): JsonLog | undefined {
  let data: unknown;
  try {
    data = JSON.parse(typeof raw === 'string' ? raw : raw.toString('utf8'));
  } catch {
    return undefined;
  }
  if (Array.isArray(data)) return { messages: data as JsonLogMessage[] };
  if (data && typeof data === 'object') {
    const log = data as { name?: unknown; messages?: unknown };
    if (Array.isArray(log.messages))
      return {
        name: typeof log.name === 'string' ? log.name : undefined,
        messages: log.messages as JsonLogMessage[]
      };
  }
  return undefined;
}

export function readLogIndexName(index: Buffer): string | undefined {
  if (index.length < 1) return undefined;
  const nameLength = index.readUInt8(0);
  if (nameLength === 0 || index.length < nameLength + 1) return undefined;
  return index.toString('utf8', 1, nameLength + 1);
}

/**
 * Rebuilds .idx contents from a binary log, walking records the way fixLogs
 * does. Undefined when the log holds no indexable records.
 */
export function buildLogIndexBuffer(
  name: string,
  log: Buffer
): Buffer | undefined {
  // Pre-cap first; byte-trimming a huge hostile name is quadratic.
  let indexName = name.slice(0, 255);
  while (Buffer.byteLength(indexName) > 255) indexName = indexName.slice(0, -1);
  const nameLength = Buffer.byteLength(indexName);
  const header = Buffer.allocUnsafe(nameLength + 1);
  header.writeUInt8(nameLength, 0);
  header.write(indexName, 1);

  const chunks: Buffer[] = [header];
  let offset = 0;
  let lastDay = 0;
  while (offset + 10 <= log.length) {
    const senderLength = log.readUInt8(offset + 5);
    const textStart = offset + 6 + senderLength + 2;
    if (textStart > log.length) break;
    const textLength = log.readUInt16LE(textStart - 2);
    const next = textStart + textLength + 2;
    if (next > log.length) break;
    if (log.readUInt16LE(next - 2) !== next - offset - 2) break;
    const day = localDay(log.readUInt32LE(offset));
    if (day > lastDay && day <= 0xffff) {
      const entry = Buffer.allocUnsafe(7);
      entry.writeUInt16LE(day, 0);
      entry.writeUIntLE(offset, 2, 5);
      chunks.push(entry);
      lastDay = day;
    }
    offset = next;
  }
  if (chunks.length < 2) return undefined;
  return Buffer.concat(chunks);
}

export function parseConversationNames(
  raw: Buffer | string
): Map<string, string> | undefined {
  let data: unknown;
  try {
    data = JSON.parse(typeof raw === 'string' ? raw : raw.toString('utf8'));
  } catch {
    return undefined;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data))
    return undefined;
  const names = new Map<string, string>();
  for (const [file, name] of Object.entries(data))
    if (typeof name === 'string') names.set(file, name);
  return names;
}

/**
 * ^ Key derivation must stay in sync with the channel conversation key in
 *   chat/conversations.ts; entries are most-recent-first, first wins.
 */
export function parseRecentChannelNames(
  raw: Buffer | string
): Map<string, string> | undefined {
  let data: unknown;
  try {
    data = JSON.parse(typeof raw === 'string' ? raw : raw.toString('utf8'));
  } catch {
    return undefined;
  }
  if (!Array.isArray(data)) return undefined;
  const names = new Map<string, string>();
  for (const item of data as { channel?: unknown; name?: unknown }[]) {
    if (!item || typeof item.channel !== 'string') continue;
    if (typeof item.name !== 'string') continue;
    const key = `#${item.channel.replace(/[^\w- ]/gi, '')}`.toLowerCase();
    if (!names.has(key)) names.set(key, item.name);
  }
  return names;
}

/**
 * ^ binaryLogs exists so a stale foo.json artifact never shadows the
 *   authoritative foo from the same ZIP regardless of entry order.
 */
export interface LogImportContext {
  names: Map<string, Map<string, string>>;
  channelNames: Map<string, Map<string, string>>;
  binaryLogs: Set<string>;
}

export function buildLogImportContext(
  entries: ReadonlyArray<{
    entryName: string;
    isDirectory: boolean;
    getData(): Buffer;
  }>
): LogImportContext {
  const names = new Map<string, Map<string, string>>();
  const channelNames = new Map<string, Map<string, string>>();
  const binaryLogs = new Set<string>();
  for (const entry of entries) {
    if (!entry || entry.isDirectory) continue;
    const normalized = entry.entryName.replace(/\\/g, '/');
    if (!normalized.startsWith('characters/') || normalized.includes('..'))
      continue;
    const segments = normalized.split('/');
    if (segments.length === 3 && segments[2] === conversationNamesFile) {
      try {
        const parsed = parseConversationNames(entry.getData());
        if (parsed) names.set(segments[1], parsed);
      } catch {}
    } else if (
      segments.length === 4 &&
      segments[2] === 'settings' &&
      segments[3] === 'recentChannels'
    ) {
      try {
        const parsed = parseRecentChannelNames(entry.getData());
        if (parsed) channelNames.set(segments[1], parsed);
      } catch {}
    } else if (
      segments.length >= 4 &&
      segments[2] === 'logs' &&
      !normalized.endsWith('.json') &&
      !normalized.endsWith('.idx') &&
      !segments.slice(3).some(isFilesystemArtifact)
    ) {
      binaryLogs.add(`${segments[1]}/${segments.slice(3).join('/')}`);
    }
  }
  return { names, channelNames, binaryLogs };
}

/**
 * Legacy exports carry no sidecar (#886): channel names come from the ZIP's
 * recentChannels file, private names from the sender whose name lowercases
 * to the log's file name.
 */
export function recoverLogName(
  logKey: string,
  character: string,
  context: LogImportContext,
  messages: JsonLogMessage[]
): string | undefined {
  const key = logKey.split('/').pop()!;
  if (key === '_') return 'Console';
  if (key.startsWith('#'))
    return context.channelNames.get(character)?.get(key.toLowerCase());
  const match = messages.find(
    m => typeof m.sender === 'string' && m.sender.toLowerCase() === key
  );
  return match?.sender;
}

/**
 * Name priority: name, existing index, fallback, file name. A stale index is
 * removed when the new log yields no entries (#886).
 */
export function writeLogWithIndex(
  destination: string,
  log: Buffer,
  name?: string,
  fallback?: string
): void {
  const indexPath = `${destination}.idx`;
  let indexName = name;
  if (indexName === undefined)
    try {
      indexName = readLogIndexName(fs.readFileSync(indexPath));
    } catch {}
  fs.writeFileSync(destination, log);
  const indexBuffer = buildLogIndexBuffer(
    indexName ?? fallback ?? path.basename(destination),
    log
  );
  if (indexBuffer) fs.writeFileSync(indexPath, indexBuffer);
  else if (fs.existsSync(indexPath)) fs.unlinkSync(indexPath);
}

/** Builds a missing .idx for an existing log; heals pre-2.4 imports (#886). */
export function ensureLogIndex(destination: string, name?: string): boolean {
  const indexPath = `${destination}.idx`;
  if (fs.existsSync(indexPath)) return false;
  const indexBuffer = buildLogIndexBuffer(
    name ?? path.basename(destination),
    fs.readFileSync(destination)
  );
  if (!indexBuffer) return false;
  fs.writeFileSync(indexPath, indexBuffer);
  return true;
}

function messageKey(m: JsonLogMessage): string {
  return JSON.stringify([m.time, m.type, m.sender, m.text]);
}

function logContainsMessages(log: Buffer, messages: JsonLogMessage[]): boolean {
  if (messages.length === 0) return true;
  const counts = new Map<string, number>();
  for (const m of binaryLogToJson(log)) {
    const k = messageKey(m);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  for (const m of messages) {
    const k = messageKey(m);
    const remaining = counts.get(k) ?? 0;
    if (remaining === 0) return false;
    counts.set(k, remaining - 1);
  }
  return true;
}

/**
 * Pre-2.4 CLI imports wrote JSON logs verbatim as <log>.json (#886); Fix
 * Logs surfaces those as spurious empty conversations.
 *
 * ! The artifact may hold messages that exist nowhere else: only delete it
 *   when it is zero-byte or the binary log provably contains every message.
 */
export function removeStaleJsonLogArtifact(destination: string): boolean {
  const artifactPath = `${destination}.json`;
  try {
    const raw = fs.readFileSync(artifactPath);
    if (raw.length > 0) {
      const artifact = parseJsonLog(raw);
      if (artifact === undefined) return false;
      if (!logContainsMessages(fs.readFileSync(destination), artifact.messages))
        return false;
    }
    fs.unlinkSync(artifactPath);
    const artifactIndex = `${artifactPath}.idx`;
    if (fs.existsSync(artifactIndex)) fs.unlinkSync(artifactIndex);
    return true;
  } catch {
    return false;
  }
}

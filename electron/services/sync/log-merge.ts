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
 * Message-level union merge of chat logs, used by the device sync feature.
 * Unlike the zip importer (which only skips or overwrites whole log files),
 * this merges the incoming message set into the local binary logs so both
 * devices end up with the union of all messages, and rebuilds the `.idx`
 * day index alongside. Pure Node - no `core` or `@electron/remote` imports,
 * mirroring `../exporter/backup-export-cli.ts`.
 *
 * Binary formats match `electron/filesystem.ts` exactly:
 * - Log record: u32LE epoch-seconds, u8 type, u8 senderLen, sender (utf8),
 *   u16LE textLen, text (utf8), u16LE trailer (= record size - 2).
 * - Index file: u8 nameLen, name (utf8), then per day-with-messages:
 *   u16LE day number, u40LE byte offset of that day's first record.
 */

import type AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as path from 'path';
import { buildLogIndexBuffer, isFilesystemArtifact } from '../log-backup';
import type { LogMergeStats } from './protocol';

// Highest Conversation.Message.Type enum value (Bcast); see chat/interfaces.ts
// and docs/log-sync-protocol.md. Kept as a literal because this module is pure
// Node and must not import chat/.
const MAX_MESSAGE_TYPE = 6;

export interface LogMessage {
  time: number;
  type: number;
  sender: string;
  text: string;
}

export interface FileMergeResult {
  added: number;
  created: boolean;
}

/**
 * Parses a binary log buffer tolerantly: like `fixLogs`, reading stops at
 * the first truncated or corrupt record (validated via the size trailer)
 * and whatever was read up to that point is returned.
 */
export function parseBinaryLog(buffer: Buffer): LogMessage[] {
  const messages: LogMessage[] = [];
  let offset = 0;
  while (offset + 10 <= buffer.length) {
    const time = buffer.readUInt32LE(offset);
    const type = buffer.readUInt8(offset + 4);
    const senderLength = buffer.readUInt8(offset + 5);
    if (offset + 8 + senderLength > buffer.length) break;
    const sender = buffer.toString(
      'utf8',
      offset + 6,
      offset + 6 + senderLength
    );
    const textLength = buffer.readUInt16LE(offset + 6 + senderLength);
    const textStart = offset + 8 + senderLength;
    if (textStart + textLength + 2 > buffer.length) break;
    const text = buffer.toString('utf8', textStart, textStart + textLength);
    const size = senderLength + textLength + 10;
    if (buffer.readUInt16LE(offset + size - 2) !== size - 2) break;
    messages.push({ time, type, sender, text });
    offset += size;
  }
  return messages;
}

export function serializeLogMessage(message: LogMessage): Buffer {
  const senderLength = Buffer.byteLength(message.sender);
  const textLength = Buffer.byteLength(message.text);
  const buffer = Buffer.allocUnsafe(senderLength + textLength + 10);
  buffer.writeUInt32LE(message.time, 0);
  buffer.writeUInt8(message.type, 4);
  buffer.writeUInt8(senderLength, 5);
  buffer.write(message.sender, 6);
  let offset = 6 + senderLength;
  buffer.writeUInt16LE(textLength, offset);
  buffer.write(message.text, offset + 2);
  offset += 2 + textLength;
  buffer.writeUInt16LE(offset, offset);
  return buffer;
}

/**
 * A message is only mergeable if it round-trips through the binary format:
 * u32 timestamp, u8 type, u8 sender length, u16 text length.
 */
export function isValidLogMessage(value: unknown): value is LogMessage {
  if (value === null || typeof value !== 'object') return false;
  const m = value as LogMessage;
  return (
    Number.isInteger(m.time) &&
    m.time >= 0 &&
    m.time <= 0xffffffff &&
    Number.isInteger(m.type) &&
    m.type >= 0 &&
    m.type <= MAX_MESSAGE_TYPE &&
    typeof m.sender === 'string' &&
    Buffer.byteLength(m.sender) <= 0xff &&
    typeof m.text === 'string' &&
    Buffer.byteLength(m.text) <= 0xffff
  );
}

/** Reads the conversation display name stored in a `.idx` file. */
export function readIndexName(idxFile: string): string | undefined {
  try {
    const content = fs.readFileSync(idxFile);
    if (content.length < 1) return undefined;
    const nameLength = content.readUInt8(0);
    if (content.length < 1 + nameLength) return undefined;
    const name = content.toString('utf8', 1, 1 + nameLength);
    return name.length > 0 ? name : undefined;
  } catch {
    return undefined;
  }
}

function dedupeKey(message: LogMessage): string {
  return `${message.time}\u0000${message.type}\u0000${message.sender}\u0000${message.text}`;
}

/**
 * Merges incoming messages into the log file for one conversation and
 * rewrites its `.idx`. Returns how many messages were actually new; when
 * nothing is new the file is left untouched.
 *
 * @param logsDir - `{dataDir}/{character}/logs`, created if missing
 * @param key - Conversation key (also the log file name)
 * @param incoming - Messages from the remote device (pre-validated)
 * @param fallbackName - Display name if no local `.idx` exists yet
 */
export function mergeLogFile(
  logsDir: string,
  key: string,
  incoming: LogMessage[],
  fallbackName?: string
): FileMergeResult {
  const file = path.join(logsDir, key);
  const exists = fs.existsSync(file);
  const existing = exists ? parseBinaryLog(fs.readFileSync(file)) : [];

  const seen = new Set<string>();
  for (const message of existing) seen.add(dedupeKey(message));

  const added: LogMessage[] = [];
  for (const message of incoming) {
    const dedupe = dedupeKey(message);
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    added.push(message);
  }
  if (added.length === 0) return { added: 0, created: false };

  // Stable sort with local records first keeps each device's original
  // relative order for messages that share the same second.
  const merged = existing.concat(added);
  merged.sort((a, b) => a.time - b.time);

  const name =
    readIndexName(`${file}.idx`) ??
    (fallbackName !== undefined && fallbackName.length > 0
      ? fallbackName
      : key);

  const logBuffer = Buffer.concat(merged.map(serializeLogMessage));
  // Build the index from the finished log BEFORE swapping it in, reusing the
  // exporter/backup builder so both agree on name truncation and day-range
  // handling. Building here can no longer abort after the log is replaced, so
  // a live log is never left paired with a stale or missing index.
  const indexBuffer = buildLogIndexBuffer(name, logBuffer);

  fs.mkdirSync(logsDir, { recursive: true });
  const tempFile = `${file}.syncmerge`;
  fs.writeFileSync(tempFile, logBuffer);
  fs.renameSync(tempFile, file);
  const indexFile = `${file}.idx`;
  if (indexBuffer) fs.writeFileSync(indexFile, indexBuffer);
  else if (fs.existsSync(indexFile)) fs.unlinkSync(indexFile);

  return { added: added.length, created: !exists };
}

/**
 * Validates a character or conversation-key path segment from an untrusted
 * zip so it cannot escape the data directory.
 */
function isSafeSegment(segment: string): boolean {
  if (segment.length === 0 || segment.length > 255) return false;
  if (segment === '.' || segment === '..') return false;
  if (segment.startsWith('.')) return false;
  if (/[/\\]/.test(segment)) return false;
  if (segment.includes('\u0000')) return false;
  return true;
}

function resolveInside(baseDir: string, ...segments: string[]): string {
  const target = path.resolve(baseDir, ...segments);
  const base = path.resolve(baseDir);
  if (target !== base && !target.startsWith(`${base}${path.sep}`))
    throw new Error(`Unsafe path in sync payload: ${segments.join('/')}`);
  return target;
}

function parseNamesEntry(zip: AdmZip, character: string): Map<string, string> {
  const names = new Map<string, string>();
  const entry = zip.getEntry(`characters/${character}/logs-names.json`);
  if (!entry) return names;
  try {
    const parsed: unknown = JSON.parse(entry.getData().toString('utf8'));
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed))
      for (const [key, value] of Object.entries(parsed))
        if (typeof value === 'string' && value.length > 0)
          names.set(key.toLowerCase(), value);
  } catch {
    // Names are cosmetic; a malformed names file never fails the sync.
  }
  return names;
}

/**
 * Merges every `characters/{char}/logs/{key}.json` entry of a sync zip
 * (the logs-only export format, see docs/log-sync-protocol.md) into the
 * local log store at `dataDir`.
 */
export function mergeLogsZip(dataDir: string, zip: AdmZip): LogMergeStats {
  const stats: LogMergeStats = {
    conversationsCreated: 0,
    conversationsUpdated: 0,
    messagesAdded: 0,
    charactersTouched: 0
  };
  const touched = new Set<string>();
  const namesByCharacter = new Map<string, Map<string, string>>();

  for (const entry of zip.getEntries()) {
    if (!entry || entry.isDirectory) continue;
    const normalized = entry.entryName.replace(/\\/g, '/');
    const segments = normalized.split('/');
    if (
      segments.length !== 4 ||
      segments[0] !== 'characters' ||
      segments[2] !== 'logs' ||
      !segments[3].endsWith('.json')
    )
      continue;

    const character = segments[1];
    const key = segments[3].slice(0, -5);
    if (!isSafeSegment(character) || !isSafeSegment(key)) continue;
    if (character === 'settings' || character === 'eicons') continue;
    if (key.endsWith('.idx')) continue;
    // A sender that did not screen its log dir can ship Thumbs.db/.DS_Store as
    // a `.json` entry; never materialize filesystem litter as a conversation.
    if (isFilesystemArtifact(key)) continue;

    let incoming: unknown;
    try {
      incoming = JSON.parse(entry.getData().toString('utf8'));
    } catch {
      continue;
    }
    if (!Array.isArray(incoming)) continue;
    const messages = incoming.filter(isValidLogMessage);
    if (messages.length === 0) continue;

    let names = namesByCharacter.get(character);
    if (names === undefined) {
      names = parseNamesEntry(zip, character);
      namesByCharacter.set(character, names);
    }

    const logsDir = resolveInside(dataDir, character, 'logs');
    resolveInside(dataDir, character, 'logs', key);
    const result = mergeLogFile(
      logsDir,
      key,
      messages,
      names.get(key.toLowerCase())
    );
    if (result.added > 0) {
      stats.messagesAdded += result.added;
      if (result.created) stats.conversationsCreated++;
      else stats.conversationsUpdated++;
      touched.add(character);
    }
  }

  stats.charactersTouched = touched.size;
  return stats;
}

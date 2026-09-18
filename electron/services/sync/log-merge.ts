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
 * Binary log conversion and `.idx` building are delegated to `../log-backup`
 * (`binaryLogToJson`, `jsonLogToBinary`, `buildLogIndexBuffer`, which also
 * back the exporter and CLI); this module adds only the message-level
 * union-merge and the sync zip's path handling.
 */

import type AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as path from 'path';
import { TextDecoder } from 'util';
import {
  binaryLogToJson,
  DamagedLogError,
  buildLogIndexBuffer,
  isFilesystemArtifact,
  jsonLogToBinary,
  localDay,
  readLogIndexName
} from '../log-backup';
import type { JsonLogMessage } from '../log-backup';
import { SYNC_MAX_UNCOMPRESSED_BYTES } from './protocol';
import type { LogMergeStats } from './protocol';

// Highest Conversation.Message.Type enum value (Bcast); see chat/interfaces.ts
// and docs/log-sync-protocol.md. Kept as a literal because this module is pure
// Node and must not import chat/.
const MAX_MESSAGE_TYPE = 6;
const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
const neverCancelled = (): void => {};

function archiveTooLargeError(message: string): Error {
  return Object.assign(new Error(message), {
    status: 413,
    code: 'archive-too-large'
  });
}

/**
 * Which conversations one merge touched, keyed `{character}/{key}`. A batched
 * session unions these across batches: counts cannot simply be summed, because
 * a conversation created by one batch and extended by the next would otherwise
 * be reported as both a creation and an update.
 */
export interface LogMergeIdentities {
  created: string[];
  updated: string[];
  skipped: string[];
  characters: string[];
}

export interface LogMergeReport {
  stats: LogMergeStats;
  identities: LogMergeIdentities;
  /** What the next batch of this session should carry forward. */
  carries: ConversationCarries;
}

export interface FileMergeResult {
  added: number;
  created: boolean;
  skipped?: boolean;
}

/**
 * A message is only mergeable if it round-trips through the binary format:
 * u32 timestamp, u8 type, u8 sender length, u16 text length.
 */
export function isValidLogMessage(value: unknown): value is JsonLogMessage {
  if (value === null || typeof value !== 'object') return false;
  const m = value as JsonLogMessage;
  return (
    Number.isInteger(m.time) &&
    m.time >= 0 &&
    m.time <= 0xffffffff &&
    Number.isInteger(m.type) &&
    m.type >= 0 &&
    m.type <= MAX_MESSAGE_TYPE &&
    typeof m.sender === 'string' &&
    Buffer.from(m.sender, 'utf8').toString('utf8') === m.sender &&
    Buffer.byteLength(m.sender) <= 0xff &&
    typeof m.text === 'string' &&
    Buffer.from(m.text, 'utf8').toString('utf8') === m.text &&
    Buffer.byteLength(m.sender) + Buffer.byteLength(m.text) + 8 <= 0xffff
  );
}

/** Reads the conversation display name stored in a `.idx` file. */
export function readIndexName(idxFile: string): string | undefined {
  try {
    return readLogIndexName(fs.readFileSync(idxFile));
  } catch {
    return undefined;
  }
}

function dedupeKey(message: JsonLogMessage): string {
  return JSON.stringify([
    message.time,
    message.type,
    message.sender,
    message.text
  ]);
}

/**
 * What a previous batch learned about one conversation, so a later batch
 * carrying more of the same conversation can extend it instead of reading and
 * rewriting the whole thing. Purely an optimisation: an absent or rejected
 * carry just means the full read-modify-write path runs, which is always
 * correct. Kept small and bounded, because only the conversation a batch ends
 * on can continue into the next one.
 */
export interface ConversationCarry {
  /** Verdict of the one full parse this conversation got. */
  damaged: boolean;
  /** Local record times were non-decreasing at that parse. */
  sorted: boolean;
  /** The .idx on disk was byte-identical to a rebuild from the log. */
  indexCanonical: boolean;
  /** Log size after the last merge, so a file changed underneath is noticed. */
  size: number;
  /** Time of the last record, or -1 for an empty log. */
  tailTime: number;
  /** Dedupe keys of every trailing record sharing tailTime. */
  tailKeys: string[];
  /** Day of the last .idx entry, or -1 when the index has none. */
  lastDay: number;
  /** Display name held in the index header. */
  name: string;
}

/** Conversations whose carry is retained. Only the one a batch ends on can
 * continue into the next, so a handful covers every real sender. */
const CARRY_LIMIT = 8;
/** Trailing records sharing one timestamp that the tail walk will collect. */
const TAIL_RUN_LIMIT = 4096;
/** Largest byte offset a 5-byte .idx entry can address. */
const MAX_INDEX_OFFSET = 0xffffffffff;

export type ConversationCarries = { [id: string]: ConversationCarry };

/** Drops the oldest entries so a long session cannot grow the carry without
 * bound as it crosses the IPC boundary each batch. */
function trimCarries(carries: ConversationCarries): ConversationCarries {
  const ids = Object.keys(carries);
  if (ids.length <= CARRY_LIMIT) return carries;
  const kept: ConversationCarries = {};
  for (const id of ids.slice(ids.length - CARRY_LIMIT)) kept[id] = carries[id];
  return kept;
}

/**
 * Walks back from the end of a log collecting the trailing records that share
 * the last record's timestamp, using the length each record stores in its own
 * last two bytes. Deduplicating an ascending batch against just that run is
 * equivalent to deduplicating against the whole file, because every incoming
 * message is at or after the tail time and a sorted file holds every record at
 * that time in its trailing run.
 *
 * Undefined when the walk cannot be trusted: a torn record, a run longer than
 * the cap, or anything that fails a strict parse.
 */
function readLogTail(
  file: string,
  size: number
): { time: number; keys: string[] } | undefined {
  if (size === 0) return { time: -1, keys: [] };
  let handle: number | undefined;
  try {
    handle = fs.openSync(file, 'r');
    const trailer = Buffer.allocUnsafe(2);
    const keys: string[] = [];
    let position = size;
    let time = -1;
    while (position > 0) {
      if (fs.readSync(handle, trailer, 0, 2, position - 2) !== 2)
        return undefined;
      const start = position - trailer.readUInt16LE(0) - 2;
      if (start < 0 || start >= position) return undefined;
      const record = Buffer.allocUnsafe(position - start);
      if (
        fs.readSync(handle, record, 0, record.length, start) !== record.length
      )
        return undefined;
      const [message] = binaryLogToJson(record, true);
      if (message === undefined) return undefined;
      if (time === -1) time = message.time;
      else if (message.time !== time) break;
      keys.push(dedupeKey(message));
      if (keys.length > TAIL_RUN_LIMIT) return undefined;
      position = start;
    }
    return { time, keys };
  } catch {
    return undefined;
  } finally {
    if (handle !== undefined)
      try {
        fs.closeSync(handle);
      } catch {}
  }
}

/**
 * End offset of the record starting at `offset`, or -1 when `buffer` does not
 * hold all of it or its trailing length marker disagrees with its framing.
 *
 * Reads framing only: the u8 sender length and the u16 text length, never the
 * sender or text bytes themselves. That is what lets every walk over a stored
 * log stay cheap no matter how large the log is.
 *
 * `recordEnd` in ../log-stream is the same idea but deliberately omits the
 * trailer check, because a slice tolerates damage by returning the valid
 * prefix. Keep the two separate; sharing one would change that tolerance.
 */
function nextRecord(buffer: Buffer, offset: number): number {
  if (offset + 10 > buffer.length) return -1;
  const senderLength = buffer.readUInt8(offset + 5);
  const textStart = offset + 6 + senderLength + 2;
  if (textStart > buffer.length) return -1;
  const textLength = buffer.readUInt16LE(textStart - 2);
  const end = textStart + textLength + 2;
  if (end > buffer.length) return -1;
  if (buffer.readUInt16LE(end - 2) !== end - offset - 2) return -1;
  return end;
}

/**
 * Index entries for records appended at `from`, continuing the day sequence
 * after `lastDay`. Mirrors buildLogIndexBuffer's rule exactly, including the
 * strictly-greater day guard: a duplicate day key would make loadIndex
 * overwrite the earlier entry while both offsets stayed in the array, which
 * silently hides every message of that day before the second offset.
 */
function buildIndexTail(
  appended: Buffer,
  from: number,
  lastDay: number
): { entries: Buffer; lastDay: number } | undefined {
  const chunks: Buffer[] = [];
  let offset = 0;
  let day = lastDay;
  while (offset < appended.length) {
    const next = nextRecord(appended, offset);
    if (next < 0) return undefined;
    const recordDay = localDay(appended.readUInt32LE(offset));
    if (recordDay >= 0 && recordDay > day && recordDay <= 0xffff) {
      const absolute = from + offset;
      if (absolute > MAX_INDEX_OFFSET) return undefined;
      chunks.push(indexEntry(recordDay, absolute));
      day = recordDay;
    }
    offset = next;
  }
  return { entries: Buffer.concat(chunks), lastDay: day };
}

/** One `.idx` body entry: u16 day key, u40 byte offset into the log. */
function indexEntry(day: number, offset: number): Buffer {
  const entry = Buffer.allocUnsafe(7);
  entry.writeUInt16LE(day, 0);
  entry.writeUIntLE(offset, 2, 5);
  return entry;
}

/**
 * Debug assertion for the append path, enabled with HORIZON_SYNC_VERIFY. The
 * whole correctness argument for extending an index in place reduces to this:
 * the result must equal a rebuild from the finished log. A mismatch is a
 * duplicate or out-of-order day entry, which hides messages from the log viewer
 * without changing any message count, so it would otherwise surface weeks later
 * as "some of my history is missing" rather than as a failure here.
 */
function verifyIndexMatchesLog(file: string, what: 'append' | 'rebuild'): void {
  const indexFile = `${file}.idx`;
  const log = fs.readFileSync(file);
  const actual = fs.existsSync(indexFile)
    ? fs.readFileSync(indexFile)
    : undefined;
  const expected = buildLogIndexBuffer(
    actual !== undefined ? (readLogIndexName(actual) ?? '') : '',
    log
  );
  const agrees =
    expected === undefined
      ? actual === undefined
      : actual !== undefined && expected.equals(actual);
  if (!agrees)
    throw new Error(
      `Sync ${what} left ${indexFile} out of step with its log. This is a bug in the ${what === 'append' ? 'append fast path' : 'day-at-a-time rebuild'}.`
    );
}

/**
 * Extends a conversation in place rather than rewriting it. Returns undefined
 * when any precondition fails, which means the caller must take the full path.
 *
 * The log grows first and is flushed before the index does. That is the
 * opposite order to the rewrite path, deliberately: for an extension, a crash
 * leaving the log grown and the index short only costs a day marker until Fix
 * Logs runs, whereas an index entry pointing past the end of a short log makes
 * getLogs read uninitialised memory and render it as messages.
 */
function appendToLog(
  file: string,
  carry: ConversationCarry,
  added: JsonLogMessage[]
): boolean {
  const appended = jsonLogToBinary(added);
  if (carry.size + appended.length > MAX_INDEX_OFFSET) return false;
  const indexFile = `${file}.idx`;
  if (!fs.existsSync(indexFile)) return false;
  const tail = buildIndexTail(appended, carry.size, carry.lastDay);
  if (tail === undefined) return false;

  let log: number | undefined;
  let index: number | undefined;
  let indexSize = 0;
  let grew = false;
  try {
    log = fs.openSync(file, 'r+');
    if (fs.fstatSync(log).size !== carry.size) return false;
    if (tail.entries.length > 0) {
      index = fs.openSync(indexFile, 'r+');
      indexSize = fs.fstatSync(index).size;
    }
    fs.writeSync(log, appended, 0, appended.length, carry.size);
    fs.fsyncSync(log);
    grew = true;
    if (index !== undefined) {
      fs.writeSync(index, tail.entries, 0, tail.entries.length, indexSize);
      fs.fsyncSync(index);
    }
    carry.lastDay = tail.lastDay;
    carry.size += appended.length;
    if (process.env.HORIZON_SYNC_VERIFY) verifyIndexMatchesLog(file, 'append');
    return true;
  } catch (error) {
    if (grew) {
      // Undo the index first: an entry pointing past the end of a shortened
      // log is the one state that makes getLogs render uninitialised bytes.
      if (index !== undefined)
        try {
          fs.ftruncateSync(index, indexSize);
          fs.fsyncSync(index);
        } catch {}
      if (log !== undefined)
        try {
          fs.ftruncateSync(log, carry.size);
          fs.fsyncSync(log);
        } catch {}
      throw error;
    }
    return false;
  } finally {
    for (const handle of [index, log])
      if (handle !== undefined)
        try {
          fs.closeSync(handle);
        } catch {}
  }
}

/**
 * Extends a conversation using what an earlier pass already established about
 * it, when every precondition holds. Undefined means the caller must take the
 * full path; it is never an error, only "not cheap this time".
 *
 * Deduplicating an ascending batch against just the trailing run is equivalent
 * to deduplicating against the whole file, because every incoming message is
 * then at or after the tail time and a sorted file holds every record at that
 * time in its trailing run.
 */
function tryAppendCarry(
  file: string,
  carry: ConversationCarry,
  incoming: JsonLogMessage[],
  checkCancelled: () => void
): FileMergeResult | undefined {
  if (!carry.sorted || !carry.indexCanonical || carry.tailTime < 0)
    return undefined;
  const seenTail = new Set(carry.tailKeys);
  const fresh: JsonLogMessage[] = [];
  let previous = carry.tailTime;
  for (const message of incoming) {
    if (message.time < previous) return undefined;
    previous = message.time;
    const dedupe = dedupeKey(message);
    if (seenTail.has(dedupe)) continue;
    seenTail.add(dedupe);
    fresh.push(message);
  }
  if (fresh.length === 0) return { added: 0, created: false };
  let size: number;
  try {
    size = fs.statSync(file).size;
  } catch {
    size = -1;
  }
  if (size !== carry.size) return undefined;
  checkCancelled();
  if (!appendToLog(file, carry, fresh)) return undefined;
  const last = fresh[fresh.length - 1].time;
  const run = fresh.filter(message => message.time === last).map(dedupeKey);
  if (last === carry.tailTime) carry.tailKeys.push(...run);
  else {
    carry.tailTime = last;
    carry.tailKeys = run;
  }
  // A conversation whose trailing run outgrows the cap stops being cheap to
  // dedupe against; retire the carry rather than let it grow.
  if (carry.tailKeys.length > TAIL_RUN_LIMIT) carry.sorted = false;
  return { added: fresh.length, created: false };
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
  incoming: JsonLogMessage[],
  fallbackName?: string,
  checkCancelled: () => void = neverCancelled,
  carries?: ConversationCarries,
  carryId?: string
): FileMergeResult {
  checkCancelled();
  const file = path.join(logsDir, key);

  // A conversation an earlier batch already parsed in full can often just be
  // extended. Everything below falls through to the original path unchanged
  // when it cannot, so the carry can only make this faster, never different.
  const carry =
    carries !== undefined && carryId !== undefined
      ? carries[carryId]
      : undefined;
  if (carry !== undefined && carry.damaged)
    return { added: 0, created: false, skipped: true };
  if (carry !== undefined) {
    const appended = tryAppendCarry(file, carry, incoming, checkCancelled);
    if (appended !== undefined) return appended;
  }

  const exists = fs.existsSync(file);
  let existing: JsonLogMessage[];
  try {
    checkCancelled();
    const original = exists ? fs.readFileSync(file) : Buffer.alloc(0);
    existing = binaryLogToJson(original, true);
    // Invalid UTF-8 must not silently become replacement characters either.
    if (!jsonLogToBinary(existing).equals(original))
      throw new DamagedLogError();
  } catch (error) {
    if (error instanceof DamagedLogError) {
      if (carries !== undefined && carryId !== undefined)
        carries[carryId] = {
          damaged: true,
          sorted: false,
          indexCanonical: false,
          size: 0,
          tailTime: -1,
          tailKeys: [],
          lastDay: -1,
          name: ''
        };
      return { added: 0, created: false, skipped: true };
    }
    throw error;
  }
  let ascendingLocal = true;
  for (let i = 1; i < existing.length; i++)
    if (existing[i].time < existing[i - 1].time) {
      ascendingLocal = false;
      break;
    }

  const seen = new Set<string>();
  for (const message of existing) seen.add(dedupeKey(message));

  const added: JsonLogMessage[] = [];
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

  const logBuffer = jsonLogToBinary(merged);
  // Build the index from the finished log BEFORE swapping it in, reusing the
  // exporter/backup builder so both agree on name truncation and day-range
  // handling. Building here can no longer abort after the log is replaced, so
  // a live log is never left paired with a stale or missing index.
  const indexBuffer = buildLogIndexBuffer(name, logBuffer);

  checkCancelled();
  fs.mkdirSync(logsDir, { recursive: true });
  // Stage both files and retain the old pair until installation succeeds.
  // Remove the old index before replacing the log: even if rollback fails,
  // readers must never use old offsets with new log bytes.
  const staging = fs.mkdtempSync(path.join(logsDir, '.sync-'));
  const stagedLog = path.join(staging, 'new-log');
  const stagedIndex = path.join(staging, 'new-index');
  const oldLog = path.join(staging, 'old-log');
  const oldIndex = path.join(staging, 'old-index');
  const indexFile = `${file}.idx`;
  let indexMoved = false;
  let logReplaced = false;
  let preserveRecovery = false;
  try {
    fs.writeFileSync(stagedLog, logBuffer, { mode: 0o600 });
    if (indexBuffer)
      fs.writeFileSync(stagedIndex, indexBuffer, { mode: 0o600 });
    if (exists) fs.copyFileSync(file, oldLog);
    if (fs.existsSync(indexFile)) {
      fs.renameSync(indexFile, oldIndex);
      indexMoved = true;
    }
    fs.renameSync(stagedLog, file);
    logReplaced = true;
    if (indexBuffer) fs.renameSync(stagedIndex, indexFile);
  } catch (error) {
    try {
      if (logReplaced) {
        if (exists) fs.renameSync(oldLog, file);
        else fs.unlinkSync(file);
      }
      if (indexMoved) fs.renameSync(oldIndex, indexFile);
    } catch {
      preserveRecovery = true;
      throw new Error(
        `Could not restore log files; originals are in ${staging}. Run Fix Logs before syncing again.`
      );
    }
    throw error;
  } finally {
    if (!preserveRecovery) fs.rmSync(staging, { recursive: true, force: true });
  }

  if (carries !== undefined && carryId !== undefined) {
    // Record what this full parse learned, so the next batch carrying more of
    // the same conversation can extend it. The index was just written from the
    // finished log, so it is canonical by construction.
    const tail = readLogTail(file, logBuffer.length);
    const lastDay =
      indexBuffer !== undefined && indexBuffer.length >= 7
        ? indexBuffer.readUInt16LE(indexBuffer.length - 7)
        : -1;
    carries[carryId] =
      tail === undefined || indexBuffer === undefined
        ? {
            damaged: false,
            sorted: false,
            indexCanonical: false,
            size: logBuffer.length,
            tailTime: -1,
            tailKeys: [],
            lastDay: -1,
            name
          }
        : {
            damaged: false,
            sorted: ascendingLocal,
            indexCanonical: true,
            size: logBuffer.length,
            tailTime: tail.time,
            tailKeys: tail.keys,
            lastDay,
            name
          };
  }

  return { added: added.length, created: !exists };
}

/**
 * Validates a character or conversation-key path segment from an untrusted
 * zip so it cannot escape the data directory.
 */
function isSafeSegment(segment: string, suffixBytes = 0): boolean {
  if (segment.length === 0) return false;
  if (Buffer.from(segment, 'utf8').toString('utf8') !== segment) return false;
  if (Buffer.byteLength(segment, 'utf8') + suffixBytes > 255) return false;
  if (segment === '.' || segment === '..') return false;
  if (segment.startsWith('.')) return false;
  if (/[/\\]/.test(segment)) return false;
  if (/[<>:"|?*\u0000-\u001f]/.test(segment)) return false;
  if (/[. ]$/.test(segment)) return false;
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment))
    return false;
  return true;
}

function resolveInside(baseDir: string, ...segments: string[]): string {
  const target = path.resolve(baseDir, ...segments);
  const base = path.resolve(baseDir);
  if (target !== base && !target.startsWith(`${base}${path.sep}`))
    throw new Error(`Unsafe path in sync payload: ${segments.join('/')}`);
  return target;
}

function parseNamesEntry(
  zip: AdmZip,
  character: string,
  checkCancelled: () => void
): Map<string, string> {
  const names = new Map<string, string>();
  const entry = zip.getEntry(`characters/${character}/logs-names.json`);
  // AdmZip does not bound inflate output when the declared size is zero.
  // Empty files cannot contain JSON, so never decompress them.
  if (!entry || entry.header.size === 0) return names;
  checkCancelled();
  try {
    const parsed: unknown = JSON.parse(utf8Decoder.decode(entry.getData()));
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
 * Total declared uncompressed size of every entry in a sync zip. AdmZip
 * allocates each entry's decompressed buffer from this header value, so the
 * sum bounds the memory `mergeLogsZip` will allocate. Read from the central
 * directory, so it is available before any entry is decompressed.
 */
export function archiveUncompressedBytes(zip: AdmZip): number {
  let total = 0;
  for (const entry of zip.getEntries()) total += entry.header.size;
  return total;
}

/** Rejects unsafe archive sizes using ZIP metadata, before any entry inflates. */
export function validateSyncArchive(
  zip: AdmZip,
  checkCancelled: () => void = neverCancelled
): number {
  let total = 0;
  for (const entry of zip.getEntries()) {
    checkCancelled();
    const size = entry.header.size;
    total += size;
    if (total > SYNC_MAX_UNCOMPRESSED_BYTES)
      throw archiveTooLargeError('Sync archive is too large.');
  }
  return total;
}

/**
 * Parses one zip entry path against the sync zip layout
 * `characters/{character}/logs/{key}.json` (see docs/log-sync-protocol.md),
 * returning the character folder and conversation key. Returns undefined when
 * the entry is not a well-formed, safe log file: wrong shape, a segment that
 * could escape the data dir, a reserved folder (`settings`/`eicons`), an index
 * sidecar, or filesystem litter a careless sender zipped up (Thumbs.db or
 * .DS_Store shipped as a `.json`).
 */
function parseLogEntryPath(
  entryName: string
): { character: string; key: string } | undefined {
  const segments = entryName.replace(/\\/g, '/').split('/');
  if (segments.length !== 4) return undefined;
  const [top, character, kind, file] = segments;
  if (top !== 'characters' || kind !== 'logs' || !file.endsWith('.json'))
    return undefined;
  const key = file.slice(0, -5);
  if (!isSafeSegment(character) || !isSafeSegment(key, 4)) return undefined;
  if (['settings', 'eicons'].includes(character.toLowerCase()))
    return undefined;
  if (key.toLowerCase().endsWith('.idx') || isFilesystemArtifact(key))
    return undefined;
  return { character, key };
}

/**
 * Merges every `characters/{char}/logs/{key}.json` entry of a sync zip
 * (the logs-only export format, see docs/log-sync-protocol.md) into the
 * local log store at `dataDir`.
 */
export function mergeLogsZip(
  dataDir: string,
  zip: AdmZip,
  checkCancelled: () => void = neverCancelled,
  carries: ConversationCarries = {}
): LogMergeReport {
  validateSyncArchive(zip, checkCancelled);
  const stats: LogMergeStats = {
    conversationsCreated: 0,
    conversationsUpdated: 0,
    messagesAdded: 0,
    charactersTouched: 0,
    conversationsSkipped: 0
  };
  const identities: LogMergeIdentities = {
    created: [],
    updated: [],
    skipped: [],
    characters: []
  };
  const touched = new Set<string>();
  const namesByCharacter = new Map<string, Map<string, string>>();

  for (const entry of zip.getEntries()) {
    checkCancelled();
    if (!entry || entry.isDirectory || entry.header.size === 0) continue;
    const parsed = parseLogEntryPath(entry.entryName);
    if (parsed === undefined) continue;
    const { character, key } = parsed;

    let incoming: unknown;
    checkCancelled();
    try {
      incoming = JSON.parse(utf8Decoder.decode(entry.getData()));
    } catch {
      continue;
    }
    if (!Array.isArray(incoming)) continue;
    const messages = incoming.filter(isValidLogMessage);
    if (messages.length === 0) continue;

    let names = namesByCharacter.get(character);
    if (names === undefined) {
      names = parseNamesEntry(zip, character, checkCancelled);
      namesByCharacter.set(character, names);
    }

    // isSafeSegment already blocks separators and `..`; re-assert here that the
    // resolved log path still stays under dataDir before writing to it.
    const logsDir = resolveInside(dataDir, character, 'logs');
    resolveInside(dataDir, character, 'logs', key);
    const id = `${character}/${key}`;
    const result = mergeLogFile(
      logsDir,
      key,
      messages,
      names.get(key.toLowerCase()),
      checkCancelled,
      carries,
      id
    );
    if (result.skipped) {
      stats.conversationsSkipped++;
      identities.skipped.push(id);
    }
    if (result.added > 0) {
      stats.messagesAdded += result.added;
      if (result.created) {
        stats.conversationsCreated++;
        identities.created.push(id);
      } else {
        stats.conversationsUpdated++;
        identities.updated.push(id);
      }
      touched.add(character);
    }
  }

  stats.charactersTouched = touched.size;
  identities.characters = Array.from(touched);
  return { stats, identities, carries: trimCarries(carries) };
}

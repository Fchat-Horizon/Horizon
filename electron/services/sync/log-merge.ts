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
 * Bytes read at a time when walking a stored log. A record is at most 65545
 * bytes (isValidLogMessage bounds sender + text + 8 at 0xffff), so a window
 * this size always contains at least one whole record and a walk that restarts
 * at the last complete boundary can never stall.
 */
const SCAN_WINDOW = 256 * 1024;

/** Byte range covering every stored record of one day. */
interface LogDaySpan {
  start: number;
  end: number;
  /** Times of the first and last record of this day, in file order. */
  firstTime: number;
  lastTime: number;
  /** False when this day's records are not one unbroken run. */
  contiguous: boolean;
  /** False when this day's records are not already in time order on disk. */
  sorted: boolean;
}

/**
 * What one bounded pass over a stored log establishes. Memory is bounded by the
 * number of distinct days, which a u32 timestamp caps near 50000 entries, never
 * by the log's size.
 */
interface LogScan {
  size: number;
  days: Map<number, LogDaySpan>;
  /** Day keys in ascending order, the order a rebuild emits them in. */
  dayOrder: number[];
  /** Exactly the entries buildLogIndexBuffer would emit for this log. */
  canonical: { day: number; offset: number }[];
  /** No record time was lower than its predecessor. */
  ascending: boolean;
  /** Time of the last record, or -1 for an empty or missing log. */
  tailTime: number;
  /** Day of the last canonical entry, or -1 when there is none. */
  lastDay: number;
}

function emptyScan(): LogScan {
  return {
    size: 0,
    days: new Map(),
    dayOrder: [],
    canonical: [],
    ascending: true,
    tailTime: -1,
    lastDay: -1
  };
}

/**
 * Walks a whole stored log in bounded windows, learning where each day lives
 * and whether the file is undamaged, without ever holding more than one window.
 *
 * The damage verdict must be identical to the one a whole-file strict parse
 * gave, because "damaged" means skip this conversation entirely rather than
 * rewrite a readable prefix over it. Three things deliver that. Every byte is
 * covered by exactly one strict parse, since windows restart at the last
 * complete record boundary. A window that yields bytes but consumes none, or a
 * file that ends with bytes no record claims, is damage, which is what
 * reproduces binaryLogToJson's whole-buffer `offset !== buffer.length` check.
 * And invalid UTF-8 is caught per record by strict mode, which round-trips
 * sender and text against their raw slices; the whole-file re-serialization
 * the old path used for this was belt over exactly that braces, and under
 * HORIZON_SYNC_VERIFY it is restored per window below.
 *
 * Throws DamagedLogError. Returns an empty scan for a missing or empty file.
 */
function scanLog(file: string, checkCancelled: () => void): LogScan {
  let size: number;
  try {
    size = fs.statSync(file).size;
  } catch {
    return emptyScan();
  }
  if (size === 0) return { ...emptyScan(), size: 0 };

  const scan: LogScan = { ...emptyScan(), size, days: new Map() };
  const window = Buffer.allocUnsafe(SCAN_WINDOW);
  let handle: number | undefined;
  let position = 0;
  let previousTime = -1;
  let runDay = Number.NaN;
  try {
    handle = fs.openSync(file, 'r');
    while (position < size) {
      checkCancelled();
      const read = fs.readSync(handle, window, 0, SCAN_WINDOW, position);
      if (read === 0) throw new DamagedLogError();
      let offset = 0;
      while (offset < read) {
        const next = nextRecord(window, offset);
        if (next < 0) break;
        const time = window.readUInt32LE(offset);
        if (previousTime >= 0 && time < previousTime) scan.ascending = false;
        previousTime = time;
        scan.tailTime = time;
        const absolute = position + offset;
        const day = localDay(time);
        // Every day is tracked, even one outside the indexable range, because
        // the rebuild must preserve those records; only the index entry below
        // is withheld, exactly as buildLogIndexBuffer withholds it.
        const span = scan.days.get(day);
        if (span === undefined) {
          scan.days.set(day, {
            start: absolute,
            end: absolute + (next - offset),
            firstTime: time,
            lastTime: time,
            contiguous: true,
            sorted: true
          });
          scan.dayOrder.push(day);
        } else {
          // Returning to a day after leaving it means its records are not one
          // run, so its span encloses records this day does not own.
          if (day !== runDay) span.contiguous = false;
          // A day stored out of time order has to be rewritten rather than
          // copied, because the merge it replaces sorted every record.
          if (time < span.lastTime) span.sorted = false;
          span.end = absolute + (next - offset);
          span.lastTime = time;
        }
        runDay = day;
        // buildLogIndexBuffer emits an entry only for a day strictly greater
        // than the last one emitted; a duplicate key would make loadIndex
        // hide every message of that day before the second offset.
        if (day >= 0 && day <= 0xffff && day > scan.lastDay) {
          scan.canonical.push({ day, offset: absolute });
          scan.lastDay = day;
        }
        offset = next;
      }
      // A window that holds bytes but no complete record means a record longer
      // than the window, which isValidLogMessage's bound makes impossible, or
      // damage. Either way the file cannot be walked.
      if (offset === 0) throw new DamagedLogError();
      // Reproduce the strict-parse verdict over exactly the bytes consumed.
      // The result is discarded; only the throw matters.
      binaryLogToJson(window.subarray(0, offset), true);
      if (process.env.HORIZON_SYNC_VERIFY)
        verifyWindowRoundTrip(window.subarray(0, offset));
      position += offset;
    }
  } finally {
    if (handle !== undefined)
      try {
        fs.closeSync(handle);
      } catch {}
  }
  if (position !== size) throw new DamagedLogError();

  scan.dayOrder.sort((a, b) => a - b);
  return scan;
}

/**
 * The whole-file `jsonLogToBinary(existing).equals(original)` check the old
 * merge path used, restored per window under HORIZON_SYNC_VERIFY. Strict
 * parsing already rejects everything this can catch, so this exists to prove
 * that claim against real logs rather than to enforce it.
 */
function verifyWindowRoundTrip(consumed: Buffer): void {
  if (!jsonLogToBinary(binaryLogToJson(consumed, true)).equals(consumed))
    throw new DamagedLogError();
}

/** True when the stored `.idx` body is exactly what this scan would emit. */
function indexMatchesScan(index: Buffer, scan: LogScan): boolean {
  const nameLength = index.length >= 1 ? index.readUInt8(0) : -1;
  if (nameLength < 0 || index.length < nameLength + 1) return false;
  const body = index.subarray(nameLength + 1);
  if (body.length !== scan.canonical.length * 7) return false;
  for (let i = 0; i < scan.canonical.length; i++) {
    const entry = scan.canonical[i];
    if (body.readUInt16LE(i * 7) !== entry.day) return false;
    if (body.readUIntLE(i * 7 + 2, 5) !== entry.offset) return false;
  }
  return true;
}

/**
 * Every stored record belonging to `day`, in file order. Peak is one day's
 * records. The day filter is what keeps an interleaved log correct rather than
 * merely slower: a span is first-record-to-last, so it can enclose records of
 * neighbouring days, and those must not be duplicated into this one.
 */
function readDayRecords(
  handle: number,
  span: LogDaySpan,
  day: number,
  window: Buffer
): JsonLogMessage[] {
  const records: JsonLogMessage[] = [];
  let position = span.start;
  while (position < span.end) {
    const want = Math.min(SCAN_WINDOW, span.end - position);
    const read = fs.readSync(handle, window, 0, want, position);
    if (read === 0) throw new DamagedLogError();
    let offset = 0;
    while (offset < read) {
      const next = nextRecord(window, offset);
      if (next < 0) break;
      if (localDay(window.readUInt32LE(offset)) === day) {
        const [message] = binaryLogToJson(window.subarray(offset, next), true);
        if (message === undefined) throw new DamagedLogError();
        records.push(message);
      }
      offset = next;
    }
    if (offset === 0) throw new DamagedLogError();
    position += offset;
  }
  return records;
}

/** Buckets an incoming batch by day, holding references and keeping order. */
function groupIncomingByDay(
  incoming: JsonLogMessage[]
): Map<number, JsonLogMessage[]> {
  const byDay = new Map<number, JsonLogMessage[]>();
  for (const message of incoming) {
    const day = localDay(message.time);
    const bucket = byDay.get(day);
    if (bucket === undefined) byDay.set(day, [message]);
    else bucket.push(message);
  }
  return byDay;
}

/**
 * Which incoming records are genuinely new, deciding one day at a time so no
 * more than one day of stored dedupe keys is ever resident.
 *
 * Per-day dedupe is exactly whole-file dedupe: a dedupe key begins with the
 * record's time, so two records can only collide at equal times, and localDay
 * is a function of time, so equal times fall in the same day. No incoming
 * record can ever match a stored record outside its own day.
 */
function selectNewByDay(
  file: string,
  scan: LogScan,
  byDay: Map<number, JsonLogMessage[]>,
  checkCancelled: () => void
): { newByDay: Map<number, JsonLogMessage[]>; added: number } {
  const newByDay = new Map<number, JsonLogMessage[]>();
  let added = 0;
  let handle: number | undefined;
  const window = scan.size > 0 ? Buffer.allocUnsafe(SCAN_WINDOW) : undefined;
  try {
    for (const [day, candidates] of byDay) {
      checkCancelled();
      const span = scan.days.get(day);
      const seen = new Set<string>();
      if (span !== undefined && window !== undefined) {
        if (handle === undefined) handle = fs.openSync(file, 'r');
        for (const stored of readDayRecords(handle, span, day, window))
          seen.add(dedupeKey(stored));
      }
      const fresh: JsonLogMessage[] = [];
      for (const message of candidates) {
        const dedupe = dedupeKey(message);
        if (seen.has(dedupe)) continue;
        seen.add(dedupe);
        fresh.push(message);
      }
      if (fresh.length > 0) {
        newByDay.set(day, fresh);
        added += fresh.length;
      }
    }
  } finally {
    if (handle !== undefined)
      try {
        fs.closeSync(handle);
      } catch {}
  }
  return { newByDay, added };
}

/** What a streamed rebuild produced, for the carry the next batch will use. */
interface RebuildResult {
  size: number;
  index?: Buffer;
  lastDay: number;
  ascending: boolean;
}

/**
 * Writes the merged conversation to `destination` one day at a time, reading
 * only the day it is currently writing. A day with nothing new whose records
 * are already one unbroken run is copied byte for byte: the scan proved every
 * record round-trips strictly, so a parse and re-serialize would reproduce
 * exactly these bytes.
 *
 * Days are emitted in ascending order, which is what makes the index correct by
 * construction: getLogs reads a day as the span between consecutive offsets, so
 * a day's records must be contiguous in the file, and the strictly-ascending
 * emission means no duplicate day key can arise.
 */
function writeMergedLog(
  destination: string,
  source: string,
  scan: LogScan,
  newByDay: Map<number, JsonLogMessage[]>,
  name: string,
  checkCancelled: () => void
): RebuildResult {
  const days = Array.from(new Set([...scan.dayOrder, ...newByDay.keys()])).sort(
    (a, b) => a - b
  );
  const entries: Buffer[] = [];
  const window = Buffer.allocUnsafe(SCAN_WINDOW);
  let written = 0;
  let ascending = true;
  let lastDay = -1;
  let previousTime = -1;

  let out: number | undefined;
  let input: number | undefined;
  try {
    out = fs.openSync(destination, 'wx', 0o600);
    if (scan.size > 0) input = fs.openSync(source, 'r');
    for (const day of days) {
      checkCancelled();
      const span = scan.days.get(day);
      const fresh = newByDay.get(day);
      const start = written;
      // Copying raw bytes is only equivalent to reading, sorting and
      // re-serializing when this day is already one run in time order.
      if (
        fresh === undefined &&
        span !== undefined &&
        span.contiguous &&
        span.sorted
      ) {
        if (input === undefined) throw new DamagedLogError();
        let position = span.start;
        while (position < span.end) {
          const want = Math.min(SCAN_WINDOW, span.end - position);
          const read = fs.readSync(input, window, 0, want, position);
          if (read === 0) throw new DamagedLogError();
          fs.writeSync(out, window, 0, read, written);
          written += read;
          position += read;
        }
        // Times inside a copied run were already checked by the scan; only the
        // seam between days can newly go backwards.
        if (previousTime >= 0 && span.firstTime < previousTime)
          ascending = false;
        previousTime = span.lastTime;
      } else {
        const stored =
          span !== undefined && input !== undefined
            ? readDayRecords(input, span, day, window)
            : [];
        // Stored records come in file order and new ones in incoming order, so
        // concat then a stable sort by time reproduces exactly the relative
        // order the whole-file merge produced.
        const merged = stored.concat(fresh ?? []);
        merged.sort((a, b) => a.time - b.time);
        if (merged.length === 0) continue;
        const buffer = jsonLogToBinary(merged);
        fs.writeSync(out, buffer, 0, buffer.length, written);
        written += buffer.length;
        if (previousTime >= 0 && merged[0].time < previousTime)
          ascending = false;
        previousTime = merged[merged.length - 1].time;
      }
      if (written === start) continue;
      if (day >= 0 && day <= 0xffff) {
        if (start > MAX_INDEX_OFFSET)
          throw new Error('Merged conversation is too large to index');
        entries.push(indexEntry(day, start));
        lastDay = day;
      }
    }
    fs.fsyncSync(out);
  } finally {
    for (const handle of [input, out])
      if (handle !== undefined)
        try {
          fs.closeSync(handle);
        } catch {}
  }

  return {
    size: written,
    index: entries.length > 0 ? buildIndexBody(name, entries) : undefined,
    lastDay,
    ascending
  };
}

/**
 * Prefixes index entries with the name header, exactly as buildLogIndexBuffer
 * does, including the pre-cap that keeps byte-trimming a hostile name linear.
 */
function buildIndexBody(name: string, entries: Buffer[]): Buffer {
  let indexName = name.slice(0, 255);
  while (Buffer.byteLength(indexName) > 255) indexName = indexName.slice(0, -1);
  const nameLength = Buffer.byteLength(indexName);
  const header = Buffer.allocUnsafe(nameLength + 1);
  header.writeUInt8(nameLength, 0);
  header.write(indexName, 1);
  return Buffer.concat([header, ...entries]);
}

/** Assembles the carry a scan plus a cheap tail walk can justify. */
function carryFromScan(
  file: string,
  scan: LogScan,
  name: string,
  indexCanonical: boolean
): ConversationCarry {
  const tail = readLogTail(file, scan.size);
  if (tail === undefined || !indexCanonical)
    return {
      damaged: false,
      sorted: false,
      indexCanonical: false,
      size: scan.size,
      tailTime: -1,
      tailKeys: [],
      lastDay: -1,
      name
    };
  return {
    damaged: false,
    sorted: scan.ascending,
    indexCanonical: true,
    size: scan.size,
    tailTime: tail.time,
    tailKeys: tail.keys,
    lastDay: scan.lastDay,
    name
  };
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
  let scan: LogScan;
  try {
    checkCancelled();
    scan = scanLog(file, checkCancelled);
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

  const storedIndex = readIndexFile(`${file}.idx`);
  const name =
    (storedIndex !== undefined ? readLogIndexName(storedIndex) : undefined) ??
    (fallbackName !== undefined && fallbackName.length > 0
      ? fallbackName
      : key);
  const scanCarry = carryFromScan(
    file,
    scan,
    name,
    storedIndex !== undefined && indexMatchesScan(storedIndex, scan)
  );

  // The scan established everything a carry needs, so the first batch to touch
  // a pre-existing conversation can take the append path too, instead of
  // paying for one rewrite before any later batch can be cheap.
  const appended = tryAppendCarry(file, scanCarry, incoming, checkCancelled);
  if (appended !== undefined) {
    storeCarry(carries, carryId, scanCarry);
    return appended;
  }

  const { newByDay, added } = selectNewByDay(
    file,
    scan,
    groupIncomingByDay(incoming),
    checkCancelled
  );
  if (added === 0) {
    storeCarry(carries, carryId, scanCarry);
    return { added: 0, created: false };
  }

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
  let built: RebuildResult;
  try {
    // Write the merged log a day at a time, reading only the day being written,
    // and build its index from what was actually written. Both are finished
    // before anything is swapped in, so a live log is never left paired with a
    // stale or missing index.
    built = writeMergedLog(
      stagedLog,
      file,
      scan,
      newByDay,
      name,
      checkCancelled
    );
    const indexBuffer = built.index;
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

  if (process.env.HORIZON_SYNC_VERIFY) verifyIndexMatchesLog(file, 'rebuild');

  if (carries !== undefined && carryId !== undefined) {
    // Record what the rebuild produced, so the next batch carrying more of this
    // conversation can extend it instead. The index was just written from the
    // finished log, so it is canonical by construction, and the log is sorted
    // if the rebuild wrote it in time order.
    const tail = readLogTail(file, built.size);
    carries[carryId] =
      tail === undefined || built.index === undefined
        ? {
            damaged: false,
            sorted: false,
            indexCanonical: false,
            size: built.size,
            tailTime: -1,
            tailKeys: [],
            lastDay: -1,
            name
          }
        : {
            damaged: false,
            sorted: built.ascending,
            indexCanonical: true,
            size: built.size,
            tailTime: tail.time,
            tailKeys: tail.keys,
            lastDay: built.lastDay,
            name
          };
  }

  return { added, created: !exists };
}

/** Reads a `.idx` whole; it is at most a few hundred kilobytes. */
function readIndexFile(indexFile: string): Buffer | undefined {
  try {
    return fs.readFileSync(indexFile);
  } catch {
    return undefined;
  }
}

/** Records a carry when this merge is running as part of a batched session. */
function storeCarry(
  carries: ConversationCarries | undefined,
  carryId: string | undefined,
  carry: ConversationCarry
): void {
  if (carries !== undefined && carryId !== undefined) carries[carryId] = carry;
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

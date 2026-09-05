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
import {
  binaryLogToJson,
  DamagedLogError,
  buildLogIndexBuffer,
  isFilesystemArtifact,
  jsonLogToBinary,
  readLogIndexName
} from '../log-backup';
import type { JsonLogMessage } from '../log-backup';
import type { LogMergeStats } from './protocol';

// Highest Conversation.Message.Type enum value (Bcast); see chat/interfaces.ts
// and docs/log-sync-protocol.md. Kept as a literal because this module is pure
// Node and must not import chat/.
const MAX_MESSAGE_TYPE = 6;

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
  fallbackName?: string
): FileMergeResult {
  const file = path.join(logsDir, key);
  const exists = fs.existsSync(file);
  let existing: JsonLogMessage[];
  try {
    const original = exists ? fs.readFileSync(file) : Buffer.alloc(0);
    existing = binaryLogToJson(original, true);
    // Invalid UTF-8 must not silently become replacement characters either.
    if (!jsonLogToBinary(existing).equals(original))
      throw new DamagedLogError();
  } catch (error) {
    if (error instanceof DamagedLogError)
      return { added: 0, created: false, skipped: true };
    throw error;
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

function parseNamesEntry(zip: AdmZip, character: string): Map<string, string> {
  const names = new Map<string, string>();
  const entry = zip.getEntry(`characters/${character}/logs-names.json`);
  // AdmZip does not bound inflate output when the declared size is zero.
  // Empty files cannot contain JSON, so never decompress them.
  if (!entry || entry.header.size === 0) return names;
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
  if (!isSafeSegment(character) || !isSafeSegment(key)) return undefined;
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
export function mergeLogsZip(dataDir: string, zip: AdmZip): LogMergeStats {
  const stats: LogMergeStats = {
    conversationsCreated: 0,
    conversationsUpdated: 0,
    messagesAdded: 0,
    charactersTouched: 0,
    conversationsSkipped: 0
  };
  const touched = new Set<string>();
  const namesByCharacter = new Map<string, Map<string, string>>();

  for (const entry of zip.getEntries()) {
    if (!entry || entry.isDirectory || entry.header.size === 0) continue;
    const parsed = parseLogEntryPath(entry.entryName);
    if (parsed === undefined) continue;
    const { character, key } = parsed;

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

    // isSafeSegment already blocks separators and `..`; re-assert here that the
    // resolved log path still stays under dataDir before writing to it.
    const logsDir = resolveInside(dataDir, character, 'logs');
    resolveInside(dataDir, character, 'logs', key);
    const result = mergeLogFile(
      logsDir,
      key,
      messages,
      names.get(key.toLowerCase())
    );
    if (result.skipped) stats.conversationsSkipped++;
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

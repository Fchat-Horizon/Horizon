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
 * Builds the logs-only zip sent to the peer during device sync. The layout
 * is the regular Horizon export format (which Solstice already imports)
 * restricted to chat logs, with JSON-converted log files plus one
 * `logs-names.json` per character carrying the conversation display names
 * from the local `.idx` files. Pure Node.
 */

import archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';
import { binaryLogToJson, isFilesystemArtifact } from '../log-backup';
import { sliceJsonLog } from '../log-stream';
import { createManifest } from '../exporter/manifest';
import { TextReader, writeZipFile } from '../zip';
import { readIndexName } from './log-merge';
import {
  SYNC_BATCH_ENTRY,
  SYNC_MAX_UNCOMPRESSED_BYTES,
  SYNC_MAX_BODY_BYTES,
  SYNC_IV_LENGTH,
  SYNC_TAG_LENGTH
} from './protocol';
import type { SyncBatchInfo } from './protocol';

export interface LogsZipResult {
  /** Characters that had at least one log file. */
  characters: string[];
  /** Number of conversation log files included. */
  conversations: number;
  /**
   * `{character}/{file}` for every conversation in this archive. A batched
   * session unions these, so a conversation spanning several batches counts
   * once rather than once per batch.
   */
  conversationKeys: string[];
}

function listCharacters(dataDir: string): string[] {
  const characters: string[] = [];
  try {
    for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'settings' || entry.name === 'eicons') continue;
      if (entry.name.startsWith('.')) continue;
      characters.push(entry.name);
    }
  } catch {
    return [];
  }
  return characters.sort((a, b) => a.localeCompare(b));
}

function listLogFiles(logsDir: string): string[] {
  try {
    return fs
      .readdirSync(logsDir, { withFileTypes: true })
      .filter(
        entry =>
          entry.isFile() &&
          !entry.name.toLowerCase().endsWith('.idx') &&
          !entry.name.endsWith('.syncmerge') &&
          !isFilesystemArtifact(entry.name)
      )
      .map(entry => entry.name);
  } catch {
    return [];
  }
}

/**
 * Writes the sync zip for all characters under `dataDir` to `outFile`.
 */
export async function buildLogsZip(
  dataDir: string,
  outFile: string,
  signal?: AbortSignal
): Promise<LogsZipResult> {
  signal?.throwIfAborted();
  const characters = listCharacters(dataDir);
  const included: string[] = [];
  const conversationKeys: string[] = [];
  let conversations = 0;

  type CharacterLogs = { character: string; files: string[]; logsDir: string };
  const plan: CharacterLogs[] = [];
  for (const character of characters) {
    const logsDir = path.join(dataDir, character, 'logs');
    const files = listLogFiles(logsDir);
    if (files.length === 0) continue;
    plan.push({ character, files, logsDir });
    included.push(character);
    for (const file of files) conversationKeys.push(`${character}/${file}`);
    conversations += files.length;
  }

  const archive = archiver('zip', { zlib: { level: 6 } });
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const output = fs.createWriteStream(outFile, { mode: 0o600, flags: 'wx' });
  let archiveError: Error | undefined;
  const abort = (): void => {
    archive.abort();
    output.destroy(new Error('Sync archive cancelled'));
  };
  const done = new Promise<void>((resolve, reject) => {
    output.on('close', () => resolve());
    output.on('error', reject);
    archive.on('error', error => {
      archiveError = error;
      output.destroy(error);
      reject(error);
    });
  });
  // Attach a handler immediately, including while an entry is being prepared.
  void done.catch(() => {});
  signal?.addEventListener('abort', abort, { once: true });
  archive.pipe(output);
  let uncompressedBytes = 0;
  const append = async (data: string, name: string): Promise<void> => {
    signal?.throwIfAborted();
    if (archiveError) throw archiveError;
    const bytes = Buffer.byteLength(data);
    uncompressedBytes += bytes;
    if (uncompressedBytes > SYNC_MAX_UNCOMPRESSED_BYTES)
      throw { status: 413, code: 'archive-too-large' };
    // Wait for each entry so archiver cannot queue an entire JSON log set in
    // memory. This also lets Stop run between conversations.
    await new Promise<void>((resolve, reject) => {
      const cleanup = (): void => {
        archive.removeListener('entry', completed);
        archive.removeListener('error', failed);
        output.removeListener('error', failed);
        signal?.removeEventListener('abort', cancelled);
      };
      const completed = (): void => {
        cleanup();
        resolve();
      };
      const failed = (error: Error): void => {
        cleanup();
        reject(error);
      };
      const cancelled = (): void => failed(new Error('Sync archive cancelled'));
      archive.once('entry', completed);
      archive.once('error', failed);
      output.once('error', failed);
      signal?.addEventListener('abort', cancelled, { once: true });
      archive.append(data, { name });
    });
    if (
      archive.pointer() + SYNC_IV_LENGTH + SYNC_TAG_LENGTH >
      SYNC_MAX_BODY_BYTES
    )
      throw { status: 413, code: 'archive-too-large' };
  };

  try {
    // One entry per log file plus one logs-names.json per character.
    const expectedFiles = conversations + plan.length;
    const manifest = createManifest(
      included,
      {
        generalSettings: false,
        logs: true,
        drafts: false,
        characterSettings: false,
        pinned: false,
        eicons: false,
        recents: false,
        hidden: false,
        jsonLogs: true
      },
      expectedFiles
    );
    await append(JSON.stringify(manifest, null, 2), 'manifest.json');

    for (const { character, files, logsDir } of plan) {
      const names: { [key: string]: string } = Object.create(null);
      for (const file of files) {
        signal?.throwIfAborted();
        const messages = binaryLogToJson(
          fs.readFileSync(path.join(logsDir, file))
        );
        // Count serialized records before joining so JSON expansion (for
        // example NUL escapes) participates in the archive-wide limit.
        const records: string[] = [];
        let jsonBytes = 2;
        for (const message of messages) {
          const record = JSON.stringify(message);
          jsonBytes += Buffer.byteLength(record) + (records.length ? 1 : 0);
          if (uncompressedBytes + jsonBytes > SYNC_MAX_UNCOMPRESSED_BYTES)
            throw { status: 413, code: 'archive-too-large' };
          records.push(record);
        }
        await append(
          `[${records.join(',')}]`,
          `characters/${character}/logs/${file}.json`
        );
        const name = readIndexName(path.join(logsDir, `${file}.idx`));
        if (name !== undefined) names[file] = name;
      }
      await append(
        JSON.stringify(names),
        `characters/${character}/logs-names.json`
      );
    }

    await archive.finalize();
    await done;
    signal?.throwIfAborted();
    if (
      fs.statSync(outFile).size + SYNC_IV_LENGTH + SYNC_TAG_LENGTH >
      SYNC_MAX_BODY_BYTES
    )
      throw { status: 413, code: 'archive-too-large' };
  } catch (error) {
    abort();
    await done.catch(() => {});
    throw error;
  } finally {
    signal?.removeEventListener('abort', abort);
  }
  return { characters: included, conversations, conversationKeys };
}

/**
 * Where a batched send resumes. An absent character means the first one, and
 * `offset` is a byte offset into `file`'s binary log.
 */
export interface LogsZipPosition {
  character?: string;
  file?: string;
  offset: number;
}

export interface LogsBatchResult {
  /** What this batch carried, for the session totals. */
  result: LogsZipResult;
  /** Where the next batch resumes, or undefined once the log set is finished. */
  next: LogsZipPosition | undefined;
}

/**
 * Plain code-unit order. The cursor resumes by skipping everything ordered at
 * or before it, so the enumeration order and that comparison have to agree;
 * localeCompare does not order the same way `>=` does.
 */
function byCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Writes one batch of the sync zip: the conversations following `start`, up to
 * roughly `budget` bytes of JSON. Unlike buildLogsZip this never holds a whole
 * conversation, let alone a whole log set: each entry is one bounded slice, so
 * a conversation larger than the budget simply spans several batches, carrying
 * the same entry path in each. The receiver's merge is a union, so the pieces
 * reassemble with no extra protocol machinery.
 */
export async function buildLogsBatchZip(
  dataDir: string,
  outFile: string,
  start: LogsZipPosition,
  batchIndex: number,
  budget: number,
  maxRecords: number,
  nextCursor: string,
  signal?: AbortSignal
): Promise<LogsBatchResult> {
  signal?.throwIfAborted();
  const characters = listCharacters(dataDir)
    .sort(byCodeUnit)
    .filter(name => start.character === undefined || name >= start.character);

  const included = new Set<string>();
  const conversationKeys = new Set<string>();
  const names = new Map<string, Map<string, string>>();
  const slices: { name: string; json: string }[] = [];
  let remaining = budget;
  let records = maxRecords;
  let next: LogsZipPosition | undefined;

  for (const character of characters) {
    if (next !== undefined) break;
    const logsDir = path.join(dataDir, character, 'logs');
    let files = listLogFiles(logsDir).sort(byCodeUnit);
    if (character === start.character && start.file !== undefined) {
      const resumeAt = start.file;
      files = files.filter(file => file >= resumeAt);
    }
    for (const file of files) {
      signal?.throwIfAborted();
      const resuming = character === start.character && file === start.file;
      const slice = await sliceJsonLog(
        path.join(logsDir, file),
        resuming ? start.offset : 0,
        remaining,
        records
      );
      if (slice.count > 0) {
        slices.push({
          name: `characters/${character}/logs/${file}.json`,
          json: slice.json
        });
        included.add(character);
        conversationKeys.add(`${character}/${file}`);
        const name = readIndexName(path.join(logsDir, `${file}.idx`));
        if (name !== undefined) {
          let map = names.get(character);
          if (map === undefined) {
            map = new Map<string, string>();
            names.set(character, map);
          }
          map.set(file, name);
        }
        remaining -= slice.jsonBytes;
        records -= slice.count;
      }
      // Stopping mid-conversation means the budget ran out inside it. Stopping
      // at its end with nothing left means the next batch starts after it; the
      // recorded offset is then the file's end, so resuming re-reads nothing.
      if (!slice.atEof || remaining <= 0 || records <= 0) {
        next = { character, file, offset: slice.nextOffset };
        break;
      }
    }
  }

  const manifest = createManifest(
    Array.from(included),
    {
      generalSettings: false,
      logs: true,
      drafts: false,
      characterSettings: false,
      pinned: false,
      eicons: false,
      recents: false,
      hidden: false,
      jsonLogs: true
    },
    slices.length + names.size
  );
  // The server mints the token before the batch is built, because it owns the
  // map from token to position; the archive only carries it to the peer.
  const batch: SyncBatchInfo =
    next === undefined
      ? { index: batchIndex, done: true }
      : { index: batchIndex, done: false, cursor: nextCursor };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const bytes = await writeZipFile(outFile, async zip => {
    for (const slice of slices) {
      signal?.throwIfAborted();
      await zip.add(slice.name, new TextReader(slice.json));
    }
    // Names cover only this batch's conversations. Both receivers take the
    // display name when they create the conversation and never revisit it, so
    // shipping a character's whole map in a later batch would come too late.
    for (const [character, map] of names) {
      const document: { [key: string]: string } = Object.create(null);
      for (const [file, name] of map) document[file] = name;
      await zip.add(
        `characters/${character}/logs-names.json`,
        new TextReader(JSON.stringify(document))
      );
    }
    await zip.add(
      'manifest.json',
      new TextReader(JSON.stringify(manifest, null, 2))
    );
    await zip.add(SYNC_BATCH_ENTRY, new TextReader(JSON.stringify(batch)));
  });
  signal?.throwIfAborted();
  if (bytes + SYNC_IV_LENGTH + SYNC_TAG_LENGTH > SYNC_MAX_BODY_BYTES)
    throw { status: 413, code: 'archive-too-large' };

  return {
    result: {
      characters: Array.from(included),
      conversations: conversationKeys.size,
      conversationKeys: Array.from(conversationKeys)
    },
    next
  };
}

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
import { createManifest } from '../exporter/manifest';
import { readIndexName } from './log-merge';
import {
  SYNC_MAX_UNCOMPRESSED_BYTES,
  SYNC_MAX_BODY_BYTES,
  SYNC_IV_LENGTH,
  SYNC_TAG_LENGTH
} from './protocol';

export interface LogsZipResult {
  /** Characters that had at least one log file. */
  characters: string[];
  /** Number of conversation log files included. */
  conversations: number;
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
  let conversations = 0;

  type CharacterLogs = { character: string; files: string[]; logsDir: string };
  const plan: CharacterLogs[] = [];
  for (const character of characters) {
    const logsDir = path.join(dataDir, character, 'logs');
    const files = listLogFiles(logsDir);
    if (files.length === 0) continue;
    plan.push({ character, files, logsDir });
    included.push(character);
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
    uncompressedBytes += Buffer.byteLength(data);
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
        if (
          fs.statSync(path.join(logsDir, file)).size >
          SYNC_MAX_UNCOMPRESSED_BYTES
        )
          throw { status: 413, code: 'archive-too-large' };
        const messages = binaryLogToJson(
          fs.readFileSync(path.join(logsDir, file))
        );
        await append(
          JSON.stringify(messages),
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
  return { characters: included, conversations };
}

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
import { binaryLogToJson } from '../exporter/backup-export-cli';
import { createManifest } from '../exporter/manifest';
import { readIndexName } from './log-merge';

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
          !entry.name.endsWith('.idx') &&
          !entry.name.endsWith('.syncmerge')
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
  outFile: string
): Promise<LogsZipResult> {
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
  const output = fs.createWriteStream(outFile);
  const done = new Promise<void>((resolve, reject) => {
    output.on('close', () => resolve());
    output.on('error', reject);
    archive.on('error', reject);
  });
  archive.pipe(output);

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
  archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

  for (const { character, files, logsDir } of plan) {
    const names: { [key: string]: string } = {};
    for (const file of files) {
      const messages = binaryLogToJson(
        fs.readFileSync(path.join(logsDir, file))
      );
      archive.append(JSON.stringify(messages), {
        name: `characters/${character}/logs/${file}.json`
      });
      const name = readIndexName(path.join(logsDir, `${file}.idx`));
      if (name !== undefined) names[file] = name;
    }
    archive.append(JSON.stringify(names), {
      name: `characters/${character}/logs-names.json`
    });
  }

  await archive.finalize();
  await done;
  return { characters: included, conversations };
}

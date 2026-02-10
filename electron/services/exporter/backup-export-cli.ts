import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { createManifest } from './manifest';
import type { ExportManifest } from './manifest';

/**
 * Configuration options for CLI-based export operations.
 *
 * @property dataDir - Absolute path to the Horizon data directory
 * @property out - Absolute path where the output ZIP file will be created
 * @property includeGeneral - Include general application settings
 * @property includeCharacterSettings - Include all character-specific settings files
 * @property includeLogs - Include chat log history
 * @property includeDrafts - Include message drafts
 * @property includePinnedConversations - Include pinned conversations
 * @property includePinnedEicons - Include favorite eicons
 * @property includeRecents - Include recent conversations and channels
 * @property includeHidden - Include hidden users list
 * @property characters - Character names to export (if empty, exports all)
 * @property dryRun - Show what would be exported without creating files
 */
export interface ExportCliOptions {
  dataDir: string;
  out: string;
  includeGeneral: boolean;
  includeCharacterSettings: boolean;
  includeLogs: boolean;
  includeDrafts: boolean;
  includePinnedConversations: boolean;
  includePinnedEicons: boolean;
  includeRecents: boolean;
  includeHidden: boolean;
  characters?: string[];
  dryRun?: boolean;
  onProgress?: (fraction: number) => void;
}

export function binaryLogToJson(
  buffer: Buffer
): { time: number; type: number; sender: string; text: string }[] {
  const messages: {
    time: number;
    type: number;
    sender: string;
    text: string;
  }[] = [];
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
    if (textStart + textLength + 2 > buffer.length) break;
    const text = buffer.toString('utf8', textStart, textStart + textLength);
    messages.push({ time, type, sender, text });
    offset = textStart + textLength + 2;
  }
  return messages;
}

function getCharacters(dataDir: string, filter?: string[]): string[] {
  const list: string[] = [];
  try {
    for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'settings' || entry.name === 'eicons') continue;
      if (entry.name.startsWith('.')) continue;
      list.push(entry.name);
    }
  } catch {}
  list.sort((a, b) => a.localeCompare(b));
  if (!filter || filter.length === 0) return list;
  const set = new Set(filter.map(s => s.toLowerCase()));
  return list.filter(n => set.has(n.toLowerCase()));
}

function listFilesRecursive(rootDir: string): string[] {
  const results: string[] = [];
  const stack: string[] = [rootDir];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries: string[] = [];
    try {
      entries = fs.readdirSync(dir).map(n => path.join(dir, n));
    } catch {
      continue;
    }
    for (const abs of entries) {
      try {
        const stat = fs.statSync(abs);
        if (stat.isDirectory()) stack.push(abs);
        else if (stat.isFile()) results.push(abs);
      } catch {}
    }
  }
  return results;
}

function addCharacterSettings(
  archive: archiver.Archiver,
  characterDir: string,
  character: string,
  opts: ExportCliOptions
): void {
  const settingsDir = path.join(characterDir, 'settings');
  if (!fs.existsSync(settingsDir)) return;

  if (opts.includeCharacterSettings) {
    const files = listFilesRecursive(settingsDir);
    for (const abs of files) {
      const rel = path.relative(settingsDir, abs).replace(/\\/g, '/');
      const zipPath = path.posix.join('characters', character, 'settings', rel);
      archive.file(abs, { name: zipPath });
    }
  } else {
    const includeFiles = new Set<string>();
    if (opts.includePinnedConversations) includeFiles.add('pinned');
    if (opts.includePinnedEicons) includeFiles.add('favoriteEIcons');
    if (opts.includeRecents) {
      includeFiles.add('recent');
      includeFiles.add('recentChannels');
    }
    if (opts.includeHidden) includeFiles.add('hiddenUsers');
    for (const file of Array.from(includeFiles)) {
      const filePath = path.join(settingsDir, file);
      if (fs.existsSync(filePath)) {
        const zipPath = path.posix.join(
          'characters',
          character,
          'settings',
          file
        );
        archive.file(filePath, { name: zipPath });
      }
    }
  }
}

function addCharacterToArchive(
  archive: archiver.Archiver,
  dataDir: string,
  character: string,
  opts: ExportCliOptions
): void {
  const characterDir = path.join(dataDir, character);
  if (!fs.existsSync(characterDir)) return;

  if (opts.includeLogs) {
    const logsDir = path.join(characterDir, 'logs');
    if (fs.existsSync(logsDir)) {
      const files = listFilesRecursive(logsDir);
      for (const abs of files) {
        const rel = path.relative(logsDir, abs).replace(/\\/g, '/');
        const zipPath = path.posix.join('characters', character, 'logs', rel);
        archive.file(abs, { name: zipPath });
      }
    }
  }

  if (opts.includeDrafts) {
    const draftsFile = path.join(characterDir, 'drafts.txt');
    if (fs.existsSync(draftsFile)) {
      const zipPath = path.posix.join('characters', character, 'drafts.txt');
      archive.file(draftsFile, { name: zipPath });
    }
  }

  addCharacterSettings(archive, characterDir, character, opts);
}

function logDryRunDetails(
  opts: ExportCliOptions,
  dataDir: string,
  characters: string[]
): void {
  console.log('=== DRY RUN MODE - No files will be written ===');
  console.log(`Output file: ${opts.out}`);
  console.log('');

  console.log('Export options:');
  const generalSettingsFile = path.join(dataDir, 'settings');
  const hasGeneral = fs.existsSync(generalSettingsFile);
  console.log(
    `  - General settings: ${opts.includeGeneral && hasGeneral ? 'YES' : 'NO'}`
  );
  console.log(
    `  - Character settings: ${opts.includeCharacterSettings ? 'YES' : 'NO'}`
  );
  console.log(`  - Chat logs: ${opts.includeLogs ? 'YES' : 'NO'}`);
  console.log(`  - Message drafts: ${opts.includeDrafts ? 'YES' : 'NO'}`);
  console.log(
    `  - Pinned conversations: ${opts.includePinnedConversations ? 'YES' : 'NO'}`
  );
  console.log(`  - Pinned eicons: ${opts.includePinnedEicons ? 'YES' : 'NO'}`);
  console.log(
    `  - Recent conversations: ${opts.includeRecents ? 'YES' : 'NO'}`
  );
  console.log(`  - Hidden users: ${opts.includeHidden ? 'YES' : 'NO'}`);
  console.log('');

  console.log(`Characters (${characters.length}):`);
  if (characters.length > 0) {
    characters.forEach(char => console.log(`  - ${char}`));
  } else {
    console.log('  (none found)');
  }
}

function countEntries(
  dataDir: string,
  characters: string[],
  opts: ExportCliOptions
): number {
  let count = 0;

  if (opts.includeGeneral) {
    const generalSettingsFile = path.join(dataDir, 'settings');
    if (fs.existsSync(generalSettingsFile)) count++;
  }

  for (const character of characters) {
    const characterDir = path.join(dataDir, character);
    if (!fs.existsSync(characterDir)) continue;

    if (opts.includeLogs) {
      const logsDir = path.join(characterDir, 'logs');
      if (fs.existsSync(logsDir)) {
        count += listFilesRecursive(logsDir).length;
      }
    }

    if (opts.includeDrafts) {
      if (fs.existsSync(path.join(characterDir, 'drafts.txt'))) count++;
    }

    const settingsDir = path.join(characterDir, 'settings');
    if (fs.existsSync(settingsDir)) {
      if (opts.includeCharacterSettings) {
        count += listFilesRecursive(settingsDir).length;
      } else {
        const files = new Set<string>();
        if (opts.includePinnedConversations) files.add('pinned');
        if (opts.includePinnedEicons) files.add('favoriteEIcons');
        if (opts.includeRecents) {
          files.add('recent');
          files.add('recentChannels');
        }
        if (opts.includeHidden) files.add('hiddenUsers');
        for (const f of Array.from(files)) {
          if (fs.existsSync(path.join(settingsDir, f))) count++;
        }
      }
    }
  }

  return count;
}

async function createArchive(
  opts: ExportCliOptions,
  dataDir: string,
  characters: string[]
): Promise<{ characters: string[]; out: string }> {
  const archive = archiver('zip', {
    zlib: { level: 6 }
  });

  const outDir = path.dirname(opts.out);
  fs.mkdirSync(outDir, { recursive: true });

  const output = fs.createWriteStream(opts.out);
  archive.pipe(output);

  // Write manifest
  const expectedFiles = countEntries(dataDir, characters, opts);
  const manifest = createManifest(
    characters,
    {
      generalSettings: opts.includeGeneral,
      logs: opts.includeLogs,
      drafts: opts.includeDrafts,
      characterSettings: opts.includeCharacterSettings,
      pinned: opts.includePinnedConversations,
      eicons: opts.includePinnedEicons,
      recents: opts.includeRecents,
      hidden: opts.includeHidden,
      jsonLogs: undefined
    },
    expectedFiles
  );
  archive.append(JSON.stringify(manifest, null, 2), {
    name: 'manifest.json'
  });

  if (opts.includeGeneral) {
    const generalSettingsFile = path.join(dataDir, 'settings');
    if (fs.existsSync(generalSettingsFile)) {
      archive.file(generalSettingsFile, { name: 'settings' });
    }
  }

  for (const c of characters) {
    addCharacterToArchive(archive, dataDir, c, opts);
  }

  if (opts.onProgress) {
    const total = expectedFiles + 1; // +1 for manifest
    const cb = opts.onProgress;
    archive.on('progress', (progressData: any) => {
      const processed = progressData.entries?.processed || 0;
      cb(Math.min(0.99, processed / total));
    });
  }

  const result = new Promise<{ characters: string[]; out: string }>(
    (resolve, reject) => {
      output.on('close', () => {
        resolve({ characters, out: opts.out });
      });
      output.on('error', reject);
      archive.on('error', reject);
    }
  );

  await archive.finalize();

  return result;
}

/**
 * Executes a command-line export of Horizon user data to a ZIP archive.
 *
 * Supports both dry-run mode (displays what would be exported) and actual export mode (creates ZIP file).
 * Exports general settings, character data (logs, drafts, settings), and selective settings based on options.
 *
 * @param opts - Export configuration options
 * @returns Promise resolving to exported character list and output file path
 * @throws {Error} If data directory doesn't exist or is invalid
 */
export async function runExportCli(opts: ExportCliOptions): Promise<{
  characters: string[];
  out: string;
}> {
  const dataDir = opts.dataDir;
  if (!dataDir || !fs.existsSync(dataDir))
    throw new Error(`Data directory not found: ${dataDir}`);

  const characters = getCharacters(dataDir, opts.characters);

  if (opts.dryRun) {
    logDryRunDetails(opts, dataDir, characters);
    return { characters, out: opts.out };
  }

  return createArchive(opts, dataDir, characters);
}

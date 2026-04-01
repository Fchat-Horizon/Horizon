import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

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
    let entries: string[];
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

  if (opts.includeGeneral) {
    const generalSettingsFile = path.join(dataDir, 'settings');
    if (fs.existsSync(generalSettingsFile)) {
      archive.file(generalSettingsFile, { name: 'settings' });
    }
  }

  for (const c of characters) {
    addCharacterToArchive(archive, dataDir, c, opts);
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

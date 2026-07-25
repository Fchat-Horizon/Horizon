import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { shouldIncludeSettingsFile } from '../exporter/manifest';
import {
  buildLogImportContext,
  ensureLogIndex,
  isFilesystemArtifact,
  jsonLogToBinary,
  parseJsonLog,
  recoverLogName,
  removeStaleJsonLogArtifact,
  writeLogWithIndex
} from '../log-backup';
import type { LogImportContext } from '../log-backup';

/**
 * Configuration options for CLI-based import operations.
 *
 * @property zip - Absolute path to the ZIP backup file to import from
 * @property dataDir - Absolute path to the Horizon data directory where character data will be imported
 * @property settingsDir - Absolute path to the general settings directory; defaults to dataDir. Pass the fixed `{userData}/data` when the log directory is custom.
 * @property includeGeneral - Whether to import general application settings
 * @property includeCharacterSettings - Whether to import all character-specific settings files
 * @property includeLogs - Whether to import chat log history for characters
 * @property includeDrafts - Whether to import message drafts for characters
 * @property includePinnedConversations - Whether to import pinned conversations (even when not importing all settings)
 * @property includePinnedEicons - Whether to import favorite eicons (even when not importing all settings)
 * @property includeRecents - Whether to import recent conversations and channels (even when not importing all settings)
 * @property includeHidden - Whether to import hidden users list (even when not importing all settings)
 * @property overwrite - If true, existing files will be overwritten. If false, existing files are preserved
 * @property characters - Optional array of character names to import. If undefined or empty, imports all characters found in ZIP
 * @property dryRun - If true, shows what would be imported without actually writing any files
 */
export interface ImportCliOptions {
  zip: string;
  dataDir: string;
  settingsDir?: string;
  includeGeneral: boolean;
  includeCharacterSettings: boolean;
  includeLogs: boolean;
  includeDrafts: boolean;
  includePinnedConversations: boolean;
  includePinnedEicons: boolean;
  includeRecents: boolean;
  includeHidden: boolean;
  overwrite: boolean;
  characters?: string[];
  dryRun?: boolean;
}

function getSafeDestination(
  baseDir: string,
  relative: string
): string | undefined {
  const normalized = relative.replace(/\\/g, '/');
  if (normalized.includes('..')) return undefined;
  const target = path.resolve(baseDir, normalized);
  const base = path.resolve(baseDir);
  if (target === base || target.startsWith(`${base}${path.sep}`)) return target;
  return undefined;
}

function isEffectivelyEmptyDraftsFile(p: string): boolean {
  try {
    if (!fs.existsSync(p)) return false;
    const raw = fs.readFileSync(p, 'utf8').trim();
    if (raw.length === 0 || raw === '{}') return true;

    const parsed = JSON.parse(raw);
    return (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      Object.keys(parsed).length === 0
    );
  } catch {
    return false;
  }
}

function detectCharacters(zip: AdmZip, filter?: string[]): string[] {
  const set = new Set<string>();
  const entries = zip.getEntries();

  for (const entry of entries) {
    const normalized = entry.entryName.replace(/\\/g, '/');
    if (!normalized.startsWith('characters/') || normalized.includes('..'))
      continue;
    const parts = normalized.split('/');
    if (parts.length >= 2) set.add(parts[1]);
  }

  const list = Array.from(set).sort((a, b) => a.localeCompare(b));
  if (!filter || filter.length === 0) return list;
  const fset = new Set(filter.map(s => s.toLowerCase()));
  return list.filter(n => fset.has(n.toLowerCase()));
}

function shouldImportSettingsFile(
  opts: ImportCliOptions,
  segments: string[]
): boolean {
  const fileName = segments.slice(3).join('/');
  return shouldIncludeSettingsFile(fileName, opts);
}

function classifyEntry(
  normalized: string,
  segments: string[],
  allowedCharacters: Set<string>,
  opts: ImportCliOptions
): { should: boolean; isLog: boolean; isDrafts: boolean; character?: string } {
  if (!normalized.startsWith('characters/') || normalized.includes('..'))
    return { should: false, isLog: false, isDrafts: false };
  if (segments.length < 3)
    return { should: false, isLog: false, isDrafts: false };
  const character = segments[1];
  if (!allowedCharacters.has(character))
    return { should: false, isLog: false, isDrafts: false };

  const category = segments[2];
  if (category === 'logs' && opts.includeLogs)
    return { should: true, isLog: true, isDrafts: false, character };
  if (category === 'drafts.txt' && opts.includeDrafts)
    return { should: true, isLog: false, isDrafts: true, character };
  if (category === 'settings')
    return {
      should: shouldImportSettingsFile(opts, segments),
      isLog: false,
      isDrafts: false,
      character
    };
  return { should: false, isLog: false, isDrafts: false };
}

function importGeneralSettingsFromZip(
  zip: AdmZip,
  dataDir: string,
  opts: ImportCliOptions
): boolean {
  if (!opts.includeGeneral) return false;

  const general = zip.getEntry('settings');
  if (!general) return false;

  // General settings belong at the fixed location, not under a custom log dir.
  const dst = getSafeDestination(opts.settingsDir ?? dataDir, 'settings');
  if (!dst) throw new Error('Invalid settings destination');

  fs.mkdirSync(path.dirname(dst), { recursive: true });

  if (opts.overwrite || !fs.existsSync(dst)) {
    const data = general.getData();
    fs.writeFileSync(dst, data);
    return true;
  }

  return false;
}

function shouldSkipExistingFile(
  destination: string,
  decision: { isLog: boolean; isDrafts: boolean },
  opts: ImportCliOptions
): boolean {
  const exists = fs.existsSync(destination);
  if (!exists || opts.overwrite) return false;

  if (decision.isDrafts && isEffectivelyEmptyDraftsFile(destination)) {
    return false;
  }

  return true;
}

interface CliImportStats {
  logsCopied: number;
  logsSkipped: number;
  settingsCopied: number;
  settingsSkipped: number;
  filesErrored: number;
  touched: Set<string>;
}

function processZipEntry(
  entry: AdmZip.IZipEntry,
  dataDir: string,
  allowed: Set<string>,
  opts: ImportCliOptions,
  context: LogImportContext,
  stats: CliImportStats
): void {
  if (entry.isDirectory) return;

  const normalized = entry.entryName.replace(/\\/g, '/');
  const segments = normalized.split('/');
  const decision = classifyEntry(normalized, segments, allowed, opts);

  if (!decision.should || !decision.character) return;
  if (decision.isLog && segments.slice(3).some(isFilesystemArtifact)) return;

  let relative = normalized.substring('characters/'.length);

  try {
    let data: Buffer | undefined;
    let converted = false;
    let logName: string | undefined;
    let recoveredName: string | undefined;

    // JSON logs re-serialize to binary; anything else .json copies through.
    if (decision.isLog && normalized.endsWith('.json')) {
      const logKey = segments.slice(3).join('/').slice(0, -5);
      if (logKey && !logKey.endsWith('/')) {
        // ^ A binary twin in the ZIP is authoritative; the .json is stale.
        if (context.binaryLogs.has(`${decision.character}/${logKey}`)) {
          stats.logsSkipped++;
          return;
        }
        data = entry.getData();
        const parsedLog = parseJsonLog(data);
        if (parsedLog) {
          data = jsonLogToBinary(parsedLog.messages);
          relative = relative.slice(0, -5);
          converted = true;
          logName =
            context.names.get(decision.character)?.get(logKey) ??
            parsedLog.name;
          if (logName === undefined)
            recoveredName = recoverLogName(
              logKey,
              decision.character,
              context,
              parsedLog.messages
            );
        }
      }
    }

    const destination = getSafeDestination(dataDir, relative);
    if (!destination) return;

    fs.mkdirSync(path.dirname(destination), { recursive: true });

    if (shouldSkipExistingFile(destination, decision, opts)) {
      if (decision.isLog) {
        stats.logsSkipped++;
        // Heal pre-2.4 imports that never wrote indexes (#886).
        if (converted) {
          const healed = ensureLogIndex(destination, logName ?? recoveredName);
          if (removeStaleJsonLogArtifact(destination) || healed)
            stats.touched.add(decision.character);
        }
      } else stats.settingsSkipped++;
      return;
    }

    if (data === undefined) data = entry.getData();
    if (converted) {
      writeLogWithIndex(destination, data, logName, recoveredName);
      removeStaleJsonLogArtifact(destination);
    } else fs.writeFileSync(destination, data);
    stats.touched.add(decision.character);
    if (decision.isLog) stats.logsCopied++;
    else stats.settingsCopied++;
  } catch (err) {
    stats.filesErrored++;
    console.warn(
      `Failed to import ${normalized}:`,
      err instanceof Error ? err.message : err
    );
  }
}

function printDryRunGeneralSettings(
  opts: ImportCliOptions,
  zip: AdmZip,
  dataDir: string
): void {
  const general = zip.getEntry('settings');
  const hasGeneral = general !== null;
  const generalExists = fs.existsSync(
    path.join(opts.settingsDir ?? dataDir, 'settings')
  );

  let generalStatus = opts.includeGeneral && hasGeneral ? 'YES' : 'NO';
  if (opts.includeGeneral && hasGeneral && generalExists) {
    const action = opts.overwrite ? 'OVERWRITE' : 'SKIP';
    generalStatus += ` (would ${action} existing)`;
  }
  console.log(`  - General settings: ${generalStatus}`);
}

function printDryRunOptions(opts: ImportCliOptions): void {
  const options = [
    ['Character settings', opts.includeCharacterSettings],
    ['Chat logs', opts.includeLogs],
    ['Message drafts', opts.includeDrafts],
    ['Pinned conversations', opts.includePinnedConversations],
    ['Pinned eicons', opts.includePinnedEicons],
    ['Recent conversations', opts.includeRecents],
    ['Hidden users', opts.includeHidden],
    ['Overwrite mode', opts.overwrite, 'ENABLED', 'DISABLED']
  ] as const;

  for (const [label, enabled, trueText = 'YES', falseText = 'NO'] of options) {
    console.log(`  - ${label}: ${enabled ? trueText : falseText}`);
  }
}

function printDryRunCharacters(
  wantedChars: string[],
  dataDir: string,
  opts: ImportCliOptions
): void {
  console.log(`Characters in ZIP (${wantedChars.length}):`);
  if (wantedChars.length > 0) {
    for (const char of wantedChars) {
      const charDir = path.join(dataDir, char);
      const exists = fs.existsSync(charDir);
      let charStatus = char;
      if (exists) {
        const action = opts.overwrite ? 'overwrite' : 'merge';
        charStatus += ` (exists, would ${action})`;
      } else {
        charStatus += ' (new)';
      }
      console.log(`  - ${charStatus}`);
    }
  } else {
    console.log('  (none found)');
  }
}

function handleDryRun(
  opts: ImportCliOptions,
  zip: AdmZip,
  dataDir: string,
  wantedChars: string[]
): {
  touchedCharacters: string[];
  generalImported: boolean;
  filesErrored: number;
} {
  console.log('=== DRY RUN MODE - No files will be modified ===');
  console.log(`Source ZIP: ${opts.zip}`);
  console.log(`Target directory: ${dataDir}`);
  console.log('');

  console.log('Import options:');
  printDryRunGeneralSettings(opts, zip, dataDir);
  printDryRunOptions(opts);
  console.log('');

  printDryRunCharacters(wantedChars, dataDir, opts);

  const general = zip.getEntry('settings');
  const hasGeneral = general !== null;

  return {
    touchedCharacters: wantedChars,
    generalImported: opts.includeGeneral && hasGeneral,
    filesErrored: 0
  };
}

function performActualImport(
  zip: AdmZip,
  dataDir: string,
  wantedChars: string[],
  opts: ImportCliOptions
): {
  touchedCharacters: string[];
  generalImported: boolean;
  filesErrored: number;
} {
  fs.mkdirSync(dataDir, { recursive: true });

  const generalImported = importGeneralSettingsFromZip(zip, dataDir, opts);

  const allowed = new Set<string>(wantedChars);

  const stats: CliImportStats = {
    logsCopied: 0,
    logsSkipped: 0,
    settingsCopied: 0,
    settingsSkipped: 0,
    filesErrored: 0,
    touched: new Set<string>()
  };

  const entries = zip.getEntries();
  const context = buildLogImportContext(entries);
  for (const entry of entries) {
    processZipEntry(entry, dataDir, allowed, opts, context, stats);
  }

  return {
    touchedCharacters: Array.from(stats.touched.values()).sort((a, b) =>
      a.localeCompare(b)
    ),
    generalImported,
    filesErrored: stats.filesErrored
  };
}

/**
 * Executes a command-line import of Horizon user data from a ZIP backup file.
 * Supports both dry-run mode (preview only) and actual import with selective data import and conflict handling.
 *
 * @param opts - Configuration options specifying what to import and how to handle conflicts
 * @returns A promise that resolves with the list of imported characters, whether general settings were imported, and how many files failed
 * @throws {Error} If the data directory is not provided or the ZIP file cannot be opened
 */
export async function runImportCli(opts: ImportCliOptions): Promise<{
  touchedCharacters: string[];
  generalImported: boolean;
  filesErrored: number;
}> {
  const dataDir = opts.dataDir;
  if (!dataDir) throw new Error('No data dir provided');

  const zip = new AdmZip(opts.zip);

  const wantedChars =
    opts.characters && opts.characters.length > 0
      ? opts.characters
      : detectCharacters(zip, opts.characters);

  if (opts.dryRun) {
    return handleDryRun(opts, zip, dataDir, wantedChars);
  }

  return performActualImport(zip, dataDir, wantedChars, opts);
}

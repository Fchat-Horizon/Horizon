/**
 * @module backup-host
 * Main-process implementation of the Exporter window's backup flows: ZIP
 * export (with binary-to-JSON log conversion) and ZIP import. The renderer
 * keeps the view-model logic and calls these endpoints over IPC; progress is
 * streamed back over 'backup-export-progress'.
 *
 * * The CLI export (backup-export-cli.ts) stays separate on purpose: it
 * * archives raw binary logs, while these UI exports convert logs to JSON.
 */

import * as electron from 'electron';
import log from 'electron-log'; //tslint:disable-line:match-default-export-name
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import AdmZip from 'adm-zip';
import type { IZipEntry } from 'adm-zip';
import { GeneralSettings } from '../common';
import {
  createManifest,
  isValidManifest,
  shouldIncludeSettingsFile
} from './exporter/manifest';
import type { ExportManifest, SettingsSelection } from './exporter/manifest';
import {
  binaryLogToJson,
  listFilesRecursive
} from './exporter/backup-export-cli';
import type { BackupCharacterInfo } from './importer/backup-import';

export interface BackupIncludes {
  generalSettings: boolean;
  characterSettings: boolean;
  logs: boolean;
  drafts: boolean;
  pinnedConversations: boolean;
  pinnedEicons: boolean;
  recents: boolean;
  hidden: boolean;
}

export interface BackupExportOptions {
  outputPath: string;
  characters: string[];
  includes: BackupIncludes;
}

export interface BackupExportResult {
  exportedCount: number;
  failedCount: number;
  outputPath: string;
}

export interface ParsedBackupZip {
  hasManifest: boolean;
  manifest: ExportManifest | undefined;
  generalAvailable: boolean;
  /** Set when the backup was made with a non-default log directory. */
  customLogDirectory: string | undefined;
  characters: BackupCharacterInfo[];
}

export interface BackupImportOptions {
  /** Restore destination; defaults to the configured log directory. */
  dataDir?: string;
  overwrite: boolean;
  /** Drop `logDirectory` from restored general settings. */
  stripLogDirectory: boolean;
  selectedCharacters: string[];
  includes: BackupIncludes;
}

export interface BackupImportResult {
  logsCopied: number;
  logsSkipped: number;
  settingsCopied: number;
  settingsSkipped: number;
  filesErrored: number;
  generalImported: boolean;
  generalCandidate: boolean;
  charactersTouched: number;
  /** Parsed general settings to merge into the renderer's copy. */
  newGeneralSettings: object | undefined;
}

let getSettings: (() => GeneralSettings) | undefined;

/** The fixed general-settings location, regardless of custom log dirs. */
function generalSettingsDir(): string {
  return path.join(electron.app.getPath('userData'), 'data');
}

function settingsSelection(includes: BackupIncludes): SettingsSelection {
  return {
    includeCharacterSettings: includes.characterSettings,
    includePinnedConversations: includes.pinnedConversations,
    includePinnedEicons: includes.pinnedEicons,
    includeRecents: includes.recents,
    includeHidden: includes.hidden
  };
}

/* --- Export ---------------------------------------------------------------- */

type ExportEntry = { abs: string; zip: string; isLog?: boolean };

function buildExportEntries(
  dataDir: string,
  options: BackupExportOptions
): ExportEntry[] {
  const entries: ExportEntry[] = [];
  const includes = options.includes;

  if (includes.generalSettings) {
    const generalSettingsFile = path.join(generalSettingsDir(), 'settings');
    if (fs.existsSync(generalSettingsFile))
      entries.push({ abs: generalSettingsFile, zip: 'settings' });
  }

  for (const character of options.characters) {
    const characterDir = path.join(dataDir, character);
    if (!fs.existsSync(characterDir)) continue;

    if (includes.logs) {
      const logsDir = path.join(characterDir, 'logs');
      if (fs.existsSync(logsDir)) {
        for (const abs of listFilesRecursive(logsDir)) {
          if (abs.endsWith('.idx')) continue;
          const rel = path.relative(logsDir, abs).replace(/\\/g, '/');
          const zip = path.posix.join(
            'characters',
            character,
            'logs',
            rel + '.json'
          );
          entries.push({ abs, zip, isLog: true });
        }
      }
    }

    if (includes.drafts) {
      const draftsFile = path.join(characterDir, 'drafts.txt');
      if (fs.existsSync(draftsFile))
        entries.push({
          abs: draftsFile,
          zip: path.posix.join('characters', character, 'drafts.txt')
        });
    }

    const settingsDir = path.join(characterDir, 'settings');
    if (fs.existsSync(settingsDir)) {
      const selection = settingsSelection(includes);
      for (const abs of listFilesRecursive(settingsDir)) {
        const rel = path.relative(settingsDir, abs).replace(/\\/g, '/');
        if (!shouldIncludeSettingsFile(rel, selection)) continue;
        const zip = path.posix.join('characters', character, 'settings', rel);
        entries.push({ abs, zip });
      }
    }
  }

  return entries;
}

function verifyExportZip(
  filePath: string,
  manifest: ExportManifest
): string | undefined {
  try {
    const zip = new AdmZip(filePath);
    const manifestEntry = zip.getEntry('manifest.json');
    if (!manifestEntry)
      return 'Verification failed: manifest.json missing from ZIP.';

    let parsed: unknown;
    try {
      parsed = JSON.parse(manifestEntry.getData().toString('utf8'));
    } catch {
      return 'Verification failed: manifest.json is not valid JSON.';
    }

    if (!isValidManifest(parsed))
      return 'Verification failed: manifest.json has invalid format.';

    const entries = zip.getEntries().filter(e => !e.isDirectory);
    const expected = manifest.expectedFiles + 1; // +1 for manifest itself
    if (Math.abs(entries.length - expected) > 1)
      return `Verification failed: expected ~${expected} files but ZIP contains ${entries.length}.`;

    const zipPaths = new Set(entries.map(e => e.entryName.replace(/\\/g, '/')));
    for (const char of manifest.characters) {
      const hasEntry = Array.from(zipPaths).some(p =>
        p.startsWith(`characters/${char}/`)
      );
      if (!hasEntry)
        return `Verification failed: no files found for character "${char}".`;
    }

    return undefined;
  } catch (err) {
    return `Verification failed: ${err instanceof Error ? err.message : String(err)}`;
  }
}

async function runExport(
  sender: electron.WebContents,
  options: BackupExportOptions
): Promise<BackupExportResult> {
  const outputPath = options.outputPath;
  const sendProgress = (
    progress: number,
    count: number,
    total: number
  ): void => {
    if (!sender.isDestroyed())
      sender.send('backup-export-progress', { progress, count, total });
  };

  try {
    const dataDir = getSettings!().logDirectory;
    if (!dataDir || !fs.existsSync(dataDir))
      throw new Error('Log directory not found');

    const entries = buildExportEntries(dataDir, options);
    const charactersWithData = options.characters.filter(char =>
      entries.some(e => e.zip.startsWith(`characters/${char}/`))
    );
    const total = entries.length || 1;
    sendProgress(0, 0, entries.length);

    const archive = archiver('zip', { zlib: { level: 6 } });
    const output = fs.createWriteStream(outputPath);
    let streamErrored = false;
    output.on('error', () => {
      streamErrored = true;
    });
    archive.pipe(output);

    const manifest = createManifest(
      charactersWithData,
      {
        generalSettings: options.includes.generalSettings,
        logs: options.includes.logs,
        drafts: options.includes.drafts,
        characterSettings: options.includes.characterSettings,
        pinned: options.includes.pinnedConversations,
        eicons: options.includes.pinnedEicons,
        recents: options.includes.recents,
        hidden: options.includes.hidden,
        jsonLogs: options.includes.logs ? true : undefined
      },
      entries.length,
      dataDir
    );
    archive.append(JSON.stringify(manifest, null, 2), {
      name: 'manifest.json'
    });

    archive.on('progress', progressData => {
      const processed = progressData.entries.processed || 0;
      sendProgress(
        Math.max(0, Math.min(0.98, processed / (total + 1))),
        Math.max(0, processed - 1), // -1 for manifest
        entries.length
      );
    });

    let count = 0;
    const failedFiles: string[] = [];
    for (const e of entries) {
      try {
        if (fs.existsSync(e.abs)) {
          if (e.isLog) {
            const buf = fs.readFileSync(e.abs);
            const json = binaryLogToJson(buf);
            archive.append(JSON.stringify(json), { name: e.zip });
          } else {
            archive.file(e.abs, { name: e.zip });
          }
          count++;
          // ! We're on the main process here; yield now and then or the
          // ! whole app hitches while someone exports six years of logs.
          if (count % 10 === 0)
            await new Promise<void>(resolve => setImmediate(resolve));
        }
      } catch (err) {
        failedFiles.push(e.zip);
        log.warn('export.file.error', e.zip, err);
      }
    }

    if (streamErrored) throw new Error('Output stream error during export.');

    sendProgress(0.99, count, entries.length);
    await archive.finalize();

    await new Promise<void>((resolve, reject) => {
      output.on('close', () => {
        sendProgress(1, count, entries.length);
        log.info('export.complete', outputPath, `${archive.pointer()} bytes`);
        resolve();
      });
      output.on('error', reject);
      archive.on('error', reject);
    });

    if (archive.pointer() === 0)
      throw new Error('Export produced an empty ZIP file.');

    const verifyError = verifyExportZip(outputPath, manifest);
    if (verifyError) {
      log.error('export.verify.failed', verifyError);
      throw new Error(verifyError);
    }

    return {
      exportedCount: count,
      failedCount: failedFiles.length,
      outputPath
    };
  } catch (error) {
    // Clean up partial ZIP on failure
    try {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch {}
    throw error;
  }
}

/* --- Import ---------------------------------------------------------------- */

function createEmptyCharacterInfo(name: string): BackupCharacterInfo {
  return {
    name,
    selected: true,
    hasLogs: false,
    hasSettings: false,
    hasPinnedConversations: false,
    hasPinnedEicons: false,
    hasRecents: false,
    hasHidden: false,
    hasDrafts: false
  };
}

function isValidCharacterEntry(normalized: string): boolean {
  return (
    normalized.startsWith('characters/') &&
    !normalized.includes('..') &&
    normalized !== 'settings'
  );
}

function updateCharacterInfo(
  info: BackupCharacterInfo,
  category: string,
  segments: string[]
): void {
  if (category === 'logs') {
    info.hasLogs = true;
    return;
  }

  if (category === 'drafts.txt') {
    info.hasDrafts = true;
    return;
  }

  if (category !== 'settings') return;

  info.hasSettings = true;
  const fileName = segments.slice(3).join('/');

  if (fileName === 'pinned') {
    info.hasPinnedConversations = true;
  } else if (fileName === 'favoriteEIcons') {
    info.hasPinnedEicons = true;
  } else if (fileName === 'recent' || fileName === 'recentChannels') {
    info.hasRecents = true;
  } else if (fileName === 'hiddenUsers') {
    info.hasHidden = true;
  }
}

function parseCharacterEntry(
  normalized: string,
  characterMap: Map<string, BackupCharacterInfo>
): void {
  const segments = normalized.split('/');
  if (segments.length < 3) return;

  const characterName = segments[1];
  const category = segments[2];

  let info = characterMap.get(characterName);
  if (!info) {
    info = createEmptyCharacterInfo(characterName);
    characterMap.set(characterName, info);
  }

  // Recognize JSON log files (e.g. characters/X/logs/foo.json)
  if (category === 'logs') {
    const fileName = segments.slice(3).join('/');
    if (fileName && fileName.endsWith('.json')) {
      info.hasLogs = true;
      return;
    }
  }

  updateCharacterInfo(info, category, segments);
}

function parseZip(zip: AdmZip): {
  hasManifest: boolean;
  manifest: ExportManifest | undefined;
  generalAvailable: boolean;
  characterMap: Map<string, BackupCharacterInfo>;
} {
  const characterMap = new Map<string, BackupCharacterInfo>();
  const entries = zip.getEntries();

  let hasManifest = false;
  let manifest: ExportManifest | undefined;
  const manifestEntry = zip.getEntry('manifest.json');
  if (manifestEntry) {
    try {
      const parsed = JSON.parse(manifestEntry.getData().toString('utf8'));
      if (isValidManifest(parsed)) {
        hasManifest = true;
        manifest = parsed as ExportManifest;
      }
    } catch {
      // Treated as no manifest.
    }
  }

  const generalAvailable = entries.some(e => e.entryName === 'settings');

  for (const entry of entries) {
    if (!entry || entry.isDirectory) continue;
    const normalized = entry.entryName.replace(/\\/g, '/');
    if (!isValidCharacterEntry(normalized)) continue;
    parseCharacterEntry(normalized, characterMap);
  }

  return { hasManifest, manifest, generalAvailable, characterMap };
}

export function getSafeDestination(
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
    if (raw.length === 0) return true;
    try {
      const parsed = JSON.parse(raw);
      return (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        Object.keys(parsed).length === 0
      );
    } catch {
      return raw.replace(/\s+/g, '') === '{}';
    }
  } catch {
    return false;
  }
}

export function jsonLogToBinary(
  json: { time: number; type: number; sender: string; text: string }[]
): Buffer {
  const chunks: Buffer[] = [];
  for (const msg of json) {
    const sender = msg.sender || '';
    const senderLength = Buffer.byteLength(sender);
    const textLength = Buffer.byteLength(msg.text);
    const buf = Buffer.allocUnsafe(senderLength + textLength + 10);
    buf.writeUInt32LE(msg.time, 0);
    buf.writeUInt8(msg.type, 4);
    buf.writeUInt8(senderLength, 5);
    buf.write(sender, 6);
    let offset = 6 + senderLength;
    buf.writeUInt16LE(textLength, offset);
    buf.write(msg.text, offset + 2);
    offset += 2 + textLength;
    buf.writeUInt16LE(offset, offset);
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

interface ImportStats {
  logsCopied: number;
  logsSkipped: number;
  settingsCopied: number;
  settingsSkipped: number;
  filesErrored: number;
  generalImported: boolean;
  generalCandidate: boolean;
  charactersTouched: Set<string>;
}

function shouldImportEntry(
  options: BackupImportOptions,
  category: string,
  segments: string[],
  info: BackupCharacterInfo
): { shouldImport: boolean; isLog: boolean; isDrafts: boolean } {
  if (category === 'logs' && options.includes.logs && info.hasLogs)
    return { shouldImport: true, isLog: true, isDrafts: false };
  if (category === 'drafts.txt' && options.includes.drafts && info.hasDrafts)
    return { shouldImport: true, isLog: false, isDrafts: true };
  if (category === 'settings' && info.hasSettings)
    return {
      shouldImport: shouldIncludeSettingsFile(
        segments.slice(3).join('/'),
        settingsSelection(options.includes)
      ),
      isLog: false,
      isDrafts: false
    };
  return { shouldImport: false, isLog: false, isDrafts: false };
}

function shouldSkipExistingFile(
  destination: string,
  exists: boolean,
  overwrite: boolean,
  decision: { isLog: boolean; isDrafts: boolean }
): boolean {
  if (!exists || overwrite) return false;
  if (decision.isDrafts) return !isEffectivelyEmptyDraftsFile(destination);
  return true;
}

function importGeneralSettings(
  zip: AdmZip,
  options: BackupImportOptions,
  generalAvailable: boolean,
  stats: ImportStats
): object | undefined {
  if (!generalAvailable || !options.includes.generalSettings) return undefined;

  stats.generalCandidate = true;
  const generalEntry = zip.getEntry('settings');
  if (!generalEntry) return undefined;

  // General settings always belong at the fixed location, not under a custom
  // log directory, so the main process can read them back.
  const destination = getSafeDestination(generalSettingsDir(), 'settings');
  if (!destination) return undefined;

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const generalData = generalEntry.getData();

  if (!options.overwrite && fs.existsSync(destination)) return undefined;

  fs.writeFileSync(destination, generalData);
  stats.generalImported = true;

  try {
    const newSettings = JSON.parse(generalData.toString('utf8'));
    if (options.stripLogDirectory) delete newSettings.logDirectory;
    return newSettings;
  } catch (error) {
    log.warn('settings.import.zip.general.parse', error);
    return undefined;
  }
}

function importCharacterFile(
  entry: IZipEntry,
  options: BackupImportOptions,
  dataDir: string,
  selectedCharacters: Set<string>,
  characterInfo: Map<string, BackupCharacterInfo>,
  stats: ImportStats
): void {
  if (!entry || !entry.entryName) return;
  const normalized = entry.entryName.replace(/\\/g, '/');
  if (!normalized.startsWith('characters/') || normalized.includes('..'))
    return;

  const segments = normalized.split('/');
  if (segments.length < 3) return;

  const characterName = segments[1];
  if (!selectedCharacters.has(characterName)) return;

  const info = characterInfo.get(characterName);
  if (!info) return;

  const category = segments[2];
  const decision = shouldImportEntry(options, category, segments, info);
  if (!decision.shouldImport) return;

  let relative = normalized.substring('characters/'.length);
  // Strip .json suffix for JSON log files so they're written as binary
  if (decision.isLog && relative.endsWith('.json')) {
    relative = relative.slice(0, -5);
  }
  const destination = getSafeDestination(dataDir, relative);
  if (!destination) return;

  try {
    fs.mkdirSync(path.dirname(destination), { recursive: true });

    const exists = fs.existsSync(destination);
    if (
      shouldSkipExistingFile(destination, exists, options.overwrite, decision)
    ) {
      if (decision.isLog) stats.logsSkipped++;
      else stats.settingsSkipped++;
      return;
    }

    let fileData: Buffer = entry.getData();

    // JSON log from export: re-serialize to binary
    if (decision.isLog && normalized.endsWith('.json')) {
      try {
        const parsed = JSON.parse(fileData.toString('utf8'));
        if (Array.isArray(parsed)) {
          fileData = jsonLogToBinary(parsed);
        }
      } catch (err) {
        stats.filesErrored++;
        log.warn('import.file.json-convert-error', normalized, err);
        return;
      }
    }

    fs.writeFileSync(destination, fileData);
    stats.charactersTouched.add(characterName);

    if (decision.isLog) stats.logsCopied++;
    else stats.settingsCopied++;
  } catch (err) {
    stats.filesErrored++;
    log.warn('import.file.error', normalized, err);
  }
}

function runImport(
  zipPath: string,
  options: BackupImportOptions
): BackupImportResult {
  const zip = new AdmZip(zipPath);
  const parsed = parseZip(zip);

  const dataDir = options.dataDir ?? getSettings!().logDirectory;
  if (!dataDir) throw new Error('No log directory configured');
  fs.mkdirSync(dataDir, { recursive: true });

  const selectedCharacters = new Set(options.selectedCharacters);
  const stats: ImportStats = {
    logsCopied: 0,
    logsSkipped: 0,
    settingsCopied: 0,
    settingsSkipped: 0,
    filesErrored: 0,
    generalImported: false,
    generalCandidate: false,
    charactersTouched: new Set<string>()
  };

  const newGeneralSettings = importGeneralSettings(
    zip,
    options,
    parsed.generalAvailable,
    stats
  );

  for (const entry of zip.getEntries()) {
    if (!entry || entry.isDirectory) continue;
    importCharacterFile(
      entry,
      options,
      dataDir,
      selectedCharacters,
      parsed.characterMap,
      stats
    );
  }

  return {
    logsCopied: stats.logsCopied,
    logsSkipped: stats.logsSkipped,
    settingsCopied: stats.settingsCopied,
    settingsSkipped: stats.settingsSkipped,
    filesErrored: stats.filesErrored,
    generalImported: stats.generalImported,
    generalCandidate: stats.generalCandidate,
    charactersTouched: stats.charactersTouched.size,
    newGeneralSettings
  };
}

/* --- IPC wiring ------------------------------------------------------------ */

let initialized = false;

/**
 * Registers the backup import/export IPC endpoints. Call once during app
 * startup.
 */
export function initBackupHost(opts: { getSettings(): GeneralSettings }): void {
  if (initialized) return;
  initialized = true;
  getSettings = opts.getSettings;

  const ipc = electron.ipcMain;

  /* Characters available for export (skips special/hidden directories). */
  ipc.handle('backup-list-export-characters', (): string[] => {
    const characters: string[] = [];
    try {
      const dataDir = getSettings!().logDirectory;
      if (!dataDir || !fs.existsSync(dataDir)) return [];
      for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        if (entry.name === 'settings' || entry.name === 'eicons') continue;
        if (entry.name.startsWith('.')) continue;
        characters.push(entry.name);
      }
      characters.sort((a, b) => a.localeCompare(b));
    } catch (error) {
      log.warn('settings.export.refresh.error', error);
      return [];
    }
    return characters;
  });

  ipc.handle('backup-export-run', (e, options: BackupExportOptions) =>
    runExport(e.sender, options)
  );

  ipc.handle('backup-zip-parse', (_e, zipPath: string): ParsedBackupZip => {
    const zip = new AdmZip(zipPath);
    const parsed = parseZip(zip);

    // Detect custom log directory from manifest or settings entry.
    let backupLogDir: string | undefined = parsed.manifest?.logDirectory;
    if (!backupLogDir) {
      const settingsEntry = zip.getEntry('settings');
      if (settingsEntry) {
        try {
          const settings = JSON.parse(settingsEntry.getData().toString('utf8'));
          if (
            settings.logDirectory &&
            typeof settings.logDirectory === 'string'
          )
            backupLogDir = settings.logDirectory;
        } catch {
          // Ignore parse errors; custom log detection is best-effort.
        }
      }
    }
    const defaultLogDirectory = path.join(
      electron.app.getPath('userData'),
      'data'
    );

    return {
      hasManifest: parsed.hasManifest,
      manifest: parsed.manifest,
      generalAvailable: parsed.generalAvailable,
      customLogDirectory:
        backupLogDir && backupLogDir !== defaultLogDirectory
          ? backupLogDir
          : undefined,
      characters: Array.from(parsed.characterMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    };
  });

  /* Verifies a restore destination is creatable and writable. */
  ipc.handle(
    'backup-check-dir-access',
    (_e, dir: string): string | undefined => {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        return `Cannot create directory: ${dir}`;
      }
      try {
        fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK);
      } catch {
        return `No read/write access to: ${dir}`;
      }
      return undefined;
    }
  );

  ipc.handle(
    'backup-zip-import',
    (_e, zipPath: string, options: BackupImportOptions) =>
      runImport(zipPath, options)
  );
}

/**
 * @license MPL-2.0
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * @copyright 2024-2026 Sylvia Roselie & Respective Horizon Contributors
 * @version 1.0
 * @see {@link https://github.com/Fchat-Horizon/Horizon|GitHub repo}
 */

import * as remote from '@electron/remote';
import fs from 'fs';
import path from 'path';
import { ipcRenderer } from 'electron';
import log from 'electron-log';
import l from '../../../chat/localize';
import AdmZip from 'adm-zip';
import type { IZipEntry } from 'adm-zip';
import {
  isValidManifest,
  shouldIncludeSettingsFile
} from '../exporter/manifest';
import type { ExportManifest, SettingsSelection } from '../exporter/manifest';
import type { ExporterVm } from '../exporter-vm';
/** Default log directory in the renderer process (avoids instantiating GeneralSettings). */
const defaultLogDirectory = path.join(remote.app.getPath('userData'), 'data');
/**
 * Directory holding the general (app-wide) settings file. Fixed at
 * `{userData}/data` regardless of the user's custom `logDirectory`, matching
 * where the main process reads/writes general settings.
 */
const generalSettingsDir = defaultLogDirectory;

/**
 * Information about a character found in a Horizon backup ZIP file.
 *
 * @property name - Character name
 * @property selected - Whether this character is selected for import
 * @property hasLogs - Whether the backup contains chat logs for this character
 * @property hasSettings - Whether the backup contains settings files for this character
 * @property hasPinnedConversations - Whether the backup contains pinned conversations for this character
 * @property hasPinnedEicons - Whether the backup contains pinned/favorite eicons for this character
 * @property hasRecents - Whether the backup contains recent conversations/channels for this character
 * @property hasHidden - Whether the backup contains hidden users list for this character
 * @property hasDrafts - Whether the backup contains message drafts for this character
 */
export interface BackupCharacterInfo {
  name: string;
  selected: boolean;
  hasLogs: boolean;
  hasSettings: boolean;
  hasPinnedConversations: boolean;
  hasPinnedEicons: boolean;
  hasRecents: boolean;
  hasHidden: boolean;
  hasDrafts?: boolean;
}

/**
 * Prompts the user to select a Horizon backup ZIP file to import.
 *
 * @param vm - Vue component instance managing import state
 * @returns A promise that resolves when the file dialog closes
 */
export async function chooseImportZip(vm: ExporterVm): Promise<void> {
  if (vm.importInProgress) return;
  const result = await remote.dialog.showOpenDialog({
    title: 'Choose Horizon export', // TODO: localize
    filters: [{ name: 'ZIP archives', extensions: ['zip'] }],
    properties: ['openFile']
  });
  if (result.canceled || !result.filePaths || result.filePaths.length === 0)
    return;
  await loadImportZip(vm, result.filePaths[0]);
}

/**
 * Resets all import-related state properties in the Vue component.
 *
 * @param vm - Vue component instance managing import state
 */
export function resetImportZipState(vm: ExporterVm): void {
  vm.importZipArchive = undefined;
  vm.importZipPath = undefined;
  vm.importZipName = undefined;
  vm.importCharacters = [];
  vm.importGeneralAvailable = false;
  vm.importCharacterSettingsAvailable = false;
  vm.importLogsAvailable = false;
  vm.importPinnedConversationsAvailable = false;
  vm.importPinnedEiconsAvailable = false;
  vm.importRecentsAvailable = false;
  vm.importHiddenAvailable = false;
  vm.importDraftsAvailable = false;
  vm.importIncludeGeneralSettings = false;
  vm.importIncludeCharacterSettings = false;
  vm.importIncludeLogs = false;
  vm.importIncludePinnedConversations = false;
  vm.importIncludePinnedEicons = false;
  vm.importIncludeRecents = false;
  vm.importIncludeHidden = false;
  vm.importIncludeDrafts = false;
  vm.importZipError = undefined;
  vm.importZipHasManifest = false;
  vm.importZipManifest = undefined;
  vm.importCustomLogDirectory = undefined;
  vm.importUseCustomLogLocation = false;
  vm.importCustomLogLocationError = undefined;
}

/**
 * Loads and parses a Horizon backup ZIP file.
 *
 * @param vm - Vue component instance managing import state
 * @param filePath - Absolute path to the ZIP file to load
 * @returns A promise that resolves when the ZIP is loaded and parsed
 */
export async function loadImportZip(
  vm: ExporterVm,
  filePath: string
): Promise<void> {
  vm.importSummary = undefined;
  vm.importError = undefined;
  vm.importZipError = undefined;
  resetImportZipState(vm);

  try {
    const zip = new AdmZip(filePath);
    vm.importZipArchive = zip;
    vm.importZipPath = filePath;
    vm.importZipName = path.basename(filePath);
    parseImportZip(vm);
  } catch (error) {
    log.error('settings.import.zip.load.error', error);
    const reason = error instanceof Error ? error.message : String(error);
    resetImportZipState(vm);
    vm.importZipError = `We couldn't read that export: ${reason}. Please choose a Horizon export created by this app.`;
  }
}

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

/**
 * Parses a loaded ZIP archive to determine what data is available for import.
 * Updates VM properties with character list, availability flags, and user selections.
 *
 * @param vm - Vue component instance with loaded ZIP archive
 */
export function parseImportZip(vm: ExporterVm): void {
  const zip = vm.importZipArchive as AdmZip;
  if (!zip) return;

  const characterMap = new Map<string, BackupCharacterInfo>();
  const entries = zip.getEntries();

  // Check for manifest
  const manifestEntry = zip.getEntry('manifest.json');
  if (manifestEntry) {
    try {
      const parsed = JSON.parse(manifestEntry.getData().toString('utf8'));
      if (isValidManifest(parsed)) {
        vm.importZipHasManifest = true;
        vm.importZipManifest = parsed as ExportManifest;
      } else {
        vm.importZipHasManifest = false;
        vm.importZipManifest = undefined;
      }
    } catch {
      vm.importZipHasManifest = false;
      vm.importZipManifest = undefined;
    }
  } else {
    vm.importZipHasManifest = false;
    vm.importZipManifest = undefined;
  }

  vm.importGeneralAvailable = entries.some(e => e.entryName === 'settings');

  // Detect custom log directory from manifest or settings entry
  vm.importCustomLogDirectory = undefined;
  vm.importUseCustomLogLocation = false;
  vm.importCustomLogLocationError = undefined;
  let backupLogDir: string | undefined;
  // Prefer manifest (always present in v2+ exports)
  if (vm.importZipManifest?.logDirectory) {
    backupLogDir = vm.importZipManifest.logDirectory;
  }
  // Fall back to settings entry
  if (!backupLogDir) {
    const settingsEntry = zip.getEntry('settings');
    if (settingsEntry) {
      try {
        const parsed = JSON.parse(settingsEntry.getData().toString('utf8'));
        if (parsed.logDirectory && typeof parsed.logDirectory === 'string') {
          backupLogDir = parsed.logDirectory;
        }
      } catch {
        // Ignore parse errors — custom log detection is best-effort
      }
    }
  }
  if (backupLogDir && backupLogDir !== defaultLogDirectory) {
    vm.importCustomLogDirectory = backupLogDir;
  }

  for (const entry of entries) {
    if (!entry || entry.isDirectory) continue;
    const normalized = entry.entryName.replace(/\\/g, '/');

    if (!isValidCharacterEntry(normalized)) continue;
    parseCharacterEntry(normalized, characterMap);
  }

  vm.importCharacters = Array.from(characterMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  vm.importCharacterSettingsAvailable = vm.importCharacters.some(
    (c: BackupCharacterInfo) => c.hasSettings
  );
  vm.importLogsAvailable = vm.importCharacters.some(
    (c: BackupCharacterInfo) => c.hasLogs
  );
  vm.importPinnedConversationsAvailable = vm.importCharacters.some(
    (c: BackupCharacterInfo) => c.hasPinnedConversations
  );
  vm.importPinnedEiconsAvailable = vm.importCharacters.some(
    (c: BackupCharacterInfo) => c.hasPinnedEicons
  );
  vm.importRecentsAvailable = vm.importCharacters.some(
    (c: BackupCharacterInfo) => c.hasRecents
  );
  vm.importHiddenAvailable = vm.importCharacters.some(
    (c: BackupCharacterInfo) => c.hasHidden
  );
  vm.importDraftsAvailable = vm.importCharacters.some(
    (c: BackupCharacterInfo) => !!c.hasDrafts
  );

  vm.importIncludeGeneralSettings = vm.importGeneralAvailable;
  vm.importIncludeCharacterSettings = vm.importCharacterSettingsAvailable;
  vm.importIncludeLogs = vm.importLogsAvailable;
  vm.importIncludePinnedConversations = vm.importPinnedConversationsAvailable;
  vm.importIncludePinnedEicons = vm.importPinnedEiconsAvailable;
  vm.importIncludeRecents = vm.importRecentsAvailable;
  vm.importIncludeHidden = vm.importHiddenAvailable;
  vm.importIncludeDrafts = vm.importDraftsAvailable;

  if (vm.importCharacters.length === 0) {
    vm.importIncludeCharacterSettings = false;
    vm.importIncludeLogs = false;
    vm.importIncludePinnedConversations = false;
    vm.importIncludePinnedEicons = false;
    vm.importIncludeRecents = false;
    vm.importIncludeHidden = false;
    vm.importIncludeDrafts = false;
  }

  if (!vm.importGeneralAvailable && vm.importCharacters.length === 0) {
    vm.importZipError =
      "This export doesn't contain any data Horizon can restore.";
  }
}

/**
 * Sets the selection state for all characters in the import list.
 *
 * @param vm - Vue component instance with importCharacters array
 * @param selected - Whether to select (true) or deselect (false) all characters
 */
export function setImportCharacters(vm: ExporterVm, selected: boolean): void {
  vm.importCharacters.forEach(character => {
    character.selected = selected;
  });
}

/**
 * Gets an array of character names that are currently selected for import.
 *
 * @param vm - Vue component instance with importCharacters array
 * @returns Array of character names where selected is true
 */
export function getSelectedImportCharacters(vm: ExporterVm): string[] {
  return vm.importCharacters
    .filter(character => character.selected)
    .map(character => character.name);
}

/**
 * Generates a human-readable description of available data for a character.
 *
 * @param character - Character info object from the backup ZIP
 * @returns Comma-separated string describing available data (e.g., "Settings, Logs, Drafts")
 */
export function describeImportCharacter(
  character: BackupCharacterInfo
): string {
  const parts: string[] = [];
  if (character.hasSettings) parts.push('Settings');
  if (character.hasLogs) parts.push('Logs');
  if (character.hasPinnedConversations) parts.push('Pinned conversations');
  if (character.hasPinnedEicons) parts.push('Pinned eicons');
  if (character.hasRecents) parts.push('Recents');
  if (character.hasHidden) parts.push('Hidden users');
  if (character.hasDrafts) parts.push('Drafts');
  if (parts.length === 0) return 'No data found for this character.';
  return parts.join(', ');
}

/**
 * Validates and resolves a safe destination path for extracting ZIP entries.
 * Prevents directory traversal attacks by ensuring paths stay within baseDir.
 *
 * @param baseDir - Base directory where files should be extracted
 * @param relative - Relative path from the ZIP entry
 * @returns Absolute resolved path if safe, undefined if path escapes baseDir
 */
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

/**
 * Returns true if the file exists and is effectively an empty JSON object.
 */
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
  vm: ExporterVm,
  category: string,
  segments: string[],
  info: BackupCharacterInfo
): { shouldImport: boolean; isLog: boolean; isDrafts: boolean } {
  const decision = {
    shouldImport: false,
    isLog: false,
    isDrafts: false
  };

  if (category === 'logs' && vm.importIncludeLogs && info.hasLogs) {
    decision.shouldImport = true;
    decision.isLog = true;
  } else if (
    category === 'drafts.txt' &&
    vm.importIncludeDrafts &&
    info.hasDrafts
  ) {
    decision.shouldImport = true;
    decision.isDrafts = true;
  } else if (category === 'settings' && info.hasSettings) {
    decision.shouldImport = shouldImportSettingsFile(vm, segments);
  }

  return decision;
}

function shouldImportSettingsFile(vm: ExporterVm, segments: string[]): boolean {
  const fileName = segments.slice(3).join('/');
  return shouldIncludeSettingsFile(fileName, importSettingsSelection(vm));
}

function importSettingsSelection(vm: ExporterVm): SettingsSelection {
  return {
    includeCharacterSettings: vm.importIncludeCharacterSettings,
    includePinnedConversations: vm.importIncludePinnedConversations,
    includePinnedEicons: vm.importIncludePinnedEicons,
    includeRecents: vm.importIncludeRecents,
    includeHidden: vm.importIncludeHidden
  };
}

/**
 * Checks whether a directory can be read from and written to.
 * Creates the directory if it doesn't exist yet.
 */
function checkDirectoryAccess(dir: string): string | undefined {
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

async function checkConnectedCharacters(): Promise<boolean> {
  try {
    const connected: string[] = await ipcRenderer.invoke(
      'get-connected-characters'
    );
    return connected?.length > 0;
  } catch {
    return false;
  }
}

function importGeneralSettings(
  vm: ExporterVm,
  zip: AdmZip,
  stats: ImportStats
): void {
  if (!vm.importGeneralAvailable || !vm.importIncludeGeneralSettings) return;

  stats.generalCandidate = true;
  const generalEntry = zip.getEntry('settings');
  if (!generalEntry) return;

  // General settings always belong at the fixed location, not under a custom
  // log directory, so the main process can read them back.
  const destination = getSafeDestination(generalSettingsDir, 'settings');
  if (!destination) return;

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const generalData = generalEntry.getData();

  if (vm.importOverwrite || !fs.existsSync(destination)) {
    fs.writeFileSync(destination, generalData);
    stats.generalImported = true;

    try {
      const newSettings = JSON.parse(generalData.toString('utf8'));
      if (!vm.importUseCustomLogLocation) {
        delete newSettings.logDirectory;
      }
      Object.assign(vm.settings, newSettings);
    } catch (error) {
      log.warn('settings.import.zip.general.parse', error);
    }
  }
}

function shouldSkipExistingFile(
  destination: string,
  exists: boolean,
  overwrite: boolean,
  decision: { isLog: boolean; isDrafts: boolean }
): boolean {
  if (!exists || overwrite) return false;

  if (decision.isDrafts) {
    return !isEffectivelyEmptyDraftsFile(destination);
  }

  return true;
}

function importCharacterFile(
  vm: ExporterVm,
  entry: IZipEntry,
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
  const decision = shouldImportEntry(vm, category, segments, info);
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
      shouldSkipExistingFile(destination, exists, vm.importOverwrite, decision)
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

function importCharacterData(
  vm: ExporterVm,
  zip: AdmZip,
  dataDir: string,
  selectedCharacters: Set<string>,
  characterInfo: Map<string, BackupCharacterInfo>,
  stats: ImportStats
): void {
  const entries = zip.getEntries();
  for (const entry of entries) {
    if (!entry || entry.isDirectory) continue;
    importCharacterFile(
      vm,
      entry,
      dataDir,
      selectedCharacters,
      characterInfo,
      stats
    );
  }
}

function finalizeImport(vm: ExporterVm, stats: ImportStats): void {
  if (stats.generalImported || stats.charactersTouched.size > 0) {
    ipcRenderer.send('general-settings-update', vm.settings);
  }

  let generalState: string;
  if (stats.generalImported) {
    generalState = l('settings.import.zip.generalUpdated');
  } else if (stats.generalCandidate) {
    generalState = l('settings.import.zip.generalSkipped');
  } else {
    generalState = l('settings.import.zip.generalNotImported');
  }

  let summary = l('settings.import.zip.summary', {
    count: stats.charactersTouched.size,
    logsCopied: stats.logsCopied,
    logsSkipped: stats.logsSkipped,
    settingsCopied: stats.settingsCopied,
    settingsSkipped: stats.settingsSkipped,
    generalSettings: generalState
  });
  if (stats.filesErrored > 0) {
    summary += ` ${l('settings.import.zip.summaryFailed', {
      count: stats.filesErrored
    })}`;
  }
  vm.importSummary = summary;
}

/**
 * Executes the full import process from a loaded ZIP backup with progress tracking.
 * Handles general settings, character data, file conflicts, and progress updates.
 *
 * @param vm - Vue component instance managing import state and user selections
 * @returns A promise that resolves when import completes
 */
export async function runZipImport(vm: ExporterVm): Promise<void> {
  if (!vm.canRunZipImport) return;

  const hasConnected = await checkConnectedCharacters();
  if (hasConnected) return;

  const zip = vm.importZipArchive as AdmZip;
  if (!zip) return;

  vm.importInProgress = true;
  vm.importSummary = undefined;
  vm.importError = undefined;

  try {
    let dataDir: string;
    if (vm.importUseCustomLogLocation && vm.importCustomLogDirectory) {
      const accessError = checkDirectoryAccess(vm.importCustomLogDirectory);
      if (accessError) {
        vm.importCustomLogLocationError = accessError;
        vm.importError = accessError;
        return;
      }
      dataDir = vm.importCustomLogDirectory;
    } else {
      dataDir = vm.settings.logDirectory;
      if (!dataDir) throw new Error('No log directory configured');
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const selectedCharacters = new Set(getSelectedImportCharacters(vm));
    const characterInfo = new Map<string, BackupCharacterInfo>(
      vm.importCharacters.map((c: BackupCharacterInfo) => [c.name, c])
    );

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

    importGeneralSettings(vm, zip, stats);
    importCharacterData(
      vm,
      zip,
      dataDir,
      selectedCharacters,
      characterInfo,
      stats
    );
    finalizeImport(vm, stats);
  } catch (error) {
    log.error('settings.import.zip.error', error);
    const reason = error instanceof Error ? error.message : String(error);
    vm.importError = `Import failed: ${reason}`;
  } finally {
    vm.importInProgress = false;
  }
}

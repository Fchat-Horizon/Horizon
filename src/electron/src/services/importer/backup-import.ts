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

/*
 * View-model glue for the Exporter window's ZIP import. The ZIP is parsed and
 * extracted by the main process (electron/services/backup-host.ts); only the
 * serializable parse results live in the view-model, keyed by the ZIP path.
 */

import { ipcRenderer } from 'electron';
import path from 'path';
import { createLogger } from '@horizon/shared/logger';
const log = createLogger('backup-import');
import type { ExporterVm } from '@services/exporter-vm';
import type {
  BackupImportOptions,
  BackupImportResult,
  ParsedBackupZip
} from '@services/backup-host';

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

export async function chooseImportZip(vm: ExporterVm): Promise<void> {
  if (vm.importInProgress) return;
  const result: Electron.OpenDialogReturnValue = await ipcRenderer.invoke(
    'dialog-open',
    {
      title: 'Choose Horizon export', // TODO: localize
      filters: [{ name: 'ZIP archives', extensions: ['zip'] }],
      properties: ['openFile']
    }
  );
  if (result.canceled || !result.filePaths || result.filePaths.length === 0)
    return;
  await loadImportZip(vm, result.filePaths[0]);
}

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

export async function loadImportZip(
  vm: ExporterVm,
  filePath: string
): Promise<void> {
  vm.importSummary = undefined;
  vm.importError = undefined;
  vm.importZipError = undefined;
  resetImportZipState(vm);

  try {
    const parsed = <ParsedBackupZip>(
      await ipcRenderer.invoke('backup-zip-parse', filePath)
    );
    // ^ Path doubles as the truthy "archive loaded" marker canRunZipImport checks.
    vm.importZipArchive = filePath;
    vm.importZipPath = filePath;
    vm.importZipName = path.basename(filePath);
    applyParsedZip(vm, parsed);
  } catch (error) {
    log.error('settings.import.zip.load.error', error);
    const reason = error instanceof Error ? error.message : String(error);
    resetImportZipState(vm);
    vm.importZipError = `We couldn't read that export: ${reason}. Please choose a Horizon export created by this app.`;
  }
}

function applyParsedZip(vm: ExporterVm, parsed: ParsedBackupZip): void {
  vm.importZipHasManifest = parsed.hasManifest;
  vm.importZipManifest = parsed.manifest;
  vm.importGeneralAvailable = parsed.generalAvailable;

  vm.importCustomLogDirectory = parsed.customLogDirectory;
  vm.importUseCustomLogLocation = false;
  vm.importCustomLogLocationError = undefined;

  vm.importCharacters = parsed.characters;

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

export function setImportCharacters(vm: ExporterVm, selected: boolean): void {
  vm.importCharacters.forEach(character => {
    character.selected = selected;
  });
}

export function getSelectedImportCharacters(vm: ExporterVm): string[] {
  return vm.importCharacters
    .filter(character => character.selected)
    .map(character => character.name);
}

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

function buildImportSummary(result: BackupImportResult): string {
  let generalState: string;
  if (result.generalImported) {
    generalState = 'updated';
  } else if (result.generalCandidate) {
    generalState = 'skipped';
  } else {
    generalState = 'not imported';
  }

  let summary = `Restored data for ${result.charactersTouched} character(s). Logs copied: ${result.logsCopied} (skipped ${result.logsSkipped}). Settings copied: ${result.settingsCopied} (skipped ${result.settingsSkipped}). General settings: ${generalState}.`;
  if (result.filesErrored > 0) {
    summary += ` ${result.filesErrored} file(s) failed to import.`;
  }
  return summary;
}

export async function runZipImport(vm: ExporterVm): Promise<void> {
  if (!vm.canRunZipImport) return;

  const hasConnected = await checkConnectedCharacters();
  if (hasConnected) return;

  if (!vm.importZipPath) return;

  vm.importInProgress = true;
  vm.importSummary = undefined;
  vm.importError = undefined;

  try {
    let dataDir: string | undefined;
    if (vm.importUseCustomLogLocation && vm.importCustomLogDirectory) {
      const accessError = <string | undefined>(
        await ipcRenderer.invoke(
          'backup-check-dir-access',
          vm.importCustomLogDirectory
        )
      );
      if (accessError) {
        vm.importCustomLogLocationError = accessError;
        vm.importError = accessError;
        return;
      }
      dataDir = vm.importCustomLogDirectory;
    }

    const options: BackupImportOptions = {
      dataDir,
      overwrite: vm.importOverwrite,
      stripLogDirectory: !vm.importUseCustomLogLocation,
      selectedCharacters: getSelectedImportCharacters(vm),
      includes: {
        generalSettings:
          vm.importGeneralAvailable && vm.importIncludeGeneralSettings,
        characterSettings: vm.importIncludeCharacterSettings,
        logs: vm.importIncludeLogs,
        drafts: vm.importIncludeDrafts,
        pinnedConversations: vm.importIncludePinnedConversations,
        pinnedEicons: vm.importIncludePinnedEicons,
        recents: vm.importIncludeRecents,
        hidden: vm.importIncludeHidden
      }
    };

    const result = <BackupImportResult>(
      await ipcRenderer.invoke('backup-zip-import', vm.importZipPath, options)
    );

    if (result.newGeneralSettings !== undefined) {
      Object.assign(vm.settings, result.newGeneralSettings);
    }
    if (result.generalImported || result.charactersTouched > 0) {
      ipcRenderer.send('general-settings-update', vm.settings);
    }

    vm.importSummary = buildImportSummary(result);
  } catch (error) {
    log.error('settings.import.zip.error', error);
    const reason = error instanceof Error ? error.message : String(error);
    vm.importError = `Import failed: ${reason}`;
  } finally {
    vm.importInProgress = false;
  }
}

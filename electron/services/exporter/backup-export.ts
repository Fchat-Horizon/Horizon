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
import log from 'electron-log';
import archiver from 'archiver';

async function yieldToUi(vm?: any): Promise<void> {
  try {
    if (vm && typeof vm.$nextTick === 'function') {
      await vm.$nextTick();
    }
    if (typeof (globalThis as any).requestAnimationFrame === 'function') {
      await new Promise<void>(resolve =>
        (globalThis as any).requestAnimationFrame(() => resolve())
      );
    } else {
      await new Promise<void>(resolve => setTimeout(resolve, 16));
    }
  } catch {
    // best-effort
  }
}

/**
 * Refreshes the list of available characters for export from the data directory.
 * Skips special folders like 'settings', 'eicons', and hidden directories.
 *
 * @param vm - Vue component instance containing settings and exportCharacters array
 */
export function refreshExportCharacters(vm: any): void {
  const characters: Array<{ name: string; selected: boolean }> = [];
  try {
    const dataDir = vm.settings.logDirectory;
    if (!dataDir || !fs.existsSync(dataDir)) {
      vm.exportCharacters = [];
      return;
    }
    for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'settings' || entry.name === 'eicons') continue;
      if (entry.name.startsWith('.')) continue;
      characters.push({ name: entry.name, selected: true });
    }
    characters.sort((a, b) => a.name.localeCompare(b.name));
    vm.exportCharacters = characters;
  } catch (error) {
    log.warn('settings.export.refresh.error', error);
    vm.exportCharacters = [];
  }
}

/**
 * Sets the selection state for all export characters.
 *
 * @param vm - Vue component instance containing exportCharacters array
 * @param selected - Whether to select (true) or deselect (false) all characters
 */
export function setExportCharacters(vm: any, selected: boolean): void {
  vm.exportCharacters.forEach((character: any) => {
    character.selected = selected;
  });
}

/**
 * Gets an array of character names that are currently selected for export.
 *
 * @param vm - Vue component instance containing exportCharacters array
 * @returns Array of character names where selected is true
 */
export function getSelectedExportCharacters(vm: any): string[] {
  return vm.exportCharacters
    .filter((c: any) => c.selected)
    .map((c: any) => c.name);
}

/**
 * Generates the default export file path with timestamp.
 * Filename format: `horizon-export-YYYY-MM-DDTHH-MM-SS.zip` (colons replaced with hyphens for Windows).
 *
 * @returns Absolute path to a timestamped ZIP file in the user's Downloads folder
 */
export function getExportDefaultPath(): string {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  return path.join(
    remote.app.getPath('downloads'),
    `horizon-export-${timestamp}.zip`
  );
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

type ExportEntry = { abs: string; zip: string };

function buildExportEntries(
  dataDir: string,
  selectedCharacters: string[],
  vm: any
): ExportEntry[] {
  const entries: ExportEntry[] = [];

  if (vm.exportIncludeGeneralSettings) {
    const generalSettingsFile = path.join(dataDir, 'settings');
    if (fs.existsSync(generalSettingsFile))
      entries.push({ abs: generalSettingsFile, zip: 'settings' });
  }

  for (const character of selectedCharacters) {
    const characterDir = path.join(dataDir, character);
    if (!fs.existsSync(characterDir)) continue;

    if (vm.exportIncludeLogs) {
      const logsDir = path.join(characterDir, 'logs');
      if (fs.existsSync(logsDir)) {
        const files = listFilesRecursive(logsDir);
        for (const abs of files) {
          const rel = path.relative(logsDir, abs).replace(/\\/g, '/');
          const zip = path.posix.join('characters', character, 'logs', rel);
          entries.push({ abs, zip });
        }
      }
    }

    if (vm.exportIncludeDrafts) {
      const draftsFile = path.join(characterDir, 'drafts.txt');
      if (fs.existsSync(draftsFile))
        entries.push({
          abs: draftsFile,
          zip: path.posix.join('characters', character, 'drafts.txt')
        });
    }

    const settingsDir = path.join(characterDir, 'settings');
    if (fs.existsSync(settingsDir)) {
      if (vm.exportIncludeCharacterSettings) {
        const files = listFilesRecursive(settingsDir);
        for (const abs of files) {
          const rel = path.relative(settingsDir, abs).replace(/\\/g, '/');
          const zip = path.posix.join('characters', character, 'settings', rel);
          entries.push({ abs, zip });
        }
      } else {
        const includeFiles = getSettingsFilesToInclude(vm);
        for (const file of Array.from(includeFiles)) {
          const filePath = path.join(settingsDir, file);
          if (fs.existsSync(filePath)) {
            const zip = path.posix.join(
              'characters',
              character,
              'settings',
              file
            );
            entries.push({ abs: filePath, zip });
          }
        }
      }
    }
  }

  return entries;
}

function getSettingsFilesToInclude(vm: any): Set<string> {
  const includeFiles = new Set<string>();
  if (vm.exportIncludePinnedConversations) includeFiles.add('pinned');
  if (vm.exportIncludePinnedEicons) includeFiles.add('favoriteEIcons');
  if (vm.exportIncludeRecents) {
    includeFiles.add('recent');
    includeFiles.add('recentChannels');
  }
  if (vm.exportIncludeHidden) includeFiles.add('hiddenUsers');
  return includeFiles;
}

/**
 * Executes the full export process with user-selected output location and progress tracking.
 *
 * @param vm - Vue component instance with export state and settings
 * @returns A promise that resolves when export completes or is cancelled
 */
export async function runExport(vm: any): Promise<void> {
  if (!vm.canRunExport) return;
  vm.exportInProgress = true;
  vm.exportSummary = undefined;
  vm.exportError = undefined;
  vm.exportProgress = 0;
  vm.exportCount = 0;
  vm.exportTotal = 0;

  try {
    const saveResult = await remote.dialog.showSaveDialog({
      title: 'Save Horizon Export', // TODO: localize
      defaultPath: getExportDefaultPath(),
      filters: [{ name: 'ZIP archives', extensions: ['zip'] }]
    });

    if (saveResult.canceled || !saveResult.filePath) {
      vm.exportInProgress = false;
      vm.exportProgress = undefined;
      return;
    }

    const dataDir = vm.settings.logDirectory;
    if (!dataDir || !fs.existsSync(dataDir))
      throw new Error('Log directory not found');

    const selectedCharacters = getSelectedExportCharacters(vm);
    const entries = buildExportEntries(dataDir, selectedCharacters, vm);
    const total = entries.length || 1;
    vm.exportTotal = entries.length;
    vm.exportCount = 0;

    const archive = archiver('zip', {
      zlib: { level: 6 }
    });

    const output = fs.createWriteStream(saveResult.filePath);
    archive.pipe(output);

    archive.on('progress', progressData => {
      const processed = progressData.entries.processed || 0;
      vm.exportCount = processed;
      vm.exportProgress = Math.max(0, Math.min(0.98, processed / total));
    });

    let count = 0;
    for (const e of entries) {
      if (fs.existsSync(e.abs)) {
        archive.file(e.abs, { name: e.zip });
        count++;
        if (count % 10 === 0) {
          await yieldToUi(vm);
        }
      }
    }

    vm.exportProgress = 0.99;
    await archive.finalize();

    await new Promise<void>((resolve, reject) => {
      output.on('close', () => {
        vm.exportProgress = 1;
        const bytes = archive.pointer();
        log.info('export.complete', saveResult.filePath, `${bytes} bytes`);
        resolve();
      });
      output.on('error', reject);
      archive.on('error', reject);
    });

    vm.exportSummary = `Exported data for ${selectedCharacters.length} character(s) to ${saveResult.filePath}`;
  } catch (error) {
    log.error('settings.export.error', error);
    vm.exportError = 'Export failed. Please check the logs for details.';
  } finally {
    vm.exportInProgress = false;
    vm.exportProgress = undefined;
    vm.exportCount = undefined;
    vm.exportTotal = undefined;
  }
}

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
 * View-model glue for the Exporter window's ZIP export. The actual archive
 * work happens in the main process (electron/services/backup-host.ts);
 * progress streams back over 'backup-export-progress'.
 */

import { ipcRenderer } from 'electron';
import path from 'path';
import { createLogger } from '@horizon/shared/logger';
const log = createLogger('backup-export');
import type { ExporterVm } from '@services/exporter-vm';
import type {
  BackupExportOptions,
  BackupExportResult
} from '@services/backup-host';

export async function refreshExportCharacters(vm: ExporterVm): Promise<void> {
  try {
    const names = <string[]>(
      await ipcRenderer.invoke('backup-list-export-characters')
    );
    vm.exportCharacters = names.map(name => ({ name, selected: true }));
  } catch (error) {
    log.warn('settings.export.refresh.error', error);
    vm.exportCharacters = [];
  }
}

export function setExportCharacters(vm: ExporterVm, selected: boolean): void {
  vm.exportCharacters.forEach(character => {
    character.selected = selected;
  });
}

export function getSelectedExportCharacters(vm: ExporterVm): string[] {
  return vm.exportCharacters.filter(c => c.selected).map(c => c.name);
}

// Dashes (not colons) in the timestamp keep the filename valid on Windows.
export function getExportDefaultPath(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timestamp =
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `T${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return path.join(
    <string>ipcRenderer.sendSync('app-path-sync', 'downloads'),
    `horizon-export-${timestamp}.zip`
  );
}

export async function runExport(vm: ExporterVm): Promise<void> {
  if (!vm.canRunExport) return;
  vm.exportInProgress = true;
  vm.exportSummary = undefined;
  vm.exportError = undefined;
  vm.exportProgress = 0;
  vm.exportCount = 0;
  vm.exportTotal = 0;

  const onProgress = (
    _e: Electron.IpcRendererEvent,
    data: { progress: number; count: number; total: number }
  ): void => {
    vm.exportProgress = data.progress;
    vm.exportCount = data.count;
    vm.exportTotal = data.total;
  };
  ipcRenderer.on('backup-export-progress', onProgress);

  try {
    const saveResult: Electron.SaveDialogReturnValue = await ipcRenderer.invoke(
      'dialog-save',
      {
        title: 'Save Horizon Export', // TODO: localize
        defaultPath: getExportDefaultPath(),
        filters: [{ name: 'ZIP archives', extensions: ['zip'] }]
      }
    );

    if (saveResult.canceled || !saveResult.filePath) {
      return;
    }

    const selectedCharacters = getSelectedExportCharacters(vm);
    const options: BackupExportOptions = {
      outputPath: saveResult.filePath,
      characters: selectedCharacters,
      includes: {
        generalSettings: !!vm.exportIncludeGeneralSettings,
        characterSettings: !!vm.exportIncludeCharacterSettings,
        logs: !!vm.exportIncludeLogs,
        drafts: !!vm.exportIncludeDrafts,
        pinnedConversations: !!vm.exportIncludePinnedConversations,
        pinnedEicons: !!vm.exportIncludePinnedEicons,
        recents: !!vm.exportIncludeRecents,
        hidden: !!vm.exportIncludeHidden
      }
    };

    const result = <BackupExportResult>(
      await ipcRenderer.invoke('backup-export-run', options)
    );

    let summary = `Exported ${result.exportedCount} file(s) for ${selectedCharacters.length} character(s) to ${result.outputPath}`;
    if (result.failedCount > 0) {
      summary += ` (${result.failedCount} file(s) skipped due to errors)`;
    }
    vm.exportSummary = summary;
  } catch (error) {
    log.error('settings.export.error', error);
    vm.exportError = `Export failed: ${error instanceof Error ? error.message : 'Please check the logs for details.'}`;
  } finally {
    ipcRenderer.removeListener('backup-export-progress', onProgress);
    vm.exportInProgress = false;
    vm.exportProgress = undefined;
    vm.exportCount = undefined;
    vm.exportTotal = undefined;
  }
}

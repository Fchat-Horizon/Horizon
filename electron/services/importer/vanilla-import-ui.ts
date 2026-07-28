import * as remote from '@electron/remote';
import os from 'os';
import path from 'path';
import { ipcRenderer } from 'electron';
import log from 'electron-log';
import l, { lp } from '../../../chat/localize';
import type { ExporterVm } from '../exporter-vm';
import * as VanillaImporter from './vanilla-importer';

/**
 * Initializes the vanilla F-Chat import UI state and determines if auto-prompt should be shown.
 *
 * @param vm - Vue component instance managing vanilla import state
 * @returns A promise that resolves when initialization is complete
 */
export async function initializeVanillaImport(vm: ExporterVm): Promise<void> {
  await refreshVanillaContext(vm);
  vm.showVanillaAutoPrompt =
    ((vm.importHint === 'auto' || vm.importHint === 'vanilla') &&
      !vm.settings.hasImportedVanillaLogs &&
      !vm.settings.hasDismissedVanillaImport &&
      vm.vanillaImportAvailable) ||
    vm.importHint === 'advanced';
  if (vm.showVanillaAutoPrompt) {
    vm.selectedSection = 'vanilla';
  }
}

/**
 * Refreshes the vanilla F-Chat context and updates UI state with available data.
 *
 * @param vm - Vue component instance managing vanilla import state
 * @returns A promise that resolves when context is refreshed
 */
export async function refreshVanillaContext(vm: ExporterVm): Promise<void> {
  const ctx = VanillaImporter.resolveContext(vm.settings.vanillaCustomBaseDir);
  const chars = ctx ? VanillaImporter.listCharacters(ctx) : [];
  const canGeneral = ctx && VanillaImporter.canImport(ctx);

  Object.assign(vm, {
    vanillaContext: ctx,
    vanillaBaseDir: ctx?.dataDir,
    vanillaImportGeneralAvailable: !!canGeneral,
    vanillaImportAvailable: !!ctx && (!!canGeneral || chars.length > 0),
    vanillaCharacters: chars.map((name: string) => ({ name, selected: true })),
    vanillaImportError: ctx
      ? undefined
      : l('settings.import.vanilla.errorResolve')
  });
  if (!canGeneral) vm.vanillaImportGeneral = false;
}

/**
 * Normalizes the custom vanilla base directory path and refreshes the context.
 *
 * @param vm - Vue component instance with settings containing vanillaCustomBaseDir
 * @returns A promise that resolves when normalization and refresh are complete
 */
export async function normalizeVanillaBaseDir(vm: ExporterVm): Promise<void> {
  if (vm.vanillaImportInProgress) return;
  let v = vm.settings.vanillaCustomBaseDir?.trim() || '';
  if (v.startsWith('~'))
    v = path.join(os.homedir(), v.slice(1).replace(/^[/\\]+/, ''));
  vm.settings.vanillaCustomBaseDir = v ? path.normalize(v) : undefined;
  ipcRenderer.send('general-settings-update', vm.settings);
  await refreshVanillaContext(vm);
}

/**
 * Prompts the user to select a custom vanilla F-Chat data directory.
 *
 * @param vm - Vue component instance managing vanilla import state
 * @returns A promise that resolves when directory is selected and normalized
 */
export async function chooseVanillaImportDir(vm: ExporterVm): Promise<void> {
  if (vm.vanillaImportInProgress) return;
  const r = await remote.dialog.showOpenDialog({
    title: l('settings.import.vanilla.customDirDialogTitle'),
    properties: ['openDirectory']
  });
  if (r.canceled || !r.filePaths?.[0]) return;
  vm.settings.vanillaCustomBaseDir = r.filePaths[0];
  await normalizeVanillaBaseDir(vm);
}

/**
 * Resets the custom vanilla base directory to use platform defaults.
 *
 * @param vm - Vue component instance managing vanilla import state
 * @returns A promise that resolves when reset and refresh are complete
 */
export async function resetVanillaImportDir(vm: ExporterVm): Promise<void> {
  if (vm.vanillaImportInProgress) return;
  vm.settings.vanillaCustomBaseDir = undefined;
  await normalizeVanillaBaseDir(vm);
}

/**
 * Handles manual edits to the vanilla base directory input field.
 *
 * @param vm - Vue component instance managing vanilla import state
 * @returns A promise that resolves when input is processed
 */
export async function handleVanillaBaseDirInput(vm: ExporterVm): Promise<void> {
  await normalizeVanillaBaseDir(vm);
}

/**
 * Sets the selection state for all vanilla characters.
 *
 * @param vm - Vue component instance with vanillaCharacters array
 * @param selected - Whether to select (true) or deselect (false) all characters
 */
export function setVanillaCharacters(vm: ExporterVm, selected: boolean): void {
  vm.vanillaCharacters.forEach(c => (c.selected = selected));
}

/**
 * Gets an array of character names selected for vanilla import.
 *
 * @param vm - Vue component instance with vanillaCharacters array
 * @returns Array of character names where selected is true
 */
export function getSelectedVanillaCharacters(vm: ExporterVm): string[] {
  return vm.vanillaCharacters.filter(c => c.selected).map(c => c.name);
}

/**
 * Executes the vanilla F-Chat import process with UI feedback.
 * Imports general settings, character data (logs, settings, eicons) with progress tracking.
 *
 * @param vm - Vue component instance managing vanilla import state and user selections
 * @returns A promise that resolves when import completes
 */
export async function runVanillaImport(vm: ExporterVm): Promise<void> {
  if (!vm.canRunVanillaImport) return;

  try {
    const connected: string[] = await ipcRenderer.invoke(
      'get-connected-characters'
    );
    if (connected?.length > 0) return;
  } catch {}

  if (!vm.vanillaContext) {
    await refreshVanillaContext(vm);
    if (!vm.vanillaContext || !vm.vanillaImportAvailable) return;
  }

  Object.assign(vm, {
    vanillaImportInProgress: true,
    vanillaImportSummary: undefined,
    vanillaImportError: undefined
  });

  try {
    const destDir = vm.settings.logDirectory;
    if (!destDir) throw new Error('No log directory configured');

    const selected = getSelectedVanillaCharacters(vm);
    const summaries = VanillaImporter.importAll(vm.vanillaContext, destDir, {
      includeLogs: vm.vanillaImportLogs,
      includeSettings: vm.vanillaImportCharacterSettings,
      includePinnedEicons: vm.vanillaImportPinnedEicons,
      overwrite: vm.vanillaImportOverwrite,
      characters: selected.length > 0 ? selected : undefined
    });

    let logs = 0,
      logsSkip = 0,
      settings = 0,
      settingsSkip = 0;
    summaries.forEach(s => {
      logs += s.logsCopied;
      logsSkip += s.logsSkipped;
      settings += s.settingsCopied;
      settingsSkip += s.settingsSkipped;
    });

    if (vm.vanillaImportGeneral) {
      const imported = VanillaImporter.importGeneralSettings(
        vm.vanillaContext,
        destDir
      );
      if (imported) {
        Object.assign(vm.settings, imported);
      }
    }

    vm.settings.hasImportedVanillaLogs = true;
    ipcRenderer.send('general-settings-update', vm.settings);

    vm.vanillaImportSummary = l('settings.import.vanilla.summary', {
      characters: lp('settings.summary.characters', summaries.size),
      logsCopied: logs,
      logsSkipped: logsSkip,
      settingsCopied: settings,
      settingsSkipped: settingsSkip
    });
    vm.showVanillaAutoPrompt = false;

    const { refreshExportCharacters } =
      await import('../exporter/backup-export');
    refreshExportCharacters(vm);
  } catch (error) {
    log.error('settings.import.vanilla.error', error);
    const reason = error instanceof Error ? error.message : String(error);
    vm.vanillaImportError = `${l('settings.import.vanilla.errorGeneric')}: ${reason}`;
  } finally {
    vm.vanillaImportInProgress = false;
  }
}

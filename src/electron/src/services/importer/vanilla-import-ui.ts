import { ipcRenderer } from 'electron';
import path from 'path';
import { createLogger } from '@horizon/shared/logger';
const log = createLogger('vanilla-import-ui');
import l from '@horizon/shared/chat/localize';
import type { ExporterVm } from '@services/exporter-vm';
import * as VanillaImporter from './vanilla-importer';
// Static: backup-export is already in this graph (the services barrel re-exports
// it), so a dynamic import() couldn't split it into its own chunk anyway.
import { refreshExportCharacters } from '@services/exporter/backup-export';

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

export async function refreshVanillaContext(vm: ExporterVm): Promise<void> {
  const ctx = await VanillaImporter.resolveContext(
    vm.settings.vanillaCustomBaseDir
  );
  const chars = ctx ? await VanillaImporter.listCharacters(ctx) : [];
  const canGeneral = ctx && (await VanillaImporter.canImport(ctx));

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

export async function normalizeVanillaBaseDir(vm: ExporterVm): Promise<void> {
  if (vm.vanillaImportInProgress) return;
  let v = vm.settings.vanillaCustomBaseDir?.trim() || '';
  if (v.startsWith('~'))
    v = path.join(
      <string>ipcRenderer.sendSync('app-path-sync', 'home'),
      v.slice(1).replace(/^[/\\]+/, '')
    );
  vm.settings.vanillaCustomBaseDir = v ? path.normalize(v) : undefined;
  ipcRenderer.send('general-settings-update', vm.settings);
  await refreshVanillaContext(vm);
}

export async function chooseVanillaImportDir(vm: ExporterVm): Promise<void> {
  if (vm.vanillaImportInProgress) return;
  const r: Electron.OpenDialogReturnValue = await ipcRenderer.invoke(
    'dialog-open',
    {
      title: l('settings.import.vanilla.customDirDialogTitle'),
      properties: ['openDirectory']
    }
  );
  if (r.canceled || !r.filePaths?.[0]) return;
  vm.settings.vanillaCustomBaseDir = r.filePaths[0];
  await normalizeVanillaBaseDir(vm);
}

export async function resetVanillaImportDir(vm: ExporterVm): Promise<void> {
  if (vm.vanillaImportInProgress) return;
  vm.settings.vanillaCustomBaseDir = undefined;
  await normalizeVanillaBaseDir(vm);
}

export async function handleVanillaBaseDirInput(vm: ExporterVm): Promise<void> {
  await normalizeVanillaBaseDir(vm);
}

export function setVanillaCharacters(vm: ExporterVm, selected: boolean): void {
  vm.vanillaCharacters.forEach(c => (c.selected = selected));
}

export function getSelectedVanillaCharacters(vm: ExporterVm): string[] {
  return vm.vanillaCharacters.filter(c => c.selected).map(c => c.name);
}

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
    const summaries = await VanillaImporter.importAll(
      vm.vanillaContext,
      destDir,
      {
        includeLogs: vm.vanillaImportLogs,
        includeSettings: vm.vanillaImportCharacterSettings,
        includePinnedEicons: vm.vanillaImportPinnedEicons,
        overwrite: vm.vanillaImportOverwrite,
        characters: selected.length > 0 ? selected : undefined
      }
    );

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
      const imported = await VanillaImporter.importGeneralSettings(
        vm.vanillaContext,
        destDir
      );
      if (imported) {
        Object.assign(vm.settings, imported);
      }
    }

    vm.settings.hasImportedVanillaLogs = true;
    ipcRenderer.send('general-settings-update', vm.settings);

    vm.vanillaImportSummary = l(
      'settings.import.vanilla.summary',
      summaries.size,
      logs,
      logsSkip,
      settings,
      settingsSkip
    );
    vm.showVanillaAutoPrompt = false;

    refreshExportCharacters(vm);
  } catch (error) {
    log.error('settings.import.vanilla.error', error);
    const reason = error instanceof Error ? error.message : String(error);
    vm.vanillaImportError = `${l('settings.import.vanilla.errorGeneric')}: ${reason}`;
  } finally {
    vm.vanillaImportInProgress = false;
  }
}

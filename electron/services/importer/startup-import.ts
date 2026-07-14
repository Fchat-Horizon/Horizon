import { ipcRenderer } from '../../host-bridge';
import l from '../../../chat/localize';
import * as VanillaImporter from './vanilla-importer';
import { SlimcatImporter } from '../index';
import { GeneralSettings } from '../../common';

type ImporterHint = 'auto' | 'vanilla' | 'advanced' | 'slimcat' | undefined;

/**
 * Checks if the user already has Horizon logs.
 * If the log directory contains any subdirectories (character folders), we assume they have logs.
 *
 * @param logDirectory - Path to the Horizon log directory
 * @returns true if logs exist, false otherwise
 */
async function hasExistingHorizonLogs(): Promise<boolean> {
  try {
    const characters = <string[]>(
      await ipcRenderer.invoke('logs-get-available-characters')
    );
    return characters.length > 0;
  } catch {
    return false;
  }
}

function normalizeImportHint(v: string | undefined): ImporterHint {
  if (v === 'true') return 'slimcat';
  if (v === 'auto' || v === 'vanilla' || v === 'slimcat' || v === 'advanced')
    return v;
  return undefined;
}

function getFinalHint(
  rawHint: ImporterHint,
  ctx: any,
  canImportSlimcat: boolean
): 'vanilla' | 'slimcat' | undefined {
  if (rawHint === 'auto') {
    if (ctx) return 'vanilla';
    if (canImportSlimcat) return 'slimcat';
    return undefined;
  }
  if (rawHint === 'vanilla' || rawHint === 'slimcat') return rawHint;
  return undefined;
}

async function doVanillaGeneralImport(
  rctx: VanillaImporter.VanillaContext,
  settings: GeneralSettings
): Promise<GeneralSettings> {
  const destinationDir = settings.logDirectory;

  const importedSettings = await VanillaImporter.importGeneralSettings(
    rctx,
    destinationDir
  );
  // ! No `new GeneralSettings()` here: its field initializers read app info
  // ! only the main process injects, so a renderer copy would carry defaults.
  if (importedSettings)
    settings = Object.assign({}, settings, importedSettings);

  const summaries = await VanillaImporter.importAll(rctx, destinationDir, {
    includePinnedEicons: true,
    // ! we should avoid overwriting any existing logs during startup import
    // This shouldn't even be offered if you have logs already, but better safe than sorry.
    overwrite: false
  });
  const importedCharacters = Array.from(summaries.entries()).filter(
    ([, s]) => s.logsCopied > 0 || s.settingsCopied > 0
  );

  settings.hasImportedVanillaLogs = true;
  settings.version = ipcRenderer.sendSync('app-version-sync') as string;
  ipcRenderer.send('general-settings-update', settings);
  ipcRenderer.send(
    'save-login',
    settings.account,
    settings.host,
    settings.proxy
  );

  if (importedCharacters.length > 0) {
    alert(
      l(
        'importer.vanillaSuccess',
        importedCharacters.length.toString(),
        importedCharacters.map(([n]) => n).join(', ')
      )
    );
  } else {
    alert(l('importer.vanillaNoData'));
  }
  return settings;
}

async function handleVanillaImportPrompt(
  ctx: VanillaImporter.VanillaContext,
  settings: GeneralSettings
): Promise<GeneralSettings> {
  const choice = ipcRenderer.sendSync('dialog-message-box-sync', {
    message: l('importer.vanillaImportGeneral'),
    title: l('title'),
    type: 'question',
    buttons: [l('confirmYes'), l('importer.vanillaAdvanced'), l('confirmNo')],
    defaultId: 0,
    cancelId: 2
  });

  if (choice === 1) {
    ipcRenderer.send('open-exporter-window', 'vanilla');
  } else if (choice === 0) {
    return await doVanillaGeneralImport(ctx, settings);
  } else {
    settings.hasDismissedVanillaImport = true;
    ipcRenderer.send('general-settings-update', settings);
  }
  return settings;
}

function handleSlimcatImport(settings: GeneralSettings): void {
  if (
    SlimcatImporter.canImportGeneral() &&
    confirm(l('importer.importGeneral'))
  ) {
    SlimcatImporter.importGeneral(settings);
    ipcRenderer.send('save-login', settings.account, settings.host);
  }
}

/**
 * Handles automatic import prompts when Horizon starts up.
 * Processes import hints ('auto', 'vanilla', 'slimcat', 'advanced') to detect and import data.
 *
 * @param settings - Current general settings for the application
 * @param rawImportParam - Import hint passed from main process
 * @returns Updated GeneralSettings after import completes
 */
export async function handleStartupImport(
  settings: GeneralSettings,
  rawImportParam: string | undefined
): Promise<GeneralSettings> {
  const rawHint = normalizeImportHint(rawImportParam);
  if (!rawHint) return settings;

  try {
    const ctx =
      rawHint === 'auto' || rawHint === 'vanilla'
        ? await VanillaImporter.resolveContext(settings.vanillaCustomBaseDir)
        : undefined;

    const finalHint = getFinalHint(
      rawHint,
      ctx,
      SlimcatImporter.canImportGeneral()
    );

    if (!finalHint) return settings;
    if (
      finalHint === 'vanilla' &&
      (settings.hasDismissedVanillaImport || (await hasExistingHorizonLogs()))
    )
      return settings;

    if (finalHint === 'vanilla' && ctx) {
      settings = await handleVanillaImportPrompt(ctx, settings);
    } else if (finalHint === 'slimcat') {
      handleSlimcatImport(settings);
    }
  } catch (err) {
    console.error('importer.error', err);
    alert(l('importer.error'));
  }

  return settings;
}

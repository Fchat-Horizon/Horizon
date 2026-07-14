/**
 * Vanilla F-Chat Importer
 *
 * Provides import functionality for vanilla F-Chat clients (official desktop client).
 * NOTE: Frolic too, should work. But I cannot 100% verify this fact.
 *       Testing shows it works, but... I unno' what edge cases there might be.
 *
 * * All file IO lives in the main process (electron/services/import-host.ts);
 * * this module proxies over IPC.
 */

import { ipcRenderer } from '../../host-bridge';
import { GeneralSettings } from '../../common';

/** Type of data being imported from vanilla F-Chat clients. */
export type ImportType = 'logs' | 'settings';

/**
 * Locations of a vanilla F-Chat client's data: the install directory and
 * its data directory (typically baseDir/data) with character folders inside.
 */
export interface VanillaContext {
  readonly baseDir: string;
  readonly dataDir: string;
}

/**
 * What to import for a character. Everything defaults to on except
 * `overwrite`; `includePinnedEicons` follows `includeSettings`.
 */
export interface CharacterImportOptions {
  readonly includeLogs?: boolean;
  readonly includeSettings?: boolean;
  readonly includePinnedEicons?: boolean;
  readonly overwrite?: boolean;
}

/** Counts of log/settings files copied or skipped during an import. */
export interface ImportSummary {
  readonly logsCopied: number;
  readonly logsSkipped: number;
  readonly settingsCopied: number;
  readonly settingsSkipped: number;
}

/** Locates vanilla data in a custom or platform-default location. */
export async function resolveContext(
  customBaseDir?: string
): Promise<VanillaContext | undefined> {
  return ipcRenderer.invoke('vanilla-resolve-context', customBaseDir);
}

/** Whether importable vanilla data exists; resolves a context if not given. */
export async function canImport(context?: VanillaContext): Promise<boolean> {
  return ipcRenderer.invoke('vanilla-can-import', context);
}

/** Character names found in the vanilla data directory, sorted. */
export async function listCharacters(
  context?: VanillaContext
): Promise<ReadonlyArray<string>> {
  return ipcRenderer.invoke('vanilla-list-characters', context);
}

/** Imports general settings into Horizon's data dir; undefined on failure. */
export async function importGeneralSettings(
  context: VanillaContext,
  destinationDataDir: string
): Promise<GeneralSettings | undefined> {
  return ipcRenderer.invoke(
    'vanilla-import-general-settings',
    context,
    destinationDataDir
  );
}

/** Imports one character's logs, settings, and pinned eicons. */
export async function importCharacter(
  context: VanillaContext,
  destinationDataDir: string,
  character: string,
  options: CharacterImportOptions = {}
): Promise<ImportSummary> {
  return ipcRenderer.invoke(
    'vanilla-import-character',
    context,
    destinationDataDir,
    character,
    options
  );
}

/** Imports multiple characters; returns a summary per character name. */
export async function importAll(
  context: VanillaContext,
  destinationDataDir: string,
  options: CharacterImportOptions & { characters?: ReadonlyArray<string> } = {}
): Promise<Map<string, ImportSummary>> {
  const summaries = <Record<string, ImportSummary>>await ipcRenderer.invoke(
    'vanilla-import-all',
    context,
    destinationDataDir,
    {
      ...options,
      characters: options.characters ? [...options.characters] : undefined
    }
  );
  return new Map(Object.entries(summaries));
}

/**
 * Import for the official vanilla F-Chat desktop client (Frolic is expected
 * to work too, but is unverified).
 *
 * * All file IO lives in the main process (electron/services/import-host.ts);
 * * this module proxies over IPC.
 */

import { ipcRenderer } from 'electron';
import type { GeneralSettings } from '@horizon/shared/common';

export type ImportType = 'logs' | 'settings';

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

export interface ImportSummary {
  readonly logsCopied: number;
  readonly logsSkipped: number;
  readonly settingsCopied: number;
  readonly settingsSkipped: number;
}

export async function resolveContext(
  customBaseDir?: string
): Promise<VanillaContext | undefined> {
  return ipcRenderer.invoke('vanilla-resolve-context', customBaseDir);
}

export async function canImport(context?: VanillaContext): Promise<boolean> {
  return ipcRenderer.invoke('vanilla-can-import', context);
}

export async function listCharacters(
  context?: VanillaContext
): Promise<ReadonlyArray<string>> {
  return ipcRenderer.invoke('vanilla-list-characters', context);
}

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

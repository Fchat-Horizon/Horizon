import { GeneralSettings } from './general-settings';

export interface DirectoryPickerOptions {
  defaultPath?: string;
}

export interface FilePickerOptions {
  defaultPath?: string;
  extensions?: string[];
}

export interface SpellcheckLanguage {
  code: string;
  name: string;
}

export interface PlatformServices {
  saveGeneralSettings(settings: GeneralSettings): Promise<void>;
  reloadSettings(): Promise<void>;
  selectDirectory(
    options?: DirectoryPickerOptions
  ): Promise<string | undefined>;
  selectFile(options?: FilePickerOptions): Promise<string | undefined>;
  openDirectory(directory: string): Promise<void>;
  /**
   * Returns a list of available spellcheck languages for the current platform.
   * @returns A promise that resolves to an array of SpellcheckLanguage objects, each containing a language code and its corresponding name.
   * If the platform does not support spellcheck or if there are no available languages, the promise resolves to an empty array.
   */
  getSpellcheckLanguages(): Promise<ReadonlyArray<SpellcheckLanguage>>;
}

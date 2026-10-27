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

/**
 * Interface defining the platform-specific services that can be implemented for different platforms (e.g., Electron, web, etc.).
 * This interface provides methods for saving general settings, reloading settings, selecting directories and files,
 * opening directories, and retrieving available spellcheck languages.
 */
export interface PlatformServices {
  /**
   * Saves the provided general settings to the platform-specific storage or configuration.
   * @param settings The general settings to be saved.
   * @returns A promise that resolves when the settings have been successfully saved.
   */
  saveGeneralSettings(settings: GeneralSettings): Promise<void>;
  /**
   * Reloads the platform-specific settings, typically by requesting the main process to refresh its configuration.
   * @returns A promise that resolves when the settings have been successfully reloaded.
   */
  reloadSettings(): Promise<void>;
  /**
   * Opens a directory picker dialog for the user to select a directory.
   * @param options Optional configuration for the directory picker, such as a default path.
   * @returns A promise that resolves to the selected directory path, or undefined if the user cancels the operation.
   */
  selectDirectory(
    options?: DirectoryPickerOptions
  ): Promise<string | undefined>;
  /**
   * Opens a file picker dialog for the user to select a file.
   * @param options Optional configuration for the file picker, such as a default path and allowed file extensions.
   * @returns A promise that resolves to the selected file path, or undefined if the user cancels the operation.
   */
  selectFile(options?: FilePickerOptions): Promise<string | undefined>;
  /**
   * Opens the specified directory in the platform's file explorer or equivalent application.
   * @param directory The path of the directory to be opened.
   * @returns A promise that resolves when the directory has been successfully opened.
   */
  openDirectory(directory: string): Promise<void>;
  /**
   * Returns a list of available spellcheck languages for the current platform.
   * @returns A promise that resolves to an array of SpellcheckLanguage objects, each containing a language code and its corresponding name.
   * If the platform does not support spellcheck or if there are no available languages, the promise resolves to an empty array.
   */
  getSpellcheckLanguages(): Promise<ReadonlyArray<SpellcheckLanguage>>;
}

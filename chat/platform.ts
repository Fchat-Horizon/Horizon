import { GeneralSettings } from './general-settings';

export interface DirectoryPickerOptions {
  defaultPath?: string;
}

export interface FilePickerOptions {
  defaultPath?: string;
  extensions?: string[];
}

export interface PlatformServices {
  saveGeneralSettings(settings: GeneralSettings): Promise<void>;
  reloadSettings(): Promise<void>;
  selectDirectory(
    options?: DirectoryPickerOptions
  ): Promise<string | undefined>;
  selectFile(options?: FilePickerOptions): Promise<string | undefined>;
  openDirectory(directory: string): Promise<void>;
}

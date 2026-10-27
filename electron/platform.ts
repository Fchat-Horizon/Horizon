import * as electron from 'electron';
import * as remote from '@electron/remote';
import { GeneralSettings } from '../chat/general-settings';
import {
  DirectoryPickerOptions,
  FilePickerOptions,
  PlatformServices
} from '../chat/platform';

export default class ElectronPlatformService implements PlatformServices {
  async saveGeneralSettings(settings: GeneralSettings): Promise<void> {
    electron.ipcRenderer.send('general-settings-update', settings);
  }

  async reloadSettings(): Promise<void> {
    electron.ipcRenderer.send('request-reload-settings');
  }

  async selectDirectory(
    options: DirectoryPickerOptions = {}
  ): Promise<string | undefined> {
    const result = await remote.dialog.showOpenDialog({
      defaultPath: options.defaultPath,
      properties: ['openDirectory']
    });

    return result.canceled ? undefined : result.filePaths[0];
  }

  async selectFile(
    _options: FilePickerOptions = {}
  ): Promise<string | undefined> {
    const result = await electron.ipcRenderer.invoke('browser-option-browse');
    return typeof result === 'string' && result.length > 0 ? result : undefined;
  }

  async openDirectory(directory: string): Promise<void> {
    electron.ipcRenderer.send('open-dir', directory);
  }
}

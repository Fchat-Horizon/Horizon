import { ipcRenderer } from './host-bridge';
import type { KeyValueStore } from './json-store';

/**
 * Renderer-side view of the app-level key-value store
 * (userData/settings.json), which lives in the main process
 * (electron/filesystem-host.ts).
 */
export class IpcKeyValueStore implements KeyValueStore {
  async get(key: string): Promise<unknown> {
    return ipcRenderer.invoke('app-store-get', key);
  }

  async set(key: string, value: unknown): Promise<void> {
    await ipcRenderer.invoke('app-store-set', key, value);
  }

  async unset(key: string): Promise<void> {
    await ipcRenderer.invoke('app-store-unset', key);
  }
}

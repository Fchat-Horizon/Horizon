import { ipcRenderer } from 'electron';
import type { KeyValueStore } from './json-store';

/**
 * Stores credentials encrypted with the OS keychain via Electron's
 * safeStorage API, which lives in the main process and is reached over IPC.
 *
 * note: The on-disk format (binary-encoded safeStorage buffers in the
 * note: settings JSON) is unchanged from the old @electron/remote version,
 * note: so previously saved credentials keep working.
 */
export class SecureStore {
  constructor(
    protected storeName: string,
    protected settings: KeyValueStore
  ) {}

  private getKey(domain: string, account: string): string {
    return `${this.storeName}__${domain}__${account}`.replace(
      /[^a-zA-Z0-9_]/g,
      '__'
    );
  }

  private async isAvailable(): Promise<boolean> {
    return (await ipcRenderer.invoke('safe-storage-available')) === true;
  }

  async setPassword(
    domain: string,
    account: string,
    password: string
  ): Promise<void> {
    if (!(await this.isAvailable())) return;

    const encrypted = <string>(
      await ipcRenderer.invoke('safe-storage-encrypt', password)
    );

    await this.settings.set(this.getKey(domain, account), encrypted);
  }

  async deletePassword(domain: string, account: string): Promise<void> {
    if (!(await this.isAvailable())) return;

    await this.settings.unset(this.getKey(domain, account));
  }

  async getPassword(domain: string, account: string): Promise<string | null> {
    if (!(await this.isAvailable())) return null;

    const pw = await this.settings.get(this.getKey(domain, account));

    if (typeof pw !== 'string' || pw === '') {
      return null;
    }

    return <string>await ipcRenderer.invoke('safe-storage-decrypt', pw);
  }
}

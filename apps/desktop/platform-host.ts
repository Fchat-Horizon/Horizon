/**
 * @module platform-host
 * Installs the electron implementation of @horizon/shared's platform seams in a
 * renderer. The preload context bridge exposes window.electronAPI (see
 * preload.ts); this hands it to shared as the PlatformIpc. Call once at startup.
 */

import { setPlatformIpc, PlatformIpc } from '@horizon/shared/platform/ipc';

export function installRendererPlatform(): void {
  const api = (window as unknown as { electronAPI: PlatformIpc }).electronAPI;
  setPlatformIpc(api);
}

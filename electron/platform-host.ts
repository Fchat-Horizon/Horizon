/*
 * Installs the electron implementation of the shared platform IPC seam in a
 * renderer, from the context bridge preload.ts exposes (window.electronAPI).
 * Call once at startup, before shared code touches `ipc`.
 */

import { setPlatformIpc } from '../platform/ipc';
import type { PlatformIpc } from '../platform/ipc';

export function installRendererPlatform(): void {
  const w = window as unknown as { electronAPI: PlatformIpc };
  setPlatformIpc(w.electronAPI);
}

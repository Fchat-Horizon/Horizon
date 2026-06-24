/*
 * Installs the electron implementation of @horizon/shared's platform seams in a
 * renderer, from the context bridge preload.ts exposes (window.electronAPI +
 * window.hostInfo). Call once at startup, before shared code reads a seam.
 */

import { setPlatformIpc } from '@horizon/shared/platform/ipc';
import type { PlatformIpc } from '@horizon/shared/platform/ipc';
import {
  setPlatform,
  setPreviewPreloadUrl
} from '@horizon/shared/platform/platform';
import type { HostPlatform } from '@horizon/shared/platform/platform';

interface HostInfo {
  platform: HostPlatform;
  previewPreloadUrl: string;
}

export function installRendererPlatform(): void {
  const w = window as unknown as {
    electronAPI: PlatformIpc;
    hostInfo: HostInfo;
  };
  setPlatformIpc(w.electronAPI);
  setPlatform(w.hostInfo.platform);
  setPreviewPreloadUrl(w.hostInfo.previewPreloadUrl);
}

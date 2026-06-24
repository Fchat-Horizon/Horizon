/*
 * Runs in every shell window and chat tab before any page script. Renderers are
 * sandboxed and context-isolated (no Node, no Electron), so the few host
 * capabilities the UI needs are handed across the context bridge here;
 * electron-shim.ts and platform-host.ts pick them up on the other side.
 */

import { contextBridge, ipcRenderer, webFrame } from 'electron';

// Exposes window.__electronLog so electron-log/renderer can reach main.
import 'electron-log/preload';

contextBridge.exposeInMainWorld('electronAPI', {
  send(channel: string, ...args: unknown[]): void {
    ipcRenderer.send(channel, ...args);
  },
  sendSync(channel: string, ...args: unknown[]): unknown {
    return ipcRenderer.sendSync(channel, ...args);
  },
  invoke(channel: string, ...args: unknown[]): Promise<unknown> {
    return ipcRenderer.invoke(channel, ...args);
  },
  on(channel: string, listener: (...args: unknown[]) => void): () => void {
    const wrapped = (
      _event: Electron.IpcRendererEvent,
      ...args: unknown[]
    ): void => listener(...args);
    ipcRenderer.on(channel, wrapped);
    return () => ipcRenderer.removeListener(channel, wrapped);
  },
  once(channel: string, listener: (...args: unknown[]) => void): void {
    ipcRenderer.once(
      channel,
      (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
        listener(...args)
    );
  },
  setZoomLevel(level: number): void {
    webFrame.setZoomLevel(level);
  }
});

contextBridge.exposeInMainWorld('hostInfo', {
  platform: process.platform,
  // The sandboxed preload has no path/fs to build the file:// URL, so main
  // resolves the preview preload location and hands it over synchronously.
  previewPreloadUrl: ipcRenderer.sendSync('preview-preload-url-sync')
});

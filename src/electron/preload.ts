/**
 * @module preload
 * Runs in every shell window and chat tab before any page script. Renderers
 * are sandboxed and context-isolated - no Node, no Electron - so the handful
 * of things the UI actually needs get handed through the context bridge
 * here, and electron-shim.ts picks them up on the other side.
 */

import { contextBridge, ipcRenderer, webFrame } from 'electron';

// note: Exposes window.__electronLog so electron-log/renderer reaches main.
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
  /**
   * Subscribes and returns an unsubscribe function. The listener receives
   * the message arguments without the IpcRendererEvent; electron-shim.ts
   * reinserts a placeholder event so call sites keep their signatures.
   */
  on(channel: string, listener: (...args: unknown[]) => void): () => void {
    const wrapped = (
      _event: Electron.IpcRendererEvent,
      ...args: unknown[]
    ): void => listener(...args);
    ipcRenderer.on(channel, wrapped);
    return () => {
      ipcRenderer.removeListener(channel, wrapped);
    };
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

/*
 * Free `process.platform` references in renderer code resolve to this.
 * ! No `versions` on purpose: bluebird and friends sniff
 * ! process.versions.node and start believing they're in Node. They are not.
 */
contextBridge.exposeInMainWorld('process', {
  platform: process.platform,
  env: {}
});

import { contextBridge, ipcRenderer } from 'electron';
import { ABOUT_CHANNELS } from './api';
import type { AboutApi, AboutAppearance } from './api';
import { ABOUT_DIAGNOSTICS_CHANNEL } from './diagnostics-contract';

const api: AboutApi = {
  getState: () => ipcRenderer.invoke(ABOUT_CHANNELS.state),
  getAppearance: () => ipcRenderer.invoke(ABOUT_CHANNELS.appearance),
  collectDiagnostics: () => ipcRenderer.invoke(ABOUT_DIAGNOSTICS_CHANNEL),
  copyText: text => ipcRenderer.invoke(ABOUT_CHANNELS.copyText, text),
  reportBug: report => ipcRenderer.invoke(ABOUT_CHANNELS.reportBug, report),
  revealLogs: () => ipcRenderer.invoke(ABOUT_CHANNELS.revealLogs),
  ready: () => ipcRenderer.send(ABOUT_CHANNELS.ready),
  close: () => ipcRenderer.send(ABOUT_CHANNELS.close),
  onAppearanceChanged(listener) {
    const wrapped = (
      _event: Electron.IpcRendererEvent,
      appearance: AboutAppearance
    ): void => listener(appearance);
    ipcRenderer.on(ABOUT_CHANNELS.appearanceChanged, wrapped);
    return () =>
      ipcRenderer.removeListener(ABOUT_CHANNELS.appearanceChanged, wrapped);
  }
};

contextBridge.exposeInMainWorld('horizonAbout', api);

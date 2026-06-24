/**
 * @module electron-shim
 * Vite aliases `electron` to this file in renderer bundles. The real
 * Electron APIs live behind the context bridge (see preload.ts); this module
 * re-creates the small ipcRenderer/clipboard/webFrame surface the renderer
 * code uses, so call sites keep their normal `import ... from 'electron'`.
 */

type Listener = (...args: any[]) => void;

interface BridgeApi {
  send(channel: string, ...args: unknown[]): void;
  sendSync(channel: string, ...args: unknown[]): unknown;
  invoke(channel: string, ...args: unknown[]): Promise<unknown>;
  on(channel: string, listener: Listener): () => void;
  once(channel: string, listener: Listener): void;
  setZoomLevel(level: number): void;
}

const api = (window as unknown as { electronAPI: BridgeApi }).electronAPI;

/* state: (channel, listener) -> unsubscribe fns. The bridge cannot match
   listener identity across worlds, so removeListener goes through these. */
const subscriptions = new Map<string, Map<Listener, Array<() => void>>>();

export const ipcRenderer = {
  send(channel: string, ...args: any[]): void {
    api.send(channel, ...args);
  },
  sendSync(channel: string, ...args: any[]): any {
    return api.sendSync(channel, ...args);
  },
  invoke(channel: string, ...args: any[]): Promise<any> {
    return api.invoke(channel, ...args);
  },
  on(channel: string, listener: Listener): typeof ipcRenderer {
    const dispose = api.on(channel, (...args: any[]) =>
      listener({ channel }, ...args)
    );
    let byListener = subscriptions.get(channel);
    if (byListener === undefined) {
      byListener = new Map();
      subscriptions.set(channel, byListener);
    }
    const disposers = byListener.get(listener) ?? [];
    disposers.push(dispose);
    byListener.set(listener, disposers);
    return ipcRenderer;
  },
  once(channel: string, listener: Listener): typeof ipcRenderer {
    api.once(channel, (...args: any[]) => listener({ channel }, ...args));
    return ipcRenderer;
  },
  removeListener(channel: string, listener: Listener): typeof ipcRenderer {
    const byListener = subscriptions.get(channel);
    const disposers = byListener?.get(listener);
    const dispose = disposers?.pop();
    if (dispose !== undefined) dispose();
    if (disposers !== undefined && disposers.length === 0) {
      byListener!.delete(listener);
      if (byListener!.size === 0) subscriptions.delete(channel);
    }
    return ipcRenderer;
  }
};

export const clipboard = {
  writeText(text: string): void {
    api.send('clipboard-write-text', text);
  },
  writeBookmark(title: string, url: string): void {
    api.send('clipboard-write-bookmark', title, url);
  }
};

export const webFrame = {
  setZoomLevel(level: number): void {
    api.setZoomLevel(level);
  }
};

// note: `app` is main-only, but common.ts references it on paths that never
//        run in a renderer. Exporting undefined keeps the build from failing.
export const app = undefined;

export default { ipcRenderer, clipboard, webFrame, app };

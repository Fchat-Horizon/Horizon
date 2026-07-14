/**
 * @module host-bridge
 * Typed renderer-side view of the context bridge (see preload.ts) for the
 * electron package's own renderer files. Re-creates the small
 * ipcRenderer/clipboard/webFrame surface they use; import it explicitly -
 * `import { ipcRenderer } from './host-bridge'` - never via the bare
 * 'electron' specifier, which is reserved for main-process code.
 *
 * Shared code (chat/, learn/, site/, ...) must not import this either; it
 * talks to the host through the injected seam in platform/ipc.ts.
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

interface HostIpcRenderer {
  send(channel: string, ...args: any[]): void;
  sendSync(channel: string, ...args: any[]): any;
  invoke(channel: string, ...args: any[]): Promise<any>;
  on(channel: string, listener: Listener): HostIpcRenderer;
  once(channel: string, listener: Listener): HostIpcRenderer;
  removeListener(channel: string, listener: Listener): HostIpcRenderer;
}

export const ipcRenderer: HostIpcRenderer = {
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

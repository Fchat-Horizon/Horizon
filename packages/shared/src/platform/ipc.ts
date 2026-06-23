/**
 * @module platform/ipc
 * The IPC seam between shared/ and its host. Shared code talks to the host
 * through `ipc` instead of importing electron; each target (electron renderer,
 * web, tauri) injects an implementation with setPlatformIpc() at startup.
 */

export type IpcListener = (...args: unknown[]) => void;

export interface PlatformIpc {
  send(channel: string, ...args: unknown[]): void;
  sendSync(channel: string, ...args: unknown[]): unknown;
  invoke(channel: string, ...args: unknown[]): Promise<unknown>;
  on(channel: string, listener: IpcListener): void;
}

let impl: PlatformIpc | null = null;

export function setPlatformIpc(ipc: PlatformIpc): void {
  impl = ipc;
}

function active(): PlatformIpc {
  if (impl === null)
    throw new Error('Platform IPC not installed; call setPlatformIpc() first.');
  return impl;
}

/** Drop-in handle the call sites use; forwards to whatever the host installed. */
export const ipc: PlatformIpc = {
  send: (channel, ...args) => active().send(channel, ...args),
  sendSync: (channel, ...args) => active().sendSync(channel, ...args),
  invoke: (channel, ...args) => active().invoke(channel, ...args),
  on: (channel, listener) => active().on(channel, listener)
};

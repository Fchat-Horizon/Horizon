/**
 * @module timers-shim
 * Provided by webpack (ProvidePlugin) wherever renderer code references the
 * Node-only `setImmediate`/`clearImmediate` globals, which no longer exist
 * now that renderers run without Node integration.
 */

export function setImmediate(
  callback: (...args: any[]) => void,
  ...args: any[]
): ReturnType<typeof setTimeout> {
  return setTimeout(callback, 0, ...args);
}

export function clearImmediate(handle: ReturnType<typeof setTimeout>): void {
  clearTimeout(handle);
}

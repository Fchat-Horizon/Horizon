/*
 * Host identity injected at startup so shared code branches on platform and
 * locates the host-resolved preview preload without reaching for Node's
 * `process`. Each target (electron renderer, web, tauri) installs its values;
 * the defaults stay safe to read before a host installs the real ones.
 */

export type HostPlatform =
  | 'aix'
  | 'android'
  | 'darwin'
  | 'freebsd'
  | 'haiku'
  | 'linux'
  | 'openbsd'
  | 'sunos'
  | 'win32'
  | 'cygwin'
  | 'netbsd'
  | 'web';

let platform: HostPlatform = 'web';
let previewPreloadUrl = '';

export function setPlatform(value: HostPlatform): void {
  platform = value;
}

export function getPlatform(): HostPlatform {
  return platform;
}

export function setPreviewPreloadUrl(value: string): void {
  previewPreloadUrl = value;
}

export function getPreviewPreloadUrl(): string {
  return previewPreloadUrl;
}

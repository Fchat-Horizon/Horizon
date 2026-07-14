/**
 * @module platform/app-info
 * Host-provided application metadata, injected at startup so shared/ can read
 * locale, paths, and version without electron.app. Defaults keep it safe to
 * read before a host installs real values.
 */

export interface AppInfo {
  locale: string;
  userDataPath: string;
  version: string;
}

let info: AppInfo = { locale: 'en-GB', userDataPath: '', version: '0.0.0' };

export function setAppInfo(value: AppInfo): void {
  info = value;
}

export function getAppInfo(): AppInfo {
  return info;
}

import * as electron from 'electron';
import * as path from 'path';

import log from 'electron-log'; //tslint:disable-line:match-default-export-name

log.debug('init.common');

export const defaultHost = 'wss://chat.f-list.net/chat2';

function getDefaultLanguage(): string {
  try {
    return (
      electron.app.getLocale() ||
      process.env.LC_ALL ||
      process.env.LC_MESSAGES ||
      process.env.LANG ||
      process.env.LANGUAGE ||
      'en-GB'
    ).replace(/[.:].*/, '');
  } catch (err) {
    return 'en-GB';
  }
}

export class GeneralSettings {
  account = '';
  closeToTray = true;
  profileViewer = true;
  host = defaultHost;
  logDirectory = path.join(electron.app.getPath('userData'), 'data');
  spellcheckLang: string[] | string | undefined = [getDefaultLanguage()];
  theme = 'default';
  version = electron.app.getVersion();
  beta = false;
  customDictionary: string[] = [];
  hwAcceleration = true;
  risingCacheExpiryDays = 30;
  risingSystemLogLevel: log.LevelOption = 'info';
  risingDisableWindowsHighContrast = false;
  browserPath = '';
  browserArgs = '%s';
}

// //tslint:disable
// const Module = require('module');
//
// export function nativeRequire<T>(module: string): T {
//     return Module.prototype.require.call({paths: Module._nodeModulePaths(__dirname)}, module);
// }
//
// //tslint:enable

log.debug('init.common.done');

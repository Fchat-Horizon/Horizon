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
  proxy: string = '';
  host = defaultHost;
  logDirectory = path.join(electron.app.getPath('userData'), 'data');
  spellcheckLang: string[] | string | undefined = [getDefaultLanguage()];
  displayLanguage: string = 'en_us';
  theme = 'default';
  themeSync: boolean = false;
  themeSyncDark: string = 'dark';
  themeSyncLight: string = 'light';
  version = electron.app.getVersion();
  beta = false;
  updateCheck = true;
  customDictionary: string[] = [];
  hwAcceleration = true;
  reducedMotion = false;
  risingCacheExpiryDays = 30;
  horizonCacheMemoryCount = 350;
  risingSystemLogLevel: log.LevelOption = 'info';
  risingDisableWindowsHighContrast = false;
  browserPath = '';
  browserArgs = '%s';
  zoomLevel = 0.0;
  horizonCustomCss: string = '';
  horizonCustomCssEnabled: boolean = false;
  horizonVanillaTextColors: boolean = false;
  horizonVanillaGenderColors: boolean = false;
  horizonBbcodeGlow: boolean = false;
  horizonShowTips: boolean = true;
  soundTheme = 'default';
  soundThemeSoundVolumes: { [theme: string]: { [sound: string]: number } } = {};
  horizonAutoLogin: boolean = false;
  horizonWindowTitleCharacter: boolean = false;
  use12HourTime: boolean = false;
  showSeconds: boolean = false;
  fuzzyDates: boolean = true;
  flashWindow: boolean = true;
  allowWindowTransparency: boolean = false;
  horizonForceAsciiProfiles: boolean = false;
  hasImportedVanillaLogs: boolean = false;
  hasDismissedVanillaImport: boolean = false;
  vanillaCustomBaseDir: string | undefined = undefined;
  autoBackupEnabled: boolean = false;
  autoBackupIncludeGeneralSettings: boolean = true;
  autoBackupIncludeCharacterSettings: boolean = true;
  autoBackupIncludeLogs: boolean = true;
  autoBackupIncludeDrafts: boolean = true;
  autoBackupIncludePinnedConversations: boolean = true;
  autoBackupIncludePinnedEicons: boolean = true;
  autoBackupIncludeRecents: boolean = true;
  autoBackupIncludeHidden: boolean = true;
  autoBackupRetention: number = 5;
  autoBackupDirectory: string = '';
}

log.debug('init.common.done');

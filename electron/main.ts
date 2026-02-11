/**
 * @license
 * Originally licensed under MIT License
 *
 * Copyright (c) 2018 F-List
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * ---
 *
 * This file is now also licensed under GPLv3 (see LICENSE file).
 * Modifications made after the original MIT release are licensed under GPLv3.
 *
 * This license header applies to this file and all of the non-third-party assets it includes.
 * @file The entry point for the Electron main thread of F-Chat 3.0.
 * @copyright 2018 F-List
 * @author Maya Wolf <maya@f-list.net>
 * @version 3.0
 * @see {@link https://github.com/f-list/exported|GitHub repo}
 */

import * as electron from 'electron';

import log from 'electron-log'; //tslint:disable-line:match-default-export-name
import * as fs from 'fs';
import * as path from 'path';
// import * as url from 'url';
import l from '../chat/localize';
import { defaultHost, GeneralSettings } from './common';
// import BrowserWindow = electron.BrowserWindow;
import MenuItemConstructorOptions = electron.MenuItemConstructorOptions;
import * as _ from 'lodash';
import { AdCoordinatorHost } from '../chat/ads/ad-coordinator-host';
import { IpcMainEvent, session } from 'electron';
import Axios from 'axios';
import * as browserWindows from './browser_windows';
import * as remoteMain from '@electron/remote/main';
import { Event } from 'electron/main';

const configuredSessions = new WeakSet<electron.Session>();

const resolvePartition = (
  targetSession: electron.Session,
  fallback: string
): string => {
  const partition = (targetSession as unknown as { partition?: string })
    .partition;
  return partition || fallback || 'default';
};

// Module to control application life.
const app = electron.app;

remoteMain.initialize();

const characters: string[] = [];

async function tryHandleCli(): Promise<boolean> {
  const argv = process.argv.slice(1);
  const command = argv[0];
  const has = (flag: string) => argv.includes(flag);
  const get = (flag: string): string | undefined => {
    const idx = argv.indexOf(flag);
    return idx !== -1 ? argv[idx + 1] : undefined;
  };

  if (command === 'help' || has('--help') || has('-h')) {
    console.log(`
Horizon - CLI Usage

USAGE:
  horizon <command> [flags]
  horizon [flags]              Start GUI (with optional flags)

COMMANDS:
  export                  Export user data to a ZIP archive
  import                  Import user data from a ZIP archive
  help                    Show this help message

GUI FLAGS:
  --devtools              Open DevTools on startup for debugging

EXPORT FLAGS:
  --data-dir <path>       Data directory (default: userData/data)
  --out <path>            Output ZIP file path (default: ./horizon-export.zip)
  --characters <list>     Comma-separated list of characters to export (default: all)
  -n, --dry-run           Perform a dry run without creating the actual export
  --include-general       Include general settings (default: true)
  --include-character-settings    Include character settings (default: true)
  --include-logs          Include chat logs (default: true)
  --include-drafts        Include message drafts (default: true)
  --include-pinned-conversations  Include pinned conversations (default: true)
  --include-pinned-eicons Include pinned eicons (default: true)
  --include-recents       Include recent users/channels (default: true)
  --include-hidden        Include hidden users (default: true)

IMPORT FLAGS:
  --zip <path>            ZIP file to import (required)
  --data-dir <path>       Data directory (default: userData/data)
  --characters <list>     Comma-separated list of characters to import (default: all)
  -n, --dry-run           Perform a dry run without modifying any files
  --overwrite             Overwrite existing files (default: false)
  --include-general       Include general settings (default: true)
  --include-character-settings    Include character settings (default: true)
  --include-logs          Include chat logs (default: true)
  --include-drafts        Include message drafts (default: true)
  --include-pinned-conversations  Include pinned conversations (default: true)
  --include-pinned-eicons Include pinned eicons (default: true)
  --include-recents       Include recent users/channels (default: true)
  --include-hidden        Include hidden users (default: true)

EXAMPLES:
  # Export all data
  horizon export --data-dir ~/.config/horizon/data --out ~/backup.zip

  # Export only logs for specific characters
  horizon export --characters "CharName1,CharName2" --include-logs

  # Dry run to see what would be exported
  horizon export --dry-run --out ~/backup.zip

  # Import from a backup
  horizon import --zip ~/backup.zip --data-dir ~/.config/horizon/data

  # Import with overwrite
  horizon import --zip ~/backup.zip --overwrite

  # Dry run to see what would be imported
  horizon import --zip ~/backup.zip --dry-run

  # Start GUI with DevTools
  horizon --devtools
`);
    app.exit(0);
    return true;
  }

  if (command === 'export') {
    const { runExportCli } = await import(
      './services/exporter/backup-export-cli'
    );
    const dataDir =
      get('--data-dir') || path.join(app.getPath('userData'), 'data');
    const out = get('--out') || path.join(process.cwd(), 'horizon-export.zip');
    const include = (f: string, d = false) => (has(f) ? true : d);
    const chars = get('--characters')?.split(',').filter(Boolean);
    const dryRun = has('-n') || has('--dry-run');
    const exportResult = await runExportCli({
      dataDir,
      out,
      includeGeneral: include('--include-general', true),
      includeCharacterSettings: include('--include-character-settings', true),
      includeLogs: include('--include-logs', true),
      includeDrafts: include('--include-drafts', true),
      includePinnedConversations: include(
        '--include-pinned-conversations',
        true
      ),
      includePinnedEicons: include('--include-pinned-eicons', true),
      includeRecents: include('--include-recents', true),
      includeHidden: include('--include-hidden', true),
      characters: chars,
      dryRun
    });
    // Emit a simple summary for cron logs
    console.log(
      JSON.stringify({
        op: 'export',
        dryRun,
        out: exportResult.out,
        characters: exportResult.characters.length
      })
    );
    // Exit without opening any window
    app.exit(0);
    return true;
  }

  if (command === 'import') {
    const { runImportCli } = await import(
      './services/importer/backup-import-cli'
    );
    const zip = get('--zip');
    if (!zip) return false;
    const dataDir =
      get('--data-dir') || path.join(app.getPath('userData'), 'data');
    const include = (f: string, d = false) => (has(f) ? true : d);
    const chars = get('--characters')?.split(',').filter(Boolean);
    const overwrite = has('--overwrite');
    const dryRun = has('-n') || has('--dry-run');
    const importResult = await runImportCli({
      zip,
      dataDir,
      includeGeneral: include('--include-general', true),
      includeCharacterSettings: include('--include-character-settings', true),
      includeLogs: include('--include-logs', true),
      includeDrafts: include('--include-drafts', true),
      includePinnedConversations: include(
        '--include-pinned-conversations',
        true
      ),
      includePinnedEicons: include('--include-pinned-eicons', true),
      includeRecents: include('--include-recents', true),
      includeHidden: include('--include-hidden', true),
      overwrite,
      characters: chars,
      dryRun
    });
    console.log(
      JSON.stringify({
        op: 'import',
        dryRun,
        zip,
        touchedCharacters: importResult.touchedCharacters.length,
        generalImported: importResult.generalImported
      })
    );
    app.exit(0);
    return true;
  }
  return false;
}

function broadcastConnectedCharacters(): void {
  for (const w of electron.webContents.getAllWebContents()) {
    try {
      w.send('connected-characters-updated', characters.slice());
    } catch {
      // ignore
    }
  }
}

const baseDir = app.getPath('userData');
fs.mkdirSync(baseDir, { recursive: true });
let shouldImportSettings = false;
const releasesUrl =
  'https://api.github.com/repos/Fchat-Horizon/Horizon/releases';
type ReleaseInfo = {
  html_url: string;
  tag_name: string;
  prerelease: boolean | undefined;
};
const updateCheckFirstDelay = 10000;
const updateCheckInterval = 3600000;

const settingsDir = path.join(baseDir, 'data');
fs.mkdirSync(settingsDir, { recursive: true });
const settingsFile = path.join(settingsDir, 'settings');
const settings = new GeneralSettings();
//We need this, since displaying the changelog is done through a child window instead of an external link
let showChangelogOnBoot = false;

if (!fs.existsSync(settingsFile)) {
  shouldImportSettings = true;
} else {
  try {
    Object.assign(
      settings,
      <GeneralSettings>JSON.parse(fs.readFileSync(settingsFile, 'utf8'))
    );
  } catch (e) {
    log.error(`Error loading settings: ${e}`);
  }
}

if (!settings.hwAcceleration) {
  log.info('Disabling hardware acceleration.');
  app.disableHardwareAcceleration();
}

// async function setDictionary(lang: string | undefined): Promise<void> {
//     if(lang !== undefined) await ensureDictionary(lang);
//     settings.spellcheckLang = lang;
//     setGeneralSettings(settings);
// }

export function updateSpellCheckerLanguages(langs: string[]): void {
  // console.log('UPDATESPELLCHECKERLANGUAGES', langs);

  // console.log('Language support:', langs);
  electron.session.defaultSession.setSpellCheckerLanguages(langs);
  browserWindows.setSpellCheckerLanguages(langs);
}

function setGeneralSettings(value: GeneralSettings): void {
  log.debug('settings.save', value);
  fs.writeFileSync(path.join(settingsDir, 'settings'), JSON.stringify(value));
  for (const w of electron.webContents.getAllWebContents())
    w.send('settings', settings);

  shouldImportSettings = false;

  log.transports.file.level = settings.risingSystemLogLevel;
  log.transports.console.level = settings.risingSystemLogLevel;
}

async function checkForGitRelease(
  semVer: string,
  releaseUrl: string
): Promise<void> {
  if (!settings.updateCheck) {
    return;
  }
  try {
    let releases: ReleaseInfo[] = (
      await Axios.get<ReleaseInfo[]>(`${releaseUrl}`)
    ).data;
    //The releases we get from the GitHub API are in in descending order from their release date.
    for (const release of releases) {
      //We don't care about pre-releases if we're not using the beta, but we still want to try the others.
      log.debug('updateCheck.release', release.tag_name);
      if (release.prerelease && !settings.beta) {
        continue;
      }
      if (release.tag_name == semVer) {
        log.info('updateCheck.state.upToDate', `Horizon up to date: ${semVer}`);
        return;
      }
      log.info(
        'updateCheck.state.new',
        `Update available: You're using ${semVer} instead of ${release.tag_name}`
      );

      browserWindows.toggleUpdateNotice(true, release.tag_name);
      return;
    }
  } catch (e) {
    log.error(`Error checking for update: ${e}`);
  }
}
export function openURLExternally(linkUrl: string): void {
  // check if user set a path and whether it exists
  const pathIsValid =
    settings.browserPath !== '' && fs.existsSync(settings.browserPath);

  if (pathIsValid) {
    // also check if the user can execute whatever is located at the selected path
    let fileIsExecutable = false;
    try {
      fs.accessSync(settings.browserPath, fs.constants.X_OK);
      fileIsExecutable = true;
    } catch (err) {
      log.error(
        `Selected browser is not executable by user. Path: "${settings.browserPath}"`
      );
    }

    if (fileIsExecutable) {
      // regular expression that looks for an encoded % symbol followed by two hexadecimal characters
      // using this expression, we can find parts of the URL that were encoded twice
      const re = /%25([0-9a-f]{2})/gi;

      // encode the URL no matter what
      linkUrl = encodeURI(linkUrl);

      // eliminate double-encoding using expression above
      linkUrl = linkUrl.replace(re, '%$1');

      if (!settings.browserArgs.includes('%s')) {
        // append %s to params if it is not already there
        settings.browserArgs += ' %s';
      }

      // replace %s in arguments with URL and encapsulate in quotes to prevent issues with spaces and special characters in the path
      let link = settings.browserArgs.replace('%s', '"' + linkUrl + '"');

      const execFile = require('child_process').exec;
      if (process.platform === 'darwin') {
        // NOTE: This is seemingly bugged on MacOS when setting Safari as the external browser while using a different default browser.
        // In that case, this will open the URL in both the selected application AND the default browser.
        // Other browsers work fine. (Tested with Chrome with Firefox as the default browser.)
        // https://developer.apple.com/forums/thread/685385
        execFile(`open -a "${settings.browserPath}" ${link}`);
      } else {
        execFile(`"${settings.browserPath}" ${link}`);
      }
      return;
    }
  }

  electron.shell.openExternal(linkUrl);
}

let zoomLevel = settings.zoomLevel;

async function onReady(): Promise<void> {
  try {
    if (await tryHandleCli()) return;
  } catch (err) {
    log.error('cli.run.failed', err);
    app.exit(1);
    return;
  }

  let hasCompletedUpgrades = false;

  const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'silly';

  log.transports.file.level = settings.risingSystemLogLevel || logLevel;
  log.transports.console.level = settings.risingSystemLogLevel || logLevel;
  log.transports.file.maxSize = 5 * 1024 * 1024;

  log.info('Starting application.');

  app.setAppUserModelId('net.flist.fchat');
  app.on('open-file', () => {
    browserWindows.createMainWindow(settings, 'none', baseDir);
  });
  const configurePermissionPolicy = (
    targetSession: electron.Session | null,
    fallbackLabel: string
  ): void => {
    if (!targetSession || configuredSessions.has(targetSession)) return;

    configuredSessions.add(targetSession);

    const partitionName = resolvePartition(targetSession, fallbackLabel);
    const deny = (): boolean => false;

    targetSession.setPermissionRequestHandler(
      (_webContents, permission, callback) => {
        if (
          permission === 'notifications' &&
          partitionName === 'persist:fchat'
        ) {
          log.debug('permissions.allowed.notifications', {
            partition: partitionName
          });
          callback(true);
          return;
        }

        log.debug('permissions.blocked', {
          partition: partitionName,
          permission: permission
        });
        callback(false);
      }
    );

    // Optional handlers if available
    targetSession.setPermissionCheckHandler?.(
      (_webContents, permission, _details) => {
        if (
          permission === 'notifications' &&
          partitionName === 'persist:fchat'
        ) {
          return true;
        }
        return deny();
      }
    );

    targetSession.setDevicePermissionHandler?.(details => {
      log.debug('permissions.blocked.device', {
        partition: partitionName,
        deviceType: details.deviceType
      });
      return deny();
    });

    targetSession.setDisplayMediaRequestHandler?.((_request, callback) => {
      log.debug('permissions.blocked.displayCapture', {
        partition: partitionName
      });
      callback({} as any);
    });
  };

  //Block automatic downloads in the image previewer.
  //It's in its own partitioned session, so we can't use session.defaultSession here
  const ses = session.fromPartition('persist:adblocked');
  ses.on('will-download', (event, _item, _webContents) => {
    event.preventDefault();
  });
  configurePermissionPolicy(session.defaultSession, 'default');
  configurePermissionPolicy(
    session.fromPartition('persist:fchat'),
    'persist:fchat'
  );
  configurePermissionPolicy(ses, 'persist:adblocked');
  app.on('web-contents-created', (_event, contents) => {
    const partition = resolvePartition(contents.session, 'dynamic');
    configurePermissionPolicy(contents.session, partition);
  });
  if (
    settings.version !== app.getVersion() &&
    process.env.NODE_ENV !== 'development'
  ) {
    if (settings.host === 'wss://chat.f-list.net:9799')
      settings.host = defaultHost;
    settings.version = app.getVersion();
    setGeneralSettings(settings);
    showChangelogOnBoot = true;
  }

  // require('update-electron-app')(
  //   {
  //     repo: 'https://github.com/Fchat-Horizon/Horizon.git',
  //     updateInterval: '3 hours',
  //     logger: require('electron-log')
  //   }
  // );
  if (process.env.NODE_ENV === 'production') {
    setTimeout(
      () => checkForGitRelease(`v${app.getVersion()}`, releasesUrl),
      updateCheckFirstDelay
    );

    setInterval(
      () => checkForGitRelease(`v${app.getVersion()}`, releasesUrl),
      updateCheckInterval
    );
  }

  const viewItem = {
    label: `&${l('action.view')}`,
    submenu: <electron.MenuItemConstructorOptions[]>[
      // {role: 'resetZoom'},
      {
        label: 'Reset Zoom',
        click: (_m: electron.MenuItem, _w: electron.BrowserWindow) => {
          // log.info('MENU ZOOM0');
          // w.webContents.setZoomLevel(0);

          zoomLevel = 0;

          for (const win of electron.webContents.getAllWebContents())
            win.send('update-zoom', 0);
          browserWindows.updateZoomLevel(0);
          settings.zoomLevel = zoomLevel;
          setGeneralSettings(settings);
        },
        accelerator: 'CmdOrCtrl+0'
      },
      {
        // role: 'zoomIn',
        label: 'Zoom In',
        click: (_m: electron.MenuItem, w: electron.BrowserWindow) => {
          // log.info('MENU ZOOM+');
          zoomLevel = Math.min(
            zoomLevel + w.webContents.getZoomFactor() / 2,
            6
          );
          // w.webContents.setZoomLevel(newZoom);

          for (const win of electron.webContents.getAllWebContents())
            win.send('update-zoom', zoomLevel);
          browserWindows.updateZoomLevel(zoomLevel);
          settings.zoomLevel = zoomLevel;
          setGeneralSettings(settings);
        },
        id: 'zoomIn',
        accelerator: 'CmdOrCtrl+='
      },
      {
        // role: 'zoomIn',
        label: 'Zoom Out',
        click: (_m: electron.MenuItem, w: electron.BrowserWindow) => {
          // log.info('MENU ZOOM-');
          zoomLevel = Math.max(
            -3,
            zoomLevel - w.webContents.getZoomFactor() / 2
          );

          // w.webContents.setZoomLevel(newZoom);

          for (const win of electron.webContents.getAllWebContents())
            win.send('update-zoom', zoomLevel);
          browserWindows.updateZoomLevel(zoomLevel);
          settings.zoomLevel = zoomLevel;
          setGeneralSettings(settings);
        },
        id: 'zoomOut',
        accelerator: 'CmdOrCtrl+-'
      },
      // {role: 'zoomOut'},
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  };
  if (process.env.NODE_ENV !== 'production')
    viewItem.submenu.unshift(
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' }
    );
  const windowItem: MenuItemConstructorOptions = {
    label: l('window'),
    role: 'window',
    submenu: [
      {
        label: l('navigation.nextTab'),
        accelerator: 'Ctrl+Tab',
        click: (_m, window) => {
          if (window && 'webContents' in window) {
            (window as electron.BrowserWindow).webContents.send('switch-tab');
          }
        }
      },
      {
        label: l('navigation.previousTab'),
        accelerator: 'Ctrl+Shift+Tab',
        click: (_m, window) => {
          if (window && 'webContents' in window) {
            (window as electron.BrowserWindow).webContents.send('previous-tab');
          }
        }
      }
    ]
  };
  //tslint:disable-next-line:no-floating-promises

  electron.Menu.setApplicationMenu(
    electron.Menu.buildFromTemplate([
      {
        label: `&${l('title')}`,
        submenu: [
          {
            label: l('action.about'),
            click: (_m: electron.MenuItem, w: electron.BrowserWindow) => {
              browserWindows.createAboutWindow(settings, w);
            }
          },
          {
            label: l(
              process.env.NODE_ENV !== 'development'
                ? 'version'
                : 'developmentVersion',
              process.env.APP_VERSION || app.getVersion()
            ),
            click: (_m: electron.MenuItem, w: electron.BrowserWindow) => {
              let win = w || electron.BrowserWindow.getFocusedWindow();
              if (!win) return;
              browserWindows.createChangelogWindow(settings, 'none', win);
            }
          },
          { type: 'separator' },
          {
            label: l('action.newWindow'),
            click: () => {
              if (hasCompletedUpgrades)
                browserWindows.createMainWindow(settings, 'none', baseDir);
            },
            accelerator: 'CmdOrCtrl+n'
          },
          {
            label: l('action.newTab'),
            click: (_m: electron.MenuItem, w: electron.BrowserWindow) => {
              if (hasCompletedUpgrades) browserWindows.openTab(w);
            },
            id: 'newTab',
            accelerator: 'CmdOrCtrl+Shift+T'
          },
          {
            label: l('action.preferences'),
            click: (_m, window: electron.BrowserWindow) => {
              browserWindows.createSettingsWindow(
                settings,
                shouldImportSettings ? 'auto' : 'none',
                window
              );
            },
            accelerator:
              process.platform === 'darwin' ? 'CmdOrCtrl+,' : undefined
          },
          {
            label: l('fixLogs.action'),
            click: (_m, window: electron.BrowserWindow) =>
              window.webContents.send('fix-logs'),
            id: 'fixLogs'
          },

          {
            label: 'Show/hide current profile',
            click: (_m: electron.MenuItem, w: electron.BrowserWindow) => {
              w.webContents.send('reopen-profile');
            },
            accelerator: 'CmdOrCtrl+p',
            id: 'showProfile'
          },

          { type: 'separator' },
          ...(process.platform === 'darwin'
            ? [
                { role: 'hide', label: l('action.hide') },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' }
              ]
            : []),

          { role: 'minimize' },
          {
            role: 'quit',
            label: l('action.quit'),
            accelerator:
              process.platform !== 'darwin' ? 'CmdOrCtrl+Shift+Q' : undefined
          }
        ] as MenuItemConstructorOptions[]
      },
      {
        label: `&${l('action.edit')}`,
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectall' }
        ] as MenuItemConstructorOptions[]
      },
      {
        label: `&${l('settings.export.manageData')}`,
        click: (_m: electron.MenuItem, w: electron.BrowserWindow) => {
          browserWindows.createExporterWindow(settings, 'none', w);
        }
      },
      viewItem,
      ...(process.platform === 'darwin' ? [windowItem] : []),
      {
        label: `&${l('help')}`,
        submenu: [
          {
            label: l('help.fchat'),
            click: () => openURLExternally('https://horizn.moe/docs')
          },
          // {
          //     label: l('help.feedback'),
          //     click: () => openURLExternally('https://goo.gl/forms/WnLt3Qm3TPt64jQt2')
          // },
          { type: 'separator' },

          {
            label: l('help.rules'),
            click: () => openURLExternally('https://wiki.f-list.net/Rules')
          },
          {
            label: l('help.faq'),
            click: () =>
              openURLExternally(
                'https://wiki.f-list.net/Frequently_Asked_Questions'
              )
          },
          {
            label: l('help.report'),
            click: () =>
              openURLExternally(
                'https://wiki.f-list.net/How_to_Report_a_User#In_chat'
              )
          },
          {
            label: 'Test UI items',
            click: (_m, window: electron.BrowserWindow, _e: KeyboardEvent) => {
              window.webContents.send('ui-test');
            },
            id: 'uiTest',
            visible: process.env.NODE_ENV !== 'production'
          }
        ] as MenuItemConstructorOptions[]
      },
      ...(process.platform !== 'darwin'
        ? ([
            {
              label: l('navigation'),
              visible: false,
              submenu: [
                {
                  id: 'nextTab',
                  accelerator: 'Ctrl+Tab',
                  label: l('navigation.nextTab'),
                  click: (
                    _menuItem: electron.MenuItem,
                    browserWindow: electron.BrowserWindow | undefined,
                    _event: KeyboardEvent
                  ) => {
                    if (browserWindow) {
                      browserWindow.webContents.send('switch-tab');
                    }
                  }
                } as MenuItemConstructorOptions,
                {
                  id: 'nextTabAlt',
                  accelerator: 'CmdOrCtrl+PageDown',
                  label: l('navigation.nextTab'),
                  click: (
                    _menuItem: electron.MenuItem,
                    browserWindow: electron.BrowserWindow | undefined,
                    _event: KeyboardEvent
                  ) => {
                    if (browserWindow) {
                      browserWindow.webContents.send('switch-tab');
                    }
                  }
                } as MenuItemConstructorOptions,
                {
                  id: 'previousTab',
                  accelerator: 'Ctrl+Shift+Tab',
                  label: l('navigation.previousTab'),
                  click: (
                    _menuItem: electron.MenuItem,
                    browserWindow: electron.BrowserWindow | undefined,
                    _event: KeyboardEvent
                  ) => {
                    if (browserWindow) {
                      browserWindow.webContents.send('previous-tab');
                    }
                  }
                } as MenuItemConstructorOptions,
                {
                  id: 'previousTabAlt',
                  accelerator: 'CmdOrCtrl+PageUp',
                  label: l('navigation.previousTab'),
                  click: (
                    _menuItem: electron.MenuItem,
                    browserWindow: electron.BrowserWindow | undefined,
                    _event: KeyboardEvent
                  ) => {
                    if (browserWindow) {
                      browserWindow.webContents.send('previous-tab');
                    }
                  }
                } as MenuItemConstructorOptions
              ] as MenuItemConstructorOptions[]
            } as MenuItemConstructorOptions
          ] as MenuItemConstructorOptions[])
        : [])
    ])
  );

  electron.ipcMain.on('tab-added', (_event: IpcMainEvent, id: number) => {
    const webContents = electron.webContents.fromId(id);

    if (webContents) {
      browserWindows.tabAddHandler(webContents, settings);
    }
  });
  electron.ipcMain.on('tab-closed', () => {
    browserWindows.tabClosedHandler();
  });

  electron.ipcMain.on(
    'update-and-exit',
    (_event: IpcMainEvent, updateVersion: string) => {
      if (characters.length > 0) {
        const button = electron.dialog.showMessageBoxSync(
          //Yes this could technically fail if this event is ever emitted from something that's not a user interaction.
          electron.BrowserWindow.getFocusedWindow()!,
          {
            message: l('changelog.quitAndDownload.confirm'),
            title: l('title'),
            buttons: [l('confirmYes'), l('confirmNo')],
            cancelId: 1
          }
        );
        if (button !== 0) return;
      }
      openURLExternally(
        'https://horizn.moe/download.html?ver=' + updateVersion
      );
      browserWindows.quitAllWindows();
    }
  );
  electron.ipcMain.on(
    'open-update-changelog',
    (_event: IpcMainEvent, updateVersion: string) => {
      browserWindows.createChangelogWindow(
        settings,
        'none',
        electron.BrowserWindow.getFocusedWindow()!,
        updateVersion
      );
    }
  );
  electron.ipcMain.on('open-settings-menu', (_event: IpcMainEvent) => {
    browserWindows.createSettingsWindow(
      settings,
      'none',
      electron.BrowserWindow.getFocusedWindow()!
    );
  });

  electron.ipcMain.on(
    'open-exporter-window',
    (_event: IpcMainEvent, importHint?: string) => {
      const targetWindow = electron.BrowserWindow.getFocusedWindow();
      if (!targetWindow) return;
      browserWindows.createExporterWindow(
        settings,
        importHint as any,
        targetWindow
      );
    }
  );

  electron.ipcMain.on(
    'save-login',
    (_event: IpcMainEvent, account: string, host: string, proxy: string) => {
      settings.account = account;
      settings.host = host;
      settings.proxy = proxy;
      setGeneralSettings(settings);
    }
  );
  electron.ipcMain.on(
    'connect',
    (e: IpcMainEvent & { sender: electron.WebContents }, character: string) => {
      if (characters.indexOf(character) !== -1) {
        e.returnValue = false;
        return;
      }
      characters.push(character);
      e.returnValue = true;
      broadcastConnectedCharacters();
    }
  );
  electron.ipcMain.on(
    'dictionary-add',
    (_event: IpcMainEvent, word: string) => {
      // if(settings.customDictionary.indexOf(word) !== -1) return;
      // settings.customDictionary.push(word);
      // setGeneralSettings(settings);
      browserWindows.addWordToSpellCheckerDictionary(word);
    }
  );
  electron.ipcMain.on(
    'dictionary-remove',
    (_event: IpcMainEvent /*, word: string*/) => {
      // settings.customDictionary.splice(settings.customDictionary.indexOf(word), 1);
      // setGeneralSettings(settings);
    }
  );
  electron.ipcMain.on(
    'disconnect',
    (_event: IpcMainEvent, character: string) => {
      const index = characters.indexOf(character);
      if (index !== -1) characters.splice(index, 1);
      broadcastConnectedCharacters();
    }
  );

  electron.ipcMain.handle('get-connected-characters', () => {
    return characters.slice();
  });

  electron.ipcMain.handle('list-auto-backups', () => {
    const backupDir =
      settings.autoBackupDirectory || path.join(baseDir, 'backups');
    try {
      return fs
        .readdirSync(backupDir)
        .filter(f => /^auto-backup-.*\.zip$/.test(f))
        .map(f => {
          const stat = fs.statSync(path.join(backupDir, f));
          return {
            name: f,
            path: path.join(backupDir, f),
            mtime: stat.mtimeMs,
            size: stat.size
          };
        })
        .sort((a, b) => b.mtime - a.mtime);
    } catch {
      return [];
    }
  });

  const adCoordinator = new AdCoordinatorHost();
  electron.ipcMain.on('request-send-ad', (event: IpcMainEvent, adId: string) =>
    adCoordinator.processAdRequest(event, adId)
  );

  electron.ipcMain.on('rising-upgrade-complete', () => {
    // console.log('RISING COMPLETE SHARE');
    hasCompletedUpgrades = true;
    for (const w of electron.webContents.getAllWebContents())
      w.send('rising-upgrade-complete');
  });

  electron.ipcMain.on('update-zoom', (_e, zl: number) => {
    // log.info('MENU ZOOM UPDATE', zoomLevel);
    for (const w of electron.webContents.getAllWebContents())
      w.send('update-zoom', zl);
  });

  electron.ipcMain.on('open-dir', (_e, directory: string) => {
    electron.shell.openPath(directory);
  });

  electron.ipcMain.handle('browser-option-browse', async () => {
    log.debug('settings.browserOption.browse');
    console.log('settings.browserOption.browse', JSON.stringify(settings));

    let filters;
    if (process.platform === 'win32') {
      filters = [{ name: 'Executables', extensions: ['exe'] }];
    } else if (process.platform === 'darwin') {
      filters = [{ name: 'Executables', extensions: ['app'] }];
    } else {
      // linux and anything else that might be supported
      // no specific extension for executables
      filters = [{ name: 'Executables', extensions: ['*'] }];
    }

    const dir = electron.dialog.showOpenDialogSync({
      defaultPath: settings.browserPath,
      properties: ['openFile'],
      filters: filters
    });
    if (dir !== undefined) {
      return dir[0];
    }

    // we keep the current path if the user cancels the dialog
    return settings.browserPath;
  });

  electron.ipcMain.on(
    'browser-option-update',
    (_e, _path: string, _args: string) => {
      settings.browserPath = _path;
      settings.browserArgs = _args;
      setGeneralSettings(settings);
    }
  );

  electron.ipcMain.on('log-path-update', (_e, _path: string) => {
    browserWindows.quitAllWindows();
    settings.logDirectory = _path;
    setGeneralSettings(settings);
    app.quit();
  });

  electron.ipcMain.on(
    'general-settings-update',
    (_e, _options: GeneralSettings) => {
      log.info('main.settings.update.message', _options);
      if (_options) {
        let newCss =
          settings.horizonCustomCssEnabled !==
            _options.horizonCustomCssEnabled ||
          settings.horizonCustomCss !== _options.horizonCustomCss;
        Object.assign(settings, _options);
        //Now we save it to a file
        setGeneralSettings(_options);
        //No need to bother with an expensive operation if we don't change anything related to CSS settings
        if (newCss) {
          browserWindows.updateCustomCssAllWindows(
            settings.horizonCustomCss,
            settings.horizonCustomCssEnabled
          );
        }
      }
    }
  );

  electron.ipcMain.on('open-url-externally', (_e, _url: string) => {
    openURLExternally(_url);
  });

  let window = browserWindows.createMainWindow(
    settings,
    shouldImportSettings ? 'auto' : 'none',
    baseDir
  );
  if (showChangelogOnBoot && window) {
    browserWindows.createChangelogWindow(
      settings,
      shouldImportSettings ? 'auto' : 'none',
      window
    );
    showChangelogOnBoot = false;
  }

  if (settings.autoBackupEnabled) {
    import('./services/exporter/auto-backup').then(({ performAutoBackup }) =>
      setTimeout(() => performAutoBackup(settings, baseDir), 30000)
    );
  }
}

// Twitter fix
app.commandLine.appendSwitch('disable-features', 'CrossOriginOpenerPolicy');

const isSquirrelStart = require('electron-squirrel-startup'); //tslint:disable-line:no-require-imports
if (
  isSquirrelStart ||
  (process.env.NODE_ENV === 'production' && !app.requestSingleInstanceLock())
)
  app.quit();
else
  app.on('ready', () => {
    onReady();
    //MacOS event for opening via the dock. Only to subscribe to once we are truly ready
    app.on('activate', () => {
      browserWindows.showAllWindows();
    });
    app.on('did-become-active', () => {
      browserWindows.showAllWindows();
    });
  });
app.on('second-instance', () => {
  browserWindows.createMainWindow(settings, 'none', baseDir);
});
app.on('before-quit', (event: Event) => {
  if (characters.length !== 0) {
    const focusedWindow = electron.BrowserWindow.getFocusedWindow();
    //forcing a window to be focused is weird. Let's just make it so that it floats otherwise.
    const options = {
      message: l('chat.confirmLeave'),
      title: l('title'),
      buttons: [l('confirmYes'), l('confirmNo')],
      cancelId: 1
    };
    const button = focusedWindow
      ? electron.dialog.showMessageBoxSync(focusedWindow, options)
      : electron.dialog.showMessageBoxSync(options);

    if (button === 1) {
      event.preventDefault();
      return;
    }
  }
  browserWindows.quitAllWindows();
});
app.on('window-all-closed', () => app.quit());

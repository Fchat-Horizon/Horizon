/**
 * @license
 * MIT License
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
 * This license header applies to this file and all of the non-third-party assets it includes.
 * @file The entry point for the Electron main thread of F-Chat 3.0.
 * @copyright 2018 F-List
 * @author Maya Wolf <maya@f-list.net>
 * @version 3.0
 * @see {@link https://github.com/f-list/exported|GitHub repo}
 */

// import { DebugLogger } from './debug-logger';
// // @ts-ignore
// const dl = new DebugLogger('main');

import * as electron from 'electron';

import log from 'electron-log'; //tslint:disable-line:match-default-export-name
import * as fs from 'fs';
import * as path from 'path';
// import * as url from 'url';
import l from '../chat/localize';
import { defaultHost, GeneralSettings } from './common';
import { getSafeLanguages, knownLanguageNames } from './language';
// import BrowserWindow = electron.BrowserWindow;
import MenuItem = electron.MenuItem;
import MenuItemConstructorOptions = electron.MenuItemConstructorOptions;
import * as _ from 'lodash';
import { AdCoordinatorHost } from '../chat/ads/ad-coordinator-host';
import { IpcMainEvent } from 'electron';
import Axios from 'axios';
import * as browserWindows from './browser_windows';
import * as remoteMain from '@electron/remote/main';

// Module to control application life.
const app = electron.app;

remoteMain.initialize();

const characters: string[] = [];

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

if (!fs.existsSync(settingsFile)) shouldImportSettings = true;
else
  try {
    Object.assign(
      settings,
      <GeneralSettings>JSON.parse(fs.readFileSync(settingsFile, 'utf8'))
    );
  } catch (e) {
    log.error(`Error loading settings: ${e}`);
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

async function toggleDictionary(lang: string): Promise<void> {
  const activeLangs = getSafeLanguages(settings.spellcheckLang);

  // console.log('INITIAL LANG', activeLangs, lang);

  let newLangs: string[] = [];

  if (_.indexOf(activeLangs, lang) >= 0) {
    newLangs = _.reject(activeLangs, al => al === lang);
  } else {
    activeLangs.push(lang);
    newLangs = activeLangs;
  }

  settings.spellcheckLang = _.uniq(newLangs);

  setGeneralSettings(settings);

  // console.log('NEW LANG', newLangs);

  updateSpellCheckerLanguages(newLangs);
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

async function addSpellcheckerItems(menu: electron.Menu): Promise<void> {
  const selected = getSafeLanguages(settings.spellcheckLang);
  const langs = electron.session.defaultSession.availableSpellCheckerLanguages;

  const sortedLangs = _.sortBy(
    _.map(langs, lang => ({
      lang,
      name:
        lang in knownLanguageNames
          ? `${(knownLanguageNames as any)[lang]} (${lang})`
          : lang
    })),
    'name'
  );

  for (const lang of sortedLangs)
    menu.append(
      new electron.MenuItem({
        type: 'checkbox',
        label: lang.name,
        checked: _.indexOf(selected, lang.lang) >= 0,
        click: async () => toggleDictionary(lang.lang)
      })
    );
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
      const menu = electron.Menu.getApplicationMenu()!;

      const item = menu.getMenuItemById('update') as MenuItem | null;

      if (item !== null) item.visible = true;
      else
        menu.append(
          new electron.MenuItem({
            label: l('action.updateAvailable'),
            submenu: electron.Menu.buildFromTemplate([
              {
                label: l('action.update'),
                click: () => {
                  browserWindows.quitAllWindows();
                  openURLExternally(
                    'https://github.com/Fchat-Horizon/Horizon/releases'
                  );
                }
              },
              {
                label: l('help.changelog'),
                click: showPatchNotes
              }
            ]),
            id: 'update'
          })
        );
      electron.Menu.setApplicationMenu(menu);
      browserWindows.toggleUpdateNotice(true);
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
      const re = new RegExp('%25([0-9a-f]{2})', 'ig');

      // encode the URL no matter what
      linkUrl = encodeURI(linkUrl);

      // eliminate double-encoding using expression above
      linkUrl = linkUrl.replace(re, '%$1');

      if (!settings.browserArgs.includes('%s')) {
        // append %s to params if it is not already there
        settings.browserArgs += ' %s';
      }

      // replace %s in arguments with URL and encapsulate in quotes to prevent issues with spaces and special characters in the path
      let link = settings.browserArgs.replace('%s', '\"' + linkUrl + '\"');

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

function showPatchNotes(): void {
  //tslint:disable-next-line: no-floating-promises
  openURLExternally(
    'https://github.com/Fchat-Horizon/Horizon/blob/main/CHANGELOG.md'
  );
}

function showCurrentPatchNotes(): void {
  //tslint:disable-next-line: no-floating-promises
  openURLExternally(
    'https://github.com/Fchat-Horizon/Horizon/blob/v' +
      settings.version +
      '/CHANGELOG.md'
  );
}

let zoomLevel = 0;

function createWindow() {
  browserWindows.createMainWindow(settings, shouldImportSettings, baseDir);
}

function onReady(): void {
  let hasCompletedUpgrades = false;

  const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'silly';

  log.transports.file.level = settings.risingSystemLogLevel || logLevel;
  log.transports.console.level = settings.risingSystemLogLevel || logLevel;
  log.transports.file.maxSize = 5 * 1024 * 1024;

  log.info('Starting application.');

  app.setAppUserModelId('net.flist.fchat');
  app.on('open-file', createWindow);

  if (
    settings.version !== app.getVersion() &&
    process.env.NODE_ENV !== 'development'
  ) {
    showCurrentPatchNotes();
    if (settings.host === 'wss://chat.f-list.net:9799')
      settings.host = defaultHost;
    settings.version = app.getVersion();
    setGeneralSettings(settings);
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
        },
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
        },
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
  const spellcheckerMenu = new electron.Menu();

  //tslint:disable-next-line:no-floating-promises
  addSpellcheckerItems(spellcheckerMenu);
  const themes = fs
    .readdirSync(path.join(__dirname, 'themes'))
    .filter(x => x.substr(-4) === '.css')
    .map(x => x.slice(0, -4));
  const setTheme = (theme: string) => {
    settings.theme = theme;
    setGeneralSettings(settings);
  };

  const setSystemLogLevel = (logLevell: log.LevelOption) => {
    settings.risingSystemLogLevel = logLevell;
    setGeneralSettings(settings);
  };

  electron.Menu.setApplicationMenu(
    electron.Menu.buildFromTemplate([
      {
        label: `&${l('title')}`,
        submenu: [
          {
            label: l('action.about'),
            click: (_m: electron.MenuItem, w: electron.BrowserWindow) => {
              browserWindows.createAboutWindow(w);
            }
          },
          { type: 'separator' },
          {
            label: l('action.newWindow'),
            click: () => {
              if (hasCompletedUpgrades)
                browserWindows.createMainWindow(
                  settings,
                  shouldImportSettings,
                  baseDir
                );
            },
            accelerator: 'CmdOrCtrl+n'
          },
          {
            label: l('action.newTab'),
            click: (_m: electron.MenuItem, w: electron.BrowserWindow) => {
              if (hasCompletedUpgrades) browserWindows.openTab(w);
            },
            accelerator: 'CmdOrCtrl+t'
          },
          {
            label: l('settings.logDir'),
            click: (_m, window: electron.BrowserWindow) => {
              const dir = electron.dialog.showOpenDialogSync({
                defaultPath: settings.logDirectory,
                properties: ['openDirectory']
              });
              if (dir !== undefined) {
                if (dir[0].startsWith(path.dirname(app.getPath('exe'))))
                  return electron.dialog.showErrorBox(
                    l('settings.logDir'),
                    l('settings.logDir.inAppDir')
                  );
                const button = electron.dialog.showMessageBoxSync(window, {
                  message: l(
                    'settings.logDir.confirm',
                    dir[0],
                    settings.logDirectory
                  ),
                  buttons: [l('confirmYes'), l('confirmNo')],
                  cancelId: 1
                });
                if (button === 0) {
                  browserWindows.quitAllWindows();
                  settings.logDirectory = dir[0];
                  setGeneralSettings(settings);
                  app.quit();
                }
              }
            }
          },
          {
            label: l('settings.closeToTray'),
            type: 'checkbox',
            checked: settings.closeToTray,
            click: (item: electron.MenuItem) => {
              settings.closeToTray = item.checked;
              setGeneralSettings(settings);
            }
          },
          {
            label: l('settings.profileViewer'),
            type: 'checkbox',
            checked: settings.profileViewer,
            click: (item: electron.MenuItem) => {
              settings.profileViewer = item.checked;
              setGeneralSettings(settings);
            }
          },
          { label: l('settings.spellcheck'), submenu: spellcheckerMenu },
          {
            label: l('settings.theme'),
            submenu: themes.map(x => ({
              checked: settings.theme === x,
              click: () => setTheme(x),
              label: x,
              type: <'radio'>'radio'
            }))
          },
          {
            label: l('settings.hwAcceleration'),
            type: 'checkbox',
            checked: settings.hwAcceleration,
            click: (item: electron.MenuItem) => {
              settings.hwAcceleration = item.checked;
              setGeneralSettings(settings);
            }
          },
          {
            label: l('settings.updateCheck'),
            type: 'checkbox',
            checked: settings.updateCheck,
            click: async (item: electron.MenuItem) => {
              settings.updateCheck = item.checked;
              setGeneralSettings(settings);
            }
          },
          {
            label: l('settings.beta'),
            type: 'checkbox',
            checked: settings.beta,
            click: async (item: electron.MenuItem) => {
              settings.beta = item.checked;
              setGeneralSettings(settings);
              checkForGitRelease(`v${app.getVersion()}`, releasesUrl);
            }
          },
          {
            label: l('fixLogs.action'),
            click: (_m, window: electron.BrowserWindow) =>
              window.webContents.send('fix-logs')
          },

          { type: 'separator' },
          {
            label: 'Horizon',
            submenu: [
              {
                label: 'System log level',
                submenu: [
                  'error',
                  'warn',
                  'info',
                  'verbose',
                  'debug',
                  'silly'
                ].map((level: string) => ({
                  checked: settings.risingSystemLogLevel === level,
                  label: `${level.substr(0, 1).toUpperCase()}${level.substr(1)}`,
                  click: () => setSystemLogLevel(level as log.LevelOption),
                  type: <'radio'>'radio'
                }))
              },
              {
                visible: process.platform === 'win32',
                label: 'Disable Windows high-contrast mode',
                type: 'checkbox',
                checked: settings.risingDisableWindowsHighContrast,
                click: (item: electron.MenuItem) => {
                  settings.risingDisableWindowsHighContrast = item.checked;
                  setGeneralSettings(settings);
                }
              },
              {
                label: l('settings.browserOption'),
                click: (_m, window: electron.BrowserWindow) => {
                  browserWindows.createBrowserSettings(
                    settings,
                    shouldImportSettings,
                    window
                  );
                }
              }
            ]
          },
          {
            label: 'Show/hide current profile',
            click: (_m: electron.MenuItem, w: electron.BrowserWindow) => {
              w.webContents.send('reopen-profile');
            },
            accelerator: 'CmdOrCtrl+p'
          },

          { type: 'separator' },
          { role: 'minimize' },
          {
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : undefined,
            label: l('action.quit'),
            click(_m: electron.MenuItem, window: electron.BrowserWindow): void {
              if (characters.length === 0) return app.quit();
              const button = electron.dialog.showMessageBoxSync(window, {
                message: l('chat.confirmLeave'),
                buttons: [l('confirmYes'), l('confirmNo')],
                cancelId: 1
              });
              if (button === 0) {
                browserWindows.quitAllWindows();
                app.quit();
              }
            }
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
      viewItem,
      {
        label: `&${l('help')}`,
        submenu: [
          {
            label: l('help.fchat'),
            click: () =>
              openURLExternally(
                'https://github.com/Fchat-Horizon/Horizon/blob/main/README.md'
              )
          },
          // {
          //     label: l('help.feedback'),
          //     click: () => openURLExternally('https://goo.gl/forms/WnLt3Qm3TPt64jQt2')
          // },
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
            label: l(
              process.env.NODE_ENV !== 'development'
                ? 'version'
                : 'developmentVersion',
              process.env.APP_VERSION || app.getVersion()
            ),
            click: showCurrentPatchNotes
          }
        ]
      }
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
      if (characters.indexOf(character) !== -1) return (e.returnValue = false);
      characters.push(character);
      e.returnValue = true;
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
    }
  );

  const adCoordinator = new AdCoordinatorHost();
  electron.ipcMain.on('request-send-ad', (event: IpcMainEvent, adId: string) =>
    adCoordinator.processAdRequest(event, adId)
  );

  const emptyBadge = electron.nativeImage.createEmpty();

  const badge = electron.nativeImage.createFromPath(
    //tslint:disable-next-line:no-require-imports no-unsafe-any
    path.join(__dirname, <string>require('./build/badge.png').default)
  );

  electron.ipcMain.on('has-new', (e: IpcMainEvent, hasNew: boolean) => {
    if (process.platform === 'darwin' && app.dock !== undefined)
      app.dock.setBadge(hasNew ? '!' : '');
    const window = electron.BrowserWindow.fromWebContents(e.sender);
    if (window !== undefined && window !== null) {
      window.setOverlayIcon(
        hasNew ? badge : emptyBadge,
        hasNew ? 'New messages' : ''
      );
    }
  });

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
      log.debug('Browser Path settings update:', _path, _args);
      // store the new path and args in our general settings
      settings.browserPath = _path;
      settings.browserArgs = _args;
      setGeneralSettings(settings);
    }
  );

  electron.ipcMain.on('open-url-externally', (_e, _url: string) => {
    openURLExternally(_url);
  });

  browserWindows.createMainWindow(settings, shouldImportSettings, baseDir);
}

// Twitter fix
app.commandLine.appendSwitch('disable-features', 'CrossOriginOpenerPolicy');

const isSquirrelStart = require('electron-squirrel-startup'); //tslint:disable-line:no-require-imports
if (
  isSquirrelStart ||
  (process.env.NODE_ENV === 'production' && !app.requestSingleInstanceLock())
)
  app.quit();
else app.on('ready', onReady);
app.on('second-instance', createWindow);
app.on('window-all-closed', () => app.quit());

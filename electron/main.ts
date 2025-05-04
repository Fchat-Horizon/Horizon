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

import { createAboutWindow } from './about';

import * as electron from 'electron';
import * as remoteMain from '@electron/remote/main';

import log from 'electron-log'; //tslint:disable-line:match-default-export-name
import * as fs from 'fs';
import * as path from 'path';
// import * as url from 'url';
import l from '../chat/localize';
import { defaultHost, GeneralSettings } from './common';
import {
  getSafeLanguages,
  knownLanguageNames,
  updateSupportedLanguages
} from './language';
import * as windowState from './window_state';
// import BrowserWindow = electron.BrowserWindow;
import MenuItem = electron.MenuItem;
import MenuItemConstructorOptions = electron.MenuItemConstructorOptions;
import * as _ from 'lodash';
import DownloadItem = electron.DownloadItem;
import { AdCoordinatorHost } from '../chat/ads/ad-coordinator-host';
import { IpcMainEvent } from 'electron';
import { BlockerIntegration } from './blocker/blocker';

//tslint:disable-next-line:no-require-imports
const pck = require('./package.json');

// Module to control application life.
const app = electron.app;

// tslint:disable-next-line:no-require-imports
const pngIcon = path.join(
  __dirname,
  <string>require('./build/icon.png').default
);

// tslint:disable-next-line:no-require-imports
const winIcon = path.join(
  __dirname,
  <string>require('./build/icon.ico').default
);

remoteMain.initialize();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const windows: electron.BrowserWindow[] = [];
const characters: string[] = [];
let tabCount = 0;

const baseDir = app.getPath('userData');
fs.mkdirSync(baseDir, { recursive: true });
let shouldImportSettings = false;

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

  for (const w of windows) {
    // console.log('LANG SEND');
    w.webContents.session.setSpellCheckerLanguages(langs);
    w.webContents.send('update-dictionaries', langs);
  }
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

function openURLExternally(linkUrl: string): void {
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

function setUpWebContents(webContents: electron.WebContents): void {
  remoteMain.enable(webContents);

  const openLinkExternally = (e: Event, linkUrl: string) => {
    e.preventDefault();
    const profileMatch = linkUrl.match(
      /^https?:\/\/(www\.)?f-list.net\/c\/([^/#]+)\/?#?/
    );
    if (profileMatch !== null && settings.profileViewer) {
      webContents.send('open-profile', decodeURIComponent(profileMatch[2]));
      return;
    }

    // otherwise, try to open externally
    openURLExternally(linkUrl);
  };

  webContents.setVisualZoomLevelLimits(1, 5);

  (webContents as any).on('will-navigate', openLinkExternally);

  webContents.setWindowOpenHandler(({ url }) => {
    openLinkExternally(new Event('link'), url);
    return { action: 'deny' };
  });
}

function createWindow(): electron.BrowserWindow | undefined {
  if (tabCount >= 3) return;
  const lastState = windowState.getSavedWindowState();

  const windowProperties: electron.BrowserWindowConstructorOptions & {
    maximized: boolean;
  } = {
    ...lastState,
    center: lastState.x === undefined,
    show: false,
    icon: process.platform === 'win32' ? winIcon : pngIcon,
    webPreferences: {
      webviewTag: true,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      spellcheck: true,
      enableRemoteModule: true,
      contextIsolation: false,
      partition: 'persist:fchat'
    } as any
  };

  if (process.platform === 'darwin') {
    windowProperties.titleBarStyle = 'hiddenInset';
    // windowProperties.frame = true;
  } else {
    windowProperties.frame = false;
  }

  const window = new electron.BrowserWindow(windowProperties);

  remoteMain.enable(window.webContents);

  windows.push(window);

  // window.setIcon(process.platform === 'win32' ? winIcon : pngIcon);

  window.webContents.on('will-attach-webview', () => {
    const all = electron.webContents.getAllWebContents();
    all.forEach(item => {
      remoteMain.enable(item);
    });
  });

  updateSupportedLanguages(
    electron.session.defaultSession.availableSpellCheckerLanguages
  );

  const safeLanguages = getSafeLanguages(settings.spellcheckLang);

  // console.log('CREATEWINDOW', safeLanguages);
  electron.session.defaultSession.setSpellCheckerLanguages(safeLanguages);
  window.webContents.session.setSpellCheckerLanguages(safeLanguages);

  // Set up ad blocker
  BlockerIntegration.factory(baseDir);

  // This prevents automatic download prompts on certain webview URLs without
  // stopping conversation logs from being downloaded
  electron.session.defaultSession.on(
    'will-download',
    (
      e: { preventDefault: () => void; readonly defaultPrevented: boolean },
      item: DownloadItem
    ) => {
      if (!item.getURL().match(/^blob:file:/)) {
        log.info('download.prevent', { item, event: e });
        e.preventDefault();
      }
    }
  );

  // tslint:disable-next-line:no-floating-promises
  window.loadFile(path.join(__dirname, 'window.html'), {
    query: {
      settings: JSON.stringify(settings),
      import: shouldImportSettings ? 'true' : ''
    }
  });

  // window.loadURL(url.format({ //tslint:disable-line:no-floating-promises
  //     pathname: path.join(__dirname, 'window.html'),
  //     protocol: 'file:',
  //     slashes: true,
  //     query: {settings: JSON.stringify(settings), import: shouldImportSettings ? 'true' : []}
  // }));

  setUpWebContents(window.webContents);

  // Save window state when it is being closed.
  window.on('close', () => windowState.setSavedWindowState(window));
  window.on('closed', () => windows.splice(windows.indexOf(window), 1));
  window.once('ready-to-show', () => {
    window.show();
    if (lastState.maximized) window.maximize();
  });

  return window;
}

function showPatchNotes(): void {
  //tslint:disable-next-line: no-floating-promises
  openURLExternally(
    'https://github.com/Fchat-Horizon/Horizon/blob/main/CHANGELOG.md'
  );
}

function openBrowserSettings(): electron.BrowserWindow | undefined {
  let desiredHeight = 520;
  if (process.platform === 'darwin') {
    desiredHeight = 750;
  }

  const windowProperties: electron.BrowserWindowConstructorOptions = {
    center: true,
    show: false,
    icon: process.platform === 'win32' ? winIcon : pngIcon,
    frame: false,
    width: 650,
    height: desiredHeight,
    minWidth: 650,
    minHeight: desiredHeight,
    maxWidth: 650,
    maxHeight: desiredHeight,
    maximizable: false,
    webPreferences: {
      webviewTag: true,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      spellcheck: true,
      enableRemoteModule: true,
      contextIsolation: false,
      partition: 'persist:fchat'
    } as any
  };

  const browserWindow = new electron.BrowserWindow(windowProperties);
  remoteMain.enable(browserWindow.webContents);
  browserWindow.loadFile(path.join(__dirname, 'browser_option.html'), {
    query: {
      settings: JSON.stringify(settings),
      import: shouldImportSettings ? 'true' : ''
    }
  });

  browserWindow.once('ready-to-show', () => {
    browserWindow.show();
  });

  return browserWindow;
}

let zoomLevel = 0;

function onReady(): void {
  let hasCompletedUpgrades = false;

  const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'silly';

  log.transports.file.level = settings.risingSystemLogLevel || logLevel;
  log.transports.console.level = settings.risingSystemLogLevel || logLevel;
  log.transports.file.maxSize = 5 * 1024 * 1024;

  log.info('Starting application.');

  app.setAppUserModelId('net.flist.fchat');
  app.on('open-file', createWindow);

  if (settings.version !== app.getVersion()) {
    showPatchNotes();
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

  //tslint:disable-next-line: no-unsafe-any
  const updaterUrl = `https://update.electronjs.org/Fchat-Horizon/Horizon/${process.platform}-${process.arch}/${pck.version}`;
  if (process.env.NODE_ENV === 'production' && process.platform !== 'darwin') {
    electron.autoUpdater.setFeedURL({
      url: updaterUrl + (settings.beta ? '?channel=beta' : ''),
      serverType: 'json'
    });
    setTimeout(() => electron.autoUpdater.checkForUpdates(), 10000);
    const updateTimer = setInterval(
      () => electron.autoUpdater.checkForUpdates(),
      3600000
    );
    electron.autoUpdater.on('update-downloaded', () => {
      clearInterval(updateTimer);
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
                  for (const w of windows) w.webContents.send('quit');
                  electron.autoUpdater.quitAndInstall();
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
      for (const w of windows) w.webContents.send('update-available', true);
    });
    electron.autoUpdater.on('update-not-available', () => {
      for (const w of windows) w.webContents.send('update-available', false);
      const item = electron.Menu.getApplicationMenu()!.getMenuItemById(
        'update'
      ) as MenuItem | null;
      if (item !== null) item.visible = false;
    });
    electron.autoUpdater.on('error', e => log.error(e));
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
          for (const win of windows) win.webContents.send('update-zoom', 0);
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
          for (const win of windows)
            win.webContents.send('update-zoom', zoomLevel);
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
          for (const win of windows)
            win.webContents.send('update-zoom', zoomLevel);
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
            click: createAboutWindow
          },
          { type: 'separator' },
          {
            label: l('action.newWindow'),
            click: () => {
              if (hasCompletedUpgrades) createWindow();
            },
            accelerator: 'CmdOrCtrl+n'
          },
          {
            label: l('action.newTab'),
            click: (_m: electron.MenuItem, w: electron.BrowserWindow) => {
              if (hasCompletedUpgrades && tabCount < 3)
                w.webContents.send('open-tab');
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
                  for (const w of windows) w.webContents.send('quit');
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

          // {
          //     label: l('settings.beta'), type: 'checkbox', checked: settings.beta,
          //     click: async(item: electron.MenuItem) => {
          //         settings.beta = item.checked;
          //         setGeneralSettings(settings);
          //         // electron.autoUpdater.setFeedURL({url: updaterUrl+(item.checked ? '?channel=beta' : ''), serverType: 'json'});
          //         // return electron.autoUpdater.checkForUpdates();
          //     }
          // },
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
                click: () => {
                  openBrowserSettings();
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
                for (const w of windows) w.webContents.send('quit');
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
          { label: l('version', app.getVersion()), click: showPatchNotes }
        ]
      }
    ])
  );

  electron.ipcMain.on('tab-added', (_event: IpcMainEvent, id: number) => {
    const webContents = electron.webContents.fromId(id);

    if (webContents) {
      setUpWebContents(webContents);
      ++tabCount;
      if (tabCount === 5) {
        for (const w of windows) {
          w.webContents.send('allow-new-tabs', false);
        }
      }
    }
  });
  electron.ipcMain.on('tab-closed', () => {
    --tabCount;
    for (const w of windows) w.webContents.send('allow-new-tabs', true);
  });
  electron.ipcMain.on(
    'save-login',
    (_event: IpcMainEvent, account: string, host: string) => {
      settings.account = account;
      settings.host = host;
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
      for (const w of windows)
        w.webContents.session.addWordToSpellCheckerDictionary(word);
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

  createWindow();
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

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
import { MenuItem } from 'electron/main';
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
//We need this, since displaying the changelog is done through a child window instead of an external link
let showChangelogOnBoot = false;

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

let zoomLevel = settings.zoomLevel;

function onReady(): void {
  let hasCompletedUpgrades = false;

  const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'silly';

  log.transports.file.level = settings.risingSystemLogLevel || logLevel;
  log.transports.console.level = settings.risingSystemLogLevel || logLevel;
  log.transports.file.maxSize = 5 * 1024 * 1024;

  log.info('Starting application.');

  app.setAppUserModelId('net.flist.fchat');
  app.on('open-file', () => {
    browserWindows.createMainWindow(settings, shouldImportSettings, baseDir);
  });
  //Block automatic downloads in the image previewer.
  //It's in its own partitioned session, so we can't use session.defaultSession here
  const ses = session.fromPartition('persist:adblocked');
  ses.on('will-download', (event, item, webContents) => {
    event.preventDefault();
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
        click: (_m: MenuItem, window: electron.BrowserWindow | undefined) => {
          if (window) {
            window.webContents.send('switch-tab');
          }
        }
      },
      {
        label: l('navigation.previousTab'),
        accelerator: 'Ctrl+Shift+Tab',
        click: (_m: MenuItem, window: electron.BrowserWindow | undefined) => {
          if (window) {
            window.webContents.send('previous-tab');
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
              browserWindows.createAboutWindow(w);
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
              browserWindows.createChangelogWindow(settings, false, win);
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
            id: 'newTab'
          },
          {
            label: l('action.preferences'),
            click: (_m, window: electron.BrowserWindow) => {
              browserWindows.createSettingsWindow(
                settings,
                shouldImportSettings,
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

          { type: 'separator' },
          {
            label: 'Show/hide current profile',
            click: (_m: electron.MenuItem, w: electron.BrowserWindow) => {
              w.webContents.send('reopen-profile');
            },
            accelerator: 'CmdOrCtrl+p',
            id: 'showProfile'
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
                title: l('title'),
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
      app.quit();
    }
  );
  electron.ipcMain.on(
    'open-update-changelog',
    (_event: IpcMainEvent, updateVersion: string) => {
      browserWindows.createChangelogWindow(
        settings,
        true,
        electron.BrowserWindow.getFocusedWindow()!,
        updateVersion
      );
    }
  );
  electron.ipcMain.on('open-settings-menu', (_event: IpcMainEvent) => {
    browserWindows.createSettingsWindow(
      settings,
      true,
      electron.BrowserWindow.getFocusedWindow()!
    );
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
    shouldImportSettings,
    baseDir
  );
  if (showChangelogOnBoot && window) {
    browserWindows.createChangelogWindow(
      settings,
      shouldImportSettings,
      window
    );
    showChangelogOnBoot = false;
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
  browserWindows.createMainWindow(settings, shouldImportSettings, baseDir);
});
app.on('window-all-closed', () => app.quit());

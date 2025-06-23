import * as electron from 'electron';
import * as windowState from './window_state';
import * as remoteMain from '@electron/remote/main';
import log from 'electron-log'; //tslint:disable-line:match-default-export-name
import path from 'path';
import { GeneralSettings } from './common';
import { openURLExternally } from './main';
import { DownloadItem, IpcMainEvent } from 'electron';
import { getSafeLanguages, updateSupportedLanguages } from './language';
import { BlockerIntegration } from './blocker/blocker';
import l from '../chat/localize';
//In non-production modes we might want to connect to development servers too.
//This won't change the amount of allowed connections to the live server.
const maxTabCount = process.env.NODE_ENV === 'production' ? 3 : 5;

const tabMap: { [key: string]: electron.WebContents } = {};
const trayIcon = path.join(
  __dirname,
  <string>(
    require(
      process.platform !== 'darwin'
        ? './build/tray.png'
        : './build/trayTemplate.png'
    ).default
  )
);

let tray: electron.Tray;
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

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const windows: electron.BrowserWindow[] = [];
let tabCount = 0;

electron.ipcMain.on(
  'connect',
  (e: IpcMainEvent & { sender: electron.WebContents }, character: string) => {
    if (e.sender) {
      //browserWindows.tabAddHandler(webContents, settings);
      tabMap[character] = e.sender;
      tray.setContextMenu(electron.Menu.buildFromTemplate(createTrayMenu()));
    }
  }
);
electron.ipcMain.on('disconnect', (_event: IpcMainEvent, character: string) => {
  delete tabMap[character];
  tray.setContextMenu(electron.Menu.buildFromTemplate(createTrayMenu()));
});
export function openTab(w: electron.BrowserWindow) {
  if (tabCount <= maxTabCount) w.webContents.send('open-tab');
}

export function createMainWindow(
  settings: GeneralSettings,
  shouldImportSettings: boolean,
  baseDir: string
): electron.BrowserWindow | undefined {
  if (tabCount >= maxTabCount) return;
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

  setUpWebContents(window.webContents, settings);

  // Save window state when it is being closed.
  window.on('close', () => windowState.setSavedWindowState(window));
  window.on('closed', () => windows.splice(windows.indexOf(window), 1));
  window.once('ready-to-show', () => {
    window.show();
    if (lastState.maximized) window.maximize();
  });
  tray = new electron.Tray(trayIcon);
  tray.setToolTip(l('title'));
  tray.on('click', _e => tray.popUpContextMenu());

  tray.setContextMenu(electron.Menu.buildFromTemplate(createTrayMenu()));
  log.debug('init.window.add.tray');

  return window;
}
export function setUpWebContents(
  webContents: electron.WebContents,
  settings: GeneralSettings
): void {
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

function createTrayMenu(): electron.MenuItemConstructorOptions[] {
  const tabItems: electron.MenuItemConstructorOptions[] = Object.entries(
    tabMap
  ).map(([tabId, webContents]) => ({
    label: tabId,
    click: () => {
      // Example: focus this tab, or any action you want
      windows.forEach(winow => {
        winow.webContents.focus();
        winow.show();
        winow.webContents.send('show-tab', webContents.id);
      });
      webContents.focus();
    }
  }));
  return [
    { label: l('title'), enabled: false },
    ...tabItems,
    { label: l('action.quit'), click: () => electron.app.quit() }
  ];
}

export function setSpellCheckerLanguages(langs: string[]): void {
  for (const w of windows) {
    // console.log('LANG SEND');
    w.webContents.session.setSpellCheckerLanguages(langs);
    w.webContents.send('update-dictionaries', langs);
  }
}

export function addWordToSpellCheckerDictionary(word: string) {
  for (const w of windows)
    w.webContents.session.addWordToSpellCheckerDictionary(word);
}

export function updateZoomLevel(zoomLevel: number) {
  for (const win of windows) win.webContents.send('update-zoom', zoomLevel);
}

export function quitAllWindows() {
  for (const w of windows) w.webContents.send('quit');
}

export function toggleUpdateNotice(updateAvailable: boolean) {
  for (const w of windows)
    w.webContents.send('update-available', updateAvailable);
}

export function createBrowserSettings(
  settings: GeneralSettings,
  shouldImportSettings: boolean,
  parentWindow: electron.BrowserWindow
): electron.BrowserWindow | undefined {
  let desiredHeight = 570;
  let desiredWidth = 805;

  const windowProperties: electron.BrowserWindowConstructorOptions = {
    center: true,
    show: false,
    icon: process.platform === 'win32' ? winIcon : pngIcon,
    frame: false,
    width: desiredWidth,
    minWidth: desiredWidth,
    height: desiredHeight,
    minHeight: desiredHeight,
    resizable: true,
    modal: true,
    parent: parentWindow,
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

  if (process.platform === 'darwin') {
    windowProperties.titleBarStyle = 'hiddenInset';
  }
  const browserWindow = new electron.BrowserWindow(windowProperties);
  remoteMain.enable(browserWindow.webContents);
  browserWindow.loadFile(path.join(__dirname, 'settings.html'), {
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

export function createAboutWindow(
  parentWindow: electron.BrowserWindow
): electron.BrowserWindow {
  const about = new electron.BrowserWindow({
    width: 400,
    height: 400,
    center: true,
    resizable: false,
    minimizable: false,
    useContentSize: process.platform === 'win32',
    alwaysOnTop: true,
    modal: false,
    parent: parentWindow,
    autoHideMenuBar: true,
    icon: process.platform === 'win32' ? winIcon : pngIcon,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  remoteMain.enable(about.webContents);

  // Make links open in external browser
  about.webContents.setWindowOpenHandler(({ url }) => {
    electron.shell.openExternal(url);
    return { action: 'deny' };
  });

  // Get package.json version and pass it to the renderer
  const packageInfo = require('../package.json');

  // Set environment variable for package version that the renderer can access
  process.env.npm_package_version = packageInfo.version;

  // Load the about HTML file
  about.loadFile(path.join(__dirname, 'about.html'));

  about.webContents.on('dom-ready', () => {
    // The following ensures proper path encoding for Windows paths too
    const iconPath = process.platform === 'win32' ? winIcon : pngIcon;
    const encodedPath = 'file://' + iconPath.replace(/\\/g, '/');

    about.webContents.executeJavaScript(`
      document.querySelector('.app-logo').src = "${encodedPath}";
      console.log("Updated icon path to: ${encodedPath}");
    `);
  });

  return about;
}

export function tabAddHandler(
  webContents: electron.WebContents,
  settings: GeneralSettings
) {
  setUpWebContents(webContents, settings);
  ++tabCount;
  if (tabCount === maxTabCount) {
    for (const w of windows) {
      w.webContents.send('allow-new-tabs', false);
    }
  }
}

export function tabClosedHandler() {
  --tabCount;
  for (const w of windows) w.webContents.send('allow-new-tabs', true);
}

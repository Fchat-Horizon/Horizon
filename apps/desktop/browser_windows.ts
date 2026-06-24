import * as electron from 'electron';
import * as windowState from './window_state';
import { createLogger } from '@horizon/shared/logger';
const log = createLogger('browser-windows');
import path from 'path';
import { loadRendererPage } from './load-renderer';
import type { GeneralSettings } from '@horizon/shared/common';
import { openURLExternally } from './main';
import type { DownloadItem, IpcMainEvent } from 'electron';
import { app } from 'electron';
import { getSafeLanguages, updateSupportedLanguages } from './language';
import { BlockerIntegration } from './blocker/blocker';
import l from './localize-host';

// Higher in dev to allow more concurrent test-server sessions; does not affect
// the number of live-server connections.
const maxTabCount = import.meta.env.PROD ? 3 : 5;

export function shouldOpenDevtools(): boolean {
  return (
    process.argv.includes('--devtools') ||
    process.env.ELECTRON_RENDERER_URL != null
  );
}

type ImporterHint = 'auto' | 'vanilla' | 'advanced' | 'slimcat' | 'none';

const tabMap: { [key: string]: electron.WebContents } = {};

const newMessagesMap: { [id: number]: number } = {};

const windowCssKeyMap: { [id: number]: string } = {};

const trayIcon: string = path.join(
  __dirname,
  'build',
  process.platform !== 'darwin' ? 'tray.png' : 'trayTemplate.png'
);

const trayIconNotif: string = path.join(__dirname, 'build', 'tray-notif.png');

let tray: electron.Tray;

const pngIcon: string = path.join(__dirname, 'build', 'icon.png');

const winIcon: string = path.join(__dirname, 'build', 'icon.ico');

const badge: electron.NativeImage = electron.nativeImage.createFromPath(
  path.join(__dirname, 'build', 'badge.png')
);

// Index = new-message count; 0 is empty, 10 stands for "9+".
const badges: electron.NativeImage[] = [
  electron.nativeImage.createEmpty(),
  ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '9plus'].map(n =>
    electron.nativeImage.createFromPath(
      path.join(__dirname, 'build', 'badges', `${n}.png`)
    )
  )
];

electron.ipcMain.on(
  'has-new',
  (e: IpcMainEvent, hasNew: number, numberedBadges: boolean) => {
    log.debug('app.hasNew', { hasNew, numberedBadges });
    const window = electron.BrowserWindow.fromWebContents(e.sender);
    if (window !== undefined && window !== null) {
      newMessagesMap[window.id] = hasNew;
    }
    updateNotificationBadges(numberedBadges);
  }
);

export function updateNotificationBadges(numberedBadges: boolean) {
  const totalCount = windows.reduce(
    (sum, item) => sum + newMessagesMap[item.id],
    0
  );
  if (process.platform !== 'win32') {
    if (numberedBadges) {
      app.setBadgeCount(totalCount);
    } else {
      if (app.dock) {
        app.dock.setBadge(totalCount > 0 ? '.' : '');
      }
    }
  } else {
    windows.forEach(browserWindow => {
      applyWin32OverlayIcon(browserWindow, totalCount, numberedBadges);
    });
    tray.setImage(totalCount > 0 ? trayIconNotif : trayIcon);
  }
}

function applyWin32OverlayIcon(
  browserWindow: electron.BrowserWindow,
  badgeCount: number,
  numberedBadges: boolean
) {
  browserWindow.setOverlayIcon(
    numberedBadges
      ? badges[Math.max(Math.min(badgeCount, 10), 0)]
      : badgeCount > 0
        ? badge
        : null,
    badgeCount > 0 ? ` ${badgeCount} new messages` : ''
  );
}

// Global reference so the windows are not garbage collected.
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
  if (canAddTab()) w.webContents.send('open-tab');
}

/** Whether another tab may be opened without exceeding {@link maxTabCount}. */
export function canAddTab(): boolean {
  return tabCount < maxTabCount;
}

/**
 * Shows any hidden windows, then creates a new main window. Returns undefined
 * once {@link maxTabCount} is reached, so no window is created.
 */
export function createMainWindow(
  settings: GeneralSettings,
  ImporterHint: ImporterHint,
  baseDir: string
): electron.BrowserWindow | undefined {
  log.info('browser_windows.createMainWindow', { ImporterHint });
  if (windows.every(item => !item.isVisible())) {
    windows.forEach(item => {
      item.show();
    });
  }
  if (tabCount >= maxTabCount) {
    return;
  }
  const lastState = windowState.getSavedWindowState();

  let windowBackgroundColor: string;

  switch (process.platform) {
    //Windows and MacOS have a different property name for their background colors.
    case 'win32':
      windowBackgroundColor = electron.systemPreferences.getColor('window');
      break;
    case 'darwin':
      windowBackgroundColor =
        electron.systemPreferences.getColor('window-background');
      break;

    //This is specifically for Linux, but doing it as the default path makes
    //the typescript compiler stop whining that the variable might not be assigned
    default:
      windowBackgroundColor = electron.nativeTheme.shouldUseDarkColors
        ? '#000'
        : '#e5e5e5';
      break;
  }

  const windowProperties: electron.BrowserWindowConstructorOptions & {
    maximized: boolean;
  } = {
    ...lastState,
    center: lastState.x === undefined,
    show: false,
    icon: process.platform === 'win32' ? winIcon : pngIcon,
    backgroundColor: !settings.allowWindowTransparency
      ? windowBackgroundColor
      : undefined,
    transparent: settings.allowWindowTransparency,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: true,
      partition: 'persist:fchat'
    }
  };

  if (process.platform === 'darwin') {
    windowProperties.titleBarStyle = 'hiddenInset';
  } else {
    windowProperties.frame = settings.forceNativeWindowControls;
  }

  const window = new electron.BrowserWindow(windowProperties);

  newMessagesMap[window.id] = 0;

  windows.push(window);

  // window.setIcon(process.platform === 'win32' ? winIcon : pngIcon);

  if (shouldOpenDevtools()) window.webContents.openDevTools({ mode: 'detach' });

  window.on('show', () => {
    applyWin32OverlayIcon(
      window,
      newMessagesMap[window.id],
      settings.horizonShowNotificationBadge
    );
  });

  window.on('closed', () => {
    delete newMessagesMap[window.id];
  });

  window.webContents.on('did-finish-load', async () => {
    if (settings.horizonCustomCssEnabled) {
      const key = await window.webContents.insertCSS(
        `html {${settings.horizonCustomCss}}`,
        {
          cssOrigin: 'author'
        }
      );
      windowCssKeyMap[window.id] = key;
    }
  });

  updateSupportedLanguages(
    electron.session.defaultSession.availableSpellCheckerLanguages
  );

  const safeLanguages = getSafeLanguages(settings.spellcheckLang);
  electron.session.defaultSession.setSpellCheckerLanguages(safeLanguages);
  window.webContents.session.setSpellCheckerLanguages(safeLanguages);

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
  const query = {
    settings: JSON.stringify(settings),
    import: ImporterHint === 'none' ? '' : ImporterHint
  };
  log.info('browser_windows.loadFile', { import: query.import });
  void loadRendererPage(window, 'window.html', query);

  setUpWebContents(window.webContents, settings);

  window.on('close', () => windowState.setSavedWindowState(window));
  window.on('closed', () => windows.splice(windows.indexOf(window), 1));
  window.once('ready-to-show', () => {
    window.show();
    if (lastState.maximized) {
      window.maximize();
    }
  });

  //On MacOS, the app menu is not bound to any windows, so some options need to be manually toggled. An app can be "active" without any focused windows.
  if (process.platform === 'darwin') {
    window.on('show', () => {
      toggleWindowSpecificMenuItems(true);
    });
    window.on('hide', () => {
      if (!electron.BrowserWindow.getFocusedWindow()) {
        toggleWindowSpecificMenuItems(false);
      }
    });
  }
  if (!tray) {
    tray = new electron.Tray(trayIcon);
    tray.setToolTip(l('title'));
    tray.on('click', _e => showAllWindows());

    tray.setContextMenu(electron.Menu.buildFromTemplate(createTrayMenu()));
    log.debug('init.window.add.tray');
  }

  return window;
}

// Window-specific menu items must be toggled by hand on macOS, where the app
// menu stays present even with no window focused.
function toggleWindowSpecificMenuItems(active: boolean) {
  const appMenu = app.applicationMenu;
  const toggleableIds = [
    'fixLogs',
    'showProfile',
    'newTab',
    'zoomOut',
    'zoomIn'
  ];

  if (appMenu) {
    toggleableIds.forEach(itemId => {
      const item = appMenu!.getMenuItemById(itemId);
      if (item) item.enabled = active;
    });
  }
}

/*
 * True when the URL points at the Vite dev server that serves the renderer in
 * `dev` (ELECTRON_RENDERER_URL). Used to distinguish internal page navigation
 * from genuine external links. Always false in a packaged build (file:// pages).
 */
function isDevServerUrl(linkUrl: string): boolean {
  const devServer = process.env.ELECTRON_RENDERER_URL;
  if (!devServer) return false;
  try {
    return new URL(linkUrl).origin === new URL(devServer).origin;
  } catch {
    return false;
  }
}

export function setUpWebContents(
  webContents: electron.WebContents,
  settings: GeneralSettings
): void {
  const openLinkExternally = (e: Event, linkUrl: string) => {
    // In dev the renderer is served from the Vite dev server, so its own pages
    // are http://localhost URLs. HMR full-reloads (and any in-app page nav)
    // arrive here as will-navigate; let same-origin links reload in place
    // instead of preventDefault-ing them out to the system browser.
    if (isDevServerUrl(linkUrl)) return;

    e.preventDefault();
    const profileMatch = linkUrl.match(
      /^https?:\/\/(www\.)?f-list.net\/c\/([^/#]+)\/?#?/
    );
    if (profileMatch !== null && settings.profileViewer) {
      const characterName = decodeURIComponent(
        profileMatch[2].replace(/\+/g, '%20')
      );
      webContents.send('open-profile', characterName);
      return;
    }

    openURLExternally(linkUrl);
  };

  webContents.setVisualZoomLevelLimits(1, 5);

  (webContents as any).on('will-navigate', openLinkExternally);

  webContents.setWindowOpenHandler(({ url }) => {
    openLinkExternally(new Event('link'), url);
    return { action: 'deny' };
  });
}

export async function updateCustomCssAllWindows(
  styleSheet: string,
  useCustomCss: boolean
) {
  electron.BrowserWindow.getAllWindows().forEach(async window => {
    if (windowCssKeyMap[window.id]) {
      await window.webContents.removeInsertedCSS(windowCssKeyMap[window.id]);
      delete windowCssKeyMap[window.id];
    }
    if (useCustomCss) {
      const key = await window.webContents.insertCSS(
        ` html { ${styleSheet} }`,
        {
          cssOrigin: 'author'
        }
      );
      windowCssKeyMap[window.id] = key;
    }

    window.webContents.send('user-css-updated', styleSheet, useCustomCss);
  });
}

function createTrayMenu(): electron.MenuItemConstructorOptions[] {
  const tabItems: electron.MenuItemConstructorOptions[] = Object.entries(
    tabMap
  ).map(([tabId, webContents]) => ({
    label: tabId,
    click: () => {
      windows.forEach(winow => {
        winow.webContents.focus();
        winow.show();
        winow.webContents.send('show-tab', webContents.id);
      });
      webContents.focus();
    }
  }));
  return [
    { label: l('title'), click: () => showAllWindows() },
    { type: 'separator' },
    ...tabItems,
    {
      label: l('action.quit'),
      click: () => {
        quitAllWindows();
      }
    }
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

export async function quitAllWindows() {
  for (const w of windows) {
    w.webContents.send('quit');
    w.close();
  }
}

export function showAllWindows() {
  for (const w of windows) {
    if (w.isMinimized()) w.restore();
    if (!w.isVisible()) w.show();
    w.focus();
  }
}
export function toggleUpdateNotice(updateAvailable: boolean, version?: string) {
  for (const w of windows)
    w.webContents.send('update-available', updateAvailable, version);
}

export function sendUpdateProgress(percent: number, done: boolean = false) {
  for (const w of windows)
    w.webContents.send('update-download-progress', percent, done);
}

export function createSettingsWindow(
  settings: GeneralSettings,
  ImporterHint: ImporterHint,
  parentWindow: electron.BrowserWindow
): electron.BrowserWindow | undefined {
  const desiredHeight = 570;
  const desiredWidth = 885;

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
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: true,
      partition: 'persist:fchat'
    }
  };

  if (process.platform === 'darwin') {
    windowProperties.titleBarStyle = 'hiddenInset';
  } else if (settings.forceNativeWindowControls) {
    windowProperties.frame = true;
    windowProperties.minimizable = false;
    windowProperties.maximizable = false;
    windowProperties.autoHideMenuBar = true;
  }
  const browserWindow = new electron.BrowserWindow(windowProperties);
  void loadRendererPage(browserWindow, 'settings.html', {
    settings: JSON.stringify(settings),
    import: ImporterHint === 'none' ? '' : ImporterHint
  });

  browserWindow.once('ready-to-show', () => {
    browserWindow.show();
  });

  return browserWindow;
}

// With updateVer set, this is a new-update changelog; otherwise it shows the
// changelog for the current version.
export function createChangelogWindow(
  settings: GeneralSettings,
  ImporterHint: ImporterHint,
  parentWindow: electron.BrowserWindow,
  updateVer?: string,
  updateMode?: 'auto' | 'manual'
): electron.BrowserWindow | undefined {
  const desiredHeight = updateVer ? 850 : 700;
  const desiredWidth = updateVer ? 900 : 600;

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
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: true,
      partition: 'persist:fchat'
    }
  };

  if (process.platform === 'darwin') {
    windowProperties.titleBarStyle = 'hiddenInset';
  } else if (settings.forceNativeWindowControls) {
    windowProperties.frame = true;
    windowProperties.minimizable = false;
    windowProperties.maximizable = false;
    windowProperties.autoHideMenuBar = true;
  }
  const appVersion =
    import.meta.env.VITE_APP_VERSION || electron.app.getVersion() || 'unknown';
  const browserWindow = new electron.BrowserWindow(windowProperties);
  void loadRendererPage(browserWindow, 'changelog.html', {
    settings: JSON.stringify(settings),
    import: ImporterHint === 'none' ? '' : ImporterHint,
    updateVer: updateVer || '',
    updateMode: updateMode || '',
    version: appVersion
  });

  browserWindow.once('ready-to-show', () => {
    browserWindow.show();
  });

  return browserWindow;
}

export function createExporterWindow(
  settings: GeneralSettings,
  importHint: ImporterHint,
  parentWindow: electron.BrowserWindow
): electron.BrowserWindow | undefined {
  const desiredHeight = 720;
  const desiredWidth = 885;

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
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: true,
      partition: 'persist:fchat'
    }
  };

  if (process.platform === 'darwin') {
    windowProperties.titleBarStyle = 'hiddenInset';
  } else if (settings.forceNativeWindowControls) {
    windowProperties.frame = true;
    windowProperties.minimizable = false;
    windowProperties.maximizable = false;
    windowProperties.autoHideMenuBar = true;
  }

  const browserWindow = new electron.BrowserWindow(windowProperties);
  void loadRendererPage(browserWindow, 'exporter.html', {
    settings: JSON.stringify(settings),
    import: importHint === 'none' ? '' : importHint
  });

  browserWindow.once('ready-to-show', () => {
    browserWindow.show();
  });

  return browserWindow;
}

export function createAboutWindow(
  settings: GeneralSettings,
  parentWindow: electron.BrowserWindow
): electron.BrowserWindow {
  const icon = process.platform === 'win32' ? winIcon : pngIcon;
  const appCommit = import.meta.env.VITE_APP_COMMIT || 'unknown';
  const appVersion =
    import.meta.env.VITE_APP_VERSION || electron.app.getVersion() || 'unknown';

  const aboutWindowProperties: electron.BrowserWindowConstructorOptions = {
    center: true,
    show: false,
    icon,
    frame: false,
    minWidth: 460,
    width: 460,
    height: 620,
    resizable: false,
    modal: true,
    parent: parentWindow,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    useContentSize: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: true,
      partition: 'persist:fchat'
    }
  };

  if (process.platform === 'darwin') {
    aboutWindowProperties.frame = true;
    aboutWindowProperties.height = 560;
    aboutWindowProperties.modal = false;
  }

  const about = new electron.BrowserWindow(aboutWindowProperties);

  about.webContents.setWindowOpenHandler(({ url }) => {
    electron.shell.openExternal(url);
    return { action: 'deny' };
  });

  void loadRendererPage(about, 'about.html', {
    settings: JSON.stringify(settings),
    commit: appCommit,
    version: appVersion
  });

  about.once('ready-to-show', () => {
    about.center();
    about.show();
  });

  return about;
}

export function tabAddHandler(
  webContents: electron.WebContents,
  settings: GeneralSettings
) {
  setUpWebContents(webContents, settings);
  ++tabCount;
  if (tabCount >= maxTabCount) {
    for (const w of windows) {
      w.webContents.send('allow-new-tabs', false);
    }
  }
}

export function tabClosedHandler() {
  --tabCount;
  if (tabCount < maxTabCount)
    for (const w of windows) w.webContents.send('allow-new-tabs', true);
}

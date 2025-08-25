/**
 * @module browser_windows
 * Handles the creation and management of browser windows in the Electron application.
 */

import * as electron from 'electron';
import * as windowState from './window_state';
import * as remoteMain from '@electron/remote/main';
import log from 'electron-log'; //tslint:disable-line:match-default-export-name
import path from 'path';
import { GeneralSettings } from './common';
import { openURLExternally } from './main';
import { app, DownloadItem, IpcMainEvent } from 'electron';
import { getSafeLanguages, updateSupportedLanguages } from './language';
import { BlockerIntegration } from './blocker/blocker';
import l from '../chat/localize';

/**
 * @constant
 * The maximum number of tabs that can be opened in the application. In production, this is set to 3, while in development it is set to 5.
 * This does not change tha amount of connections to the live server, it's used so that we can connect more sessions to the test server during development.
 */
const maxTabCount = process.env.NODE_ENV === 'production' ? 3 : 5;

/**
 * Used to store the mapping of character names to their respective web contents from a tab.
 * This allows for quick access to the web contents associated with a specific character.
 * @internal
 */
const tabMap: { [key: string]: electron.WebContents } = {};

/**
 * Used to track whether a window has new messages.
 * This is a map where the key is the window ID and the value is a boolean indicating whether there are new messages.
 * @internal
 */
const newMessagesMap: { [id: number]: boolean } = {};

/**
 * Used to track the injected CSS per key value. Inserting CSS returns a key value that can later be used to remove the value.
 * @internal
 */
const windowCssKeyMap: { [id: number]: string } = {};

/**
 * Tray icon path.
 * @internal
 */
const trayIcon: string = path.join(
  __dirname,
  <string>(
    require(
      process.platform !== 'darwin'
        ? './build/tray.png'
        : './build/trayTemplate.png'
    ).default
  )
);

/**
 * @internal
 */
let tray: electron.Tray;

/**
 * PNG icon path.
 * This is used for the application icon on platforms that support PNG icons.
 * @internal
 */
const pngIcon: string = path.join(
  __dirname,
  <string>require('./build/icon.png').default
);

/**
 * Windows icon path.
 * @internal
 */
const winIcon: string = path.join(
  __dirname,
  <string>require('./build/icon.ico').default
);

/**
 * Empty badge icon for the overlay.
 * @internal
 */
const emptyBadge = electron.nativeImage.createEmpty();

/**
 * Badge icon for the overlay, indicating new messages.
 * @internal
 */
const badge = electron.nativeImage.createFromPath(
  path.join(__dirname, <string>require('./build/badge.png').default)
);

/**
 * Handles the 'has-new' IPC event.
 * This event is triggered when there are new messages in the application.
 * It updates the dock badge on macOS and applies an overlay icon to the window that sent the event on Window and Linux.
 * @event
 * @param {IpcMainEvent} e
 * @param {boolean} hasNew
 */
electron.ipcMain.on('has-new', (e: IpcMainEvent, hasNew: boolean) => {
  if (process.platform === 'darwin' && app.dock !== undefined)
    app.dock.setBadge(hasNew ? '•' : '');
  const window = electron.BrowserWindow.fromWebContents(e.sender);
  if (window !== undefined && window !== null) {
    applyOverlayIcon(window, hasNew);
    newMessagesMap[window.id] = hasNew;
  }
});

/**
 * Apply an overlay icon to the given window based on whether there are new messages.
 * @function
 * @param {electron.BrowserWindow} window
 * The window to apply the overlay icon to.
 * @param {boolean} hasNew
 * Whether or not the window has new messages.
 * @internal
 */
function applyOverlayIcon(window: electron.BrowserWindow, hasNew: boolean) {
  window.setOverlayIcon(
    hasNew ? badge : emptyBadge,
    hasNew ? 'New messages' : ''
  );
}

/**
 * @internal
 * Keep a global reference to all browser windows.
 * This prevents the windows from being garbage collected.
 */
const windows: electron.BrowserWindow[] = [];

/**
 * Used to count the number of tabs currently open.
 * @internal
 */
let tabCount = 0;

/**
 * Handles the 'connect' IPC event.
 * This event is triggered when tab connects to F-Chat.
 * It adds the tab's web contents to the `tabMap` and updates the tray context menu.
 * @event
 * @param {IpcMainEvent & { sender: electron.WebContents }} e
 * The IPC main event that contains the sender's web contents.
 * @param {string} character
 * The character name associated with the tab.
 */
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
/**
 * Handles the 'disconnect' IPC event.
 * This event is triggered when a tab disconnects from F-Chat.
 * It removes the tab's web contents from the `tabMap` and updates the tray context menu.
 * @event
 * @param {IpcMainEvent} _event
 * The IPC main event that is triggered when a tab disconnects.
 * @param {string} character
 * The character name associated with the tab that is disconnecting.
 */
electron.ipcMain.on('disconnect', (_event: IpcMainEvent, character: string) => {
  delete tabMap[character];
  tray.setContextMenu(electron.Menu.buildFromTemplate(createTrayMenu()));
});
/**
 * Opens a new tab in the specified browser window.
 * @function
 * @param {electron.BrowserWindow} w
 * The browser window in which to open the new tab.
 */
export function openTab(w: electron.BrowserWindow) {
  if (tabCount < maxTabCount) w.webContents.send('open-tab');
}

/**
 * Creates a new main window for the application.
 * @function
 * @param {GeneralSettings} settings
 * This contains the general settings for the application.
 * @param {boolean} shouldImportSettings
 * Seemingly unreferenced outside of creating the window.
 * @param {string} baseDir
 * Base directory for the application, used for the ad blocker.
 * @returns {electron.BrowserWindow | undefined}
 */
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

  newMessagesMap[window.id] = false;
  remoteMain.enable(window.webContents);

  windows.push(window);

  // window.setIcon(process.platform === 'win32' ? winIcon : pngIcon);

  window.webContents.on('will-attach-webview', () => {
    const all = electron.webContents.getAllWebContents();
    all.forEach(item => {
      remoteMain.enable(item);
    });
  });

  window.on('show', () => {
    applyOverlayIcon(window, newMessagesMap[window.id]);
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
    tray.on('click', _e => tray.popUpContextMenu());

    tray.setContextMenu(electron.Menu.buildFromTemplate(createTrayMenu()));
    log.debug('init.window.add.tray');
  }

  return window;
}

/**
 * Toggles the enabled state of specific menu items in the application menu.
 * This is used to enable or disable menu items that are specific to the current window, but are not supposed to be available when all windows are closed or hidden.
 * This is particularly useful on macOS, where the application menu is always present.
 * @function
 * @param {boolean} active
 * Indicates whether the menu items should be enabled or disabled.
 * @internal
 */
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
      var item = appMenu!.getMenuItemById(itemId);
      if (item) item.enabled = active;
    });
  }
}

/**
 * Sets up the web contents for a browser window.
 * This function enables remote module support, sets visual zoom limits, and handles link clicks.
 * @function
 * @param {electron.WebContents} webContents
 * The web contents to set up.
 * @param {GeneralSettings} settings
 * The general settings for the application, used to determine how links should be handled.
 */
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
      let key = await window.webContents.insertCSS(` html { ${styleSheet} }`, {
        cssOrigin: 'author'
      });
      windowCssKeyMap[window.id] = key;
    }

    window.webContents.send('user-css-updated', styleSheet, useCustomCss);
  });
}

/**
 * Creates the context menu for the system tray.
 * @function
 * @returns {electron.MenuItemConstructorOptions[]}
 * An array of menu item options for the tray context menu.
 * Each item represents a tab in the application, allowing the user to switch between tabs.
 * @internal
 */
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
    { type: 'separator' },
    ...tabItems,
    {
      label: l('action.quit'),
      click: () => {
        quitAllWindows();
        electron.app.quit();
      }
    }
  ];
}

/**
 * Sets the spell checker languages for all browser windows.
 * @function
 * @param {string[]} langs
 * An array of language codes to set for the spell checker. For example, ['en-US', 'fr-FR'].
 */
export function setSpellCheckerLanguages(langs: string[]): void {
  for (const w of windows) {
    // console.log('LANG SEND');
    w.webContents.session.setSpellCheckerLanguages(langs);
    w.webContents.send('update-dictionaries', langs);
  }
}

/**
 * Adds a word to the spell checker dictionary for all browser windows.
 * @function
 * @param {string} word
 * The word to add to the spell checker dictionary.
 */
export function addWordToSpellCheckerDictionary(word: string) {
  for (const w of windows)
    w.webContents.session.addWordToSpellCheckerDictionary(word);
}

/**
 * Updates the zoom level for all browser windows.
 * This function sends an IPC message to all windows to update their zoom level.
 * @function
 * @param {number} zoomLevel
 * The new zoom level to set for all windows. This is a multiplier for the default zoom level between 0 and 5.
 */
export function updateZoomLevel(zoomLevel: number) {
  for (const win of windows) win.webContents.send('update-zoom', zoomLevel);
}

/**
 * Quits all browser windows.
 * @function
 */
export function quitAllWindows() {
  for (const w of windows) w.webContents.send('quit');
}

/**
 * Shows all browser windows.
 * @function
 */
export function showAllWindows() {
  for (const w of windows) w.show();
}
/**
 * Toggles the update notice in all browser windows through an IPC message.
 * @function
 * @param {boolean} updateAvailable
 * Whether an update is available or not.
 * @param {string} [version]
 * The version of the update, if available. This is optional and can be undefined.
 */
export function toggleUpdateNotice(updateAvailable: boolean, version?: string) {
  for (const w of windows)
    w.webContents.send('update-available', updateAvailable, version);
}

/**
 * Creates a new settings window.
 * @function
 * @param {GeneralSettings} settings
 * The general settings for the application, modified by the user in the settings window.
 * @param {boolean} shouldImportSettings
 * Seemingly unreferenced outside of creating the window.
 * @param {electron.BrowserWindow} parentWindow
 * The parent window for the settings window. This is used to create a modal dialog.
 * @returns {electron.BrowserWindow | undefined}
 * Returns the newly created settings window or undefined if creation failed.
 */
export function createSettingsWindow(
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

/**
 * Creates and configures a modal changelog window as a child of the specified parent Electron BrowserWindow.
 *
 * @param settings
 * The general application settings to be passed to the changelog window.
 * @param shouldImportSettings
 * Seemingly unreferenced outside of creating the window.
 * @param parentWindow
 * The parent window for the settings window. This is used to create a modal dialog.
 * @param updateVer
 * @optional
 * The update version string to display in the changelog window. If not defined, the window will be a regular changelog window for the current application version. If defined, it will be treated as a changelog for a new update.
 * @returns
 * The created Electron BrowserWindow instance for the changelog, or `undefined` if creation fails.
 */
export function createChangelogWindow(
  settings: GeneralSettings,
  shouldImportSettings: boolean,
  parentWindow: electron.BrowserWindow,
  updateVer?: string
): electron.BrowserWindow | undefined {
  let desiredHeight = 700;
  let desiredWidth = 600;

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
  browserWindow.loadFile(path.join(__dirname, 'changelog.html'), {
    query: {
      settings: JSON.stringify(settings),
      import: shouldImportSettings ? 'true' : '',
      updateVer: updateVer ? updateVer : ''
    }
  });

  browserWindow.once('ready-to-show', () => {
    browserWindow.show();
  });

  return browserWindow;
}

/**
 * Creates a new about window.
 * @function
 * @param {electron.BrowserWindow} parentWindow
 * The parent window for the about window. This is used to create a modal dialog.
 * @returns {electron.BrowserWindow}
 * Returns the newly created about window.
 */
export function createAboutWindow(
  parentWindow: electron.BrowserWindow
): electron.BrowserWindow {
  const icon = process.platform === 'win32' ? winIcon : pngIcon;

  const about = new electron.BrowserWindow({
    width: 400,
    height: 400, // Initial height
    center: true,
    resizable: false,
    minimizable: false,
    useContentSize: process.platform === 'win32', // Important for Windows
    modal: process.platform !== 'darwin',
    parent: parentWindow,
    autoHideMenuBar: true,
    show: false,
    icon,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  remoteMain.enable(about.webContents);

  // Handle external links
  about.webContents.setWindowOpenHandler(({ url }) => {
    electron.shell.openExternal(url);
    return { action: 'deny' };
  });

  // Set package version
  process.env.npm_package_version = require('../package.json').version;

  // Load the HTML file
  about.loadFile(path.join(__dirname, 'about.html'));

  // Adjust height to content and show window
  about.webContents.once('dom-ready', () => {
    // Set icon path - use the icon directly as it's already a full path
    const iconPath = 'file://' + icon.replace(/\\/g, '/');

    // Calculate content height and set icon
    about.webContents
      .executeJavaScript(
        `
      // Sets icon
      const logo = document.querySelector('.app-logo');
      if (logo) logo.src = '${iconPath}';
      
      // Return height of content for window sizing
      const container = document.querySelector('.container');
      container ? container.scrollHeight + 60 : 400;
    `
      )
      .then((height: number) => {
        // Constrain height to reasonable bounds
        const finalHeight = Math.min(Math.max(height, 350), 600);

        // Platform-specific sizing
        if (process.platform === 'win32') {
          about.setContentSize(400, finalHeight);
        } else {
          about.setSize(400, finalHeight);
        }

        about.center();
        about.show();
      })
      .catch(() => {
        // Fallback if calculation fails
        if (process.platform === 'win32') {
          about.setContentSize(400, 400);
        } else {
          about.setSize(400, 400);
        }
        about.center();
        about.show();
      });
  });

  return about;
}

/**
 * @function
 * @param {electron.WebContents} webContents
 * @param {GeneralSettings} settings
 */
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

/**
 * Handles the event when a tab is closed.
 * Decreases the tab count and allows new tabs to be opened if the count is below the maximum.
 * This function is called when a tab is closed in the application.
 * @function
 */
export function tabClosedHandler() {
  --tabCount;
  if (tabCount < maxTabCount)
    for (const w of windows) w.webContents.send('allow-new-tabs', true);
}

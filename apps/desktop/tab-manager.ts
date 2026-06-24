/**
 * @module tab-manager
 * Owns the WebContentsView instances that back chat tabs. Window.vue just
 * draws the tab strip; anything privileged (creating views, bounds,
 * destruction, routing between a tab and its host window) happens here in
 * the main process.
 */

import * as electron from 'electron';
import { createLogger } from '@horizon/shared/logger';
const log = createLogger('tab-manager');
import path from 'path';
import { loadRendererPage } from './load-renderer';
import type { GeneralSettings } from '@horizon/shared/common';
import {
  canAddTab,
  tabAddHandler,
  tabClosedHandler,
  shouldOpenDevtools
} from './browser_windows';

const FORWARDABLE_CHANNELS = ['fix-logs', 'ui-test', 'reopen-profile'];

interface HostWindowState {
  window: electron.BrowserWindow;
  importHint: string;
  topOffset: number;
  tabs: Map<number, electron.WebContentsView>;
  activeTabId?: number;
}

interface TabManagerOptions {
  getSettings(): GeneralSettings;
  hasCompletedUpgrades(): boolean;
}

/* state: host window id -> state, tab webContents id -> host window id */
const hosts = new Map<number, HostWindowState>();
const tabToHost = new Map<number, number>();
const cssKeys = new Map<number, string>();
// ! Views stay invisible until first load completes (no white flash).
const loadedTabs = new Set<number>();

let options: TabManagerOptions | undefined;

function hostFor(sender: electron.WebContents): HostWindowState | undefined {
  const hostId = tabToHost.get(sender.id);
  if (hostId !== undefined) return hosts.get(hostId);
  const win = electron.BrowserWindow.fromWebContents(sender);
  return win ? hosts.get(win.id) : undefined;
}

/**
 * Resolves the BrowserWindow a webContents belongs to, whether it is a host
 * window, one of its tab views, or an unrelated window (settings, about...).
 */
export function hostWindowFor(
  sender: electron.WebContents
): electron.BrowserWindow | undefined {
  const host = hostFor(sender);
  if (host && !host.window.isDestroyed()) return host.window;
  return electron.BrowserWindow.fromWebContents(sender) ?? undefined;
}

function tabBounds(host: HostWindowState): electron.Rectangle {
  const content = host.window.getContentBounds();
  return {
    x: 0,
    y: host.topOffset,
    width: content.width,
    height: Math.max(content.height - host.topOffset, 0)
  };
}

function layoutActiveTab(host: HostWindowState): void {
  if (host.activeTabId === undefined) return;
  const view = host.tabs.get(host.activeTabId);
  if (view) view.setBounds(tabBounds(host));
}

function showTab(host: HostWindowState, id: number): void {
  const view = host.tabs.get(id);
  if (!view) return;
  host.activeTabId = id;
  for (const [tabId, tabView] of host.tabs) {
    const active = tabId === id;
    // ! Never reveal a view before its first load completed (no white flash).
    tabView.setVisible(active && loadedTabs.has(tabId));
    if (!tabView.webContents.isDestroyed())
      tabView.webContents.send(active ? 'active-tab' : 'inactive-tab');
  }
  view.setBounds(tabBounds(host));
  view.webContents.focus();
}

function destroyView(
  host: HostWindowState,
  view: electron.WebContentsView
): void {
  const contents = view.webContents;
  tabToHost.delete(contents.id);
  cssKeys.delete(contents.id);
  loadedTabs.delete(contents.id);
  if (!host.tabs.delete(contents.id)) return; //already destroyed
  if (host.activeTabId === contents.id) host.activeTabId = undefined;
  if (!host.window.isDestroyed()) {
    try {
      host.window.contentView.removeChildView(view);
    } catch (e) {
      log.debug('tab.destroy.removeChildView', e);
    }
  }
  if (!contents.isDestroyed()) {
    try {
      contents.stop();
    } catch (e) {
      log.debug('tab.destroy.stop', e);
    }
    try {
      contents.close();
    } catch (e) {
      log.debug('tab.destroy.close', e);
    }
  }
  tabClosedHandler();
}

/**
 * Starts tracking a main chat window so it can host tabs. Must be called for
 * every window created through `browserWindows.createMainWindow`.
 */
export function adoptWindow(
  window: electron.BrowserWindow,
  importHint: string
): void {
  const host: HostWindowState = {
    window,
    importHint,
    topOffset: 0,
    tabs: new Map()
  };
  hosts.set(window.id, host);

  window.on('resize', () => layoutActiveTab(host));
  window.on('maximize', () => {
    window.webContents.send('window-maximized', true);
    layoutActiveTab(host);
  });
  window.on('unmaximize', () => {
    window.webContents.send('window-maximized', false);
    layoutActiveTab(host);
  });
  window.on('focus', () => {
    if (host.activeTabId === undefined) return;
    const view = host.tabs.get(host.activeTabId);
    if (view && !view.webContents.isDestroyed()) {
      view.webContents.focus();
      view.webContents.send('active-tab');
    }
  });
  window.on('closed', () => {
    for (const view of [...host.tabs.values()]) destroyView(host, view);
    hosts.delete(window.id);
  });
}

export async function updateCustomCssAllTabs(
  styleSheet: string,
  useCustomCss: boolean
): Promise<void> {
  for (const host of hosts.values())
    for (const view of host.tabs.values()) {
      const contents = view.webContents;
      if (contents.isDestroyed()) continue;
      const key = cssKeys.get(contents.id);
      if (key !== undefined) {
        await contents.removeInsertedCSS(key);
        cssKeys.delete(contents.id);
      }
      if (useCustomCss)
        cssKeys.set(
          contents.id,
          await contents.insertCSS(`html {${styleSheet}}`, {
            cssOrigin: 'author'
          })
        );
    }
}

export function initTabManager(opts: TabManagerOptions): void {
  if (options !== undefined) return;
  options = opts;

  const ipc = electron.ipcMain;

  ipc.handle('tab-create', (event, topOffset: number) => {
    const host = hostFor(event.sender);
    if (!host || !canAddTab() || options === undefined) return undefined;
    if (typeof topOffset === 'number') host.topOffset = topOffset;

    const settings = options.getSettings();
    const view = new electron.WebContentsView({
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        webviewTag: true,
        nodeIntegration: false,
        contextIsolation: true,
        // ! Must stay sandboxed. With webviewTag on, an unsandboxed embedder
        // ! leaves Electron's internal <webview> element without its ipcNative
        // ! binding, so every guest resize/event spams the renderer log. The
        // ! chat tab needs no Node anyway - it talks to main over the bridge.
        sandbox: true,
        spellcheck: true,
        partition: 'persist:fchat'
      }
    });
    const contents = view.webContents;

    /* Transparent until the themed page paints; anything Chromium hasn't
       drawn yet shows the window background instead of searing white. */
    view.setBackgroundColor('#00000000');

    log.debug('tab.create', { window: host.window.id, tab: contents.id });

    host.tabs.set(contents.id, view);
    tabToHost.set(contents.id, host.window.id);
    tabAddHandler(contents, settings);

    /* The chat renderer builds the menu template from these params and sends
       back `show-context-menu`; we drop `frame` because WebFrameMain
       doesn't survive the IPC trip. */
    contents.on('context-menu', (_e, props) => {
      const { frame, ...serializable } = props as electron.ContextMenuParams & {
        frame?: unknown;
      };
      contents.send('context-menu-request', serializable);
    });
    contents.on('devtools-opened', () => contents.send('devtools-opened'));

    if (shouldOpenDevtools()) contents.openDevTools({ mode: 'detach' });

    host.window.contentView.addChildView(view);
    showTab(host, contents.id);

    void loadRendererPage(contents, 'index.html', {
      settings: JSON.stringify(settings),
      hasCompletedUpgrades: JSON.stringify(options.hasCompletedUpgrades()),
      import: host.importHint
    })
      .catch(e => log.error('tab.load.error', e))
      .finally(async () => {
        if (contents.isDestroyed() || host.window.isDestroyed()) return;
        if (settings.horizonCustomCssEnabled)
          cssKeys.set(
            contents.id,
            await contents.insertCSS(`html {${settings.horizonCustomCss}}`, {
              cssOrigin: 'author'
            })
          );
        // ~ Reveal only now that the page (and custom CSS) is in place.
        loadedTabs.add(contents.id);
        if (host.activeTabId === contents.id) showTab(host, contents.id);
        host.window.webContents.send('tab-ready', contents.id);
      });

    return contents.id;
  });

  ipc.on('tab-show', (e, id: number) => {
    const host = hostFor(e.sender);
    if (host) showTab(host, id);
  });

  ipc.on('tab-close', (e, id: number) => {
    const host = hostFor(e.sender);
    const view = host?.tabs.get(id);
    if (host && view) destroyView(host, view);
  });

  ipc.on('tabs-destroy-all', e => {
    const host = hostFor(e.sender);
    if (!host) return;
    for (const view of [...host.tabs.values()]) destroyView(host, view);
  });

  ipc.on('tab-bar-height', (e, height: number) => {
    const host = hostFor(e.sender);
    if (!host || typeof height !== 'number') return;
    host.topOffset = height;
    layoutActiveTab(host);
  });

  ipc.on('focus-active-tab', e => {
    const host = hostFor(e.sender);
    if (!host || host.activeTabId === undefined) return;
    const view = host.tabs.get(host.activeTabId);
    if (view && !view.webContents.isDestroyed()) view.webContents.focus();
  });

  ipc.on('tab-forward', (e, id: number, channel: string) => {
    if (!FORWARDABLE_CHANNELS.includes(channel)) return;
    const host = hostFor(e.sender);
    const view = host?.tabs.get(id);
    if (view && !view.webContents.isDestroyed()) view.webContents.send(channel);
  });

  /* Tab renderer -> host renderer routing. */
  const routeToHost = (
    sender: electron.WebContents,
    channel: string,
    ...args: unknown[]
  ): HostWindowState | undefined => {
    const host = hostFor(sender);
    if (!host || host.window.isDestroyed()) return undefined;
    host.window.webContents.send(channel, ...args);
    return host;
  };

  ipc.on('tab-connected', (e, character: string) => {
    routeToHost(e.sender, 'connect', e.sender.id, character);
  });
  ipc.on('tab-disconnected', e => {
    routeToHost(e.sender, 'disconnect', e.sender.id);
  });
  ipc.on('tab-has-new', (e, hasNew: number) => {
    routeToHost(e.sender, 'has-new', e.sender.id, hasNew);
  });
  ipc.on('tab-avatar-url', (e, name: string, url: string) => {
    routeToHost(e.sender, 'update-avatar-url', name, url);
  });
  ipc.on('tab-character-color', (e, name: string, color: string) => {
    routeToHost(e.sender, 'update-character-color', name, color);
  });
  ipc.on('tab-notification-clicked', e => {
    const host = routeToHost(e.sender, 'show-tab', e.sender.id);
    if (!host) return;
    if (host.window.isMinimized()) host.window.restore();
    host.window.focus();
  });
}

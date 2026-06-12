/**
 * @license
 * Originally licensed under MIT License
 *
 * Copyright (c) 2018-2026 Dragonfruit Ventures, LLC
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
 * This file is now also licensed under MPL-2.0 (see LICENSE.md).
 * Modifications made after the original MIT release are licensed under MPL-2.0.
 *
 * This license header applies to this file and all of the non-third-party assets it includes.
 * @file The entry point for the Electron main thread of F-Chat 3.0.
 * @copyright 2018-2026 Dragonfruit Ventures, LLC
 * @copyright 2024-2026 Sylvia Roselie & Respective Horizon Contributors
 * @version 1.0
 * @see {@link https://github.com/Fchat-Horizon/Horizon|GitHub repo}
 * @author Maya Wolf <maya@f-list.net>
 * @version 3.0
 * @see {@link https://github.com/f-list/exported|GitHub repo}
 */

import * as electron from 'electron';

import log from 'electron-log/main'; //tslint:disable-line:match-default-export-name
import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
// import * as url from 'url';
import l from '../chat/localize';
import { defaultHost, GeneralSettings } from './common';
// import BrowserWindow = electron.BrowserWindow;
import MenuItemConstructorOptions = electron.MenuItemConstructorOptions;
import * as _ from 'lodash';
import { AdCoordinatorHost } from '../chat/ads/ad-coordinator-host';
import { IpcMainEvent, session } from 'electron';
import * as browserWindows from './browser_windows';
import * as tabManager from './tab-manager';
import { initIpcHandlers } from './ipc-handlers';
import { initSiteSessionHost } from './site-session-host';
import { initFilesystemHost } from './filesystem-host';
import { initIncognito } from './incognito';
import { initBackupHost } from './services/backup-host';
import { initImportHost } from './services/import-host';
import { Event } from 'electron/main';
import { autoUpdater } from 'electron-updater';
import Axios from 'axios';
import { ProfileViewerGalleryType } from '../site/utils';

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
let mainWindow: electron.BrowserWindow | undefined;

log.initialize();

const characters: string[] = [];
let autoBackupScheduler:
  | import('./services/exporter/auto-backup').AutoBackupScheduler
  | undefined;

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
    const { runExportCli } =
      await import('./services/exporter/backup-export-cli');
    const dataDir =
      get('--data-dir') || path.join(app.getPath('userData'), 'data');
    const out = get('--out') || path.join(process.cwd(), 'horizon-export.zip');
    const include = (f: string, d = false) => (has(f) ? true : d);
    const chars = get('--characters')?.split(',').filter(Boolean);
    const dryRun = has('-n') || has('--dry-run');
    const exportResult = await runExportCli({
      dataDir,
      settingsDir: path.join(app.getPath('userData'), 'data'),
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
    const { runImportCli } =
      await import('./services/importer/backup-import-cli');
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
      settingsDir: path.join(app.getPath('userData'), 'data'),
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
const updateCheckFirstDelay = 10_000; // 10 seconds
const updateCheckInterval = 60 * 60 * 1000; // 1 hour in milliseconds
const releasesUrl =
  'https://api.github.com/repos/Fchat-Horizon/Horizon/releases';
type ReleaseInfo = {
  html_url: string;
  tag_name: string;
  prerelease: boolean | undefined;
};

const settingsDir = path.join(baseDir, 'data');
fs.mkdirSync(settingsDir, { recursive: true });
const settingsFile = path.join(settingsDir, 'settings');
const settings = new GeneralSettings();
//We need this, since displaying the changelog is done through a child window instead of an external link
let showChangelogOnBoot = false;
// Reference count so overlapping update requests don't re-enable prompts early.
let suppressAutoUpdaterPrompt = 0;
let lastPromptedUpdateTag: string | undefined;
let isUpdateRestarting = false;
// Tracks an in-flight download so re-fired update-available events can't start a
// second one, and the tag already downloaded so periodic checks don't re-fetch it.
let downloadingUpdate = false;
let downloadedUpdateTag: string | undefined;

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

function normalizeVersionToTag(version?: string): string | undefined {
  if (!version) return undefined;
  return version.startsWith('v') ? version : `v${version}`;
}

function supportsAutoUpdates(): boolean {
  if (process.platform === 'linux') {
    return Boolean(process.env.APPIMAGE);
  }
  return true;
}

function isProductionMode(): boolean {
  return process.env.NODE_ENV === 'production';
}

function getConnectedCharacterCount(): number {
  return characters.length;
}

function isUsableWindow(
  win: electron.BrowserWindow | undefined | null
): win is electron.BrowserWindow {
  return Boolean(win && !win.isDestroyed());
}

function setMainWindow(win: electron.BrowserWindow | undefined): void {
  mainWindow = win;
  if (!win) return;
  win.on('closed', () => {
    if (mainWindow === win) {
      mainWindow = undefined;
    }
  });
}

function getMainWindow(): electron.BrowserWindow | undefined {
  if (mainWindow && mainWindow.isDestroyed()) {
    mainWindow = undefined;
  }
  if (isUsableWindow(mainWindow)) return mainWindow;
  return electron.BrowserWindow.getAllWindows().find(w => isUsableWindow(w));
}

function getPreferredWindow(
  targetWindow?: electron.BrowserWindow | null
): electron.BrowserWindow | undefined {
  if (isUsableWindow(targetWindow)) return targetWindow;
  const focused = electron.BrowserWindow.getFocusedWindow();
  if (isUsableWindow(focused)) return focused;
  return getMainWindow();
}

function maybeShowUpdatePrompt(
  updateTag: string,
  updateMode: 'auto' | 'manual',
  targetWindow?: electron.BrowserWindow | null
): void {
  if (settings.horizonHideAutoUpdater || suppressAutoUpdaterPrompt !== 0)
    return;
  if (lastPromptedUpdateTag === updateTag) return;
  const window = getPreferredWindow(targetWindow);
  if (!window) return;
  browserWindows.createChangelogWindow(
    settings,
    'none',
    window,
    updateTag,
    updateMode
  );
  lastPromptedUpdateTag = updateTag;
}

async function checkForGitRelease(
  semVer: string,
  releaseUrl: string,
  updateMode: 'auto' | 'manual'
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
      if (
        settings.horizonSkippedUpdateVersion &&
        release.tag_name === settings.horizonSkippedUpdateVersion
      ) {
        log.info(
          'updateCheck.state.skipped',
          `Update skipped: ${release.tag_name}`
        );
        browserWindows.toggleUpdateNotice(false);
        return;
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
      maybeShowUpdatePrompt(release.tag_name, updateMode);
      return;
    }
  } catch (e) {
    log.error(`Error checking for update: ${e}`);
  }
}

async function runAutoUpdateCheck(): Promise<void> {
  if (!settings.updateCheck) return;
  try {
    autoUpdater.allowPrerelease = settings.beta;
    await autoUpdater.checkForUpdates();
  } catch (e) {
    log.error('autoUpdater.check.failed', e);
  }
}
async function requestUpdateDownload(expectedTag?: string): Promise<void> {
  if (!supportsAutoUpdates()) return;
  if (!isProductionMode()) return;
  if (downloadingUpdate) return;
  suppressAutoUpdaterPrompt += 1;
  downloadingUpdate = true;
  try {
    autoUpdater.allowPrerelease = settings.beta;
    const result = await autoUpdater.checkForUpdates();
    if (!result) return;
    const updateTag = normalizeVersionToTag(result.updateInfo?.version);
    if (expectedTag && updateTag && expectedTag !== updateTag) {
      log.info('autoUpdater.update.mismatch', { expectedTag, updateTag });
      return;
    }
    if (updateTag && settings.horizonSkippedUpdateVersion === updateTag) {
      settings.horizonSkippedUpdateVersion = '';
      setGeneralSettings(settings);
    }
    await autoUpdater.downloadUpdate();
  } catch (e) {
    log.error('autoUpdater.download.failed', e);
  } finally {
    suppressAutoUpdaterPrompt = Math.max(0, suppressAutoUpdaterPrompt - 1);
    downloadingUpdate = false;
  }
}
function confirmUpdateWhileConnected(): boolean {
  if (getConnectedCharacterCount() === 0) return true;
  const focusedWindow = electron.BrowserWindow.getFocusedWindow();
  const options = {
    message: l('update.restart.confirmConnected'),
    title: l('title'),
    buttons: [l('confirmYes'), l('confirmNo')],
    cancelId: 1
  };
  const button = focusedWindow
    ? electron.dialog.showMessageBoxSync(focusedWindow, options)
    : electron.dialog.showMessageBoxSync(options);
  return button === 0;
}

// Schemes safe to hand to a spawned browser; anything else goes to the OS.
const EXTERNAL_BROWSER_SCHEMES = ['http:', 'https:'];

function resolveCustomBrowser(): string | null {
  const browserPath = settings.browserPath;
  if (browserPath === '' || !fs.existsSync(browserPath)) return null;

  try {
    fs.accessSync(browserPath, fs.constants.X_OK);
  } catch {
    log.error(
      `Selected browser is not executable by user. Path: "${browserPath}"`
    );
    return null;
  }

  return browserPath;
}

function isWebUrl(linkUrl: string): boolean {
  try {
    return EXTERNAL_BROWSER_SCHEMES.includes(new URL(linkUrl).protocol);
  } catch {
    return false;
  }
}

// Encode the URL once, undoing any accidental double-encoding (%25xx -> %xx).
function normalizeUrl(linkUrl: string): string {
  return encodeURI(linkUrl).replace(/%25([0-9a-f]{2})/gi, '%$1');
}

export function openURLExternally(linkUrl: string): void {
  const browserPath = resolveCustomBrowser();

  // No custom browser, or not a web link: let the OS handle it.
  if (browserPath === null || !isWebUrl(linkUrl)) {
    electron.shell.openExternal(linkUrl);
    return;
  }

  const url = normalizeUrl(linkUrl);
  const argTokens = settings.browserArgs.split(/\s+/).filter(Boolean);

  // execFile uses no shell, so the URL is an inert argument: it cannot inject
  // commands, and the http(s) guard keeps it from being read as a flag.
  if (process.platform === 'darwin') {
    // `open -a <app>`: args before --args are documents (the URL); flags follow
    // --args. NOTE: Safari-as-browser with a different OS default opens the URL
    // twice. https://developer.apple.com/forums/thread/685385
    const flags = argTokens.filter(arg => !arg.includes('%s'));
    const openArgs = ['-a', browserPath, url];
    if (flags.length > 0) openArgs.push('--args', ...flags);
    execFile('open', openArgs);
    return;
  }

  // Substitute the URL into %s (e.g. --app=%s), or append it if absent.
  let urlSubstituted = false;
  const launchArgs = argTokens.map(arg => {
    if (!arg.includes('%s')) return arg;
    urlSubstituted = true;
    return arg.replace('%s', url);
  });
  if (!urlSubstituted) launchArgs.push(url);

  execFile(browserPath, launchArgs);
}

let zoomLevel = settings.zoomLevel;

/**
 * Creates a main chat window and registers it with the tab manager so it can
 * host WebContentsView tabs.
 */
function openMainWindow(
  importHint: 'auto' | 'none'
): electron.BrowserWindow | undefined {
  const window = browserWindows.createMainWindow(settings, importHint, baseDir);
  if (window)
    tabManager.adoptWindow(window, importHint === 'none' ? '' : importHint);
  return window;
}

async function onReady(): Promise<void> {
  try {
    if (await tryHandleCli()) return;
  } catch (err) {
    log.error('cli.run.failed', err);
    app.exit(1);
    return;
  }

  let hasCompletedUpgrades = false;

  initIpcHandlers();
  initSiteSessionHost();
  initFilesystemHost({ getSettings: () => settings });
  initIncognito({ getSettings: () => settings });
  initBackupHost({ getSettings: () => settings });
  initImportHost({ getSettings: () => settings });
  tabManager.initTabManager({
    getSettings: () => settings,
    hasCompletedUpgrades: () => hasCompletedUpgrades
  });

  const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'silly';

  log.transports.file.level = settings.risingSystemLogLevel || logLevel;
  log.transports.console.level = settings.risingSystemLogLevel || logLevel;
  log.transports.file.maxSize = 5 * 1024 * 1024;

  log.info('Starting application.');

  app.setAppUserModelId('net.flist.fchat');
  app.on('open-file', () => {
    openMainWindow('none');
  });

  /* Strip the Origin header from imgur API requests so previews work; this
     used to be registered from each chat tab through @electron/remote. */
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['*://api.imgur.com/*', '*://i.imgur.com/*'] },
    (details, callback) => {
      delete details.requestHeaders['Origin'];
      callback({ requestHeaders: details.requestHeaders });
    }
  );
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

        if (
          permission === 'clipboard-sanitized-write' &&
          partitionName === 'persist:fchat'
        ) {
          log.debug('permissions.allowed.clipboard-sanitized-write', {
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

        if (
          permission === 'clipboard-sanitized-write' &&
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
  // );
  if (isProductionMode()) {
    const updateMode = supportsAutoUpdates() ? 'auto' : 'manual';
    autoUpdater.logger = log;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = settings.beta;

    /**
     * Optional override for the auto-update feed URL.
     *
     * When set, HORIZON_UPDATE_URL must be a fully-qualified HTTP(S) URL
     * pointing to a generic update server compatible with electron-updater's
     * `generic` provider (for example: "http://localhost:8080" when testing).
     */
    log.debug(
      'autoUpdater.feed.env',
      'Optional environment variable HORIZON_UPDATE_URL can override the generic auto-update feed URL.'
    );
    const updateFeedUrl = process.env.HORIZON_UPDATE_URL;
    if (updateFeedUrl && updateMode === 'auto') {
      autoUpdater.setFeedURL({ provider: 'generic', url: updateFeedUrl });
      log.info('autoUpdater.feed.override', updateFeedUrl);
    }

    if (updateMode === 'auto') {
      autoUpdater.on('error', err => {
        log.error('autoUpdater.error', err);
        downloadingUpdate = false;
        browserWindows.toggleUpdateNotice(false);
      });

      autoUpdater.on('update-available', info => {
        const updateTag = normalizeVersionToTag(info.version);
        if (!updateTag) return;
        if (settings.horizonSkippedUpdateVersion === updateTag) {
          log.info('autoUpdater.update.skipped', updateTag);
          return;
        }
        if (downloadedUpdateTag === updateTag) {
          browserWindows.toggleUpdateNotice(true, updateTag);
          browserWindows.sendUpdateProgress(100, true);
          return;
        }
        browserWindows.toggleUpdateNotice(true, updateTag);
        if (settings.horizonAutoDownloadUpdates) {
          log.info('autoUpdater.autoDownload', updateTag);
          void requestUpdateDownload(updateTag);
        } else {
          maybeShowUpdatePrompt(updateTag, updateMode);
        }
      });

      autoUpdater.on('update-not-available', () => {
        browserWindows.toggleUpdateNotice(false);
      });

      autoUpdater.on('download-progress', progress => {
        browserWindows.sendUpdateProgress(progress.percent);
      });

      autoUpdater.on('update-downloaded', info => {
        downloadedUpdateTag = normalizeVersionToTag(info.version);
        downloadingUpdate = false;
        browserWindows.sendUpdateProgress(100, true);
      });

      setTimeout(() => runAutoUpdateCheck(), updateCheckFirstDelay);
      setInterval(() => runAutoUpdateCheck(), updateCheckInterval);
    } else {
      setTimeout(
        () =>
          checkForGitRelease(`v${app.getVersion()}`, releasesUrl, updateMode),
        updateCheckFirstDelay
      );
      setInterval(
        () =>
          checkForGitRelease(`v${app.getVersion()}`, releasesUrl, updateMode),
        updateCheckInterval
      );
    }
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
  const devItem: MenuItemConstructorOptions = {
    label: l('action.developer'),
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      {
        label: 'Show update notice',
        click: (_menu, _window) => {
          browserWindows.toggleUpdateNotice(true, `v${app.getVersion()}`);
        }
      },
      {
        label: 'Show update menu (auto)',
        click: (_menu, window) => {
          browserWindows.createChangelogWindow(
            settings,
            'none',
            window as electron.BrowserWindow,
            `v${app.getVersion()}`,
            'auto'
          );
        }
      },
      {
        label: 'Show update menu (manual)',
        click: (_menu, window) => {
          browserWindows.createChangelogWindow(
            settings,
            'none',
            window as electron.BrowserWindow,
            `v${app.getVersion()}`,
            'manual'
          );
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Test UI items',
        click: (_m, window) => {
          (window as electron.BrowserWindow).webContents.send('ui-test');
        },
        id: 'uiTest'
      }
    ]
  };
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
      },
      {
        label: l('navigation.nextTab'),
        accelerator: 'Ctrl+PageDown',
        visible: false,
        click: (_m, window) => {
          if (window && 'webContents' in window) {
            (window as electron.BrowserWindow).webContents.send('switch-tab');
          }
        }
      },
      {
        label: l('navigation.previousTab'),
        accelerator: 'Ctrl+PageUp',
        visible: false,
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
              if (hasCompletedUpgrades) openMainWindow('none');
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
            accelerator: 'CmdOrCtrl+,'
          },
          {
            label: l('fixLogs.action'),
            click: (_m, window: electron.BrowserWindow) =>
              window.webContents.send('fix-logs'),
            id: 'fixLogs'
          },
          ...(process.platform === 'darwin'
            ? [
                {
                  label: `&${l('settings.export.manageData')}`,
                  click: (_m, w) => {
                    if (w)
                      browserWindows.createExporterWindow(
                        settings,
                        'none',
                        w as electron.BrowserWindow
                      );
                  }
                } as MenuItemConstructorOptions
              ]
            : []),
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
        click: (_m, w) => {
          if (w)
            browserWindows.createExporterWindow(
              settings,
              'none',
              w as electron.BrowserWindow
            );
        }
      } as MenuItemConstructorOptions,
      viewItem,
      windowItem,
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
          }
        ] as MenuItemConstructorOptions[]
      },
      ...(process.env.NODE_ENV !== 'production' ? [devItem] : [])
    ])
  );

  electron.ipcMain.on(
    'update-now',
    (_event: IpcMainEvent, updateVersion: string) => {
      void requestUpdateDownload(updateVersion);
    }
  );
  electron.ipcMain.on(
    'skip-update-version',
    (_event: IpcMainEvent, updateVersion: string) => {
      if (!updateVersion) return;
      settings.horizonSkippedUpdateVersion = updateVersion;
      setGeneralSettings(settings);
      browserWindows.toggleUpdateNotice(false);
    }
  );
  electron.ipcMain.on('install-update', () => {
    if (!confirmUpdateWhileConnected()) return;
    isUpdateRestarting = true;
    autoUpdater.quitAndInstall(true, true);
  });
  electron.ipcMain.on('enable-auto-download-updates', () => {
    settings.horizonAutoDownloadUpdates = true;
    setGeneralSettings(settings);
  });
  electron.ipcMain.on('disable-auto-download-updates', () => {
    settings.horizonAutoDownloadUpdates = false;
    setGeneralSettings(settings);
  });
  electron.ipcMain.on(
    'open-update-changelog',
    (_event: IpcMainEvent, updateVersion: string) => {
      const updateMode = supportsAutoUpdates() ? 'auto' : 'manual';
      browserWindows.createChangelogWindow(
        settings,
        'none',
        electron.BrowserWindow.getFocusedWindow()!,
        updateVersion,
        updateMode
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
      if (autoBackupScheduler) autoBackupScheduler.runOnConnect();
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

  electron.ipcMain.on(
    'profile-gallery-type',
    (_event: IpcMainEvent, profileGalleryType: ProfileViewerGalleryType) => {
      settings.profileViewerGalleryType = profileGalleryType;
      setGeneralSettings(settings);
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
        let badgeChange =
          settings.horizonShowNotificationBadge !==
          _options.horizonShowNotificationBadge;
        Object.assign(settings, _options);
        //Now we save it to a file
        setGeneralSettings(_options);
        //No need to bother with an expensive operation if we don't change anything related to CSS settings
        if (newCss) {
          browserWindows.updateCustomCssAllWindows(
            settings.horizonCustomCss,
            settings.horizonCustomCssEnabled
          );
          void tabManager.updateCustomCssAllTabs(
            settings.horizonCustomCss,
            settings.horizonCustomCssEnabled
          );
        }
        if (!settings.updateCheck) {
          browserWindows.toggleUpdateNotice(false);
        }
        if (autoBackupScheduler) {
          autoBackupScheduler.reload();
        }
        if (badgeChange) {
          browserWindows.updateNotificationBadges(
            settings.horizonShowNotificationBadge
          );
        }
      }
    }
  );

  electron.ipcMain.on('open-url-externally', (_e, _url: string) => {
    openURLExternally(_url);
  });

  setMainWindow(openMainWindow(shouldImportSettings ? 'auto' : 'none'));
  const bootWindow = getMainWindow();
  if (showChangelogOnBoot && bootWindow) {
    browserWindows.createChangelogWindow(
      settings,
      shouldImportSettings ? 'auto' : 'none',
      bootWindow
    );
    showChangelogOnBoot = false;
  }

  import('./services/exporter/auto-backup').then(({ AutoBackupScheduler }) => {
    autoBackupScheduler = new AutoBackupScheduler(settings, baseDir);
    if (settings.autoBackupEnabled) {
      autoBackupScheduler.start();
    }
  });
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
  setMainWindow(openMainWindow('none'));
});
app.on('before-quit', (event: Event) => {
  if (isUpdateRestarting) {
    browserWindows.quitAllWindows();
    return;
  }
  if (getConnectedCharacterCount() !== 0) {
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
let willQuitHandled = false;
app.on('will-quit', (event: Event) => {
  if (
    !willQuitHandled &&
    autoBackupScheduler &&
    settings.autoBackupEnabled &&
    Array.isArray(settings.autoBackupTriggers) &&
    settings.autoBackupTriggers.includes('close')
  ) {
    willQuitHandled = true;
    event.preventDefault();
    autoBackupScheduler.runOnClose().finally(() => {
      if (autoBackupScheduler) autoBackupScheduler.stop();
      app.quit();
    });
  } else if (autoBackupScheduler) {
    autoBackupScheduler.stop();
  }
});
app.on('window-all-closed', () => app.quit());

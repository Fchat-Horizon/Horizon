import { app, clipboard, nativeTheme, shell } from 'electron';
import type { BrowserWindow, IpcMainEvent } from 'electron';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pathToFileURL } from 'url';
import log from 'electron-log';
import { defaultHost } from '../common';
import type { GeneralSettings } from '../common';
import { ABOUT_CHANNELS } from './api';
import type { AboutAppearance, AboutSettings, AboutState } from './api';
import { assertAboutSender } from './ipc-validation';

const MAX_REPORT_LENGTH = 1024 * 1024;

// These are the links displayed by About. Bug reports are constructed separately.
const ABOUT_LINKS = new Set([
  'https://github.com/Fchat-Horizon/Horizon',
  'https://github.com/Fchat-Horizon/Horizon/blob/main/CONTRIBUTORS.md',
  'https://discord.gg/JYuxqNVNtP',
  'https://ko-fi.com/thehorizonteam',
  'https://mozilla.org/MPL/2.0/',
  'https://github.com/CodingWithAnxiety',
  'https://github.com/FatCatClient',
  'https://github.com/kawinski'
]);

export function isAboutLink(url: string): boolean {
  return (
    ABOUT_LINKS.has(url) ||
    /^https:\/\/github\.com\/Fchat-Horizon\/Horizon\/commit\/[a-f0-9]{7,40}$/i.test(
      url
    )
  );
}

function selectSettings(settings: GeneralSettings): AboutSettings {
  return {
    beta: settings.beta,
    hwAcceleration: settings.hwAcceleration,
    theme: settings.theme,
    themeSync: settings.themeSync,
    themeSyncLight: settings.themeSyncLight,
    themeSyncDark: settings.themeSyncDark,
    displayLanguage: settings.displayLanguage,
    zoomLevel: settings.zoomLevel,
    reducedMotion: settings.reducedMotion,
    allowWindowTransparency: settings.allowWindowTransparency,
    forceNativeWindowControls: settings.forceNativeWindowControls,
    horizonCustomCssEnabled: settings.horizonCustomCssEnabled,
    soundTheme: settings.soundTheme,
    risingSystemLogLevel: settings.risingSystemLogLevel,
    risingDisableWindowsHighContrast: settings.risingDisableWindowsHighContrast,
    horizonBbcodeGlow: settings.horizonBbcodeGlow,
    logDirectory: settings.logDirectory,
    proxyConfigured: Boolean(settings.proxy),
    customHost:
      settings.host && settings.host !== defaultHost ? settings.host : undefined
  };
}

/** Register only the capabilities needed by this About window. */
export function registerAboutWindowApi(
  window: BrowserWindow,
  aboutFile: string,
  settings: GeneralSettings,
  appVersion: string,
  appCommit: string,
  openExternal: (url: string) => void
): void {
  const contents = window.webContents;
  const ipc = contents.ipc;
  const publicSettings = selectSettings(settings);
  const themesDirectory = path.join(path.dirname(aboutFile), 'themes');
  let revision = 0;
  let painted = false;
  let initialized = false;
  let shown = false;

  const showWhenReady = (): void => {
    if (!painted || !initialized || shown || contents.isDestroyed()) return;
    shown = true;
    window.center();
    window.show();
  };
  window.once('ready-to-show', () => {
    painted = true;
    showWhenReady();
  });

  async function getAppearance(): Promise<AboutAppearance> {
    const currentRevision = ++revision;
    const isDark = nativeTheme.shouldUseDarkColors;
    const selected = publicSettings.themeSync
      ? isDark
        ? publicSettings.themeSyncDark
        : publicSettings.themeSyncLight
      : publicSettings.theme;
    // Settings select a theme name, never an arbitrary path.
    const name =
      typeof selected === 'string' &&
      selected.length > 0 &&
      !selected.includes('/') &&
      !selected.includes('\\') &&
      !selected.includes('\0')
        ? selected
        : 'default';
    let css: string;
    try {
      css = await fs.readFile(
        path.join(themesDirectory, `${name}.css`),
        'utf8'
      );
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code !== 'ENOENT' ||
        name === 'default'
      )
        throw error;
      css = await fs.readFile(
        path.join(themesDirectory, 'default.css'),
        'utf8'
      );
    }
    return { revision: currentRevision, isDark, css };
  }

  function handleNoArgs<T>(channel: string, handler: () => T): void {
    ipc.handle(channel, (event, ...args: unknown[]) => {
      assertAboutSender(contents, aboutFile, event);
      if (args.length !== 0) throw new Error('Invalid About request.');
      return handler();
    });
  }

  function handleReport(
    channel: string,
    handler: (text: string) => void
  ): void {
    ipc.handle(channel, (event, ...args: unknown[]) => {
      assertAboutSender(contents, aboutFile, event);
      if (
        args.length !== 1 ||
        typeof args[0] !== 'string' ||
        args[0].length > MAX_REPORT_LENGTH
      ) {
        throw new Error('Invalid About report.');
      }
      handler(args[0]);
    });
  }

  handleNoArgs(
    ABOUT_CHANNELS.state,
    async (): Promise<AboutState> => ({
      settings: publicSettings,
      appVersion,
      appCommit,
      platform: process.platform,
      arch: os.arch(),
      release: os.release(),
      versions: {
        electron: process.versions.electron || 'N/A',
        chrome: process.versions.chrome || 'N/A',
        node: process.versions.node || 'N/A'
      },
      appearance: await getAppearance()
    })
  );
  handleNoArgs(ABOUT_CHANNELS.appearance, getAppearance);
  handleReport(ABOUT_CHANNELS.copyText, text => clipboard.writeText(text));
  handleReport(ABOUT_CHANNELS.reportBug, report => {
    const base = 'https://github.com/Fchat-Horizon/Horizon/issues/new';
    const params = new URLSearchParams({ template: 'bug.yml' });
    if (report) params.set('version-info', report);
    let url = `${base}?${params.toString()}`;
    if (report && url.length > 6000) {
      clipboard.writeText(report);
      url = `${base}?template=bug.yml`;
    }
    openExternal(url);
  });
  handleNoArgs(ABOUT_CHANNELS.revealLogs, async (): Promise<void> => {
    // About's console messages now go to the main-process application log.
    try {
      const file = log.transports.file.getFile().path;
      if (file) {
        shell.showItemInFolder(file);
        return;
      }
    } catch (error) {
      log.warn('about.reveal-log.failed', error);
    }
    const error = await shell.openPath(app.getPath('logs'));
    if (error) throw new Error(error);
  });

  const ready = (event: IpcMainEvent, ...args: unknown[]): void => {
    try {
      assertAboutSender(contents, aboutFile, event);
      if (args.length !== 0) throw new Error('Invalid About ready request.');
      initialized = true;
      showWhenReady();
    } catch (error) {
      log.warn('about.ready.rejected', error);
    }
  };
  ipc.on(ABOUT_CHANNELS.ready, ready);

  const close = (event: IpcMainEvent, ...args: unknown[]): void => {
    try {
      assertAboutSender(contents, aboutFile, event);
      if (args.length !== 0) throw new Error('Invalid About close request.');
      window.close();
    } catch (error) {
      log.warn('about.close.rejected', error);
    }
  };
  ipc.on(ABOUT_CHANNELS.close, close);

  const themeChanged = (): void => {
    void getAppearance()
      .then(appearance => {
        if (
          !contents.isDestroyed() &&
          contents.getURL() === pathToFileURL(aboutFile).href
        ) {
          contents.send(ABOUT_CHANNELS.appearanceChanged, appearance);
        }
      })
      .catch(error => log.warn('about.theme.failed', error));
  };
  nativeTheme.on('updated', themeChanged);
  contents.on('console-message', details => {
    const level = details.level === 'warning' ? 'warn' : details.level;
    log[level]('about.renderer', details.message);
  });
  contents.once('destroyed', () => {
    nativeTheme.removeListener('updated', themeChanged);
    for (const channel of [
      ABOUT_CHANNELS.state,
      ABOUT_CHANNELS.appearance,
      ABOUT_CHANNELS.copyText,
      ABOUT_CHANNELS.reportBug,
      ABOUT_CHANNELS.revealLogs
    ]) {
      ipc.removeHandler(channel);
    }
    ipc.removeListener(ABOUT_CHANNELS.close, close);
    ipc.removeListener(ABOUT_CHANNELS.ready, ready);
  });
}

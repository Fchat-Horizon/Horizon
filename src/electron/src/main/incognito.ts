/**
 * @module incognito
 * Opens links in the user's browser in incognito/private mode. Lives in the
 * main process because it shells out (registry queries, .desktop parsing)
 * and reads the filesystem; renderers trigger it over 'open-incognito'.
 */

import * as electron from 'electron';
import { createLogger } from '@horizon/shared/logger';
const log = createLogger('incognito');
import { execFileSync, execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { GeneralSettings } from '@horizon/shared/common';

let getSettings: (() => GeneralSettings) | undefined;

let browser: string | undefined;
let executablePath: string | undefined;

function openIncognitoWindows(url: string): void {
  const settings = getSettings!();
  if (settings.browserPath && settings.browserPath.length > 0) {
    executablePath = settings.browserPath;
    log.debug('incognito.open.customPath', executablePath);
  } else if (executablePath === undefined) {
    executablePath =
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe';
    if (browser === undefined)
      try {
        //tslint:disable-next-line:max-line-length
        browser = execSync(
          `FOR /F "skip=2 tokens=3" %A IN ('REG QUERY HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice /v ProgId') DO @(echo %A)`
        )
          .toString()
          .trim();
      } catch (e) {
        log.error(e);
      }

    log.debug('incognito.open.win32.ProgId', browser);

    try {
      let ftypeAssocmd = execSync(`ftype ${browser}`).toString().trim();
      log.verbose('incognito.open.win32.ftype', ftypeAssocmd);
      let match = ftypeAssocmd.match(/"([^"]+\.exe)"/);
      if (match?.[1]) executablePath = match?.[1];
    } catch (e) {
      log.error('incognito.open.win32.ftype.error', e);

      // Fallback: Query registry directly for modern ProgIds (like Vivaldi)
      try {
        const regQuery = execSync(
          `REG QUERY "HKEY_CLASSES_ROOT\\${browser}\\shell\\open\\command" /ve`,
          { encoding: 'utf8' }
        ).toString();
        const regMatch = regQuery.match(/"([^"]+\.exe)"/);
        if (regMatch?.[1]) {
          executablePath = regMatch[1];
          log.debug('incognito.open.win32.registry.fallback', executablePath);
        }
      } catch (regError) {
        log.error('incognito.open.win32.registry.error', regError);
      }
    }

    log.debug('incognito.open.exePath', executablePath);
  }
  let incognitoArg: string = '-incognito';

  switch (path.basename(executablePath).toLowerCase()) {
    case 'chrome.exe':
    case 'chromeapp.exe':
    case 'brave.exe':
    case 'vivaldi.exe':
      incognitoArg = '-incognito';
      break;
    case 'msedge.exe':
      incognitoArg = '-inprivate';
      break;
    case 'firefox.exe':
    case 'floorp.exe':
    case 'librewolf.exe':
    case 'waterfox.exe':
    case 'palemoon.exe':
    case 'zen.exe':
      incognitoArg = '-private-window';
      break;
    case 'opera.exe':
      incognitoArg = '-private';
      break;
  }

  spawn(executablePath, [incognitoArg, url]);
}

function resolveExecutable(cmd: string): string {
  if (path.isAbsolute(cmd)) return cmd;
  try {
    const resolved = execFileSync('which', [cmd], { encoding: 'utf8' })
      .trim()
      .split('\n')[0];
    if (resolved) return resolved;
  } catch {
    // Ignore: fall through and try spawn with the raw token.
  }
  return cmd;
}

const LINUX_INCOGNITO_FLAGS: Record<string, string> = {
  chrome: '--incognito',
  'google-chrome': '--incognito',
  'google-chrome-stable': '--incognito',
  'google-chrome-beta': '--incognito',
  'google-chrome-unstable': '--incognito',
  chromium: '--incognito',
  'chromium-browser': '--incognito',
  brave: '--incognito',
  'brave-browser': '--incognito',
  vivaldi: '--incognito',
  'vivaldi-stable': '--incognito',
  'vivaldi-snapshot': '--incognito',

  'microsoft-edge': '--inprivate',
  'microsoft-edge-stable': '--inprivate',
  'microsoft-edge-beta': '--inprivate',
  'microsoft-edge-dev': '--inprivate',

  // Firefox flag is the default fallback, kept explicit.
  firefox: '-private-window',
  'firefox-bin': '-private-window',
  'firefox-esr': '-private-window',
  librewolf: '-private-window',
  waterfox: '-private-window',
  palemoon: '-private-window',
  zen: '-private-window',
  icecat: '-private-window',
  floorp: '-private-window',

  opera: '--private',
  'opera-beta': '--private',
  'opera-developer': '--private'
};

function extractExecCommand(desktopFilePath: string): string | undefined {
  try {
    const desktopFile = fs.readFileSync(desktopFilePath, { encoding: 'utf8' });
    const match = desktopFile.match(/^\s*Exec\s*=\s*(.+)$/m);
    if (!match) return undefined;

    // Remove desktop entry field codes (%u, %U, etc.) per spec.
    const execValue = match[1].replace(/%[a-zA-Z]/g, '').trim();
    const tokens = execValue.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];

    return tokens.find(
      token =>
        token !== 'env' &&
        !/^[A-Za-z_][A-Za-z0-9_]*=/.test(token) &&
        token.length > 0
    );
  } catch (err) {
    log.error('incognito.open.linux.exec.read.error', desktopFilePath, err);
    return undefined;
  }
}

function openIncognitoLinux(url: string): void {
  let desktopId: string | undefined;
  try {
    desktopId = execFileSync('xdg-settings', ['get', 'default-web-browser'], {
      encoding: 'utf8'
    }).trim();
  } catch (err) {
    log.error('incognito.open.linux.desktopId.error', err);
  }

  const candidatePaths =
    desktopId === undefined
      ? []
      : [
          // ^ User locations first: they take priority per the freedesktop spec.
          path.join(os.homedir(), '.local/share/applications', desktopId),
          path.join(
            os.homedir(),
            '.local/share/flatpak/exports/share/applications',
            desktopId
          ),
          path.join('/usr/local/share/applications', desktopId),
          path.join('/usr/share/applications', desktopId),

          path.join(
            '/usr/local/share/flatpak/exports/share/applications',
            desktopId
          ),
          path.join('/var/lib/flatpak/exports/share/applications', desktopId),
          path.join('/var/lib/snapd/desktop/applications', desktopId)
        ];
  const desktopFilePath = candidatePaths.find(p => fs.existsSync(p));
  let browserCommand = desktopFilePath
    ? extractExecCommand(desktopFilePath)
    : undefined;

  if (!browserCommand) {
    log.warn(
      'incognito.open.linux.fallback',
      desktopId,
      desktopFilePath ?? 'no desktop file found'
    );

    // ! Last resort: fall back to Firefox.
    browserCommand = 'firefox';
  }

  const resolvedCommand = resolveExecutable(browserCommand);

  log.debug('incognito.open.linux.browserCommand', resolvedCommand);

  const incognitoArg =
    LINUX_INCOGNITO_FLAGS[path.basename(browserCommand).toLowerCase()] ??
    '-private-window';

  spawn(resolvedCommand, [incognitoArg, url]);
}

let initialized = false;

export function initIncognito(opts: { getSettings(): GeneralSettings }): void {
  if (initialized) return;
  initialized = true;
  getSettings = opts.getSettings;

  electron.ipcMain.on('open-incognito', (_e, url: string) => {
    if (!/^https?:/i.test(url)) return;
    if (process.platform === 'win32') openIncognitoWindows(url);
    else if (process.platform === 'linux') openIncognitoLinux(url);
  });
}

/**
 * @license
 * Originally licensed under MIT License
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
 * ---
 *
 * This file is now also licensed under GPLv3 (see LICENSE file).
 * Modifications made after the original MIT release are licensed under GPLv3.
 *
 * This license header applies to this file and all of the non-third-party assets it includes.
 * @file The entry point for the Electron renderer of F-Chat 3.0.
 * @copyright 2018 F-List
 * @author Maya Wolf <maya@f-list.net>
 * @version 3.0
 * @see {@link https://github.com/f-list/exported|GitHub repo}
 */

import * as electron from 'electron';

import * as remote from '@electron/remote';
const webContents = remote.getCurrentWebContents();

// tslint:disable-next-line:no-require-imports no-submodule-imports
require('@electron/remote/main').enable(webContents);

import Axios from 'axios';
import { exec, execSync, spawn } from 'child_process';
import * as path from 'path';
import * as qs from 'querystring';
import { getKey } from '../chat/common';
import { EventBus } from '../chat/preview/event-bus';
import { init as initCore } from '../chat/core';
import l, { setLanguage } from '../chat/localize';
// import {setupRaven} from '../chat/vue-raven';
import Socket from '../chat/WebSocket';
import Connection from '../fchat/connection';
import { Keys } from '../keys';
import { GeneralSettings /*, nativeRequire*/ } from './common';
import { Logs, SettingsStore } from './filesystem';
import Notifications from './notifications';
import { handleStartupImport } from './services';
import Index from './Index.vue';
import log from 'electron-log'; // tslint:disable-line: match-default-export-name
import { WordPosSearch } from '../learn/dictionary/word-pos-search';
import { MenuItemConstructorOptions } from 'electron/main';
import { match } from 'assert';

log.debug('init.chat');

document.addEventListener(
  'keydown',
  process.platform !== 'darwin'
    ? (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && getKey(e) === Keys.KeyI)
          remote.getCurrentWebContents().toggleDevTools();
      }
    : (e: KeyboardEvent) => {
        if (e.metaKey && e.altKey && getKey(e) === Keys.KeyI)
          remote.getCurrentWebContents().toggleDevTools();
      }
);

/* process.env.SPELLCHECKER_PREFER_HUNSPELL = '1';
const sc = nativeRequire<{
    Spellchecker: new() => {
        add(word: string): void
        remove(word: string): void
        isMisspelled(x: string): boolean
        setDictionary(name: string | undefined, dir: string): void
        getCorrectionsForMisspelling(word: string): ReadonlyArray<string>
    }
}>('spellchecker/build/Release/spellchecker.node');
const spellchecker = new sc.Spellchecker();*/

Axios.defaults.params = { __fchat: `desktop/${remote.app.getVersion()}` };

if (process.env.NODE_ENV === 'production') {
  // setupRaven('https://a9239b17b0a14f72ba85e8729b9d1612@sentry.f-list.net/2', remote.app.getVersion());

  remote.getCurrentWebContents().on('devtools-opened', () => {
    console.log(
      `%c${l('consoleWarning.head')}`,
      'background: red; color: yellow; font-size: 30pt'
    );
    console.log(`%c${l('consoleWarning.body')}`, 'font-size: 16pt; color:red');
  });
}
let browser: string | undefined;
let executablePath: string | undefined;

//If this were available on non-Windows platforms, getting the values for browser and exec would require using $PATH and whereis
function openIncognito(url: string): void {
  if (settings.browserPath && settings.browserPath.length > 0) {
    executablePath = settings.browserPath;
    log.debug('incognito.open.customPath', executablePath);
  } else if (executablePath === undefined) {
    //Default to Edge path
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
        console.error(e);
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
  //"Everything is chrome in the future!" -🧽
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

const wordPosSearch = new WordPosSearch();

webContents.on('context-menu', (_, props) => {
  const hasText = props.selectionText.trim().length > 0;
  const can = (type: string) =>
    (<Electron.EditFlags & { [key: string]: boolean }>props.editFlags)[
      `can${type}`
    ] && hasText;

  const menuTemplate: Electron.MenuItemConstructorOptions[] = [];
  if (hasText || props.isEditable)
    menuTemplate.push({
      id: 'copy',
      label: l('action.copy'),
      role: can('Copy') ? 'copy' : undefined,
      accelerator: 'CmdOrCtrl+C',
      enabled: can('Copy')
    });
  if (props.isEditable)
    menuTemplate.push(
      {
        id: 'cut',
        label: l('action.cut'),
        role: can('Cut') ? 'cut' : undefined,
        accelerator: 'CmdOrCtrl+X',
        enabled: can('Cut')
      },
      {
        id: 'paste',
        label: l('action.paste'),
        role: props.editFlags.canPaste ? 'paste' : undefined,
        accelerator: 'CmdOrCtrl+V',
        enabled: props.editFlags.canPaste
      },
      {
        id: 'delete',
        label: l('action.delete'),
        role: props.editFlags.canDelete ? 'delete' : undefined,
        enabled: props.editFlags.canDelete
      },
      {
        id: 'selectAll',
        label: l('action.selectAll'),
        role: props.editFlags.canSelectAll ? 'selectAll' : undefined,
        accelerator: 'CmdOrCtrl+A',
        enabled: props.editFlags.canSelectAll
      }
    );
  else if (
    props.linkURL.length > 0 &&
    props.linkURL.substr(0, props.pageURL.length) !== props.pageURL
  ) {
    if (props.mediaType === 'none') {
      menuTemplate.push({
        id: 'toggleStickyness',
        label: l('action.toggleStickyPreview'),
        click(): void {
          EventBus.$emit('imagepreview-toggle-stickyness', {
            url: props.linkURL
          });
        }
      });
    }
    menuTemplate.push({
      id: 'copyLink',
      label: l('action.copyLink'),
      click(): void {
        if (process.platform === 'darwin')
          electron.clipboard.writeBookmark(props.linkText, props.linkURL);
        else electron.clipboard.writeText(props.linkURL);
      }
    });

    if (process.platform === 'win32')
      menuTemplate.push({
        id: 'incognito',
        label: l('action.incognito'),
        click: () => openIncognito(props.linkURL)
      });
  } else if (hasText)
    menuTemplate.push({
      label: l('action.copyWithoutBBCode'),
      enabled: can('Copy'),
      accelerator: 'CmdOrCtrl+Shift+C',
      click: () => electron.clipboard.writeText(props.selectionText)
    });
  if (props.misspelledWord !== '') {
    const corrections = props.dictionarySuggestions; //spellchecker.getCorrectionsForMisspelling(props.misspelledWord);
    menuTemplate.unshift(
      {
        label: l('spellchecker.add'),
        click: () =>
          electron.ipcRenderer.send('dictionary-add', props.misspelledWord)
      },
      { type: 'separator' }
    );
    if (corrections.length > 0)
      menuTemplate.unshift(
        ...corrections.map((correction: string) => ({
          label: correction,
          click: () => webContents.replaceMisspelling(correction)
        }))
      );
    else
      menuTemplate.unshift({
        enabled: false,
        label: l('spellchecker.noCorrections')
      });
  } else if (settings.customDictionary.indexOf(props.selectionText) !== -1)
    menuTemplate.unshift(
      {
        label: l('spellchecker.remove'),
        click: () =>
          electron.ipcRenderer.send('dictionary-remove', props.selectionText)
      },
      { type: 'separator' }
    );

  const lookupWord = props.selectionText || wordPosSearch.getLastClickedWord();

  if (connection.isOpen && connection.character && lookupWord) {
    menuTemplate.unshift(
      {
        label: `Look up '${lookupWord}'`,
        click: async () => {
          EventBus.$emit('word-definition', {
            lookupWord,
            x: props.x,
            y: props.y
          });
        }
      },
      { type: 'separator' }
    );
  }

  if (
    connection.isOpen &&
    props.srcURL.startsWith('https://static.f-list.net/images/eicon/')
  ) {
    let eiconName = props.titleText;
    //Electron on Mac allows for header context menu items, so we use that instead of a disabled item split of by a seperator.
    menuTemplate.unshift(
      {
        label: eiconName,
        enabled: false,
        type: process.platform === 'darwin' ? 'header' : 'normal'
      },
      ...(process.platform === 'darwin'
        ? []
        : [
            {
              type: 'separator'
            } as MenuItemConstructorOptions
          ]),
      {
        label: l('action.eicon.copy'),
        click: () => {
          electron.clipboard.writeText(eiconName);
        }
      },
      {
        label: l('action.eicon.copyBbcode'),

        click: () => {
          electron.clipboard.writeText(`[eicon]${eiconName}[/eicon]`);
        }
      },
      {
        label: l('eicon.addToFavorites'),
        click: async () => {
          EventBus.$emit('eicon-pinned', {
            eicon: eiconName
          });
        }
      }
    );
  }

  if (menuTemplate.length > 0)
    remote.Menu.buildFromTemplate(menuTemplate).popup({});

  log.debug('context.text', {
    linkText: props.linkText,
    misspelledWord: props.misspelledWord,
    selectionText: props.selectionText,
    titleText: props.titleText
  });
});

let dictDir = path.join(remote.app.getPath('userData'), 'spellchecker');

if (process.platform === 'win32')
  //get the path in DOS (8-character) format as special characters cause problems otherwise
  exec(
    `for /d %I in ("${dictDir}") do @echo %~sI`,
    (_, stdout) => (dictDir = stdout.trim())
  );

// electron.webFrame.setSpellCheckProvider(
// '', {spellCheck: (words, callback) => callback(words.filter((x) => spellchecker.isMisspelled(x)))});

function onSettings(s: GeneralSettings): void {
  settings = s;

  log.transports.file.level = settings.risingSystemLogLevel;
  log.transports.console.level = settings.risingSystemLogLevel;

  // spellchecker.setDictionary(s.spellcheckLang, dictDir);
  // for(const word of s.customDictionary) spellchecker.add(word);

  // Apply display language live when settings change
  try {
    setLanguage(settings.displayLanguage);
  } catch (e) {
    console.warn('Failed to apply display language', e);
  }
}

electron.ipcRenderer.on(
  'settings',
  (_: Electron.IpcRendererEvent, s: GeneralSettings) => onSettings(s)
);

const params = <{ [key: string]: string | undefined }>(
  qs.parse(window.location.search.substr(1))
);
let settings = <GeneralSettings>JSON.parse(params['settings']!);

log.info(
  '[chat.ts] params[import]:',
  params['import'],
  'type:',
  typeof params['import']
);

if (params['import'] !== undefined && params['import'] !== '') {
  log.info('[chat.ts] Calling handleStartupImport');
  handleStartupImport(settings, params['import'])
    .then(updatedSettings => {
      settings = updatedSettings;
      onSettings(settings);
    })
    .catch(err => {
      log.error('Startup import error:', err);
    });
} else {
  log.info('[chat.ts] Skipping import, calling onSettings directly');
  onSettings(settings);
}

// Apply UI language early (fallback handled in setLanguage)
try {
  setLanguage(settings.displayLanguage);
} catch (e) {
  console.warn('Failed to apply display language', e);
}

log.debug('init.chat.core');

const connection = new Connection(
  `Horizon (${process.platform})`,
  remote.app.getVersion(),
  Socket
);
initCore(connection, settings, Logs, SettingsStore, Notifications);

log.debug('init.chat.vue');

//tslint:disable-next-line:no-unused-expression
new Index({
  el: '#app',
  data: {
    settings,
    hasCompletedUpgrades: JSON.parse(params['hasCompletedUpgrades']!)
  }
});

log.debug('init.chat.vue.done');

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
 * @file The entry point for the Electron renderer of F-Chat 3.0.
 * @copyright 2018-2026 Dragonfruit Ventures, LLC
 * @copyright 2024-2026 Sylvia Roselie & Respective Horizon Contributors
 * @version 1.0
 * @see {@link https://github.com/Fchat-Horizon/Horizon|GitHub repo}
 * @author Maya Wolf <maya@f-list.net>
 * @version 3.0
 * @see {@link https://github.com/f-list/exported|GitHub repo}
 */

import { ipcRenderer, clipboard } from './host-bridge';

import Axios from 'axios';
import { getKey } from '../chat/common';
import { EventBus } from '../chat/preview/event-bus';
import { init as initCore } from '../chat/core';
import l, { setLanguage } from '../chat/localize';
import Socket from '../chat/WebSocket';
import Connection from '../fchat/connection';
import { Keys } from '../keys';
import { GeneralSettings /*, nativeRequire*/ } from './common';
import { Logs, SettingsStore } from './filesystem';
import Notifications from './notifications';
import { handleStartupImport } from './services';
import Index from './Index.vue';
import electronLog from 'electron-log/renderer';
import {
  installElectronLogging,
  applySharedLogLevel,
  applyHumanReadableLogs
} from './logging';
import { installRendererPlatform } from './platform-host';
import { createLogger } from '../logger';
const log = createLogger('chat');
import { WordPosSearch } from '../learn/dictionary/word-pos-search';
import { MenuItemConstructorOptions } from 'electron/main';

installElectronLogging(electronLog);
installRendererPlatform();
log.debug('init.chat');

const appVersion = <string>ipcRenderer.sendSync('app-version-sync');

document.addEventListener(
  'keydown',
  process.platform !== 'darwin'
    ? (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && getKey(e) === Keys.KeyI)
          ipcRenderer.send('toggle-devtools');
      }
    : (e: KeyboardEvent) => {
        if (e.metaKey && e.altKey && getKey(e) === Keys.KeyI)
          ipcRenderer.send('toggle-devtools');
      }
);

Axios.defaults.params = { __fchat: `desktop/${appVersion}` };

if (process.env.NODE_ENV === 'production') {
  ipcRenderer.on('devtools-opened', () => {
    console.log(
      `%c${l('consoleWarning.head')}`,
      'background: red; color: yellow; font-size: 30pt'
    );
    console.log(`%c${l('consoleWarning.body')}`, 'font-size: 16pt; color:red');
  });
}
const wordPosSearch = new WordPosSearch();

/*
 * Context menus are popped up by the main process: it forwards the
 * 'context-menu' webContents event here as 'context-menu-request', this
 * handler builds a serializable template (click handlers are kept locally and
 * keyed by id), and clicks come back over 'context-menu-action'.
 */
let contextMenuHandlers = new Map<string, () => void>();

ipcRenderer.on('context-menu-action', (_e, id: string) => {
  const handler = contextMenuHandlers.get(id);
  if (handler !== undefined) handler();
});

function popupContextMenu(
  template: Electron.MenuItemConstructorOptions[]
): void {
  contextMenuHandlers = new Map();
  let nextId = 0;
  const serialized = template.map(item => {
    const { click, ...rest } = item;
    if (click === undefined) return rest;
    const id = `ctx-${nextId++}`;
    contextMenuHandlers.set(id, click as () => void);
    return { ...rest, id };
  });
  ipcRenderer.send('show-context-menu', serialized);
}

ipcRenderer.on(
  'context-menu-request',
  (_event, props: Electron.ContextMenuParams) => {
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
      props.linkURL.slice(0, props.pageURL.length) !== props.pageURL
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
        id: 'openLink',
        label: l('action.openBrowser'),
        click(): void {
          ipcRenderer.send('open-url-externally', props.linkURL);
        }
      });
      menuTemplate.push({
        id: 'copyLink',
        label: l('action.copyLink'),
        click(): void {
          if (process.platform === 'darwin')
            clipboard.writeBookmark(props.linkText, props.linkURL);
          else clipboard.writeText(props.linkURL);
        }
      });

      if (process.platform === 'win32' || process.platform === 'linux')
        menuTemplate.push({
          id: 'incognito',
          label: l('action.incognito'),
          click: () => ipcRenderer.send('open-incognito', props.linkURL)
        });
    } else if (hasText)
      menuTemplate.push({
        label: l('action.copyWithoutBBCode'),
        enabled: can('Copy'),
        accelerator: 'CmdOrCtrl+Shift+C',
        click: () => clipboard.writeText(props.selectionText)
      });
    if (props.misspelledWord !== '') {
      const corrections = props.dictionarySuggestions; //spellchecker.getCorrectionsForMisspelling(props.misspelledWord);
      menuTemplate.unshift(
        {
          label: l('spellchecker.add'),
          click: () => ipcRenderer.send('dictionary-add', props.misspelledWord)
        },
        { type: 'separator' }
      );
      if (corrections.length > 0)
        menuTemplate.unshift(
          ...corrections.map((correction: string) => ({
            label: correction,
            click: () => ipcRenderer.send('replace-misspelling', correction)
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
            ipcRenderer.send('dictionary-remove', props.selectionText)
        },
        { type: 'separator' }
      );

    const lookupWord =
      props.selectionText || wordPosSearch.getLastClickedWord();

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
            clipboard.writeText(eiconName);
          }
        },
        {
          label: l('action.eicon.copyBbcode'),

          click: () => {
            clipboard.writeText(`[eicon]${eiconName}[/eicon]`);
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

    if (menuTemplate.length > 0) popupContextMenu(menuTemplate);

    log.debug('context.text', {
      linkText: props.linkText,
      misspelledWord: props.misspelledWord,
      selectionText: props.selectionText,
      titleText: props.titleText
    });
  }
);

// electron.webFrame.setSpellCheckProvider(
// '', {spellCheck: (words, callback) => callback(words.filter((x) => spellchecker.isMisspelled(x)))});

function onSettings(s: GeneralSettings): void {
  settings = s;

  applySharedLogLevel(settings.risingSystemLogLevel);
  applyHumanReadableLogs(!!settings.horizonHumanReadableLogs);

  // spellchecker.setDictionary(s.spellcheckLang, dictDir);
  // for(const word of s.customDictionary) spellchecker.add(word);

  // Apply display language live when settings change
  try {
    setLanguage(settings.displayLanguage);
  } catch (e) {
    console.warn('Failed to apply display language', e);
  }
}

ipcRenderer.on('settings', (_: Electron.IpcRendererEvent, s: GeneralSettings) =>
  onSettings(s)
);

const params = <{ [key: string]: string | undefined }>(
  Object.fromEntries(new URLSearchParams(window.location.search.slice(1)))
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
  appVersion,
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

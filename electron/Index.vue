<template>
  <div
    @mouseover="onMouseOver"
    id="page"
    style="position: relative; padding-top: 5px; overflow: clip"
    :class="getThemeClass()"
    @auxclick.prevent
    @click.middle="unpinUrlPreview"
  >
    <div v-html="styling"></div>
    <div
      v-if="!characters"
      style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
      "
    >
      <div class="card bg-light" style="width: 400px">
        <div
          class="initializer"
          :class="{
            visible: !hasCompletedUpgrades,
            complete: hasCompletedUpgrades,
            shouldShow: shouldShowSpinner
          }"
        >
          <div class="title">
            Getting ready, please wait...
            <small
              >You should only experience this delay once per software
              update</small
            >
          </div>
          <i class="fas fa-circle-notch fa-spin search-spinner"></i>
        </div>

        <BBCodeTester v-show="false"></BBCodeTester>

        <h3 class="card-header" style="margin-top: 0; display: flex">
          {{ l('title') }}

          <a
            href="#"
            @click.prevent="showLogs()"
            class="btn"
            style="flex: 1; text-align: right"
          >
            <span class="fa fa-file-alt"></span>
            <span class="btn-text">{{ l('logs.title') }}</span>
          </a>
        </h3>
        <div class="card-body">
          <div class="alert alert-danger" v-show="error">
            {{ error }}
          </div>
          <div class="mb-3">
            <label class="control-label" for="account">{{
              l('login.account')
            }}</label>
            <input
              class="form-control"
              id="account"
              v-model="settings.account"
              @keypress.enter="login()"
              :disabled="loggingIn"
            />
          </div>
          <div class="mb-3">
            <label class="control-label" for="password">{{
              l('login.password')
            }}</label>
            <input
              class="form-control"
              type="password"
              id="password"
              v-model="password"
              @keypress.enter="login()"
              :disabled="loggingIn"
            />
          </div>
          <div class="mb-3" v-show="showAdvanced">
            <label class="control-label" for="host">{{
              l('login.host')
            }}</label>
            <div class="input-group">
              <input
                class="form-control"
                id="host"
                v-model="settings.host"
                @keypress.enter="login()"
                :disabled="loggingIn"
              />
              <div class="input-group-append">
                <button class="btn btn-outline-secondary" @click="resetHost()">
                  <span class="fas fa-undo-alt"></span>
                </button>
              </div>
            </div>
            <div style="height: 8px"></div>
            <label class="control-label" for="proxy">{{
              l('login.proxy')
            }}</label>
            <div class="input-group">
              <input
                class="form-control"
                id="proxy"
                v-model="settings.proxy"
                @keypress.enter="login()"
              />
              <div class="input-group-append">
                <button class="btn btn-outline-secondary" @click="resetProxy()">
                  <span class="fas fa-undo-alt"></span>
                </button>
              </div>
            </div>
          </div>
          <div class="mb-3">
            <div class="form-check">
              <input
                type="checkbox"
                class="form-check-input"
                id="advanced"
                v-model="showAdvanced"
              />
              <label class="form-check-label" for="advanced">
                {{ l('login.advanced') }}
              </label>
            </div>
          </div>
          <div class="mb-3">
            <div class="form-check">
              <input
                type="checkbox"
                class="form-check-input"
                id="save"
                v-model="saveLogin"
              />
              <label class="form-check-label" for="save">
                {{ l('login.save') }}
              </label>
            </div>
          </div>
          <div class="mb-3">
            <div class="form-check">
              <input
                type="checkbox"
                class="form-check-input"
                id="autoLogin"
                v-model="autoLogin"
                :disabled="!saveLogin"
                @change="onAutoLoginChange"
              />
              <label class="form-check-label" for="autoLogin">
                {{ l('login.auto') }}
              </label>
            </div>
          </div>
          <div class="mb-3" style="margin: 0; text-align: right">
            <button
              class="btn btn-primary"
              @click="login"
              :disabled="loggingIn"
            >
              {{ l(loggingIn ? 'login.working' : 'login.submit') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <chat
      v-else
      :ownCharacters="characters"
      :defaultCharacter="defaultCharacter"
      ref="chat"
    ></chat>
    <div ref="linkPreview" class="link-preview"></div>
    <modal :action="l('importer.importing')" ref="importModal" :buttons="false">
      <span style="white-space: pre-wrap">{{
        l('importer.importingNote')
      }}</span>
      <div class="progress" style="margin-top: 5px">
        <div
          class="progress-bar"
          :style="{ width: importProgress * 100 + '%' }"
        ></div>
      </div>
    </modal>
    <modal :buttons="false" ref="profileViewer" dialogClass="profile-viewer">
      <character-page
        :authenticated="true"
        :oldApi="true"
        :name="profileName"
        :image-preview="true"
        ref="characterPage"
      ></character-page>
      <template slot="title">
        {{ profileName }}
        <a class="btn" @click="openProfileInBrowser"
          ><i class="fa fa-external-link-alt"
        /></a>
        <a class="btn" @click="openConversation"
          ><i class="fa fa-comment"></i
        ></a>
        <a class="btn" @click="reloadCharacter"><i class="fa fa-sync" /></a>

        <i
          class="fas fa-circle-notch fa-spin profileRefreshSpinner"
          v-show="isRefreshingProfile()"
        ></i>

        <bbcode
          :text="profileStatus"
          v-show="!!profileStatus"
          class="status-text"
        ></bbcode>

        <div class="profile-title-right">
          <button
            class="btn"
            @click="prevProfile"
            :disabled="!prevProfileAvailable()"
          >
            <i class="fas fa-arrow-left fa-lg"></i>
          </button>
          <button
            class="btn"
            @click="nextProfile"
            :disabled="!nextProfileAvailable()"
          >
            <i class="fas fa-arrow-right fa-lg"></i>
          </button>
        </div>
      </template>
    </modal>
    <modal
      :action="l('fixLogs.action')"
      ref="fixLogsModal"
      @submit="fixLogs"
      buttonClass="btn-danger"
      iconClass="fas fa-file-half-dashed"
    >
      <span style="white-space: pre-wrap">{{ l('fixLogs.text') }}</span>
      <div class="mb-3">
        <label class="control-label">{{ l('fixLogs.character') }}</label>
        <select id="import" class="form-select" v-model="fixCharacter">
          <option v-for="character in fixCharacters" :value="character">
            {{ character }}
          </option>
        </select>
      </div>
    </modal>
    <modal
      :buttons="false"
      ref="wordDefinitionViewer"
      dialogClass="word-definition-viewer"
    >
      <word-definition
        :expression="wordDefinitionLookup"
        ref="wordDefinitionLookup"
      ></word-definition>
      <template slot="title">
        {{ wordDefinitionLookup }}
        <a
          class="btn wordDefBtn dictionary"
          @click="openDefinitionWithDictionary"
          ><i>D</i></a
        >
        <a class="btn wordDefBtn thesaurus" @click="openDefinitionWithThesaurus"
          ><i>T</i></a
        >
        <a
          class="btn wordDefBtn urbandictionary"
          @click="openDefinitionWithUrbanDictionary"
          ><i>UD</i></a
        >
        <a class="btn wordDefBtn wikipedia" @click="openDefinitionWithWikipedia"
          ><i>W</i></a
        >

        <a class="btn" @click="openWordDefinitionInBrowser"
          ><i class="fa fa-external-link-alt"
        /></a>
      </template>
    </modal>

    <logs ref="logsDialog"></logs>
    <ui-test ref="uiTestDialog" v-if="isDevMode"> </ui-test>
  </div>
</template>

<script lang="ts">
  import { Component, Hook, Watch } from '@f-list/vue-ts';
  import Axios from 'axios';
  import * as electron from 'electron';
  import * as remote from '@electron/remote';
  import settings from 'electron-settings';
  import log from 'electron-log'; //tslint:disable-line:match-default-export-name
  import * as fs from 'fs';
  import * as path from 'path';
  import * as qs from 'querystring';
  import Raven from 'raven-js';
  // import {promisify} from 'util';
  import Vue from 'vue';
  import Chat from '../chat/Chat.vue';
  import { getKey, Settings } from '../chat/common';
  import core /*, { init as initCore }*/ from '../chat/core';
  import l from '../chat/localize';
  import Logs from '../chat/Logs.vue';
  import UITest from '../chat/UITest.vue';
  import Socket from '../chat/WebSocket';
  import Modal from '../components/Modal.vue';
  import { SimpleCharacter } from '../interfaces';
  // import { BetterSqliteStore } from '../learn/store/better-sqlite3';
  // import { Sqlite3Store } from '../learn/store/sqlite3';
  import CharacterPage from '../site/character_page/character_page.vue';
  import WordDefinition from '../learn/dictionary/WordDefinition.vue';
  import ProfileAnalysis from '../learn/recommend/ProfileAnalysis.vue';
  import { defaultHost, GeneralSettings } from './common';
  import { fixLogs /*SettingsStore, Logs as FSLogs*/ } from './filesystem';
  import * as SlimcatImporter from './importer';
  import _ from 'lodash';
  import { EventBus } from '../chat/preview/event-bus';

  import BBCodeTester from '../bbcode/Tester.vue';
  import { BBCodeView } from '../bbcode/view';
  import { EIconStore } from '../learn/eicon/store';
  import { SecureStore } from './secure-store';

  // import ImagePreview from '../chat/preview/ImagePreview.vue';
  // import Bluebird from 'bluebird';
  // import Connection from '../fchat/connection';
  // import Notifications from './notifications';

  // import VueLazyload from 'vue-lazyload';
  //
  // Vue.use(VueLazyload, {
  //   observer: true,
  //
  //   observerOptions: {
  //     rootMargin: '0px',
  //     threshold: 0,
  //   }
  // });

  const webContents = remote.getCurrentWebContents();
  const parent = remote.getCurrentWindow().webContents;

  // Allow requests to imgur.com
  const session = remote.session;

  /* tslint:disable:no-unsafe-any no-any no-unnecessary-type-assertion */
  session!.defaultSession!.webRequest!.onBeforeSendHeaders(
    {
      urls: ['*://api.imgur.com/*', '*://i.imgur.com/*']
    },
    (details: any, callback: any) => {
      details.requestHeaders['Origin'] = null;
      details.headers['Origin'] = null;

      callback({ requestHeaders: details.requestHeaders });
    }
  );
  // log.info('init.chat.keytar.load.start');
  //
  /* tslint:disable: no-any no-unsafe-any */ //because this is hacky
  //

  // const keyStore = nativeRequire<
  //   {
  //     getPassword(service: string, account: string): Promise<string>
  //     setPassword(service: string, account: string, password: string): Promise<void>
  //     deletePassword(service: string, account: string): Promise<void>
  //     findCredentials(service: string): Promise<{ account: string, password: string }>
  //     findPassword(service: string): Promise<string>
  //     [key: string]: (...args: any[]) => Promise<any>
  //   }
  // >('keytar/build/Release/keytar.node');

  settings.configure({ electron: remote as any });
  const keyStore = new SecureStore('fchat-rising-accounts', remote, settings);

  // const keyStore = import('keytar');
  //
  // for(const key in keyStore) keyStore[key] = promisify(<(...args: any[]) => any>keyStore[key].bind(keyStore, 'fchat'));
  //tslint:enable

  // log.info('init.chat.keytar.load.done');

  @Component({
    components: {
      chat: Chat,
      modal: Modal,
      characterPage: CharacterPage,
      logs: Logs,
      'ui-test': UITest,
      'word-definition': WordDefinition,
      BBCodeTester: BBCodeTester,
      bbcode: BBCodeView(core.bbCodeParser),
      'profile-analysis': ProfileAnalysis
    }
  })
  export default class Index extends Vue {
    showAdvanced = false;
    saveLogin = false;
    autoLogin = false;
    loggingIn = false;
    password = '';
    character?: string;
    characters?: SimpleCharacter[];
    error = '';
    defaultCharacter?: number;
    l = l;
    settings!: GeneralSettings;
    hasCompletedUpgrades!: boolean;
    importProgress = 0;
    profileName = '';
    profileStatus = '';
    adName = '';
    fixCharacters: ReadonlyArray<string> = [];
    fixCharacter = '';
    wordDefinitionLookup = '';

    shouldShowSpinner = false;

    profileNameHistory: string[] = [];
    profilePointer = 0;
    isDevMode: boolean = process.env.NODE_ENV !== 'production';

    async startAndUpgradeCache(): Promise<void> {
      log.debug('init.chat.cache.start');

      const timer = setTimeout(() => {
        this.shouldShowSpinner = true;
      }, 250);

      void EIconStore.getSharedStore(); // intentionally background

      log.debug('init.eicons.update.done');

      clearTimeout(timer);

      parent.send('rising-upgrade-complete');
      electron.ipcRenderer.send('rising-upgrade-complete');

      this.hasCompletedUpgrades = true;
    }

    @Watch('profileName')
    onProfileNameChange(newName: string): void {
      if (this.profileNameHistory[this.profilePointer] !== newName) {
        this.profileNameHistory = _.takeRight(
          _.filter(
            _.take(this.profileNameHistory, this.profilePointer + 1),
            n => n !== newName
          ),
          30
        );

        this.profileNameHistory.push(newName);

        this.profilePointer = this.profileNameHistory.length - 1;
      }
    }

    @Hook('mounted')
    onMounted(): void {
      log.debug('init.chat.mounted');

      EventBus.$on('word-definition', (data: any) => {
        this.wordDefinitionLookup = data.lookupWord;

        if (!!data.lookupWord) {
          (<Modal>this.$refs.wordDefinitionViewer).show();
        }
      });
    }

    @Hook('created')
    async created(): Promise<void> {
      await this.startAndUpgradeCache();

      if (this.settings.account.length > 0) this.saveLogin = true;

      // load auto-login flag from global settings
      if (this.settings.horizonAutoLogin) this.autoLogin = true;

      this.password =
        (await keyStore.getPassword('f-list.net', this.settings.account)) || '';

      log.debug('init.chat.keystore.get.done');

      Vue.set(core.state, 'generalSettings', this.settings);
      webContents.setZoomLevel(this.settings.zoomLevel);

      electron.ipcRenderer.on(
        'settings',
        (_e: Electron.IpcRendererEvent, settings: GeneralSettings) => {
          log.debug('settings.update.index');
          let soundChanged =
            this.settings.soundTheme !== settings.soundTheme ||
            core.state.generalSettings.soundTheme !== settings.soundTheme;
          core.state.generalSettings = this.settings = settings;
          /*
          We have to do this after the settings change is applied to  this.settings &
          core.state.generalSettings because the initSounds function checks those values
          to determine which sounds to initialize.
          */
          if (soundChanged) {
            log.debug(
              'settings.update.index.reinitSounds',
              settings.soundTheme
            );
            core.notifications.initSounds([
              'attention',
              'login',
              'logout',
              'modalert',
              'newnote',
              'silence'
            ]);
          }
        }
      );

      electron.ipcRenderer.on(
        'open-profile',
        (_e: Electron.IpcRendererEvent, name: string) => {
          const profileViewer = <Modal>this.$refs['profileViewer'];

          this.openProfile(name);

          profileViewer.show();
        }
      );

      electron.ipcRenderer.on(
        'reopen-profile',
        (_e: Electron.IpcRendererEvent) => {
          if (
            this.profileNameHistory.length > 0 &&
            this.profilePointer < this.profileNameHistory.length &&
            this.profilePointer >= 0
          ) {
            const name = this.profileNameHistory[this.profilePointer];
            const profileViewer = <Modal>this.$refs['profileViewer'];

            if (this.profileName === name && profileViewer.isShown) {
              profileViewer.hide();
              return;
            }

            this.openProfile(name);
            profileViewer.show();
          }
        }
      );

      electron.ipcRenderer.on('fix-logs', async () => {
        this.fixCharacters = await core.settingsStore.getAvailableCharacters();
        this.fixCharacter = this.fixCharacters[0];
        (<Modal>this.$refs['fixLogsModal']).show();
      });

      electron.ipcRenderer.on('ui-test', () => {
        this.showUiTest();
      });

      electron.ipcRenderer.on('update-zoom', (_e, zoomLevel) => {
        webContents.setZoomLevel(zoomLevel);
        // log.info('INDEXVUE ZOOM UPDATE', zoomLevel);
      });

      electron.ipcRenderer.on('active-tab', () => {
        core.cache.setTabActive(true);
      });

      electron.ipcRenderer.on('inactive-tab', () => {
        core.cache.setTabActive(false);
      });

      log.debug('init.chat.listeners.done');

      // If auto-login is enabled globally and we have saved credentials, attempt to login
      // This will skip the login screen if successful.
      try {
        if (
          this.settings.horizonAutoLogin &&
          this.saveLogin &&
          this.settings.account.length > 0 &&
          this.password.length > 0
        ) {
          void this.login();
        }
      } catch (e) {
        // ignore
      }

      /*if (process.env.NODE_ENV !== 'production') {
                const dt = require('@vue/devtools');

                dt.connect();
            }*/
    }

    async login(): Promise<void> {
      if (this.loggingIn) return;
      this.loggingIn = true;

      // set proxy inside from the advanced option
      if (!!this.settings.proxy) {
        try {
          // Get the current BrowserWindow's session
          const currentWindow = remote.getCurrentWindow();
          await currentWindow.webContents.session.setProxy({
            proxyRules: this.settings.proxy, // Update dynamically if needed,
            proxyBypassRules: 'localhost,127.0.0.1',
            mode: 'fixed_servers'
          });
        } catch (e) {
          this.error = l('login.error.proxy');
          log.error('login.error.proxy', e);
          return;
        }
      } else {
        // deactivate the proxy
        try {
          const currentWindow = remote.getCurrentWindow();
          await currentWindow.webContents.session.setProxy({
            mode: 'direct'
          });
        } catch (_) {
          // Ignore error
        }
      }

      try {
        if (!this.saveLogin) {
          await keyStore.deletePassword('f-list.net', this.settings.account);
        }

        core.siteSession.setCredentials(this.settings.account, this.password);

        const data = <
          {
            ticket?: string;
            error: string;
            characters: { [key: string]: number };
            default_character: number;
          }
        >(
          await Axios.post(
            'https://www.f-list.net/json/getApiTicket.php',
            qs.stringify({
              account: this.settings.account,
              password: this.password,
              no_friends: true,
              no_bookmarks: true,
              new_character_list: true
            })
          )
        ).data;
        if (data.error !== '') {
          this.error = data.error;
          return;
        }
        if (this.saveLogin) {
          electron.ipcRenderer.send(
            'save-login',
            this.settings.account,
            this.settings.host,
            this.settings.proxy
          );
          await keyStore.setPassword(
            'f-list.net',
            this.settings.account,
            this.password
          );
        }
        Socket.host = this.settings.host;

        core.connection.onEvent('connecting', async () => {
          if (
            !electron.ipcRenderer.sendSync(
              'connect',
              core.connection.character
            ) &&
            process.env.NODE_ENV === 'production'
          ) {
            alert(l('login.alreadyLoggedIn'));
            return core.connection.close();
          }
          parent.send('connect', webContents.id, core.connection.character);
          this.character = core.connection.character;
          if (
            (await core.settingsStore.get('settings')) === undefined &&
            SlimcatImporter.canImportCharacter(core.connection.character)
          ) {
            if (!confirm(l('importer.importGeneral')))
              return core.settingsStore.set('settings', new Settings());
            (<Modal>this.$refs['importModal']).show(true);
            await SlimcatImporter.importCharacter(
              core.connection.character,
              progress => (this.importProgress = progress)
            );
            (<Modal>this.$refs['importModal']).hide();
          }
        });
        core.connection.onEvent('connected', () => {
          core.watch(
            () => core.conversations.hasNew,
            newValue => parent.send('has-new', webContents.id, newValue)
          );
          Raven.setUserContext({ username: core.connection.character });
        });
        core.connection.onEvent('closed', () => {
          if (this.character === undefined) return;
          electron.ipcRenderer.send('disconnect', this.character);
          this.character = undefined;
          parent.send('disconnect', webContents.id);
          Raven.setUserContext();
        });
        core.connection.setCredentials(this.settings.account, this.password);
        this.characters = Object.keys(data.characters)
          .map(name => ({ name, id: data.characters[name], deleted: false }))
          .sort((x, y) => x.name.localeCompare(y.name));
        this.defaultCharacter = data.default_character;
      } catch (e) {
        this.error = l('login.error');
        log.error('connect.error', e);
        if (process.env.NODE_ENV !== 'production') throw e;
      } finally {
        this.loggingIn = false;
      }
    }

    fixLogs(): void {
      if (!electron.ipcRenderer.sendSync('connect', this.fixCharacter))
        return alert(l('login.alreadyLoggedIn'));
      try {
        fixLogs(this.fixCharacter);
        alert(l('fixLogs.success'));
      } catch (e) {
        alert(l('fixLogs.error'));
        throw e;
      } finally {
        electron.ipcRenderer.send('disconnect', this.fixCharacter);
      }
    }

    resetHost(): void {
      this.settings.host = defaultHost;
    }

    resetProxy(): void {
      this.settings.proxy = '';
    }

    onAutoLoginChange(): void {
      // Only allow auto-login if saveLogin is enabled
      if (!this.saveLogin) {
        this.autoLogin = false;
      }

      if (this.settings) this.settings.horizonAutoLogin = this.autoLogin;
      // send updated general settings to main process
      electron.ipcRenderer.send('general-settings-update', this.settings);
    }

    onMouseOver(e: MouseEvent): void {
      const preview = <HTMLDivElement>this.$refs.linkPreview;
      if ((<HTMLElement>e.target).tagName === 'A') {
        const target = <HTMLAnchorElement>e.target;
        if (target.hostname !== '') {
          //tslint:disable-next-line:prefer-template
          preview.className =
            'link-preview ' +
            (e.clientX < window.innerWidth / 2 &&
            e.clientY > window.innerHeight - 150
              ? ' right'
              : '');
          preview.textContent = target.href;
          preview.style.display = 'block';
          return;
        }
      }
      preview.textContent = '';
      preview.style.display = 'none';
    }

    async openProfileInBrowser(): Promise<void> {
      electron.ipcRenderer.send(
        'open-url-externally',
        `https://www.f-list.net/c/${this.profileName}`
      );
      //await remote.shell.openExternal(`https://www.f-list.net/c/${this.profileName}`);

      // tslint:disable-next-line: no-any no-unsafe-any
      (this.$refs.profileViewer as any).hide();
    }

    openConversation(): void {
      //this.
      // this.profileName
      const character = core.characters.get(this.profileName);
      const conversation = core.conversations.getPrivate(character);

      conversation.show();

      // tslint:disable-next-line: no-any no-unsafe-any
      (this.$refs.profileViewer as any).hide();
    }

    isRefreshingProfile(): boolean {
      const cp = this.$refs.characterPage as CharacterPage;

      return cp && cp.refreshing;
    }

    reloadCharacter(): void {
      // tslint:disable-next-line: no-any no-unsafe-any
      (this.$refs.characterPage as any).reload();
    }

    getThemeClass(): Record<string, boolean> {
      // console.log('getThemeClassIndex', core.state.generalSettings?.risingDisableWindowsHighContrast);

      try {
        // Hack!
        if (process.platform === 'win32') {
          if (core.state.generalSettings?.risingDisableWindowsHighContrast) {
            document
              .querySelector('html')
              ?.classList.add('disableWindowsHighContrast');
          } else {
            document
              .querySelector('html')
              ?.classList.remove('disableWindowsHighContrast');
          }
        }

        return {
          [`theme-${core.state.settings.risingCharacterTheme || this.settings.theme}`]: true,
          colorblindMode: core.state.settings.risingColorblindMode,
          vanillaTextColors: this.settings.horizonVanillaTextColors,
          vanillaGenderColors: this.settings.horizonVanillaGenderColors,
          bbcodeGlow: this.settings.horizonBbcodeGlow,
          disableWindowsHighContrast:
            core.state.generalSettings?.risingDisableWindowsHighContrast ||
            false
        };
      } catch (err) {
        return { [`theme-${this.settings.theme}`]: true };
      }
    }

    nextProfile(): void {
      if (!this.nextProfileAvailable()) {
        return;
      }

      this.profilePointer++;

      this.openProfile(this.profileNameHistory[this.profilePointer]);
    }

    nextProfileAvailable(): boolean {
      return this.profilePointer < this.profileNameHistory.length - 1;
    }

    prevProfile(): void {
      if (!this.prevProfileAvailable()) {
        return;
      }

      this.profilePointer--;

      this.openProfile(this.profileNameHistory[this.profilePointer]);
    }

    prevProfileAvailable(): boolean {
      return this.profilePointer > 0;
    }

    openProfile(name: string) {
      this.profileName = name;

      const character = core.characters.get(name);

      this.profileStatus = character.statusText || '';
    }

    get styling(): string {
      try {
        return `<style id="themeStyle">${fs.readFileSync(path.join(__dirname, `themes/${(this.character != undefined && core.state.settings.risingCharacterTheme) || this.settings.theme}.css`), 'utf8').toString()}</style>`;
      } catch (e) {
        if (
          (<Error & { code: string }>e).code === 'ENOENT' &&
          this.settings.theme !== 'default'
        ) {
          this.settings.theme = 'default';
          return this.styling;
        }
        throw e;
      }
    }

    showLogs(): void {
      (<Logs>this.$refs['logsDialog']).show();
    }

    showUiTest(): void {
      (<UITest>this.$refs['uiTestDialog']).show();
    }

    async openDefinitionWithDictionary(): Promise<void> {
      (this.$refs.wordDefinitionLookup as any).setMode('dictionary');
    }

    async openDefinitionWithThesaurus(): Promise<void> {
      (this.$refs.wordDefinitionLookup as any).setMode('thesaurus');
    }

    async openDefinitionWithUrbanDictionary(): Promise<void> {
      (this.$refs.wordDefinitionLookup as any).setMode('urbandictionary');
    }

    async openDefinitionWithWikipedia(): Promise<void> {
      (this.$refs.wordDefinitionLookup as any).setMode('wikipedia');
    }

    async openWordDefinitionInBrowser(): Promise<void> {
      electron.ipcRenderer.send(
        'open-url-externally',
        (this.$refs.wordDefinitionLookup as any).getWebUrl()
      );
      //await remote.shell.openExternal((this.$refs.wordDefinitionLookup as any).getWebUrl());

      // tslint:disable-next-line: no-any no-unsafe-any
      (this.$refs.wordDefinitionViewer as any).hide();
    }

    unpinUrlPreview(e: Event): void {
      const imagePreview = (this.$refs['chat'] as Chat)
        ?.getChatView()
        ?.getImagePreview();

      // const imagePreview = this.$refs['imagePreview'] as ImagePreview;

      if (imagePreview && imagePreview.isVisible() && imagePreview.sticky) {
        e.stopPropagation();
        e.preventDefault();

        EventBus.$emit('imagepreview-toggle-stickyness', { force: true });
      }
    }
  }
</script>

<style lang="scss">
  html,
  body,
  #page {
    height: 100%;
  }

  a[href^='#']:not([draggable]) {
    -webkit-user-drag: none;
    -webkit-app-region: no-drag;
  }

  .profileRefreshSpinner {
    font-size: 12pt;
    opacity: 0.5;
  }

  .profile-viewer {
    .modal-title {
      width: 100%;
      position: relative;

      .profile-title-right {
        float: right;
        top: 0px;
        right: 0;
        position: absolute;
        .btn {
          border: none;
        }
      }

      .status-text {
        font-size: 12pt;
        display: block;
        max-height: 3em;
        overflow: auto;
      }
    }
  }

  .initializer {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    backdrop-filter: blur(3px) grayscale(35%);

    &.shouldShow {
      transition: all 0.25s;

      &.visible {
        opacity: 1;
      }
    }

    &.complete {
      pointer-events: none !important;
    }

    i {
      font-size: 130pt;
      top: 50%;
      right: 50%;
      transform: translate(-50%, -50%);
      width: fit-content;
    }

    .title {
      position: absolute;
      top: 0;
      background: rgba(147, 255, 215, 0.6);
      width: 100%;
      text-align: center;
      padding-top: 20px;
      padding-bottom: 20px;
      font-weight: bold;

      small {
        display: block;
        opacity: 0.8;
      }
    }
  }

  .btn.wordDefBtn {
    background-color: red;
    padding: 0.2rem 0.2rem;
    line-height: 90%;
    margin-right: 0.2rem;
    text-align: center;

    i {
      font-style: normal !important;
      color: white;
      font-weight: bold;
    }

    &.thesaurus {
      background-color: #f44725;
    }

    &.urbandictionary {
      background-color: #d96a36;

      i {
        color: #fadf4b;
        text-transform: lowercase;
        font-family: monospace;
      }
    }

    &.dictionary {
      background-color: #314ca7;
    }

    &.wikipedia {
      background-color: white;

      i {
        color: black;
        font-family: serif;
      }
    }
  }

  .modal {
    .word-definition-viewer {
      max-width: 50rem !important;
      width: 70% !important;
      min-width: 22rem !important;

      .modal-content {
        min-height: 75%;
      }

      .definition-wrapper {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        margin-left: 20px;
        margin-right: 20px;

        webview {
          height: 100%;
          padding-bottom: 10px;
        }
      }
    }
  }

  .disableWindowsHighContrast,
  .disableWindowsHighContrast * {
    forced-color-adjust: none;
  }
</style>

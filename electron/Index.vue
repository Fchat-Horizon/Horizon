<template>
  <div
    @mouseover="onMouseOver"
    id="page"
    style="position: relative; padding: 5px 10px 10px"
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
            @click.prevent="showLogs"
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
          <div class="form-group">
            <label class="control-label" for="account">{{
              l('login.account')
            }}</label>
            <input
              class="form-control"
              id="account"
              v-model="settings.account"
              @keypress.enter="login"
              :disabled="loggingIn"
            />
          </div>
          <div class="form-group">
            <label class="control-label" for="password">{{
              l('login.password')
            }}</label>
            <input
              class="form-control"
              type="password"
              id="password"
              v-model="password"
              @keypress.enter="login"
              :disabled="loggingIn"
            />
          </div>
          <div class="form-group" v-show="showAdvanced">
            <label class="control-label" for="host">{{
              l('login.host')
            }}</label>
            <div class="input-group">
              <input
                class="form-control"
                id="host"
                v-model="settings.host"
                @keypress.enter="login"
                :disabled="loggingIn"
              />
              <div class="input-group-append">
                <button class="btn btn-outline-secondary" @click="resetHost">
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
                @keypress.enter="login"
              />
              <div class="input-group-append">
                <button class="btn btn-outline-secondary" @click="resetProxy">
                  <span class="fas fa-undo-alt"></span>
                </button>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label for="advanced"
              ><input type="checkbox" id="advanced" v-model="showAdvanced" />
              {{ l('login.advanced') }}</label
            >
          </div>
          <div class="form-group">
            <label for="save"
              ><input type="checkbox" id="save" v-model="saveLogin" />
              {{ l('login.save') }}</label
            >
          </div>
          <div class="form-group" style="margin: 0; text-align: right">
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
      <template #title>
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
          v-show="isRefreshingProfile"
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
            :disabled="!prevProfileAvailable"
          >
            <i class="fas fa-arrow-left"></i>
          </button>
          <button
            class="btn"
            @click="nextProfile"
            :disabled="!nextProfileAvailable"
          >
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </template>
    </modal>
    <modal
      :action="l('fixLogs.action')"
      ref="fixLogsModal"
      @submit="fixLogs"
      buttonClass="btn-danger"
    >
      <span style="white-space: pre-wrap">{{ l('fixLogs.text') }}</span>
      <div class="form-group">
        <label class="control-label">{{ l('fixLogs.character') }}</label>
        <select id="import" class="form-control" v-model="fixCharacter">
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
      <template #title>
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
  </div>
</template>

<script lang="ts">
  import {
    defineComponent,
    ref,
    reactive,
    computed,
    watch,
    onMounted,
    nextTick
  } from 'vue';
  import Axios from 'axios';
  import * as electron from 'electron';
  import * as remote from '@electron/remote';
  import settings from 'electron-settings';
  import log from 'electron-log';
  import * as fs from 'fs';
  import * as path from 'path';
  import * as qs from 'querystring';
  import l from '../chat/localize';
  import Chat from '../chat/Chat.vue';
  import { getKey, Settings } from '../chat/common';
  import core from '../chat/core';
  import Logs from '../chat/Logs.vue';
  import Socket from '../chat/WebSocket';
  import Modal from '../components/Modal.vue';
  import { SimpleCharacter } from '../interfaces';
  import { Keys } from '../keys';
  import CharacterPage from '../site/character_page/character_page.vue';
  import WordDefinition from '../learn/dictionary/WordDefinition.vue';
  import ProfileAnalysis from '../learn/recommend/ProfileAnalysis.vue';
  import { defaultHost, GeneralSettings } from './common';
  import { fixLogs as fixLogsUtil } from './filesystem';
  import * as SlimcatImporter from './importer';
  import _ from 'lodash';
  import { EventBus } from '../chat/preview/event-bus';
  import BBCodeTester from '../bbcode/Tester.vue';
  import { BBCodeView } from '../bbcode/view';
  import { EIconStore } from '../learn/eicon/store';
  import { SecureStore } from './secure-store';

  const webContents = remote.getCurrentWebContents();
  const parent = remote.getCurrentWindow().webContents;
  const session = remote.session;

  settings.configure({ electron: remote as any });
  const keyStore = new SecureStore('fchat-rising-accounts', remote, settings);

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

  export default defineComponent({
    name: 'Index',
    components: {
      chat: Chat,
      modal: Modal,
      characterPage: CharacterPage,
      logs: Logs,
      'word-definition': WordDefinition,
      BBCodeTester: BBCodeTester,
      bbcode: BBCodeView(core.bbCodeParser),
      'profile-analysis': ProfileAnalysis
    },
    props: {
      settings: { type: Object as () => GeneralSettings, required: true },
      hasCompletedUpgrades: { type: Boolean, required: true }
    },
    setup(props) {
      // State
      const showAdvanced = ref(false);
      const saveLogin = ref(false);
      const loggingIn = ref(false);
      const password = ref('');
      const character = ref<string | undefined>();
      const characters = ref<SimpleCharacter[] | undefined>();
      const error = ref('');
      const defaultCharacter = ref<number | undefined>();
      const importProgress = ref(0);
      const profileName = ref('');
      const profileStatus = ref('');
      const adName = ref('');
      const fixCharacters = ref<ReadonlyArray<string>>([]);
      const fixCharacter = ref('');
      const wordDefinitionLookup = ref('');
      const shouldShowSpinner = ref(false);
      const profileNameHistory = ref<string[]>([]);
      const profilePointer = ref(0);

      // Refs for modals and components
      const chatRef = ref();
      const linkPreview = ref();
      const importModal = ref();
      const profileViewer = ref();
      const characterPage = ref();
      const fixLogsModal = ref();
      const wordDefinitionViewer = ref();
      const wordDefinitionLookupRef = ref();
      const logsDialog = ref();

      // Local settings state
      const settingsState = ref<GeneralSettings>({ ...props.settings });
      const hasCompletedUpgrades = ref(props.hasCompletedUpgrades);

      // Methods
      async function startAndUpgradeCache() {
        log.debug('init.chat.cache.start');
        const timer = setTimeout(() => {
          shouldShowSpinner.value = true;
        }, 250);

        void EIconStore.getSharedStore();

        log.debug('init.eicons.update.done');
        clearTimeout(timer);

        parent.send('rising-upgrade-complete');
        electron.ipcRenderer.send('rising-upgrade-complete');
        hasCompletedUpgrades.value = true;
      }

      watch(profileName, newName => {
        if (profileNameHistory.value[profilePointer.value] !== newName) {
          profileNameHistory.value = _.takeRight(
            _.filter(
              _.take(profileNameHistory.value, profilePointer.value + 1),
              n => n !== newName
            ),
            30
          );
          profileNameHistory.value.push(newName);
          profilePointer.value = profileNameHistory.value.length - 1;
        }
      });

      onMounted(() => {
        log.debug('init.chat.mounted');
        EventBus.$on('word-definition', (data: any) => {
          wordDefinitionLookup.value = data.lookupWord;
          if (!!data.lookupWord) {
            wordDefinitionViewer.value?.show();
          }
        });
      });

      // Created hook logic
      (async () => {
        await startAndUpgradeCache();

        if (settingsState.value.account.length > 0) saveLogin.value = true;

        password.value =
          (await keyStore.getPassword(
            'f-list.net',
            settingsState.value.account
          )) || '';

        log.debug('init.chat.keystore.get.done');

        core.state.generalSettings = settingsState.value;
        webContents.setZoomLevel(settingsState.value.zoomLevel);

        electron.ipcRenderer.on(
          'settings',
          (_e: Electron.IpcRendererEvent, newSettings: GeneralSettings) => {
            log.debug('settings.update.index');
            core.state.generalSettings = settingsState.value = newSettings;
          }
        );

        electron.ipcRenderer.on(
          'open-profile',
          (_e: Electron.IpcRendererEvent, name: string) => {
            openProfile(name);
            nextTick(() => profileViewer.value?.show());
          }
        );

        electron.ipcRenderer.on(
          'reopen-profile',
          (_e: Electron.IpcRendererEvent) => {
            if (
              profileNameHistory.value.length > 0 &&
              profilePointer.value < profileNameHistory.value.length &&
              profilePointer.value >= 0
            ) {
              const name = profileNameHistory.value[profilePointer.value];
              if (profileName.value === name && profileViewer.value?.isShown) {
                profileViewer.value.hide();
                return;
              }
              openProfile(name);
              nextTick(() => profileViewer.value?.show());
            }
          }
        );

        electron.ipcRenderer.on('fix-logs', async () => {
          fixCharacters.value =
            await core.settingsStore.getAvailableCharacters();
          fixCharacter.value = fixCharacters.value[0];
          nextTick(() => fixLogsModal.value?.show());
        });

        electron.ipcRenderer.on('update-zoom', (_e, zoomLevel) => {
          webContents.setZoomLevel(zoomLevel);
        });

        electron.ipcRenderer.on('active-tab', () => {
          core.cache.setTabActive(true);
        });

        electron.ipcRenderer.on('inactive-tab', () => {
          core.cache.setTabActive(false);
        });

        window.addEventListener('keydown', e => {
          const key = getKey(e);
          if (key === Keys.Tab && e.ctrlKey && !e.altKey) {
            parent.send(
              `${e.shiftKey ? 'previous' : 'switch'}-tab`,
              character.value
            );
          }
          if (
            (key === Keys.PageDown || key === Keys.PageUp) &&
            e.ctrlKey &&
            !e.altKey &&
            !e.shiftKey
          ) {
            parent.send(
              `${key === Keys.PageUp ? 'previous' : 'switch'}-tab`,
              character.value
            );
          }
        });

        log.debug('init.chat.listeners.done');
      })();

      async function login() {
        if (loggingIn.value) return;
        loggingIn.value = true;

        // set proxy inside from the advanced option
        if (!!settingsState.value.proxy) {
          try {
            const currentWindow = remote.getCurrentWindow();
            await currentWindow.webContents.session.setProxy({
              proxyRules: settingsState.value.proxy,
              proxyBypassRules: 'localhost,127.0.0.1',
              mode: 'fixed_servers'
            });
          } catch (e) {
            error.value = l('login.error.proxy');
            log.error('login.error.proxy', e);
            return;
          }
        } else {
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
          if (!saveLogin.value) {
            await keyStore.deletePassword(
              'f-list.net',
              settingsState.value.account
            );
          }

          core.siteSession.setCredentials(
            settingsState.value.account,
            password.value
          );

          const data = (
            await Axios.post(
              'https://www.f-list.net/json/getApiTicket.php',
              qs.stringify({
                account: settingsState.value.account,
                password: password.value,
                no_friends: true,
                no_bookmarks: true,
                new_character_list: true
              })
            )
          ).data;
          if (data.error !== '') {
            error.value = data.error;
            return;
          }
          if (saveLogin.value) {
            electron.ipcRenderer.send(
              'save-login',
              settingsState.value.account,
              settingsState.value.host,
              settingsState.value.proxy
            );
            await keyStore.setPassword(
              'f-list.net',
              settingsState.value.account,
              password.value
            );
          }
          Socket.host = settingsState.value.host;

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
            character.value = core.connection.character;
            if (
              (await core.settingsStore.get('settings')) === undefined &&
              SlimcatImporter.canImportCharacter(core.connection.character)
            ) {
              if (!confirm(l('importer.importGeneral')))
                return core.settingsStore.set('settings', new Settings());
              importModal.value?.show(true);
              await SlimcatImporter.importCharacter(
                core.connection.character,
                progress => (importProgress.value = progress)
              );
              importModal.value?.hide();
            }
          });
          core.connection.onEvent('connected', () => {
            core.watch(
              () => core.conversations.hasNew,
              newValue => parent.send('has-new', webContents.id, newValue)
            );
          });
          core.connection.onEvent('closed', () => {
            if (character.value === undefined) return;
            electron.ipcRenderer.send('disconnect', character.value);
            character.value = undefined;
            parent.send('disconnect', webContents.id);
          });
          core.connection.setCredentials(
            settingsState.value.account,
            password.value
          );
          characters.value = Object.keys(data.characters)
            .map(name => ({ name, id: data.characters[name], deleted: false }))
            .sort((x, y) => x.name.localeCompare(y.name));
          defaultCharacter.value = data.default_character;
        } catch (e) {
          error.value = l('login.error');
          log.error('connect.error', e);
          if (process.env.NODE_ENV !== 'production') throw e;
        } finally {
          loggingIn.value = false;
        }
      }

      function fixLogs() {
        if (!electron.ipcRenderer.sendSync('connect', fixCharacter.value))
          return alert(l('login.alreadyLoggedIn'));
        try {
          fixLogsUtil(fixCharacter.value);
          alert(l('fixLogs.success'));
        } catch (e) {
          alert(l('fixLogs.error'));
          throw e;
        } finally {
          electron.ipcRenderer.send('disconnect', fixCharacter.value);
        }
      }

      function resetHost() {
        settingsState.value.host = defaultHost;
      }

      function resetProxy() {
        settingsState.value.proxy = '';
      }

      function onMouseOver(e: MouseEvent) {
        const preview = linkPreview.value as HTMLDivElement;
        if ((e.target as HTMLElement).tagName === 'A') {
          const target = e.target as HTMLAnchorElement;
          if (target.hostname !== '') {
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

      async function openProfileInBrowser() {
        electron.ipcRenderer.send(
          'open-url-externally',
          `https://www.f-list.net/c/${profileName.value}`
        );
        profileViewer.value?.hide();
      }

      function openConversation() {
        const characterObj = core.characters.get(profileName.value);
        const conversation = core.conversations.getPrivate(characterObj);
        conversation.show();
        profileViewer.value?.hide();
      }

      const isRefreshingProfile = computed(() => {
        const cp = characterPage.value as any;
        return cp && cp.refreshing;
      });

      function reloadCharacter() {
        (characterPage.value as any)?.reload();
      }

      function getThemeClass() {
        try {
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
            [`theme-${core.state.settings.risingCharacterTheme || settingsState.value.theme}`]:
              true,
            colorblindMode: core.state.settings.risingColorblindMode,
            disableWindowsHighContrast:
              core.state.generalSettings?.risingDisableWindowsHighContrast ||
              false
          };
        } catch (err) {
          return { [`theme-${settingsState.value.theme}`]: true };
        }
      }

      function nextProfile() {
        if (!nextProfileAvailable.value) return;
        profilePointer.value++;
        openProfile(profileNameHistory.value[profilePointer.value]);
      }

      const nextProfileAvailable = computed(() => {
        return profilePointer.value < profileNameHistory.value.length - 1;
      });

      function prevProfile() {
        if (!prevProfileAvailable.value) return;
        profilePointer.value--;
        openProfile(profileNameHistory.value[profilePointer.value]);
      }

      const prevProfileAvailable = computed(() => {
        return profilePointer.value > 0;
      });

      function openProfile(name: string) {
        profileName.value = name;
        const characterObj = core.characters.get(name);
        profileStatus.value = characterObj.statusText || '';
      }

      const styling = computed(() => {
        try {
          return `<style id="themeStyle">${fs.readFileSync(path.join(__dirname, `themes/${(character.value != undefined && core.state.settings.risingCharacterTheme) || settingsState.value.theme}.css`), 'utf8').toString()}</style>`;
        } catch (e: any) {
          if (e.code === 'ENOENT' && settingsState.value.theme !== 'default') {
            settingsState.value.theme = 'default';
            return styling.value;
          }
          throw e;
        }
      });

      function showLogs() {
        logsDialog.value?.show();
      }

      async function openDefinitionWithDictionary() {
        (wordDefinitionLookupRef.value as any)?.setMode('dictionary');
      }
      async function openDefinitionWithThesaurus() {
        (wordDefinitionLookupRef.value as any)?.setMode('thesaurus');
      }
      async function openDefinitionWithUrbanDictionary() {
        (wordDefinitionLookupRef.value as any)?.setMode('urbandictionary');
      }
      async function openDefinitionWithWikipedia() {
        (wordDefinitionLookupRef.value as any)?.setMode('wikipedia');
      }
      async function openWordDefinitionInBrowser() {
        electron.ipcRenderer.send(
          'open-url-externally',
          (wordDefinitionLookupRef.value as any)?.getWebUrl()
        );
        wordDefinitionViewer.value?.hide();
      }

      function unpinUrlPreview(e: Event) {
        const imagePreview = chatRef.value?.getChatView()?.getImagePreview();
        if (imagePreview && imagePreview.isVisible() && imagePreview.sticky) {
          e.stopPropagation();
          e.preventDefault();
          EventBus.$emit('imagepreview-toggle-stickyness', { force: true });
        }
      }

      return {
        l,
        showAdvanced,
        saveLogin,
        loggingIn,
        password,
        character,
        characters,
        error,
        defaultCharacter,
        settings: settingsState.value,
        hasCompletedUpgrades,
        importProgress,
        profileName,
        profileStatus,
        adName,
        fixCharacters,
        fixCharacter,
        wordDefinitionLookup,
        shouldShowSpinner,
        profileNameHistory,
        profilePointer,
        chatRef,
        linkPreview,
        importModal,
        profileViewer,
        characterPage,
        fixLogsModal,
        wordDefinitionViewer,
        wordDefinitionLookupRef,
        logsDialog,
        login,
        fixLogs,
        resetHost,
        resetProxy,
        onMouseOver,
        openProfileInBrowser,
        openConversation,
        isRefreshingProfile,
        reloadCharacter,
        getThemeClass,
        nextProfile,
        nextProfileAvailable,
        prevProfile,
        prevProfileAvailable,
        openProfile,
        styling,
        showLogs,
        openDefinitionWithDictionary,
        openDefinitionWithThesaurus,
        openDefinitionWithUrbanDictionary,
        openDefinitionWithWikipedia,
        openWordDefinitionInBrowser,
        unpinUrlPreview
      };
    }
  });
</script>

<style lang="scss">
  html,
  body,
  #app,
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
        top: -7px;
        right: 0;
        position: absolute;
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

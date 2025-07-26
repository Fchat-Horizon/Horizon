<!--For potential git history reasons, this file used to be named "browser_options.ts" prior to f257b4c6a9d6fc06c1a6f7354e38c2dbd7bc69f6-->
<template>
  <div
    class="card-full"
    style="display: flex; flex-direction: column; height: 100%"
    :class="getThemeClass()"
    @auxclick.prevent
  >
    <div v-html="styling"></div>
    <div class="window-modal modal" :class="getThemeClass()" tabindex="-1">
      <div class="modal-dialog modal-xl" style="height: 100vh">
        <div class="modal-content" style="height: 100vh">
          <div class="modal-header">
            <h4 class="modal-title" style="-webkit-app-region: drag">
              {{ l('settings.action') }}
            </h4>
            <button
              type="button"
              class="close"
              aria-label="Close"
              v-if="!isMac"
              @click.stop="close()"
              z-
            >
              <span class="fas fa-times"></span>
            </button>
          </div>
          <div class="modal-body">
            <tabs
              style="flex-shrink: 0; margin-bottom: 10px"
              v-model="selectedTab"
              :tabs="[
                l('settings.tabs.general'),
                l('settings.tabs.look'),
                l('settings.tabs.notifications'),
                l('settings.tabs.behavior'),
                l('settings.tabs.accessibility'),
                l('settings.tabs.advanced')
              ]"
            ></tabs>
            <div class="tab-content hidden-scrollbar">
              <!--General -->
              <div
                v-show="selectedTab === '0'"
                class="card-body settings-content"
                style="height: 100%; width: 100%"
              >
                <h5>
                  {{ l('settings.updates') }}
                </h5>
                <div class="form-group">
                  <label class="control-label" for="updatecheck">
                    <input
                      type="checkbox"
                      id="updateCheck"
                      v-model="settings.updateCheck"
                    />
                    {{ l('settings.updateCheck') }}
                  </label>
                </div>
                <div class="form-group" v-if="settings.updateCheck">
                  <label class="control-label" for="beta">
                    <input type="checkbox" id="beta" v-model="settings.beta" />
                    {{ l('settings.beta') }}
                  </label>
                </div>
              </div>
              <!--Appearance-->
              <div
                v-show="selectedTab === '1'"
                class="card-body settings-content"
                style="height: 100%; width: 100%"
              >
                <h5>
                  {{ l('settings.theme') }}
                </h5>
                <div class="form-group">
                  <label class="control-label" for="beta">
                    <input type="checkbox" disabled id="themeSystemSync" />
                    {{ l('settings.theme.sync') }}
                  </label>
                </div>

                <div class="form-group">
                  <label class="control-label" for="theme" style="width: 20ch">
                    {{ l('settings.theme') }}
                    <!--<select
                      id="theme"
                      class="custom-select"
                      v-model="settings.theme"
                      style="flex: 1; margin-right: 10px"
                    >
                      <option v-for="theme in availableThemes" :value="theme">
                        {{ theme }}
                      </option>
                    </select> -->
                    <filterable-select
                      v-model="settings.theme"
                      :options="availableThemes"
                      :placeholder="l('filter')"
                      :title="l('settings.theme')"
                    >
                      <template slot-scope="s">
                        {{ s.option }}
                      </template>
                    </filterable-select>
                  </label>
                </div>

                <h5>
                  {{ l('settings.spellcheck.language') }}
                </h5>
                <!--On MacOS, Electron uses the OS' native spell checker as of version 35.2.0 -->
                <div class="form-group" v-if="!isMac">
                  <label
                    class="control-label"
                    for="spellCheckLang"
                    style="width: 20ch"
                  >
                    {{ l('settings.spellcheck') }}
                    <filterable-select
                      v-model="selectedLang"
                      :options="sortedLangs"
                      :filterFunc="filterLanguage"
                      :placeholder="l('filter')"
                      :multiple="true"
                      :title="l('settings.spellcheck.language')"
                    >
                      <template slot-scope="s">
                        {{
                          //s.option ||
                          formatLanguage(s.option) ||
                          l('settings.spellcheck.language')
                        }}
                      </template>
                    </filterable-select>
                  </label>
                </div>

                <div class="form-group">
                  <label class="control-label" for="displayLanguage">
                    {{ l('settings.displayLanguage') }}
                    <select
                      id="displayLanguage"
                      class="custom-select"
                      style="flex: 1; margin-right: 10px"
                      disabled
                    >
                      <option>English</option>
                    </select>
                  </label>
                </div>
              </div>
              <!--Notifications-->
              <div
                v-show="selectedTab === '2'"
                class="card-body settings-content"
                style="height: 100%; width: 100%"
              >
                <div class="warning">
                  <h5>{{ l('settings.comingsoon') }}</h5>
                  <hr />
                  <p>{{ l('settings.charactersToGeneral.generalInfo') }}</p>
                </div>
              </div>
              <!--Behavior-->
              <div
                v-show="selectedTab === '3'"
                class="card-body settings-content"
                style="height: 100%; width: 100%"
              >
                <h5>{{ l('user.profile') }}</h5>
                <div class="form-group">
                  <label class="control-label" for="profileViewer">
                    <input
                      type="checkbox"
                      id="profileViewer"
                      v-model="settings.profileViewer"
                    />
                    {{ l('settings.profileViewer') }}
                  </label>
                </div>

                <h5>{{ l('settings.behavior.chat') }}</h5>
                <div class="form-group">
                  <label class="control-label label-full" for="logDir">
                    {{ l('settings.logDir') }}

                    <div class="input-group">
                      <input
                        class="form-control"
                        id="logDir"
                        disabled
                        @click="browseForLogDir()"
                        v-model="settings.logDirectory"
                      />

                      <div class="input-group-append">
                        <button
                          class="btn btn-outline-secondary"
                          @click="browseForLogDir()"
                        >
                          <span class="far fa-fw fa-folder-open"></span>
                        </button>
                      </div></div
                  ></label>
                </div>
                <h5>{{ l('settings.behavior.window') }}</h5>
                <div class="form-group">
                  <label class="control-label" for="closeToTray">
                    <input
                      type="checkbox"
                      id="closeToTray"
                      v-model="settings.closeToTray"
                    />
                    {{ l('settings.closeToTray') }}
                  </label>
                </div>
              </div>
              <!--Accessibility-->
              <div
                v-show="selectedTab === '4'"
                class="card-body settings-content"
                style="height: 100%; width: 100%"
              >
                <div class="form-group" v-if="isWindows">
                  <label
                    class="control-label"
                    for="risingDisableWindowsHighContrast"
                  >
                    <input
                      type="checkbox"
                      id="hwAcceleration"
                      v-model="settings.risingDisableWindowsHighContrast"
                    />
                    {{ l('settings.risingDisableWindowsHighContrast') }}
                  </label>
                </div>
                <div v-else class="warning">
                  <h5>{{ l('settings.comingsoon') }}</h5>
                  <hr />
                  <p>{{ l('settings.charactersToGeneral.generalInfo') }}</p>
                </div>
              </div>
              <!-- Advanced -->
              <div
                v-show="selectedTab === '5'"
                class="card-body settings-content"
                style="height: 100%; width: 100%"
              >
                <h5>
                  {{ l('settings.system') }}
                </h5>
                <div class="form-group">
                  <label class="control-label" for="hwAcceleration">
                    <input
                      type="checkbox"
                      id="hwAcceleration"
                      v-model="settings.hwAcceleration"
                    />
                    {{ l('settings.hwAcceleration') }}
                  </label>
                </div>
                <div class="form-group">
                  <!--We do this one slightly differently because we 
                cannot and will not make ElectronLogger.LogType reactive -->
                  <label class="control-label" for="systemLogLevel">
                    {{ l('settings.systemLogLevel') }}
                    <div class="input-group">
                      <select
                        id="systemLogLevel"
                        class="form-control custom-select"
                        style="flex: 1; margin-right: 10px"
                        v-model="settings.risingSystemLogLevel"
                      >
                        <option value="error">Error</option>
                        <option value="warn">Warn</option>
                        <option value="info">Info</option>
                        <option value="verbose">Verbose</option>
                        <option value="debug">Debug</option>
                        <option value="silly">Silly</option>
                      </select>
                    </div>
                  </label>
                </div>

                <h5>
                  {{ l('settings.browserOptionTitle') }}
                </h5>
                <div class="warning" v-if="isMac">
                  <h5>Danger Zone!</h5>

                  <hr />
                  <p>
                    Mac User: As of writing, MacOS has a bug in how it handles
                    opening links.
                  </p>
                  <p>
                    When your default browser is something other than Safari and
                    you select Safari in this settings window, links might be
                    opened twice.
                  </p>
                  <p>
                    Once in Safari and a second time in your default browser.
                    This tends to happen when Safari is not running when
                    clicking a link.
                  </p>
                </div>

                <label class="control-label label-full" for="browserPath">
                  {{ l('settings.browserOptionPath') }}

                  <div class="input-group">
                    <input
                      class="form-control"
                      id="browserPath"
                      v-model="settings.browserPath"
                    />

                    <div class="input-group-append">
                      <button
                        class="btn btn-outline-secondary"
                        @click.prevent.stop="browseForPath()"
                      >
                        <span class="far fa-fw fa-folder-open"></span>
                      </button>
                      <button
                        class="btn btn-outline-danger"
                        @click.prevent.stop="browserReset()"
                      >
                        <span
                          class="fa-solid fa-fw fa-arrow-rotate-right"
                        ></span>
                      </button>
                    </div></div
                ></label>

                <label class="control-label label-full" for="browserArgs">
                  {{ l('settings.browserOptionArguments') }}
                  <div class="input-group">
                    <input
                      class="form-control"
                      id="browserArgs"
                      v-model="settings.browserArgs"
                    />
                  </div>
                  <small class="form-text text-muted">{{
                    l('settings.browserOptionArgumentsHelp')
                  }}</small>
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                @click.stop="close()"
              >
                Close
              </button>
              <button
                type="button"
                class="btn btn-primary"
                @click.stop="submit()"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Hook } from '@f-list/vue-ts';
  import * as remote from '@electron/remote';
  import Vue from 'vue';
  import l from '../chat/localize';
  import { GeneralSettings } from './common';
  import fs from 'fs';
  import path from 'path';
  import { ipcRenderer } from 'electron';
  import log from 'electron-log';
  import { Dialog } from '../helpers/dialog';
  import Tabs from '../components/tabs';
  import FilterableSelect from '../components/FilterableSelect.vue';
  import {
    knownLanguageNames,
    getSafeLanguages,
    updateSupportedLanguages
  } from './language';
  import _ from 'lodash';

  const browserWindow = remote.getCurrentWindow();
  @Component({
    components: { tabs: Tabs, 'filterable-select': FilterableSelect }
  })
  export default class BrowserOption extends Vue {
    sortedLangs: string[] = [];
    settings!: GeneralSettings;
    selectedTab = '0';
    isMaximized = false;
    l = l;
    platform = process.platform;
    hasCompletedUpgrades = false;
    browserPath = '';
    browserArgs = '';
    logDirectory = '';
    availableThemes: ReadonlyArray<string> = [];
    logLevel: log.LevelOption = false;
    selectedLang: string | string[] | undefined;
    //These are not reactive.
    //Which is kind of good because of all the security issues that'd otherwise arise
    isWindows = process.platform === 'win32';
    isMac = process.platform === 'darwin';

    get styling(): string {
      try {
        return `<style>${fs.readFileSync(path.join(__dirname, `themes/${this.settings.theme}.css`), 'utf8').toString()}</style>`;
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

    @Hook('mounted')
    async mounted(): Promise<void> {
      updateSupportedLanguages(
        browserWindow.webContents.session.availableSpellCheckerLanguages
      );
      this.browserPath = this.settings.browserPath;
      this.browserArgs = this.settings.browserArgs;
      this.logDirectory = this.settings.logDirectory;
      this.logLevel = this.settings.risingSystemLogLevel;
      this.availableThemes = fs
        .readdirSync(path.join(__dirname, 'themes'))
        .filter(x => x.substr(-4) === '.css')
        .map(x => x.slice(0, -4));
      this.selectedLang = getSafeLanguages(this.settings.spellcheckLang);
      let availableLanguages = getSafeLanguages(
        remote.session.defaultSession.availableSpellCheckerLanguages
      );
      this.sortedLangs = _.sortBy(availableLanguages, 'name');
      window.addEventListener('keyup', e => {
        if (e.key === 'Escape') {
          this.close();
        }
      });
    }

    minimize(): void {
      browserWindow.minimize();
    }

    formatLanguage(lang: string): string {
      return lang in knownLanguageNames
        ? `${(knownLanguageNames as any)[lang]} (${lang})`
        : lang;
    }

    close(): void {
      browserWindow.close();
    }

    getThemeClass() {
      // console.log('getThemeClassWindow', this.settings?.risingDisableWindowsHighContrast);

      try {
        // Hack!
        if (process.platform === 'win32') {
          if (this.settings?.risingDisableWindowsHighContrast) {
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
          ['platform-' + this.platform]: true,
          disableWindowsHighContrast:
            this.settings?.risingDisableWindowsHighContrast || false
        };
      } catch (err) {
        return {
          ['platform-' + this.platform]: true
        };
      }
    }

    submit(): void {
      this.settings.spellcheckLang = this.selectedLang;
      ipcRenderer.send('general-settings-update', this.settings);
      this.close();
    }

    browserReset(): void {
      this.settings.browserPath = '';
      this.settings.browserArgs = '%s';
    }

    browseForPath(): void {
      ipcRenderer.invoke('browser-option-browse').then(result => {
        this.settings.browserPath = result;
      });
    }

    browseForLogDir(): void {
      const dir = remote.dialog.showOpenDialogSync({
        defaultPath: this.settings.logDirectory,
        properties: ['openDirectory']
      });
      if (dir !== undefined) {
        if (dir[0].startsWith(path.dirname(remote.app.getPath('exe'))))
          return remote.dialog.showErrorBox(
            l('settings.logDir'),
            l('settings.logDir.inAppDir')
          );

        if (
          Dialog.confirmDialog(
            l('settings.logDir.confirm', dir[0], this.settings.logDirectory)
          )
        ) {
          ipcRenderer.send('log-path-update', dir[0]);
        }
      }
    }

    filterLanguage(
      filter: RegExp,
      languageEntry: { lang: string; name: string }
    ): boolean {
      return filter.test(languageEntry.name);
    }
  }
</script>

<style lang="scss">
  .card-full .window-modal {
    position: relative;
    display: block;
  }
  .window-modal .modal-dialog {
    margin: 0px;
    max-width: 100%;
  }

  .modal-title {
    width: 100%;
  }

  .tab-content {
    overflow: auto;
  }

  .modal-body {
    height: 100%;
    display: flex;
    flex-flow: column;
  }

  /*This override exists because we allow the user to resize the window, which potentially resizes the footer otherwise*/
  .modal-body .modal-footer {
    height: 52px;
    min-height: 52px;
  }

  .modal-body .nav-tabs-scroll {
    flex: 0 1 auto;
    min-height: 42px;
  }

  .modal-body .tab-content {
    overflow: auto;
    flex: 1 1 auto;
    padding-bottom: 1em;
  }

  .label-full {
    width: 100%;
  }

  .custom-select {
    width: 20ch;
  }

  .close {
    z-index: 3;
  }

  .card-full {
    height: 100%;
    left: 0;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 100;
  }

  .card-body .form-group {
    margin-left: 0;
    margin-right: 0;
  }

  .card-body .form-group .filters label {
    display: list-item;
    margin: 0;
    margin-left: 5px;
    list-style: none;
  }

  #windowButtons .btn {
    border-top: 0;
    font-size: 14px;
  }

  #window-browser-settings {
    user-select: none;
    .btn {
      border: 0;
      border-radius: 0;
      padding: 0 18px;
      display: flex;
      align-items: center;
      line-height: 1;
      -webkit-app-region: no-drag;
      flex-grow: 0;
    }

    .btn-default {
      background: transparent;
    }

    h4 {
      margin: 0 10px;
      user-select: none;
      cursor: default;
      align-self: center;
      -webkit-app-region: drag;
    }

    .fa {
      line-height: inherit;
    }
  }

  .warning {
    border: 1px solid var(--warning);
    padding: 10px;
    margin-bottom: 20px;
    border-radius: 3px;

    div {
      margin-top: 10px;
    }
  }

  .disableWindowsHighContrast,
  .disableWindowsHighContrast * {
    forced-color-adjust: none;
  }
</style>

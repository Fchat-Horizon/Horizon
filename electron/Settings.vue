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
            <h5 class="modal-title" style="-webkit-app-region: drag">
              <i class="fa-solid fa-fw fa-gear"></i>
              {{ l('settings.action') }}
            </h5>
            <a
              type="button"
              class="btn-close"
              aria-label="Close"
              v-if="!isMac"
              @click.stop="close()"
              z-
            >
              <span class="fas fa-times"></span>
            </a>
          </div>
          <div class="modal-body">
            <tabs
              style="flex-shrink: 0; margin-bottom: 10px"
              v-model="selectedTab"
              :fullWidth="true"
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
                  {{ l('settings.tabs.general') }}
                </h5>
                <div class="mb-3">
                  <div class="form-check">
                    <input
                      type="checkbox"
                      id="autoLogin"
                      v-model="settings.horizonAutoLogin"
                      class="form-check-input"
                    />
                    <label class="form-check-label" for="autoLogin">
                      {{ l('login.auto') }}
                    </label>
                  </div>
                </div>

                <h5>
                  {{ l('settings.updates') }}
                </h5>
                <div class="mb-3">
                  <div class="form-check">
                    <input
                      type="checkbox"
                      id="updateCheck"
                      v-model="settings.updateCheck"
                      class="form-check-input"
                    />
                    <label class="form-check-label" for="updateCheck">
                      {{ l('settings.updateCheck') }}
                    </label>
                  </div>
                </div>
                <div class="mb-3" v-if="settings.updateCheck">
                  <div class="form-check">
                    <input
                      type="checkbox"
                      id="beta"
                      v-model="settings.beta"
                      class="form-check-input"
                    />
                    <label class="form-check-label" for="beta">
                      {{ l('settings.beta') }}
                    </label>
                  </div>
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
                <div class="mb-3">
                  <div class="form-check">
                    <input
                      type="checkbox"
                      disabled
                      id="themeSystemSync"
                      class="form-check-input"
                    />
                    <label class="form-check-label" for="themeSystemSync">
                      {{ l('settings.theme.sync') }}
                    </label>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="control-label" for="theme" style="width: 20ch">
                    {{ l('settings.theme') }}
                    <!--<select
                      id="theme"
                      class="form-select"
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
                        {{ capitalizeThemeName(s.option) }}
                      </template>
                    </filterable-select>
                  </label>
                </div>
                <h5>
                  {{ l('settings.theme.textColors') }}
                </h5>

                <div class="mb-3">
                  <label class="control-label" for="themeVanillaBbcode">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        v-model="settings.horizonVanillaTextColors"
                        type="checkbox"
                        id="themeVanillaBbcode"
                        aria-describedby="vanillaBbcodeLegibilityNote"
                      />
                      <label class="form-check-label" for="themeVanillaBbcode">
                        {{ l('settings.theme.vanillaBbcode') }}
                      </label>
                    </div>
                    <div
                      id="vanillaBbcodeLegibilityNote"
                      class="form-text text-muted"
                    >
                      {{ l('settings.theme.vanillaBbcode.legibilityNote') }}
                    </div>
                  </label>
                </div>

                <div class="mb-3">
                  <label class="control-label" for="themeVanillaGenders">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        v-model="settings.horizonVanillaGenderColors"
                        type="checkbox"
                        id="themeVanillaGenders"
                        aria-describedby="vanillaGendersNote"
                      />
                      <label class="form-check-label" for="themeVanillaGenders">
                        {{ l('settings.theme.vanillaGenders') }}
                      </label>
                    </div>
                    <div id="vanillaGendersNote" class="form-text text-muted">
                      {{ l('settings.theme.vanillaGenders.note') }}
                    </div>
                  </label>
                </div>

                <div class="mb-3">
                  <label class="control-label" for="themeBbcodeGlow">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        v-model="settings.horizonBbcodeGlow"
                        type="checkbox"
                        id="themeBbcodeGlow"
                        aria-describedby="bbcodeGlowNote"
                      />
                      <label class="form-check-label" for="themeBbcodeGlow">
                        {{ l('settings.theme.bbcodeGlow') }}
                      </label>
                    </div>
                    <div id="bbcodeGlowNote" class="form-text text-muted">
                      {{ l('settings.theme.bbcodeGlow.note') }}
                    </div>
                  </label>
                </div>

                <h5>
                  {{ l('settings.spellcheck.language') }}
                </h5>
                <!--On MacOS, Electron uses the OS' native spell checker as of version 35.2.0 -->
                <div class="mb-3" v-if="!isMac">
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

                <div class="mb-3">
                  <label class="control-label" for="displayLanguage">
                    {{ l('settings.displayLanguage') }}
                    <select
                      id="displayLanguage"
                      class="form-select"
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
                <h5>{{ l('settings.sounds') }}</h5>
                <div class="form-group">
                  <label
                    class="control-label"
                    for="soundTheme"
                    style="width: 20ch"
                  >
                    {{ l('settings.soundTheme') }}
                    <filterable-select
                      v-model="settings.soundTheme"
                      :options="availableSoundThemes"
                      style="flex: 1; margin-right: 10px"
                      :title="l('settings.soundTheme')"
                    >
                      <template slot-scope="s">
                        {{ capitalizeSoundThemeName(s.option) }}
                      </template>
                    </filterable-select>
                  </label>
                </div>

                <div class="sound-theme-details">
                  <div
                    class="d-flex"
                    style="justify-content: space-between; align-items: center"
                  >
                    <div>
                      <h5 style="margin: 0">
                        {{ capitalizeSoundThemeName(settings.soundTheme) }}
                      </h5>
                      <div class="text-muted" v-if="currentSoundThemeDetails">
                        <div>{{ currentSoundThemeDetails.description }}</div>
                        <div v-if="currentSoundThemeDetails.author">
                          By {{ currentSoundThemeDetails.author }}
                        </div>
                        <div class="small">
                          Version: {{ currentSoundThemeDetails.version }}
                        </div>
                      </div>
                      <div v-else class="text-muted small">
                        No metadata available
                      </div>
                    </div>
                    <div>
                      <div style="display: flex; gap: 8px; align-items: center">
                        <button
                          class="btn btn-outline-primary"
                          @click.prevent.stop="
                            soundListCollapsed = !soundListCollapsed
                          "
                          title="Toggle sound list"
                        >
                          {{ soundListCollapsed ? 'Show' : 'Hide' }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="
                      currentSoundThemeDetails &&
                      currentSoundThemeDetails.sounds
                    "
                    class="mt-3"
                  >
                    <div v-if="!soundListCollapsed" class="mt-2">
                      <div
                        v-for="(path, sound) in currentSoundThemeDetails.sounds"
                        :key="sound"
                        class="sound-row"
                        style="
                          display: flex;
                          align-items: center;
                          gap: 8px;
                          margin-bottom: 8px;
                        "
                      >
                        <div style="width: 14ch; text-transform: capitalize">
                          {{ sound }}
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          v-model.number="liveVolumeMap[sound]"
                          @input="onVolumeChange(sound)"
                          style="flex: 1"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          style="
                            width: 7ch;
                            text-align: right;
                            margin-left: 8px;
                          "
                          :value="Math.round((liveVolumeMap[sound] ?? 1) * 100)"
                          @input="handlePercentInput($event, sound)"
                        />
                        <button
                          class="btn btn-sm btn-outline-primary"
                          @click.prevent.stop="previewSound(sound)"
                          title="Preview"
                          style="margin-left: 8px"
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>
                  <div v-else class="mt-2 text-muted small">
                    No sounds listed for this theme
                  </div>
                </div>
              </div>
              <!--Behavior-->
              <div
                v-show="selectedTab === '3'"
                class="card-body settings-content"
                style="height: 100%; width: 100%"
              >
                <h5>{{ l('user.profile') }}</h5>
                <div class="mb-3">
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="profileViewer"
                      v-model="settings.profileViewer"
                    />
                    <label class="form-check-label" for="profileViewer">
                      {{ l('settings.profileViewer') }}
                    </label>
                  </div>
                </div>

                <h5>{{ l('settings.behavior.chat') }}</h5>
                <div class="mb-3">
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
                      <button
                        class="btn btn-outline-secondary"
                        @click="browseForLogDir()"
                      >
                        <span class="far fa-fw fa-folder-open"></span>
                      </button></div
                  ></label>
                </div>
                <h5>{{ l('settings.behavior.window') }}</h5>
                <div class="mb-3">
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="closeToTray"
                      v-model="settings.closeToTray"
                    />
                    <label class="form-check-label" for="closeToTray">
                      {{ l('settings.closeToTray') }}
                    </label>
                  </div>
                </div>
              </div>
              <!--Accessibility-->
              <div
                v-show="selectedTab === '4'"
                class="card-body settings-content"
                style="height: 100%; width: 100%"
              >
                <div class="mb-3" v-if="isWindows">
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="risingDisableWindowsHighContrast"
                      v-model="settings.risingDisableWindowsHighContrast"
                    />
                    <label
                      class="form-check-label"
                      for="risingDisableWindowsHighContrast"
                    >
                      {{ l('settings.risingDisableWindowsHighContrast') }}
                    </label>
                  </div>
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
                <div class="mb-3">
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="hwAcceleration"
                      v-model="settings.hwAcceleration"
                    />
                    <label class="form-check-label" for="hwAcceleration">
                      {{ l('settings.hwAcceleration') }}
                    </label>
                  </div>
                </div>
                <div class="mb-3">
                  <!--We do this one slightly differently because we 
                cannot and will not make ElectronLogger.LogType reactive -->
                  <label class="control-label" for="systemLogLevel">
                    {{ l('settings.systemLogLevel') }}
                    <div class="input-group">
                      <select
                        id="systemLogLevel"
                        class="form-select form-select"
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
                      <span class="fa-solid fa-fw fa-arrow-rotate-right"></span>
                    </button></div
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
                <h5>
                  {{ l('settings.customCss') }}
                </h5>

                <div class="mb-3">
                  <label class="control-label" for="customCssEnabled">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="customCss"
                        v-model="settings.horizonCustomCssEnabled"
                      />
                      <label class="form-check-label" for="customCss">
                        {{ l('settings.customCss.enabled') }}
                      </label>
                    </div>
                  </label>

                  <label for="customCss" class="control-label label-full"
                    >{{ l('settings.customCss.css') }}
                    <textarea
                      class="form-control textarea-code"
                      id="customCss"
                      v-model="settings.horizonCustomCss"
                      :disabled="!settings.horizonCustomCssEnabled"
                      :rows="countLines(settings.horizonCustomCss) + 3"
                      @keydown.tab.prevent="handleTab"
                    ></textarea>
                    <small class="form-text text-warning">{{
                      l('settings.customCss.warning')
                    }}</small>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div
            style="padding: 0.5rem 0.75rem 1rem 0.75rem"
            class="modal-footer"
          >
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
    availableSoundThemes: ReadonlyArray<string> = [];
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

      // Load available sound themes
      this.loadAvailableSoundThemes();
      // Load details for the currently selected sound theme
      await this.loadSelectedSoundThemeDetails();

      // Watch for sound theme changes
      this.$watch(
        () => this.settings.soundTheme,
        async () => {
          await this.loadSelectedSoundThemeDetails();
        }
      );

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

    capitalizeThemeName(themeName: string): string {
      return themeName
        .split(/[\s-_]+/) // Split on spaces, hyphens, or underscores
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }

    capitalizeSoundThemeName(themeName: string): string {
      return this.capitalizeThemeName(themeName);
    }

    loadAvailableSoundThemes(): void {
      try {
        const soundThemesPath = path.join(__dirname, 'sound-themes');
        this.availableSoundThemes = fs
          .readdirSync(soundThemesPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name)
          .filter(name => {
            const soundJsonPath = path.join(
              soundThemesPath,
              name,
              'sound.json'
            );
            return fs.existsSync(soundJsonPath);
          });
      } catch (error) {
        console.error('Error loading sound themes:', error);
        this.availableSoundThemes = ['default'];
      }
    }

    // Currently selected sound theme metadata and per-sound volumes for the UI
    currentSoundThemeDetails: any | null = null;
    // live values driven by the slider (used for immediate UI feedback and persisted)
    liveVolumeMap: { [sound: string]: number } = {};
    // collapse the sound list by default so it doesn't take the whole page
    soundListCollapsed: boolean = true;
    soundPreviewAudio: HTMLAudioElement | null = null;

    // Watcher-like helper: call this when sound theme changes
    async loadSelectedSoundThemeDetails(): Promise<void> {
      const theme = this.settings.soundTheme || 'default';
      // Load metadata (sound.json) if present
      try {
        const themeJsonPath = path.join(
          __dirname,
          'sound-themes',
          theme,
          'sound.json'
        );
        const raw = fs.readFileSync(themeJsonPath, 'utf8');
        this.currentSoundThemeDetails = JSON.parse(raw);
      } catch (err) {
        this.currentSoundThemeDetails = null;
      }

      // Build a fresh liveVolumeMap from saved settings (or defaults)
      try {
        const perTheme = (this.settings as any).soundThemeSoundVolumes || {};
        const saved = perTheme[this.settings.soundTheme] || {};
        const newMap: { [k: string]: number } = {};
        if (this.currentSoundThemeDetails?.sounds) {
          for (const sound of Object.keys(
            this.currentSoundThemeDetails.sounds
          )) {
            const rawVal = saved[sound];
            newMap[sound] =
              typeof rawVal === 'number' ? Math.max(0, Math.min(1, rawVal)) : 1;
          }
        }
        this.liveVolumeMap = newMap;
      } catch (err) {
        this.liveVolumeMap = {};
      }
    }

    onVolumeChange(sound: any): void {
      // Persist the changed volume into settings for the current theme
      const v = Number(this.liveVolumeMap[sound] ?? 1);
      const container = (this.settings as any).soundThemeSoundVolumes || {};
      if (!container[this.settings.soundTheme])
        container[this.settings.soundTheme] = {};
      container[this.settings.soundTheme][sound] = v;
      (this.settings as any).soundThemeSoundVolumes = container;
    }

    // live updates are handled by v-model on liveVolumeMap and persisted by onVolumeChange
    handlePercentInput(e: Event, sound: any): void {
      const target = e.target as HTMLInputElement;
      let pct = parseInt(target.value || '0', 10);
      if (isNaN(pct)) pct = 0;
      pct = Math.max(0, Math.min(100, pct));
      const v = pct / 100;
      (this as any).$set(this.liveVolumeMap, sound, v);
      this.onVolumeChange(sound);
    }

    previewSound(sound: any): void {
      // stop previous preview
      if (this.soundPreviewAudio) {
        try {
          this.soundPreviewAudio.pause();
          this.soundPreviewAudio.remove();
        } catch (e) {}
        this.soundPreviewAudio = null;
      }

      const audio = document.createElement('audio');
      audio.preload = 'auto';
      audio.volume = this.liveVolumeMap[sound] ?? 1;
      audio.muted = false;
      const pushSource = (src: string, mime: string) => {
        const s = document.createElement('source');
        s.type = mime;
        s.src = src;
        audio.appendChild(s);
      };

      try {
        // Prefer themed sound files from the selected sound theme
        if (this.currentSoundThemeDetails?.sounds?.[sound]) {
          const soundPath = this.currentSoundThemeDetails.sounds[sound];
          const formats = [
            this.currentSoundThemeDetails.formats?.preferred,
            ...(this.currentSoundThemeDetails.formats?.fallback || [])
          ].filter(Boolean);
          for (const format of formats) {
            const ext = format === 'mpeg' ? 'mp3' : format;
            const abs = path.join(
              __dirname,
              'sound-themes',
              this.settings.soundTheme,
              `${soundPath}.${ext}`
            );
            pushSource(`file://${abs}`, `audio/${format}`);
          }
        } else {
          // Fallback: look for assets on disk in common locations
          const codecOrder = ['wav', 'mp3', 'ogg'];
          for (const ext of codecOrder) {
            const candidate1 = path.join(
              __dirname,
              '..',
              'chat',
              'assets',
              `${sound}.${ext}`
            );
            const candidate2 = path.join(
              __dirname,
              '..',
              'assets',
              `${sound}.${ext}`
            );
            if (fs.existsSync(candidate1))
              pushSource(`file://${candidate1}`, `audio/${ext}`);
            else if (fs.existsSync(candidate2))
              pushSource(`file://${candidate2}`, `audio/${ext}`);
          }
        }
      } catch (err) {
        console.warn('Preview load failed', err);
      }

      audio.addEventListener('ended', () => {
        try {
          audio.remove();
        } catch (e) {}
        if (this.soundPreviewAudio === audio) this.soundPreviewAudio = null;
      });

      document.body.appendChild(audio);
      this.soundPreviewAudio = audio;
      // Some browsers require a user gesture; this is an explicit user action (click) so should work.
      audio.play().catch(e => console.warn('Preview play failed', e));
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

    countLines(text: string): number {
      let pointer = 0;
      for (let i = 0; i < text.length; i += 1) {
        switch (text[i]) {
          case '\r':
            pointer += 1;
            if (text[i + 1] === '\n') {
              i += 1;
            }
            break;
          case '\n':
            pointer += 1;
            if (text[i + 1] === '\r') {
              i += 1;
            }
            break;
        }
      }
      return pointer;
    }

    handleTab(e: KeyboardEvent): void {
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      // Get the current value and insert tab at cursor position
      const value = target.value;
      this.settings.horizonCustomCss =
        value.substring(0, start) + '\t' + value.substring(end);

      // Move cursor after tab
      this.$nextTick(() => {
        target.selectionStart = target.selectionEnd = start + 1;
      });
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

  textarea.textarea-code {
    font-family: monospace;
    resize: none;
  }

  /*This override exists because we allow the user to resize the window, which potentially resizes the footer otherwise*/
  .modal-body .modal-footer {
    height: 52px;
    min-height: 52px;
  }

  .modal-footer {
    padding-bottom: 1rem;
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
    border: 1px solid var(--bs-warning);
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

<template>
  <div
    class="card-full"
    style="display: flex; flex-direction: column; height: 100%"
    :class="getThemeClass()"
    @auxclick.prevent
  >
    <div v-html="styling"></div>
    <div class="window-modal modal" :class="getThemeClass()" tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h4 class="modal-title" style="-webkit-app-region: drag">
              {{
                updateVersion
                  ? l('action.updateTitle')
                  : l('changelog.version', currentVersion || '')
              }}
            </h4>
            <button
              type="button"
              class="btn-close"
              :aria-label="l('action.close')"
              v-if="!isMac"
              @click.stop="close()"
            >
              <span class="fas fa-times"></span>
            </button>
          </div>
          <div
            class="modal-body"
            :class="{ 'has-update-header': updateVersion }"
          >
            <div
              v-if="updateVersion"
              class="changelog-header d-flex align-items-center gap-3 p-2 pb-1"
            >
              <div class="changelog-header__logo">
                <div class="changelog-logo-bg"></div>
                <img class="changelog-logo" :src="logoSrc" alt="Horizon logo" />
              </div>
              <div
                class="changelog-header__content d-flex flex-column gap-2 align-items-start"
              >
                <div class="changelog-header__title">
                  {{
                    l(
                      'changelog.compare',
                      updateVersion || '',
                      currentVersion || ''
                    )
                  }}
                </div>
                <div class="changelog-header__subtitle">
                  {{
                    l(
                      updateMode === 'auto'
                        ? 'update.installOnQuit.note'
                        : 'changelog.manualUpdate'
                    )
                  }}
                </div>
                <div class="changelog-header__links d-flex flex-wrap gap-2">
                  <a
                    class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-2 text-nowrap"
                    href="https://discord.gg/JYuxqNVNtP"
                    @click.prevent="
                      externalUrlHandler('https://discord.gg/JYuxqNVNtP')
                    "
                    data-action="openExternal"
                  >
                    <span class="fab fa-discord"></span>
                    <span>{{ l('chat.joinDiscord') }}</span>
                  </a>
                  <a
                    class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-2 text-nowrap"
                    href="https://ko-fi.com/thehorizonteam"
                    @click.prevent="
                      externalUrlHandler('https://ko-fi.com/thehorizonteam')
                    "
                    :title="l('changelog.supportHorizonTitle')"
                    data-action="openExternal"
                  >
                    <span class="fa fa-coffee"></span>
                    <span>{{ l('changelog.supportHorizon') }}</span>
                  </a>
                </div>
              </div>
            </div>
            <div class="changelog-scroll pe-1 pb-2">
              <div
                class="logs-container border bg-light"
                v-html="changeLogText"
                ref="mdContainer"
              ></div>
            </div>
            <div class="modal-footer">
              <template v-if="updateVersion && updateMode === 'auto'">
                <div class="form-check me-auto w-100">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    value=""
                    id="autoInstall"
                    disabled
                  />
                  <label class="form-check-label" for="autoInstall">
                    {{ l('update.autoInstall') }}
                  </label>
                </div>
                <button
                  type="button"
                  class="btn btn-outline-secondary me-auto"
                  @click.stop="skipUpdate()"
                >
                  {{ l('changelog.skipUpdate') }}
                </button>
                <button
                  type="button"
                  class="btn btn-secondary me-1"
                  @click.stop="close()"
                >
                  {{ l('changelog.remindLater') }}
                </button>

                <button
                  type="button"
                  class="btn btn-primary"
                  @click.stop="updateNow()"
                >
                  {{ l('changelog.updateNow') }}
                </button>
              </template>
              <template v-else>
                <div v-if="!updateVersion" class="footer-links">
                  <a
                    class="btn btn-outline-primary"
                    href="https://discord.gg/JYuxqNVNtP"
                    @click.prevent="
                      externalUrlHandler('https://discord.gg/JYuxqNVNtP')
                    "
                    data-action="openExternal"
                  >
                    <span class="fab fa-discord"></span>
                    <span style="margin-left: 6px">{{
                      l('chat.joinDiscord')
                    }}</span>
                  </a>
                  <a
                    class="btn btn-outline-primary"
                    href="https://ko-fi.com/thehorizonteam"
                    @click.prevent="
                      externalUrlHandler('https://ko-fi.com/thehorizonteam')
                    "
                    :title="l('changelog.supportHorizonTitle')"
                    data-action="openExternal"
                  >
                    <span class="fa fa-coffee"></span>
                    <span style="margin-left: 6px">{{
                      l('changelog.supportHorizon')
                    }}</span>
                  </a>
                </div>
                <button
                  type="button"
                  class="btn btn-secondary"
                  @click.stop="close()"
                >
                  {{ l('action.close') }}
                </button>

                <button
                  type="button"
                  class="btn btn-primary"
                  @click.stop="openLatestRelease()"
                  v-if="updateMode === 'manual'"
                >
                  <span class="me-1">{{ l('changelog.openReleases') }}</span
                  ><i class="fa-solid fa-arrow-up-right-from-square"></i>
                </button>
              </template>
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
  import l, { setLanguage } from '../chat/localize';
  import { GeneralSettings } from './common';
  import fs from 'fs';
  import path from 'path';
  // Unused imports removed
  import Axios from 'axios';
  import markdownit from 'markdown-it';
  import { alert } from '@mdit/plugin-alert';
  import electron from 'electron';

  // tslint:disable-next-line:no-require-imports
  const logoSrc = require('./build/icon.png').default;

  type ReleaseInfo = {
    html_url: string;
    tag_name: string;
    body: string;
  };

  const browserWindow = remote.getCurrentWindow();
  @Component({})
  export default class Changelog extends Vue {
    settings!: GeneralSettings;
    osIsDark = remote.nativeTheme.shouldUseDarkColors;
    updateVersion!: string | undefined;
    updateMode!: 'auto' | 'manual';
    currentVersion = process.env.APP_VERSION;
    isMaximized = false;
    l = l;
    platform = process.platform;
    isMac = process.platform === 'darwin';
    hasCompletedUpgrades = false;
    changeLogText: string = '';
    logoSrc = logoSrc;

    get styling(): string {
      try {
        return `<style>${fs.readFileSync(path.join(__dirname, `themes/${this.getSyncedTheme()}.css`), 'utf8').toString()}</style>`;
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
    getSyncedTheme() {
      if (!this.settings.themeSync) return this.settings.theme;
      return this.osIsDark
        ? this.settings.themeSyncDark
        : this.settings.themeSyncLight;
    }

    @Hook('mounted')
    async mounted(): Promise<void> {
      remote.nativeTheme.on('updated', () => {
        this.osIsDark = remote.nativeTheme.shouldUseDarkColors;
      });
      try {
        setLanguage(this.settings.displayLanguage);
      } catch (e) {
        console.warn('Failed to set display language', e);
      }
      document.title = this.updateVersion
        ? l('action.updateAvailable')
        : l('help.changelog');
      const container = <HTMLElement>this.$refs['mdContainer'];
      if (container) {
        container.addEventListener('click', this.delegateLinkClick);
      }
      let apiUrl =
        'https://api.github.com/repos/Fchat-Horizon/Horizon/releases/tags/' +
        (this.updateVersion
          ? this.updateVersion!
          : 'v' + process.env.APP_VERSION);
      let releaseInfo: ReleaseInfo = (await Axios.get<ReleaseInfo>(apiUrl))
        .data;
      let md = markdownit({ html: true, linkify: true, typographer: true });
      md.use(alert);

      const defaultRender =
        md.renderer.rules.link_open ||
        function (tokens, idx, options, _env, self) {
          return self.renderToken(tokens, idx, options);
        };

      md.renderer.rules.link_open = function (
        tokens,
        idx,
        options,
        _env,
        self
      ) {
        const token = tokens[idx];
        token.attrPush(['data-action', 'openExternal']);
        // Set href to "#" or "javascript:void(0)"
        //const hrefIndex = token.attrIndex('href');
        //if (hrefIndex >= 0) token.attrs![hrefIndex][1] = '#';
        // Add onclick handler
        return defaultRender(tokens, idx, options, _env, self);
      };
      this.changeLogText = md.render(releaseInfo.body);
    }

    close(): void {
      browserWindow.close();
    }

    externalUrlHandler(url: string) {
      electron.ipcRenderer.send('open-url-externally', url);
    }

    delegateLinkClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'A' &&
        target.getAttribute('data-action') === 'openExternal'
      ) {
        event.preventDefault();
        this.externalUrlHandler(target.getAttribute('href') || '#');
      }
    }

    openLatestRelease(): void {
      this.externalUrlHandler(
        'https://github.com/Fchat-Horizon/Horizon/releases/latest'
      );
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
          bbcodeGlow: this.settings?.horizonBbcodeGlow || false,
          disableWindowsHighContrast:
            this.settings?.risingDisableWindowsHighContrast || false
        };
      } catch (err) {
        return {
          ['platform-' + this.platform]: true
        };
      }
    }

    skipUpdate(): void {
      if (!this.updateVersion) return;
      electron.ipcRenderer.send('skip-update-version', this.updateVersion);
      this.close();
    }

    updateNow(): void {
      if (!this.updateVersion) return;
      electron.ipcRenderer.send('update-now', this.updateVersion);
      this.close();
    }
  }
</script>

<style lang="scss">
  .card-full .window-modal {
    position: relative;
    display: block;
    height: 100%;
  }

  .window-modal.modal {
    height: 100%;
  }

  .window-modal .modal-content {
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100%;
  }
  .window-modal .modal-dialog {
    margin: 0px;
    max-width: 100%;
    height: 100%;
  }

  .modal-title {
    width: 100%;
  }

  .modal-body {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    gap: 12px;
    min-height: 0;
    overflow: hidden;
    padding-top: 6px;
    padding-bottom: 12px;
    --changelog-indent: 0;
  }

  .modal-body.has-update-header {
    --changelog-indent: 80px;
  }

  .changelog-header__logo {
    position: relative;
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    overflow: visible;
  }

  .changelog-header {
    grid-row: 1;
  }

  .changelog-logo-bg {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background-image: linear-gradient(
      -2deg,
      #1b0f30 5%,
      #a0487e 19%,
      #ffa978 79%
    );
    filter: blur(12px);
    z-index: 0;
  }

  .changelog-logo {
    width: 64px;
    height: 64px;
    z-index: 1;
  }

  .changelog-header__title {
    font-weight: 600;
    font-size: 1.05rem;
    line-height: 1.2;
  }

  .changelog-header__subtitle {
    font-size: 0.9rem;
    opacity: 0.75;
  }

  .changelog-scroll {
    min-height: 0;
    overflow: hidden;
    display: flex;
    padding-left: var(--changelog-indent);
    grid-row: 2;
  }

  .logs-container {
    min-height: 0;
    width: 100%;
    box-sizing: border-box;
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 1em;
    max-height: calc(100% - 6px);
    border-radius: 10px;
    a {
      text-decoration: underline;
    }

    a:hover {
      text-decoration: none;
    }
  }

  .markdown-alert {
    border-left: 2px solid;
    padding-left: 10px;

    .markdown-alert-title {
      font-size: 1.25em;
      font-weight: bold;
    }
  }

  .markdown-alert-important {
    border-color: var(--bs-primary);
  }

  .markdown-alert-note {
    border-color: var(--bs-secondary);
  }

  .markdown-alert-tip {
    border-color: var(--bs-info);
  }
  .markdown-alert-caution {
    border-color: var(--bs-danger);
  }
  .markdown-alert-warning {
    border-color: var(--bs-warning);
  }

  .update-banner {
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 10px;
  }
  .update-banner__text {
    font-size: 0.95rem;
    line-height: 1.4;
  }
  .update-banner__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 0;
    position: static;
    justify-content: end;
  }
  .update-banner__note {
    font-size: 0.85rem;
  }

  /*This override exists because we allow the user to resize the window, which potentially resizes the footer otherwise*/
  .modal-body .modal-footer {
    min-height: 52px;
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    padding: 0 0 12px 0;
    grid-row: 3;
  }

  .modal-body .modal-footer .footer-links {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-right: auto;
  }

  .changelog-header__links a.btn,
  .modal-body .modal-footer .footer-links a.btn {
    color: var(--bs-link-color);

    &:hover,
    &:focus {
      color: var(--bs-btn-hover-color);
    }
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

  .disableWindowsHighContrast,
  .disableWindowsHighContrast * {
    forced-color-adjust: none;
  }

  /* Make images and embedded media inside the changelog scale to the window while keeping aspect ratio */
  .logs-container img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0.5em 2em;
    max-height: calc(100vh - 160px);
    object-fit: contain;
  }

  .logs-container iframe,
  .logs-container video {
    max-width: 100%;
    max-height: calc(100vh - 160px);
  }
</style>

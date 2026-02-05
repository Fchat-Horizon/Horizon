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
              {{
                l('changelog.version', updateVersion || currentVersion || '')
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
          <div class="modal-body">
            <div
              v-if="updateVersion"
              class="update-banner bg-body-tertiary border"
            >
              <div v-if="updateMode === 'manual'" class="update-banner__text">
                {{
                  l(
                    'changelog.compare',
                    updateVersion || '',
                    currentVersion || ''
                  )
                }}
              </div>
              <div v-else class="update-banner__text">
                {{
                  l(
                    'changelog.compare',
                    updateVersion || '',
                    currentVersion || ''
                  )
                }}
              </div>

              <div class="update-banner__note text-muted">
                {{
                  l(
                    this.updateMode === 'auto'
                      ? 'update.installOnQuit.note'
                      : 'changelog.manualUpdate'
                  )
                }}
              </div>
              <div class="update-banner__actions">
                <a
                  class="btn btn-outline-primary"
                  href="https://discord.gg/JYuxqNVNtP"
                  target="_blank"
                  rel="noopener"
                >
                  <span class="fab fa-discord"></span>
                  <span style="margin-left: 6px">{{
                    l('chat.joinDiscord')
                  }}</span>
                </a>
                <a
                  class="btn btn-outline-primary"
                  href="https://ko-fi.com/thehorizonteam"
                  target="_blank"
                  rel="noopener"
                  title="Support us on Ko-Fi"
                >
                  <span class="fa fa-coffee"></span>
                  <span style="margin-left: 6px">Ko-Fi</span>
                </a>
              </div>
            </div>
            <div
              class="logs-container border bg-light"
              v-html="changeLogText"
              ref="mdContainer"
            ></div>
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
                <span v-if="!updateVer">
                  <a
                    class="btn btn-outline-primary me-2"
                    href="https://discord.gg/JYuxqNVNtP"
                    target="_blank"
                    rel="noopener"
                  >
                    <span class="fab fa-discord"></span>
                    <span style="margin-left: 6px">{{
                      l('chat.joinDiscord')
                    }}</span>
                  </a>
                  <a
                    class="btn btn-outline-primary"
                    href="https://ko-fi.com/thehorizonteam"
                    target="_blank"
                    rel="noopener"
                    title="Support us on Ko-Fi"
                  >
                    <span class="fa fa-coffee"></span>
                    <span style="margin-left: 6px">Ko-Fi</span>
                  </a>
                </span>
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
  import l from '../chat/localize';
  import { GeneralSettings } from './common';
  import fs from 'fs';
  import path from 'path';
  // Unused imports removed
  import Axios from 'axios';
  import markdownit from 'markdown-it';
  import { alert } from '@mdit/plugin-alert';
  import electron from 'electron';

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
  }
  .window-modal .modal-dialog {
    margin: 0px;
    max-width: 100%;
  }

  .modal-title {
    width: 100%;
  }

  .modal-body {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
    overflow: hidden;
  }

  .logs-container {
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    box-sizing: border-box;
    overflow-y: scroll;
    padding: 1em;
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
    padding: 0;
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

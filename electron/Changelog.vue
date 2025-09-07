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
            <div v-if="updateVersion" class="version-compare">
              {{
                l(
                  'changelog.compare',
                  updateVersion || '',
                  currentVersion || ''
                )
              }}
            </div>
            <div
              class="logs-container border bg-light"
              v-html="changeLogText"
              ref="mdContainer"
            ></div>
            <div class="modal-footer">
              <a
                class="btn btn-outline-primary"
                href="https://discord.gg/JYuxqNVNtP"
                target="_blank"
                rel="noopener"
                style="margin-left: 8px"
              >
                <span class="fab fa-discord"></span>
                <span style="margin-left: 6px">{{
                  l('chat.joinDiscord')
                }}</span>
              </a>
              <button
                type="button"
                class="btn btn-secondary"
                @click.stop="close()"
              >
                {{ l('action.close') }}
              </button>
              <button
                v-if="updateVersion"
                type="button"
                class="btn btn-secondary"
                @click.stop="goToDownload()"
              >
                {{ l('changelog.download') }}
              </button>

              <button
                v-if="updateVersion"
                type="button"
                class="btn btn-primary"
                @click.stop="closeAndDownload()"
              >
                {{ l('changelog.quitAndDownload') }}
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

    goToDownload() {
      this.externalUrlHandler(
        'https://horizn.moe/download.html?ver=' + this.updateVersion
      );
    }

    closeAndDownload(): void {
      electron.ipcRenderer.send('update-and-exit', this.updateVersion);
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
    flex-flow: column;
  }

  .logs-container {
    height: 100%;
    width: 100%;
    overflow-y: scroll;
    margin-top: 1em;
    margin-bottom: 1em;
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
  } /*This override exists because we allow the user to resize the window, which potentially resizes the footer otherwise*/
  .modal-body .modal-footer {
    height: 52px;
    min-height: 52px;
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
    margin: 0.5em auto;
    max-height: calc(100vh - 160px);
    object-fit: contain;
  }

  .logs-container iframe,
  .logs-container video {
    max-width: 100%;
    max-height: calc(100vh - 160px);
  }
</style>

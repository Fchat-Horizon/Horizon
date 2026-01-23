<template>
  <div
    class="card-full"
    style="display: flex; flex-direction: column; height: 100%"
    :class="getThemeClass()"
    @auxclick.prevent
  >
    <div v-html="styling"></div>
    <div class="window-modal modal" :class="getThemeClass()" tabindex="-1">
      <div class="modal-dialog about-dialog" style="height: 100vh">
        <div class="modal-content" style="height: 100vh">
          <div class="modal-header">
            <h5
              class="modal-title about-header-title"
              style="-webkit-app-region: drag"
            >
              <span
                class="about-title-icon"
                :style="aboutIconStyle"
                aria-hidden="true"
              ></span>
              {{ l('action.about') }}
            </h5>
            <a
              type="button"
              class="btn-close"
              :aria-label="l('action.close')"
              v-if="!isMac"
              @click.stop="close()"
            >
              <span class="fas fa-times"></span>
            </a>
          </div>
          <div class="modal-body text-center">
            <div class="about-container d-flex flex-column align-items-center">
              <div class="image-container">
                <div class="image-bg"></div>
                <img class="about-logo" :src="logoSrc" alt="Horizon logo" />
              </div>
              <h1 class="h5 fw-semibold mb-1 text-body">Horizon</h1>
              <p class="text-muted mb-2">
                A modern, community-driven F-Chat client
              </p>

              <div class="row g-2 w-100 version-grid">
                <div
                  class="col-6 d-flex justify-content-between align-items-baseline"
                >
                  <span class="text-muted small me-4">Version</span>
                  <span class="small text-body">{{ appVersion }}</span>
                </div>
                <div
                  class="col-6 d-flex justify-content-between align-items-baseline"
                >
                  <span class="text-muted small me-4">Commit</span>
                  <span class="small text-body about-mono">
                    <a
                      v-if="commitUrl"
                      :href="commitUrl"
                      target="_blank"
                      rel="noopener"
                    >
                      {{ displayCommit }}
                    </a>
                    <span v-else>{{ displayCommit }}</span>
                  </span>
                </div>
                <div
                  class="col-6 d-flex justify-content-between align-items-baseline"
                >
                  <span class="text-muted small me-4">Electron</span>
                  <span class="small text-body">{{ electronVersion }}</span>
                </div>
                <div
                  class="col-6 d-flex justify-content-between align-items-baseline"
                >
                  <span class="text-muted small me-4">Chromium</span>
                  <span class="small text-body">{{ chromiumVersion }}</span>
                </div>
                <div
                  class="col-6 d-flex justify-content-between align-items-baseline"
                >
                  <span class="text-muted small me-4">Node.js</span>
                  <span class="small text-body">{{ nodeVersion }}</span>
                </div>
                <div
                  class="col-6 d-flex justify-content-between align-items-baseline"
                >
                  <span class="text-muted small me-4">Platform</span>
                  <span
                    class="small text-body text-end platform-value ms-2"
                    :title="platformDetails"
                  >
                    {{ platformDetails }}
                  </span>
                </div>
              </div>

              <div class="d-flex justify-content-center mt-2">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-dark d-inline-flex align-items-center gap-2 text-nowrap"
                  @click="copyVersionInfo()"
                >
                  <span
                    :class="copySuccess ? 'fa fa-check' : 'fa fa-copy'"
                  ></span>
                  <span>{{
                    copySuccess ? 'Copied!' : 'Copy version info'
                  }}</span>
                </button>
              </div>

              <div
                class="d-flex flex-wrap justify-content-center mt-2 w-100 gap-2"
              >
                <a
                  class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-2 text-nowrap"
                  href="https://github.com/Fchat-Horizon/Horizon"
                  target="_blank"
                  rel="noopener"
                >
                  <span class="fab fa-github"></span>
                  <span>GitHub</span>
                </a>
                <a
                  class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-2 text-nowrap"
                  href="https://github.com/Fchat-Horizon/Horizon/blob/main/CONTRIBUTORS.md"
                  target="_blank"
                  rel="noopener"
                >
                  <span class="fa fa-users"></span>
                  <span>Contributors</span>
                </a>
                <a
                  class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-2 text-nowrap"
                  href="https://discord.gg/JYuxqNVNtP"
                  target="_blank"
                  rel="noopener"
                >
                  <span class="fab fa-discord"></span>
                  <span>Discord</span>
                </a>
                <a
                  class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-2 text-nowrap"
                  href="https://ko-fi.com/thehorizonteam"
                  target="_blank"
                  rel="noopener"
                >
                  <span class="fa fa-coffee"></span>
                  <span>Ko-Fi</span>
                </a>
              </div>

              <hr class="w-100 my-3" />

              <p class="text-muted mb-0">
                Made with <span class="heart">❤</span> by
                <a href="https://github.com/CodingWithAnxiety" target="_blank"
                  >CodingWithAnxiety</a
                >,
                <a href="https://github.com/kawinski" target="_blank"
                  >kawinski</a
                >, and
                <a href="https://github.com/FatCatClient" target="_blank"
                  >FatCatClient</a
                >. <br />
                Thank you for using Horizon!
              </p>
            </div>

            <div class="modal-footer justify-content-center">
              <button
                type="button"
                class="btn btn-secondary"
                @click.stop="close()"
              >
                {{ l('action.close') }}
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
  import { clipboard } from 'electron';
  import Vue from 'vue';
  import l, { setLanguage } from '../chat/localize';
  import { GeneralSettings } from './common';
  import os from 'os';
  import fs from 'fs';
  import path from 'path';

  const browserWindow = remote.getCurrentWindow();
  // tslint:disable-next-line:no-require-imports
  const logoSrc = require('./build/icon.png').default;
  // tslint:disable-next-line:no-require-imports
  const aboutIconSrc = require('../assets/images/logo.svg').default;

  @Component({})
  export default class About extends Vue {
    settings!: GeneralSettings;
    appCommit = '';
    appVersion = '';
    osIsDark = remote.nativeTheme.shouldUseDarkColors;
    l = l;
    platform = process.platform;
    isMac = process.platform === 'darwin';
    logoSrc = logoSrc;
    aboutIconSrc = aboutIconSrc;
    electronVersion = process.versions.electron || 'N/A';
    chromiumVersion = process.versions.chrome || 'N/A';
    nodeVersion = process.versions.node || 'N/A';
    copySuccess = false;

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

    get displayCommit(): string {
      return this.appCommit && this.appCommit !== 'unknown'
        ? this.appCommit
        : 'N/A';
    }

    get commitUrl(): string | undefined {
      if (!this.appCommit || this.appCommit === 'unknown') return undefined;
      return `https://github.com/Fchat-Horizon/Horizon/commit/${this.appCommit}`;
    }

    get platformDetails(): string {
      const platformName = (() => {
        switch (os.platform()) {
          case 'win32':
            return 'Windows';
          case 'darwin':
            return 'macOS';
          case 'linux':
            return 'Linux';
          default:
            return os.platform();
        }
      })();
      const archLabel = (() => {
        switch (os.arch()) {
          case 'x64':
            return '64-bit';
          case 'ia32':
            return '32-bit';
          case 'arm64':
            return 'ARM64';
          default:
            return os.arch();
        }
      })();
      const release = os.release();
      return `${platformName} ${archLabel}${release ? ` (${release})` : ''}`;
    }

    get versionInfoText(): string {
      return [
        `Version: ${this.appVersion || 'N/A'}`,
        `Commit: ${this.displayCommit}`,
        `Electron: ${this.electronVersion}`,
        `Chromium: ${this.chromiumVersion}`,
        `Node.js: ${this.nodeVersion}`,
        `Platform: ${this.platformDetails}`
      ].join('\n');
    }

    get aboutIconStyle(): Record<string, string> {
      return {
        maskImage: `url(${this.aboutIconSrc})`,
        WebkitMaskImage: `url(${this.aboutIconSrc})`
      };
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
      window.addEventListener('keyup', e => {
        if (e.key === 'Escape') {
          this.close();
        }
      });
      if (process.platform === 'darwin') {
        window.addEventListener('keydown', e => {
          if (e.metaKey && e.key == 'w') {
            this.close();
          }
        });
      }
    }

    close(): void {
      browserWindow.close();
    }

    copyVersionInfo(): void {
      clipboard.writeText(this.versionInfoText);
      this.copySuccess = true;
      window.setTimeout(() => {
        this.copySuccess = false;
      }, 1500);
    }

    getThemeClass() {
      try {
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

  .about-header-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .about-title-icon {
    width: 18px;
    height: 18px;
    display: inline-block;
    background-color: currentColor;
    mask-repeat: no-repeat;
    mask-position: center;
    mask-size: contain;
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-position: center;
    -webkit-mask-size: contain;
  }

  .about-container {
    width: 100%;
    max-width: 440px;
  }

  .image-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 120px;
    margin: 4px auto 8px auto;
  }

  .image-bg {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background-image: linear-gradient(
      -2deg,
      #1b0f30 5%,
      #a0487e 19%,
      #ffa978 79%
    );
    z-index: 0;
    filter: blur(20px);
  }

  .about-logo {
    width: 80px;
    height: 80px;
    z-index: 1;
  }

  .platform-value {
    max-width: 170px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .about-mono {
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
      'Courier New', monospace;
  }

  .version-grid a {
    text-decoration: underline;
  }

  .version-grid .col-6 {
    min-width: 0;
  }

  .heart {
    animation: heartbeat 1.5s ease-in-out infinite;
    display: inline-block;
  }

  @keyframes heartbeat {
    0% {
      transform: scale(1);
    }

    14% {
      transform: scale(1.3);
    }

    28% {
      transform: scale(1);
    }

    42% {
      transform: scale(1.3);
    }

    70% {
      transform: scale(1);
    }
  }

  .platform-darwin {
    .modal-header,
    .modal-footer {
      display: none;
    }
  }
</style>

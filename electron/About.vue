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
                <img
                  class="about-logo"
                  :src="logoSrc"
                  :alt="l('about.logoAlt')"
                />
              </div>
              <h1 class="h5 fw-semibold mb-1 text-body">Horizon</h1>
              <p class="text-muted mb-2">{{ l('about.tagline') }}</p>

              <div class="row g-2 w-100 version-grid">
                <div
                  class="col-6 d-flex justify-content-between align-items-baseline"
                >
                  <span class="text-muted small me-4">{{
                    l('about.version')
                  }}</span>
                  <span class="small text-body">{{ appVersion }}</span>
                </div>
                <div
                  class="col-6 d-flex justify-content-between align-items-baseline"
                >
                  <span class="text-muted small me-4">{{
                    l('about.commit')
                  }}</span>
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
                  <span class="text-muted small me-4">{{
                    l('about.platform')
                  }}</span>
                  <span
                    class="small text-body text-end platform-value ms-2"
                    :title="platformDetails"
                  >
                    {{ platformDetails }}
                  </span>
                </div>
              </div>

              <div class="d-flex flex-wrap justify-content-center gap-2 mt-2">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-dark d-inline-flex align-items-center gap-2 text-nowrap report-bug-btn"
                  :title="l('about.opensInBrowser')"
                  @click="reportBug()"
                >
                  <span class="fa fa-bug"></span>
                  <span>{{ l('about.reportBug') }}</span>
                  <span
                    class="fa fa-arrow-up-right-from-square report-bug-external"
                    aria-hidden="true"
                  ></span>
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-dark d-inline-flex align-items-center gap-2 text-nowrap"
                  @click="copyDebugInfo()"
                >
                  <span
                    :class="copySuccess ? 'fa fa-check' : 'fa fa-copy'"
                  ></span>
                  <span>{{
                    copySuccess
                      ? l('action.copy.success')
                      : l('about.copyDebugInfo')
                  }}</span>
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-dark d-inline-flex align-items-center gap-2 text-nowrap"
                  @click="openLogs()"
                >
                  <span class="fa fa-folder-open"></span>
                  <span>{{ l('about.openLogs') }}</span>
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
                  <span>{{ l('about.contributors') }}</span>
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

              <p class="text-muted small mb-2">
                {{ l('about.licensedUnder') }}
                <a
                  href="https://mozilla.org/MPL/2.0/"
                  target="_blank"
                  rel="noopener"
                  >Mozilla Public License 2.0</a
                >
              </p>

              <p class="text-muted mb-0">
                {{ madeWithParts[0] }}<span class="heart">❤</span
                >{{ madeWithParts[1] }}
                <a href="https://github.com/CodingWithAnxiety" target="_blank"
                  >CodingWithAnxiety</a
                >,
                <a href="https://github.com/FatCatClient" target="_blank"
                  >FatCatClient</a
                >, and
                <a href="https://github.com/kawinski" target="_blank"
                  >kawinski</a
                >. <br />
                {{ l('about.thankYou') }}
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
  import * as remote from '@electron/remote';
  import { clipboard, shell } from 'electron';
  import Vue from 'vue';
  import l, { setLanguage } from '../chat/localize';
  import { GeneralSettings, defaultHost } from './common';
  import os from 'os';
  import fs from 'fs';
  import path from 'path';
  import log from 'electron-log'; //tslint:disable-line:match-default-export-name

  const browserWindow = remote.getCurrentWindow();
  // tslint:disable-next-line:no-require-imports
  const logoSrc = require('./build/icon.png').default;
  // tslint:disable-next-line:no-require-imports
  const aboutIconSrc = require('../assets/images/logo.svg').default;

  const PLATFORM_NAMES: Record<string, string> = {
    win32: 'Windows',
    darwin: 'macOS',
    linux: 'Linux'
  };

  function readLinuxDistro(): string {
    if (process.platform !== 'linux') return '';
    for (const file of ['/etc/os-release', '/usr/lib/os-release']) {
      try {
        const data: Record<string, string> = {};
        for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eq = trimmed.indexOf('=');
          if (eq === -1) continue;
          const key = trimmed.slice(0, eq).trim();
          let value = trimmed.slice(eq + 1).trim();
          if (
            value.length >= 2 &&
            (value[0] === '"' || value[0] === "'") &&
            value[value.length - 1] === value[0]
          ) {
            value = value.slice(1, -1);
          }
          data[key] = value;
        }
        if (data.PRETTY_NAME) return data.PRETTY_NAME;
        const name = data.NAME || data.ID;
        const version = data.VERSION || data.VERSION_ID;
        if (name) return version ? `${name} ${version}` : name;
      } catch (e) {}
    }
    return '';
  }

  const LINUX_ENV_KEYS = [
    'XDG_SESSION_TYPE',
    'XDG_CURRENT_DESKTOP',
    'XDG_SESSION_DESKTOP',
    'DESKTOP_SESSION',
    'GDMSESSION',
    'XDG_SESSION_CLASS',
    'WAYLAND_DISPLAY',
    'DISPLAY',
    'GDK_BACKEND',
    'QT_QPA_PLATFORM',
    'OZONE_PLATFORM',
    'ELECTRON_OZONE_PLATFORM_HINT',
    'GTK_THEME',
    'LANG',
    'LC_ALL',
    'LANGUAGE'
  ];

  function detectLinuxPackaging(): string {
    const exists = (p: string): boolean => {
      try {
        return fs.existsSync(p);
      } catch (e) {
        return false;
      }
    };
    if (process.env.FLATPAK_ID || exists('/.flatpak-info'))
      return `Flatpak${process.env.FLATPAK_ID ? ` (${process.env.FLATPAK_ID})` : ''}`;
    if (process.env.SNAP || process.env.SNAP_NAME)
      return `Snap${process.env.SNAP_NAME ? ` (${process.env.SNAP_NAME})` : ''}`;
    if (process.env.APPIMAGE) return 'AppImage';
    if (process.env.container) return `Container (${process.env.container})`;
    return 'Native';
  }

  // ^ Read from WebGL in-process: getGPUInfo's GL strings are often empty on
  //   Linux under Wayland/EGL/ANGLE.
  function readWebglInfo(): {
    vendor: string;
    renderer: string;
    version: string;
  } {
    const result = { vendor: '', renderer: '', version: '' };
    try {
      const canvas = document.createElement('canvas');
      const gl = (canvas.getContext('webgl') ||
        canvas.getContext(
          'experimental-webgl'
        )) as WebGLRenderingContext | null;
      if (!gl) return result;
      const debugExt = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugExt) {
        result.vendor = String(
          gl.getParameter(debugExt.UNMASKED_VENDOR_WEBGL) || ''
        );
        result.renderer = String(
          gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL) || ''
        );
      }
      if (!result.vendor)
        result.vendor = String(gl.getParameter(gl.VENDOR) || '');
      if (!result.renderer)
        result.renderer = String(gl.getParameter(gl.RENDERER) || '');
      result.version = String(gl.getParameter(gl.VERSION) || '');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    } catch (e) {}
    return result;
  }

  export default Vue.extend({
    data() {
      return {
        settings: undefined as any as GeneralSettings,
        appCommit: '',
        appVersion: '',
        osIsDark: remote.nativeTheme.shouldUseDarkColors,
        l,
        platform: process.platform,
        isMac: process.platform === 'darwin',
        logoSrc,
        aboutIconSrc,
        electronVersion: process.versions.electron || 'N/A',
        chromiumVersion: process.versions.chrome || 'N/A',
        nodeVersion: process.versions.node || 'N/A',
        copySuccess: false
      };
    },
    computed: {
      styling(): string {
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
      },
      displayCommit(): string {
        return this.appCommit && this.appCommit !== 'unknown'
          ? this.appCommit
          : 'N/A';
      },
      commitUrl(): string | undefined {
        if (!this.appCommit || this.appCommit === 'unknown') return undefined;
        return `https://github.com/Fchat-Horizon/Horizon/commit/${this.appCommit}`;
      },
      platformDetails(): string {
        const platformName = PLATFORM_NAMES[os.platform()] || os.platform();
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
      },
      aboutIconStyle(): Record<string, string> {
        return {
          maskImage: `url(${this.aboutIconSrc})`,
          WebkitMaskImage: `url(${this.aboutIconSrc})`
        };
      },
      // The {0} placeholder is the animated heart, kept as markup; split the
      // localized string around it so translators still get a whole phrase.
      madeWithParts(): string[] {
        const parts = l('about.madeWith').split('{0}');
        return [parts[0] || '', parts[1] || ''];
      }
    },
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
    },
    methods: {
      getSyncedTheme() {
        if (!this.settings.themeSync) return this.settings.theme;
        return this.osIsDark
          ? this.settings.themeSyncDark
          : this.settings.themeSyncLight;
      },
      close(): void {
        browserWindow.close();
      },
      resolveLogFile(): string {
        try {
          return log.transports.file.getFile().path;
        } catch (e) {
          return '';
        }
      },
      openLogs(): void {
        const file = this.resolveLogFile();
        if (file) {
          try {
            shell.showItemInFolder(file);
            return;
          } catch (e) {
            console.warn('Failed to reveal log file', e);
          }
        }
        try {
          void shell.openPath(remote.app.getPath('logs'));
        } catch (e) {
          console.warn('Failed to open logs folder', e);
        }
      },
      async reportBug(): Promise<void> {
        const base = 'https://github.com/Fchat-Horizon/Horizon/issues/new';
        let info = '';
        try {
          info = await this.buildDebugInfo();
        } catch (e) {
          console.warn('Failed to build debug info', e);
        }
        const params = new URLSearchParams({ template: 'bug.yml' });
        if (info) params.set('version-info', info);
        let url = `${base}?${params.toString()}`;
        // ! Browsers/GitHub reject very long URLs; if the prefilled form would
        // ! overflow, copy the report to the clipboard and open a blank form so
        // ! the user can paste into the field (its placeholder says to).
        if (info && url.length > 6000) {
          clipboard.writeText(info);
          url = `${base}?template=bug.yml`;
        }
        try {
          void shell.openExternal(url);
        } catch (e) {
          console.warn('Failed to open issue page', e);
        }
      },
      async copyDebugInfo(): Promise<void> {
        let text: string;
        try {
          text = await this.buildDebugInfo();
        } catch (e) {
          console.warn('Failed to build debug info', e);
          text = `Version: ${this.appVersion || 'N/A'}\nCommit: ${this.displayCommit}`;
        }
        clipboard.writeText(text);
        this.copySuccess = true;
        window.setTimeout(() => {
          this.copySuccess = false;
        }, 1500);
      },
      async buildDebugInfo(): Promise<string> {
        const safe = <T,>(fn: () => T, fallback: T): T => {
          try {
            return fn();
          } catch (e) {
            return fallback;
          }
        };

        // ! Scrub the home dir for privacy; deliberately not the bare username,
        // ! which collides with real values (e.g. theme "wilted-rose").
        const home = safe(() => os.homedir(), '');
        const scrub = (value: string): string =>
          home ? String(value).split(home).join('~') : String(value);

        const section = (
          title: string,
          rows: [string, string][]
        ): string | null => {
          const filtered = rows.filter(
            ([, v]) => v != null && String(v).trim() !== ''
          );
          if (!filtered.length) return null;
          return (
            `[${title}]\n` +
            filtered.map(([k, v]) => `${k}: ${scrub(String(v))}`).join('\n')
          );
        };

        const versions: [string, string][] = [
          ['Version', this.appVersion || 'N/A'],
          ['Commit', this.displayCommit],
          ['Electron', this.electronVersion],
          ['Chromium', this.chromiumVersion],
          ['Node.js', this.nodeVersion],
          ['V8', process.versions.v8 || 'N/A']
        ];

        // ! Allow-listed: account, proxy value and on-disk paths are excluded
        // ! so this never carries personal data.
        const s = this.settings;
        const config: [string, string][] = [];
        if (s) {
          config.push(
            ['Release channel', s.beta ? 'beta' : 'stable'],
            ['Hardware acceleration', String(s.hwAcceleration)],
            [
              'Theme',
              s.themeSync
                ? `sync (light: ${s.themeSyncLight}, dark: ${s.themeSyncDark})`
                : s.theme
            ],
            ['Display language', s.displayLanguage],
            ['Zoom level', String(s.zoomLevel)],
            ['Reduced motion', String(s.reducedMotion)],
            ['Window transparency', String(s.allowWindowTransparency)],
            ['Native window controls', String(s.forceNativeWindowControls)],
            ['Custom CSS', s.horizonCustomCssEnabled ? 'enabled' : 'disabled'],
            ['Sound theme', s.soundTheme],
            ['Log level', String(s.risingSystemLogLevel)],
            ['Proxy', s.proxy ? 'configured' : 'none']
          );
          if (s.host && s.host !== defaultHost) config.push(['Host', s.host]);
        }

        const cpus = safe(() => os.cpus(), []);
        const cpuModel = cpus.length ? cpus[0].model.trim() : '';
        const totalMemGb = safe(
          () => `${(os.totalmem() / 1024 ** 3).toFixed(1)} GB`,
          ''
        );
        const locale = safe(
          () => remote.app.getLocale(),
          process.env.LANG || ''
        );
        const kernel = os.release();
        const osVersion = safe(
          () => (process as any).getSystemVersion?.() || '',
          ''
        );
        // getSystemVersion means different things per OS: the kernel on Linux,
        // the build on Windows, the product version on macOS (where os.release
        // is separately the Darwin kernel). Label each so none reads as "Kernel"
        // on Windows.
        const versionRowsByOs: Record<string, [string, string][]> = {
          darwin: [
            ['OS version', osVersion],
            ['Kernel', kernel]
          ],
          linux: [['Kernel', kernel]]
        };
        const versionRows = versionRowsByOs[this.platform] || [
          ['OS version', osVersion || kernel]
        ];
        const system: [string, string][] = [
          ['OS', PLATFORM_NAMES[this.platform] || this.platform],
          ...versionRows,
          ['Arch', safe(() => os.arch(), '')],
          ['Distro', readLinuxDistro()],
          ['CPU', cpuModel ? `${cpuModel} (${cpus.length} threads)` : ''],
          ['Memory', totalMemGb],
          ['Locale', locale],
          [
            'Color scheme',
            remote.nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
          ],
          ['Chat logs folder', s ? s.logDirectory : '']
        ];

        const linux: [string, string][] = [];
        if (this.platform === 'linux') {
          for (const key of LINUX_ENV_KEYS) {
            const value = process.env[key];
            if (value) linux.push([key, value]);
          }
          linux.push(['Packaging', detectLinuxPackaging()]);
        }

        const gpu: [string, string][] = [];
        const webgl = readWebglInfo();
        if (webgl.vendor) gpu.push(['Vendor', webgl.vendor]);
        if (webgl.renderer) gpu.push(['Renderer', webgl.renderer]);
        if (webgl.version) gpu.push(['GL Version', webgl.version]);
        try {
          const info: any = await remote.app.getGPUInfo('complete');
          const aux = info?.auxAttributes || {};
          if (!webgl.vendor && aux.glVendor) gpu.push(['Vendor', aux.glVendor]);
          if (!webgl.renderer && aux.glRenderer)
            gpu.push(['Renderer', aux.glRenderer]);
          if (!webgl.version && aux.glVersion)
            gpu.push(['GL Version', aux.glVersion]);
          const devices: any[] = Array.isArray(info?.gpuDevice)
            ? info.gpuDevice
            : [];
          devices.forEach((d, i) => {
            const vendorId =
              typeof d?.vendorId === 'number' ? d.vendorId : null;
            const deviceId =
              typeof d?.deviceId === 'number' ? d.deviceId : null;
            if (vendorId == null && deviceId == null) return;
            const parts = [
              vendorId != null && `vendor 0x${vendorId.toString(16)}`,
              deviceId != null && `device 0x${deviceId.toString(16)}`,
              d?.active && 'active'
            ].filter(Boolean);
            gpu.push([
              devices.length > 1 ? `Device ${i + 1}` : 'Device',
              parts.join(', ')
            ]);
          });
        } catch (e) {}
        try {
          const status = remote.app.getGPUFeatureStatus();
          for (const [k, v] of Object.entries(status)) {
            gpu.push([k, String(v)]);
          }
        } catch (e) {}

        const displays: [string, string][] = [];
        try {
          const primaryId = remote.screen.getPrimaryDisplay().id;
          remote.screen.getAllDisplays().forEach((d, i) => {
            const tag = d.id === primaryId ? ' (primary)' : '';
            displays.push([
              `Display ${i + 1}${tag}`,
              `${d.size.width}x${d.size.height} @ ${d.scaleFactor}x, ${d.colorDepth}-bit`
            ]);
          });
        } catch (e) {}

        return [
          section('Horizon', versions),
          section('Horizon Config', config),
          section('System', system),
          section('Linux Desktop', linux),
          section('GPU', gpu),
          section('Displays', displays)
        ]
          .filter(Boolean)
          .join('\n\n');
      },
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
  });
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

  .report-bug-btn {
    position: relative;
  }

  // Corner glyph marking the external (browser) action; absolute so it adds
  // no width to the button.
  .report-bug-external {
    position: absolute;
    top: 2px;
    right: 3px;
    font-size: 0.5em;
    opacity: 0.65;
    pointer-events: none;
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

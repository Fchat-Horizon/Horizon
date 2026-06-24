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

              <div class="d-flex flex-wrap justify-content-center gap-2 mt-2">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-dark d-inline-flex align-items-center gap-2 text-nowrap report-bug-btn"
                  title="Opens in your browser"
                  @click="reportBug()"
                >
                  <span class="fa fa-bug"></span>
                  <span>Report a bug</span>
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
                  <span>{{ copySuccess ? 'Copied!' : 'Copy debug info' }}</span>
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-dark d-inline-flex align-items-center gap-2 text-nowrap"
                  @click="openLogs()"
                >
                  <span class="fa fa-folder-open"></span>
                  <span>Open logs</span>
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
                  href="https://github.com/Fchat-Horizon/Horizon/blob/main/docs/CONTRIBUTORS.md"
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

              <p class="text-muted small mb-2">
                Licensed under the
                <a
                  href="https://mozilla.org/MPL/2.0/"
                  target="_blank"
                  rel="noopener"
                  >Mozilla Public License 2.0</a
                >
              </p>

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
  import { clipboard, ipcRenderer } from 'electron';
  import { defineComponent, type PropType } from 'vue';
  import l, { setLanguage } from '@horizon/shared/chat/localize';
  import { getPlatform } from '@horizon/shared/platform/platform';
  import { GeneralSettings, defaultHost } from '@horizon/shared/common';
  import { createLogger } from '@horizon/shared/logger';
  import logoSrc from '@build/icon.png';
  import aboutIconSrc from '@assets/images/logo.svg';

  const log = createLogger('about');

  const PLATFORM_NAMES: Record<string, string> = {
    win32: 'Windows',
    darwin: 'macOS',
    linux: 'Linux'
  };

  /** Shape returned by the main-process `debug-info-collect` IPC handler. */
  interface DebugInfo {
    homedir: string;
    v8: string;
    cpuModel: string;
    cpuThreads: number;
    totalMem: number;
    arch: string;
    kernel: string;
    osVersion: string;
    locale: string;
    isDark: boolean;
    distro: string;
    linuxEnv: [string, string][];
    packaging: string;
    logFolder: string;
    gpu: {
      glVendor: string;
      glRenderer: string;
      glVersion: string;
      devices: {
        vendorId: number | null;
        deviceId: number | null;
        active: boolean;
      }[];
    };
    gpuFeatureStatus: Record<string, string>;
    displays: {
      index: number;
      primary: boolean;
      width: number;
      height: number;
      scaleFactor: number;
      colorDepth: number;
    }[];
  }

  /* GPU vendor/renderer strings read from WebGL. getGPUInfo's GL strings are
     often empty on Linux under Wayland/EGL/ANGLE, so this is the more reliable
     source; it stays renderer-side because it is pure DOM, not Node. */
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
    } catch {
      // WebGL probing is best-effort; absent info falls back to main-process GL.
    }
    return result;
  }

  export default defineComponent({
    props: {
      initialSettings: {
        type: Object as PropType<GeneralSettings>,
        required: true
      },
      appCommit: { type: String, required: true },
      appVersion: { type: String, required: true }
    },
    data() {
      const versions = <{ [key: string]: string | undefined }>(
        ((ipcRenderer.sendSync('os-info-sync') as any).versions ?? {})
      );
      return {
        settings: this.initialSettings,
        osIsDark: ipcRenderer.sendSync('native-theme-dark-sync') as boolean,
        l,
        platform: getPlatform(),
        isMac: getPlatform() === 'darwin',
        logoSrc,
        aboutIconSrc,
        electronVersion: versions.electron || 'N/A',
        chromiumVersion: versions.chrome || 'N/A',
        nodeVersion: versions.node || 'N/A',
        copySuccess: false
      };
    },
    computed: {
      styling(): string {
        const theme = this.getSyncedTheme();
        let css = <string | null>(
          ipcRenderer.sendSync('themes-read-sync', theme)
        );
        // Fall back to the default theme without mutating settings.
        if (css === null && theme !== 'default') {
          css = <string | null>(
            ipcRenderer.sendSync('themes-read-sync', 'default')
          );
        }
        if (css === null) throw new Error('Default theme is missing');
        return `<style>${css}</style>`;
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
        const osInfo = <{ platform: string; arch: string; release: string }>(
          ipcRenderer.sendSync('os-info-sync')
        );
        const platformName = (() => {
          switch (osInfo.platform) {
            case 'win32':
              return 'Windows';
            case 'darwin':
              return 'macOS';
            case 'linux':
              return 'Linux';
            default:
              return osInfo.platform;
          }
        })();
        const archLabel = (() => {
          switch (osInfo.arch) {
            case 'x64':
              return '64-bit';
            case 'ia32':
              return '32-bit';
            case 'arm64':
              return 'ARM64';
            default:
              return osInfo.arch;
          }
        })();
        const release = osInfo.release;
        return `${platformName} ${archLabel}${release ? ` (${release})` : ''}`;
      },
      aboutIconStyle(): Record<string, string> {
        return {
          maskImage: `url("${this.aboutIconSrc}")`,
          WebkitMaskImage: `url("${this.aboutIconSrc}")`
        };
      }
    },
    async mounted(): Promise<void> {
      ipcRenderer.on(
        'native-theme-updated',
        (_e: Electron.IpcRendererEvent, isDark: boolean) => {
          this.osIsDark = isDark;
        }
      );
      try {
        setLanguage(this.settings.displayLanguage);
      } catch (e) {
        log.warn('Failed to set display language', e);
      }
      window.addEventListener('keyup', e => {
        if (e.key === 'Escape') {
          this.close();
        }
      });
      if (getPlatform() === 'darwin') {
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
        ipcRenderer.send('window-close');
      },
      openLogs(): void {
        try {
          const logs = ipcRenderer.sendSync('app-path-sync', 'logs') as string;
          if (logs) ipcRenderer.send('open-dir', logs);
        } catch (e) {
          log.warn('Failed to open logs folder', e);
        }
      },
      async reportBug(): Promise<void> {
        const base = 'https://github.com/Fchat-Horizon/Horizon/issues/new';
        let info = '';
        try {
          info = await this.buildDebugInfo();
        } catch (e) {
          log.warn('Failed to build debug info', e);
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
        ipcRenderer.send('open-url-externally', url);
      },
      async copyDebugInfo(): Promise<void> {
        let text: string;
        try {
          text = await this.buildDebugInfo();
        } catch (e) {
          log.warn('Failed to build debug info', e);
          text = `Version: ${this.appVersion || 'N/A'}\nCommit: ${this.displayCommit}`;
        }
        clipboard.writeText(text);
        this.copySuccess = true;
        window.setTimeout(() => {
          this.copySuccess = false;
        }, 1500);
      },
      // Formats a privacy-scrubbed diagnostics report. All main-process data
      // comes from the `debug-info-collect` IPC handler; only the WebGL probe
      // and `this.settings` are read here in the renderer.
      async buildDebugInfo(): Promise<string> {
        const d = (await ipcRenderer.invoke('debug-info-collect')) as DebugInfo;

        // ! Scrub the home dir for privacy; deliberately not the bare username,
        // ! which collides with real values (e.g. theme "wilted-rose").
        const home = d.homedir || '';
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
          ['V8', d.v8 || 'N/A']
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

        const totalMemGb = d.totalMem
          ? `${(d.totalMem / 1024 ** 3).toFixed(1)} GB`
          : '';
        // getSystemVersion means different things per OS: the kernel on Linux,
        // the build on Windows, the product version on macOS (where os.release
        // is separately the Darwin kernel). Label each so none reads as "Kernel"
        // on Windows.
        const versionRowsByOs: Record<string, [string, string][]> = {
          darwin: [
            ['OS version', d.osVersion],
            ['Kernel', d.kernel]
          ],
          linux: [['Kernel', d.kernel]]
        };
        const versionRows = versionRowsByOs[this.platform] || [
          ['OS version', d.osVersion || d.kernel]
        ];
        const system: [string, string][] = [
          ['OS', PLATFORM_NAMES[this.platform] || this.platform],
          ...versionRows,
          ['Arch', d.arch],
          ['Distro', d.distro],
          ['CPU', d.cpuModel ? `${d.cpuModel} (${d.cpuThreads} threads)` : ''],
          ['Memory', totalMemGb],
          ['Locale', d.locale],
          ['Color scheme', d.isDark ? 'dark' : 'light'],
          ['Log folder', d.logFolder]
        ];

        const linux: [string, string][] = [];
        if (this.platform === 'linux') {
          for (const [k, v] of d.linuxEnv) linux.push([k, v]);
          linux.push(['Packaging', d.packaging]);
        }

        const gpu: [string, string][] = [];
        const webgl = readWebglInfo();
        const glVendor = webgl.vendor || d.gpu.glVendor;
        const glRenderer = webgl.renderer || d.gpu.glRenderer;
        const glVersion = webgl.version || d.gpu.glVersion;
        if (glVendor) gpu.push(['Vendor', glVendor]);
        if (glRenderer) gpu.push(['Renderer', glRenderer]);
        if (glVersion) gpu.push(['GL Version', glVersion]);
        d.gpu.devices.forEach((dev, i) => {
          if (dev.vendorId == null && dev.deviceId == null) return;
          const parts = [
            dev.vendorId != null && `vendor 0x${dev.vendorId.toString(16)}`,
            dev.deviceId != null && `device 0x${dev.deviceId.toString(16)}`,
            dev.active && 'active'
          ].filter(Boolean);
          gpu.push([
            d.gpu.devices.length > 1 ? `Device ${i + 1}` : 'Device',
            parts.join(', ')
          ]);
        });
        for (const [k, v] of Object.entries(d.gpuFeatureStatus || {})) {
          gpu.push([k, String(v)]);
        }

        const displays: [string, string][] = d.displays.map(
          (disp): [string, string] => [
            `Display ${disp.index + 1}${disp.primary ? ' (primary)' : ''}`,
            `${disp.width}x${disp.height} @ ${disp.scaleFactor}x, ${disp.colorDepth}-bit`
          ]
        );

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
          if (getPlatform() === 'win32') {
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

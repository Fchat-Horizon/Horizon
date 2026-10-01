/** Main-process system diagnostics, extracted from PR #822. */
import * as electron from 'electron';
import * as os from 'os';
import * as fs from 'fs';
import type { AboutDiagnostics } from './diagnostics-contract';

/* Environment variables worth surfacing for Linux desktop/session diagnostics
   in the About dialog's debug report. */
const LINUX_ENV_KEYS = [
  'XDG_SESSION_TYPE',
  'XDG_CURRENT_DESKTi did discove OP',
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

/** Parses /etc/os-release for a human-readable distro name (Linux only). */
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

/** Detects how a Linux build is packaged (Flatpak/Snap/AppImage/...). */
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

function collectLinuxEnv(): [string, string][] {
  if (process.platform !== 'linux') return [];
  const out: [string, string][] = [];
  for (const key of LINUX_ENV_KEYS) {
    const value = process.env[key];
    if (value) out.push([key, value]);
  }
  return out;
}

/**
 * Gathers the main-process-only system data the About dialog's debug report
 * needs. Returns lean, serializable values (raw GPU/display objects are
 * trimmed) so the renderer can format the report without any Node access.
 */
export async function collectAboutDiagnostics(): Promise<AboutDiagnostics> {
  const safe = <T>(fn: () => T, fallback: T): T => {
    try {
      return fn();
    } catch (e) {
      return fallback;
    }
  };

  const cpus = safe(() => os.cpus(), [] as os.CpuInfo[]);

  const gpu = {
    glVendor: '',
    glRenderer: '',
    glVersion: '',
    devices: [] as {
      vendorId: number | null;
      deviceId: number | null;
      active: boolean;
    }[]
  };
  try {
    const info = (await electron.app.getGPUInfo('complete')) as {
      auxAttributes?: {
        glVendor?: string;
        glRenderer?: string;
        glVersion?: string;
      };
      gpuDevice?: { vendorId?: number; deviceId?: number; active?: boolean }[];
    };
    const aux = info?.auxAttributes || {};
    gpu.glVendor = aux.glVendor || '';
    gpu.glRenderer = aux.glRenderer || '';
    gpu.glVersion = aux.glVersion || '';
    gpu.devices = (Array.isArray(info?.gpuDevice) ? info.gpuDevice : []).map(
      d => ({
        vendorId: typeof d?.vendorId === 'number' ? d.vendorId : null,
        deviceId: typeof d?.deviceId === 'number' ? d.deviceId : null,
        active: !!d?.active
      })
    );
  } catch (e) {}

  let gpuFeatureStatus: Record<string, string> = {};
  try {
    gpuFeatureStatus = electron.app.getGPUFeatureStatus() as unknown as Record<
      string,
      string
    >;
  } catch (e) {}

  let displays: {
    index: number;
    primary: boolean;
    width: number;
    height: number;
    scaleFactor: number;
    colorDepth: number;
  }[] = [];
  try {
    const primaryId = electron.screen.getPrimaryDisplay().id;
    displays = electron.screen.getAllDisplays().map((d, i) => ({
      index: i,
      primary: d.id === primaryId,
      width: d.size.width,
      height: d.size.height,
      scaleFactor: d.scaleFactor,
      colorDepth: d.colorDepth
    }));
  } catch (e) {}

  return {
    homedir: safe(() => os.homedir(), ''),
    v8: process.versions.v8 || '',
    cpuModel: cpus.length ? cpus[0].model.trim() : '',
    cpuThreads: cpus.length,
    totalMem: safe(() => os.totalmem(), null),
    arch: os.arch(),
    kernel: os.release(),
    osVersion: safe(() => process.getSystemVersion?.() || '', ''),
    locale: safe(() => electron.app.getLocale(), process.env.LANG || ''),
    isDark: electron.nativeTheme.shouldUseDarkColors,
    distro: readLinuxDistro(),
    linuxEnv: collectLinuxEnv(),
    packaging: process.platform === 'linux' ? detectLinuxPackaging() : '',
    gpu,
    gpuFeatureStatus,
    displays
  };
}

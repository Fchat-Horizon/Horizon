/** Serializable diagnostics shared by the About renderer and main process. */
export const ABOUT_DIAGNOSTICS_CHANNEL = 'about:collect-diagnostics';

export interface AboutDiagnostics {
  homedir: string;
  v8: string;
  cpuModel: string;
  cpuThreads: number;
  totalMem: number | null;
  arch: string;
  kernel: string;
  osVersion: string;
  locale: string;
  isDark: boolean;
  distro: string;
  linuxEnv: [string, string][];
  packaging: string;
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

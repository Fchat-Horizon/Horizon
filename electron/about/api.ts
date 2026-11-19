import type { GeneralSettings } from '../common';
import type { AboutDiagnostics } from './diagnostics-contract';

// Only settings used for About's presentation/report; no account or proxy value.
export type AboutSettings = Pick<
  GeneralSettings,
  | 'beta'
  | 'hwAcceleration'
  | 'theme'
  | 'themeSync'
  | 'themeSyncLight'
  | 'themeSyncDark'
  | 'displayLanguage'
  | 'zoomLevel'
  | 'reducedMotion'
  | 'allowWindowTransparency'
  | 'forceNativeWindowControls'
  | 'horizonCustomCssEnabled'
  | 'soundTheme'
  | 'risingSystemLogLevel'
  | 'risingDisableWindowsHighContrast'
  | 'horizonBbcodeGlow'
  | 'logDirectory'
> & { proxyConfigured: boolean; customHost?: string };

export interface AboutAppearance {
  revision: number;
  isDark: boolean;
  css: string;
}

export interface AboutState {
  settings: AboutSettings;
  appVersion: string;
  appCommit: string;
  platform: string;
  arch: string;
  release: string;
  versions: { electron: string; chrome: string; node: string };
  appearance: AboutAppearance;
}

export interface AboutApi {
  getState(): Promise<AboutState>;
  getAppearance(): Promise<AboutAppearance>;
  collectDiagnostics(): Promise<AboutDiagnostics>;
  copyText(text: string): Promise<void>;
  reportBug(report: string): Promise<void>;
  revealLogs(): Promise<void>;
  ready(): void;
  close(): void;
  onAppearanceChanged(
    listener: (appearance: AboutAppearance) => void
  ): () => void;
}

export const ABOUT_CHANNELS = {
  state: 'about:get-state',
  appearance: 'about:get-appearance',
  appearanceChanged: 'about:appearance-changed',
  copyText: 'about:copy-text',
  reportBug: 'about:report-bug',
  revealLogs: 'about:reveal-logs',
  ready: 'about:ready',
  close: 'about:close'
} as const;

declare global {
  interface Window {
    horizonAbout: AboutApi;
  }
}

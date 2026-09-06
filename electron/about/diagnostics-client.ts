import { ipcRenderer } from 'electron';
import { ABOUT_DIAGNOSTICS_CHANNEL } from './diagnostics-contract';
import type { AboutDiagnostics } from './diagnostics-contract';

// NOTE: This dedicated call will move behind About's preload in the next migration.
export function collectAboutDiagnostics(): Promise<AboutDiagnostics> {
  return ipcRenderer.invoke(ABOUT_DIAGNOSTICS_CHANNEL);
}

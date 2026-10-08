import type { AboutDiagnostics } from './diagnostics-contract';
import type {} from './api';

export function collectAboutDiagnostics(): Promise<AboutDiagnostics> {
  return window.horizonAbout.collectDiagnostics();
}

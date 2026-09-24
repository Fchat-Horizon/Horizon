import type { WebContents } from 'electron';
import { assertAboutSender } from './ipc-validation';
import { ABOUT_DIAGNOSTICS_CHANNEL } from './diagnostics-contract';
import { collectAboutDiagnostics } from './diagnostics';

export function registerAboutDiagnostics(
  contents: WebContents,
  aboutFile: string
): void {
  const ipc = contents.ipc;
  ipc.handle(ABOUT_DIAGNOSTICS_CHANNEL, (event, ...args: unknown[]) => {
    assertAboutSender(contents, aboutFile, event);
    if (args.length !== 0)
      throw new Error('Invalid About diagnostics request.');
    return collectAboutDiagnostics();
  });
  contents.once('destroyed', () => {
    ipc.removeHandler(ABOUT_DIAGNOSTICS_CHANNEL);
  });
}

import type { WebContents } from 'electron';
import { pathToFileURL } from 'url';
import { ABOUT_DIAGNOSTICS_CHANNEL } from './diagnostics-contract';
import { collectAboutDiagnostics } from './diagnostics';

export function registerAboutDiagnostics(
  contents: WebContents,
  aboutFile: string
): void {
  const expectedUrl = pathToFileURL(aboutFile).href;
  const ipc = contents.ipc;
  ipc.handle(ABOUT_DIAGNOSTICS_CHANNEL, (event, ...args: unknown[]) => {
    const frame = event.senderFrame;
    if (!frame || event.sender !== contents || frame !== contents.mainFrame) {
      throw new Error('About diagnostics require the About main frame.');
    }
    const url = new URL(frame.url);
    url.search = '';
    url.hash = '';
    if (url.href !== expectedUrl || args.length !== 0) {
      throw new Error('Invalid About diagnostics request.');
    }
    return collectAboutDiagnostics();
  });
  contents.once('destroyed', () => {
    ipc.removeHandler(ABOUT_DIAGNOSTICS_CHANNEL);
  });
}

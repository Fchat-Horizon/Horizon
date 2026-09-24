import type { IpcMainEvent, WebContents } from 'electron';
import { pathToFileURL } from 'url';

export function assertAboutSender(
  contents: WebContents,
  aboutFile: string,
  event: Pick<IpcMainEvent, 'sender' | 'senderFrame'>
): void {
  const frame = event.senderFrame;
  if (!frame || event.sender !== contents || frame !== contents.mainFrame) {
    throw new Error('About requests require the About main frame.');
  }
  const url = new URL(frame.url);
  url.search = '';
  url.hash = '';
  if (url.href !== pathToFileURL(aboutFile).href) {
    throw new Error('Invalid About document.');
  }
}

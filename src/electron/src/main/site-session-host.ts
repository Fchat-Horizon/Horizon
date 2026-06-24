/**
 * @module site-session-host
 * Main-process HTTP transport for the renderer's SiteSession. The cookie-jar
 * axios stack requires the Node http adapter, which the renderer bundle does
 * not have (webpack resolves the browser build of axios there), so renderers
 * reach it over IPC.
 *
 * * Each tab webContents gets its own transport (cookie jar), mirroring the
 * * old per-renderer SiteSession instances: different tabs may be logged in
 * * to different accounts.
 */

import * as electron from 'electron';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import Axios from 'axios';
import { wrapper as addCookieJar } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const transports = new Map<number, AxiosInstance>();

function createTransport(): AxiosInstance {
  return addCookieJar(
    Axios.create({
      baseURL: 'https://www.f-list.net',
      adapter: 'http',
      jar: new CookieJar()
    })
  );
}

function transportFor(sender: electron.WebContents): AxiosInstance {
  let transport = transports.get(sender.id);
  if (transport === undefined) {
    transport = createTransport();
    transports.set(sender.id, transport);
    sender.on('destroyed', () => transports.delete(sender.id));
  }
  return transport;
}

let initialized = false;

export function initSiteSessionHost(): void {
  if (initialized) return;
  initialized = true;

  /* Drops the sender's cookie jar; the renderer calls this before each fresh
     site login. */
  electron.ipcMain.handle('site-session-reset', e => {
    transports.set(e.sender.id, createTransport());
  });

  electron.ipcMain.handle(
    'site-session-request',
    async (e, config: AxiosRequestConfig) => {
      // ! Only site-relative paths may pass; the baseURL pins f-list.net.
      if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(config.url ?? ''))
        throw new Error('site-session-request: absolute URLs are not allowed');

      const res = await transportFor(e.sender).request(config);
      // Only the serializable parts cross back over IPC.
      return { status: res.status, data: res.data };
    }
  );
}

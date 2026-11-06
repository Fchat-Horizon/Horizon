import * as electron from 'electron';
import * as dns from 'dns';
import * as net from 'net';
import log from 'electron-log'; //tslint:disable-line:match-default-export-name
import Axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const FETCH_TIMEOUT_MS = 10000;
const FETCH_MAX_BYTES = 2 * 1024 * 1024;
const FETCH_MAX_REDIRECTS = 5;

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number);

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);

  const lower = ip.toLowerCase();
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);

  if (mapped) return isPrivateIPv4(mapped[1]);

  return (
    lower === '::' ||
    lower === '::1' ||
    lower.startsWith('fc') ||
    lower.startsWith('fd') ||
    lower.startsWith('fe8') ||
    lower.startsWith('fe9') ||
    lower.startsWith('fea') ||
    lower.startsWith('feb')
  );
}

// ! Chat links drive these requests from the main process, which has no
// same-origin policy, so anything that resolves into the local network is refused.
async function assertPublicUrl(url: string): Promise<URL> {
  const parsed = new URL(url);

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Unsupported protocol: ${parsed.protocol}`);
  }

  const host = parsed.hostname.replace(/^\[|\]$/g, '');
  const addresses = net.isIP(host)
    ? [host]
    : (await dns.promises.lookup(host, { all: true })).map(a => a.address);

  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    log.warn('imagePreview.fetch.refused', parsed.hostname);
    throw new Error(`Refusing to fetch non-public host: ${parsed.hostname}`);
  }

  return parsed;
}

async function fetchPublic<T>(
  url: string,
  config: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  let current = url;

  for (let hop = 0; hop <= FETCH_MAX_REDIRECTS; hop++) {
    const target = await assertPublicUrl(current);
    const response = await Axios.get<T>(target.href, {
      ...config,
      timeout: FETCH_TIMEOUT_MS,
      maxContentLength: FETCH_MAX_BYTES,
      maxRedirects: 0,
      validateStatus: status => status >= 200 && status < 400,
      headers: {
        ...config.headers,
        'User-Agent': `F-Chat Horizon/${electron.app.getVersion()}`
      }
    });
    const location = response.headers['location'];

    if (response.status < 300 || !location) return response;

    current = new URL(location, target).href;
  }

  throw new Error(`Too many redirects: ${url}`);
}

export async function fetchPreviewPage(url: string): Promise<string> {
  const response = await fetchPublic<string>(url, {
    responseType: 'text',
    transformResponse: [(data: string) => data],
    headers: { Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1' }
  });
  const contentType = String(response.headers['content-type'] ?? '');

  if (!contentType.includes('html')) {
    throw new Error(`Not an HTML page: ${contentType || 'unknown'}`);
  }

  return response.data;
}

export async function fetchPreviewJson(url: string): Promise<unknown> {
  const response = await fetchPublic<unknown>(url, {
    responseType: 'json',
    headers: { Accept: 'application/json' }
  });

  return response.data;
}

export function registerPreviewPageFetch(): void {
  electron.ipcMain.handle(
    'preview-fetch-page',
    (_event: electron.IpcMainInvokeEvent, url: string) => fetchPreviewPage(url)
  );
  electron.ipcMain.handle(
    'preview-fetch-json',
    (_event: electron.IpcMainInvokeEvent, url: string) => fetchPreviewJson(url)
  );
}

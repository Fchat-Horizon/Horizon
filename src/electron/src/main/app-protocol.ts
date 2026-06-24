import * as electron from 'electron';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { createLogger } from '@horizon/shared/logger';
import { isWithin, mimeFor, resolveUnderRoot } from './app-tree';

const log = createLogger('app-protocol');

export const APP_SCHEME = 'app';
export const APP_ORIGIN = `${APP_SCHEME}://bundle`;

// Where main.js, the renderer pages and their assets all live (the flat app/).
const appRoot = __dirname;

// On-disk directories outside app/ the renderer may stream media from (bundled
// default-sound fallbacks). Registered at startup, re-checked on every request.
const mediaRoots = new Set<string>();

export function allowMediaRoot(dir: string): void {
  mediaRoots.add(path.resolve(dir));
}

/**
 * Builds an `app://bundle/@media` URL for an arbitrary on-disk file whose
 * directory has been registered via {@link allowMediaRoot}.
 */
export function mediaUrl(absPath: string): string {
  return `${APP_ORIGIN}/@media?p=${encodeURIComponent(absPath)}`;
}

function resolveRequest(url: URL): string | undefined {
  if (url.pathname === '/@media') {
    const p = url.searchParams.get('p');
    if (p === null || p === '') return undefined;
    const abs = path.resolve(p);
    for (const root of mediaRoots) if (isWithin(root, abs)) return abs;
    return undefined;
  }
  return resolveUnderRoot(appRoot, url.pathname, 'index.html');
}

async function handleAppRequest(request: Request): Promise<Response> {
  const file = resolveRequest(new URL(request.url));
  if (file === undefined) return new Response('Not found', { status: 404 });

  let res: Response;
  try {
    // net.fetch streams the file and honors range requests (needed by <audio>).
    res = await electron.net.fetch(pathToFileURL(file).toString());
  } catch {
    log.warn('app-protocol.notFound', { url: request.url });
    return new Response('Not found', { status: 404 });
  }
  if (!res.ok) return res;

  const mime = mimeFor(file);
  if (mime === undefined) return res;
  const headers = new Headers(res.headers);
  headers.set('content-type', mime);
  return new Response(res.body, { status: res.status, headers });
}

/**
 * Declares `app://` as a standard, secure origin. Must run at module load,
 * before `ready`; privileged scheme registration is rejected once a session
 * exists.
 */
export function registerAppSchemePrivileges(): void {
  electron.protocol.registerSchemesAsPrivileged([
    {
      scheme: APP_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true
      }
    }
  ]);
}

/**
 * Installs the `app://` handler on a session. `protocol.handle` is per-session,
 * so every session that loads a renderer page needs it: the default session and
 * the `persist:fchat` partition behind the chat WebContentsView. Run after
 * `ready`, before any window loads an `app://` page.
 */
export function serveAppProtocol(
  ses: electron.Session = electron.session.defaultSession
): void {
  ses.protocol.handle(APP_SCHEME, handleAppRequest);
}

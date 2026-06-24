import * as path from 'path';

/*
 * ^ One serving contract for the emitted app/ tree, shared so its two transports
 * - the prod app:// handler and the dev Vite middleware - can't drift into
 * divergent MIME tables and path guards.
 */

// net.fetch (prod) and bare file streams (dev) both derive an unreliable
// content-type, so the extensions the browser strictly enforces, plus the audio
// and image types the themes ship, are pinned here; anything absent falls back
// to the transport's own sniffing.
const STRICT_MIME: Record<string, string> = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.map': 'application/json',
  '.wasm': 'application/wasm',
  '.html': 'text/html',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac'
};

export function mimeFor(file: string): string | undefined {
  return STRICT_MIME[path.extname(file).toLowerCase()];
}

export function isWithin(root: string, target: string): boolean {
  return target === root || target.startsWith(root + path.sep);
}

/**
 * Function: absolute file under `root`, or undefined if the path escapes root
 * or is malformed. ! Malformed yields undefined (a caller 404 / fall-through),
 * never a throw - both consumers depend on that.
 */
export function resolveUnderRoot(
  root: string,
  urlPath: string,
  emptyFallback?: string
): string | undefined {
  let rel: string;
  try {
    rel = decodeURIComponent(urlPath.replace(/^\/+/, ''));
  } catch {
    return undefined;
  }
  // A decoded NUL byte makes fs throw synchronously instead of resolving to a
  // clean miss, so reject it like any other malformed path.
  if (rel.includes('\0')) return undefined;
  if (rel === '' && emptyFallback !== undefined) rel = emptyFallback;
  const abs = path.resolve(root, rel);
  return isWithin(root, abs) ? abs : undefined;
}

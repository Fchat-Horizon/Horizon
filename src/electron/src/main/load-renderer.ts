import { APP_ORIGIN } from './app-protocol';

/*
 * ^ Resolves to the dev server (ELECTRON_RENDERER_URL) or the built app://
 *   pages, but always via a single loadURL so window code never branches on mode.
 */
interface PageLoader {
  loadURL(url: string): Promise<void>;
}

export function loadRendererPage(
  target: PageLoader,
  page: string,
  query: Record<string, string> = {}
): Promise<void> {
  const base = process.env.ELECTRON_RENDERER_URL ?? APP_ORIGIN;
  const url = new URL(page, `${base}/`);
  for (const [key, value] of Object.entries(query))
    url.searchParams.set(key, value);
  return target.loadURL(url.href);
}

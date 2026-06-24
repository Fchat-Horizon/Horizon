import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);

function splitSpecifier(spec: string): [string, string] {
  const sep =
    spec[0] === '@'
      ? spec.indexOf('/', spec.indexOf('/') + 1)
      : spec.indexOf('/');
  return sep === -1 ? [spec, ''] : [spec.slice(0, sep), spec.slice(sep + 1)];
}

/*
 * sass only consults a FileImporter after relative resolution fails, so local
 * partials never reach here - only bare package specifiers (bootstrap, fa) do.
 * Resolving through Node's own resolver finds each package wherever it installs,
 * including pnpm's nested store, which a flat load-path would miss.
 */
export const packageImporter = {
  findFileUrl(url: string): URL | null {
    if (url.startsWith('.') || url.startsWith('/')) return null;
    const [pkg, subpath] = splitSpecifier(url);
    let pkgDir: string;
    try {
      pkgDir = path.dirname(require.resolve(`${pkg}/package.json`));
    } catch {
      return null;
    }
    return pathToFileURL(path.join(pkgDir, subpath));
  }
};

// Bootstrap's color-contrast() emits a WCAG @warn per theme color from inside
// node_modules; quietDeps only covers deprecations, so this drops warnings whose
// origin is a dependency while keeping our own themes' warnings.
const quietDepLogger = {
  warn(
    message: string,
    options: {
      span?: { url?: { toString(): string } };
      stack?: string;
    }
  ): void {
    const origin =
      options.span?.url?.toString() ?? (options.stack ?? '').split('\n')[0];
    if (origin.includes('node_modules')) return;
    // eslint-disable-next-line no-console
    console.warn(`WARNING: ${message}`);
  }
};

const silencedDeprecations = [
  'import',
  'color-functions',
  'global-builtin',
  'slash-div',
  'function-units',
  'if-function'
] as const;

export const scssOptions = {
  importers: [packageImporter],
  quietDeps: true,
  logger: quietDepLogger,
  silenceDeprecations: [...silencedDeprecations]
};

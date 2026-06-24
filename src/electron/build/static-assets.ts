import type { Plugin } from 'vite';
import { createRequire } from 'node:module';
import { compile } from 'sass-embedded';
import {
  readdirSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  cpSync,
  statSync,
  createReadStream
} from 'node:fs';
import path from 'node:path';
import { scssOptions } from '@horizon/themes/sass-options';
// Relative, not @main/: this plugin is bundled with the Vite config by esbuild,
// which does not apply the project's path aliases.
import { mimeFor, resolveUnderRoot } from '../src/main/app-tree';

const require = createRequire(import.meta.url);
const pkgRoot = (name: string): string =>
  path.dirname(require.resolve(`${name}/package.json`));

// Themes are read off disk and injected as inline <style> at runtime, so their
// url()s resolve against the page (app://bundle/). A leftover ~ means a dead
// webpack specifier that would 404 - fail the build instead of shipping it.
function assertNoTildeUrl(css: string, label: string): void {
  if (/url\(\s*['"]?~/.test(css))
    throw new Error(
      `${label}: compiled CSS contains an unresolved ~ url() specifier`
    );
}

/*
 * Emits the on-disk assets the renderer and main process read at runtime but
 * that never enter the JS bundle graph: the chat themes + Font Awesome compiled
 * to standalone CSS, their webfonts, the static sound/preview trees, shared
 * images, and the app/ package.json the packaged app boots from. Runs in
 * buildStart so it covers both `dev` and `build`.
 */
export function staticAssets(appDir: string, production: boolean): Plugin {
  const desktopDir = path.dirname(appDir);

  const emit = (): void => {
    const scssDir = path.join(pkgRoot('@horizon/themes'), 'src', 'scss');
    const sharedChat = path.join(pkgRoot('@horizon/shared'), 'src', 'chat');
    const style = production ? 'compressed' : 'expanded';

    const compileScss = (entry: string, outFile: string): void => {
      const { css } = compile(entry, { ...scssOptions, style });
      assertNoTildeUrl(css, path.basename(outFile));
      mkdirSync(path.dirname(outFile), { recursive: true });
      writeFileSync(outFile, css);
    };

    const chatThemes = path.join(scssDir, 'themes', 'chat');
    for (const file of readdirSync(chatThemes)) {
      if (!file.endsWith('.scss')) continue;
      compileScss(
        path.join(chatThemes, file),
        path.join(appDir, 'themes', `${file.slice(0, -'.scss'.length)}.css`)
      );
    }

    compileScss(path.join(scssDir, 'fa.scss'), path.join(appDir, 'fa.css'));

    const copies: [string, string][] = [
      [
        path.join(pkgRoot('@fortawesome/fontawesome-free'), 'webfonts'),
        path.join(appDir, 'webfonts')
      ],
      [
        path.join(sharedChat, 'preview', 'assets'),
        path.join(appDir, 'preview', 'assets')
      ],
      [
        path.join(sharedChat, 'sound-themes'),
        path.join(appDir, 'sound-themes')
      ],
      [
        path.join(pkgRoot('@horizon/shared'), 'assets'),
        path.join(appDir, 'assets')
      ],
      [path.join(desktopDir, 'build'), path.join(appDir, 'build')]
    ];
    for (const [from, to] of copies) cpSync(from, to, { recursive: true });

    // app/ package.json boots the packaged app: drop the electron-builder block
    // and point main at the colocated build output.
    const pkg = JSON.parse(
      readFileSync(path.join(desktopDir, 'package.json'), 'utf8')
    );
    delete pkg.build;
    pkg.main = 'main.js';
    writeFileSync(
      path.join(appDir, 'package.json'),
      JSON.stringify(pkg, null, 2)
    );
  };

  // The emitted app/ subtrees the renderer fetches by URL: fa.css + its
  // webfonts, themed sounds, and theme images/fonts from inline-<style> url()s.
  // The dev server roots at src/renderer, so stream these off app/ as the prod
  // app:// handler does (themes load via IPC, preview/icons read off disk).
  const devServed = /^\/(?:fa\.css$|webfonts\/|sound-themes\/|assets\/)/;

  return {
    name: 'horizon-static-assets',
    buildStart() {
      emit();
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0];
        if (!devServed.test(url)) return next();
        const file = resolveUnderRoot(appDir, url);
        if (file === undefined) return next();
        // ^ Match on the resolved path, not the raw URL: /webfonts/../main.js
        // passes the regex but normalizes out of the subtree, so re-check the
        // in-root path and bail if it escaped.
        const served =
          '/' + path.relative(appDir, file).split(path.sep).join('/');
        if (!devServed.test(served)) return next();
        const stat = statSync(file, { throwIfNoEntry: false });
        if (!stat?.isFile()) {
          // These trees exist only on disk; a miss is a missing asset, not a
          // path for Vite's SPA fallback to answer with index.html and a 200.
          res.statusCode = 404;
          res.end();
          return;
        }
        const mime = mimeFor(file);
        if (mime !== undefined) res.setHeader('Content-Type', mime);
        const stream = createReadStream(file);
        stream.on('error', () => {
          // After the body has started there is no clean status left to send,
          // so drop the connection rather than end with a silent truncated 200.
          if (res.headersSent) res.destroy();
          else {
            res.statusCode = 500;
            res.end();
          }
        });
        stream.pipe(res);
      });
    }
  };
}

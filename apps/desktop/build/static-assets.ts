import type { Plugin } from 'vite';
import { createRequire } from 'node:module';
import { compile } from 'sass-embedded';
import {
  readdirSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  cpSync
} from 'node:fs';
import path from 'node:path';
import { scssOptions } from '@horizon/themes/sass-options';

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

  return {
    name: 'horizon-static-assets',
    buildStart() {
      emit();
    }
  };
}

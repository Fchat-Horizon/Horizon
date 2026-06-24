import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import vue from '@vitejs/plugin-vue';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import packageJson from './package.json';
import { scssOptions } from '@horizon/themes/sass-options';
import { staticAssets } from './build/static-assets';

const appDir = __dirname;
const repoRoot = resolve(appDir, '..', '..');
const sharedSrc = resolve(repoRoot, 'src', 'shared', 'src');
const sharedAssets = resolve(repoRoot, 'src', 'shared', 'assets');
const localSrc = resolve(appDir, 'src');
const buildDir = resolve(appDir, 'build');
const outDir = resolve(appDir, 'app');

const appVersion = process.env.APP_VERSION ?? packageJson.version;
const appCommit = process.env.APP_COMMIT ?? readGitCommit();

function readGitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'ignore']
    })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}

// @horizon/shared resolves through the workspace symlink + its exports map, so
// it needs no alias. @assets and the package-internal @/ are the two seams Vite
// can't infer from package metadata; both processes need them to resolve shared
// code's internal imports.
const commonAlias = [
  { find: /^@assets\//, replacement: `${sharedAssets}/` },
  { find: /^@\//, replacement: `${sharedSrc}/` },
  // Package-internal seams between the process buckets, so a cross-bucket module
  // reads as @common/logging instead of parent-traversing ../../common/logging.
  { find: /^@main\//, replacement: `${localSrc}/main/` },
  { find: /^@renderer\//, replacement: `${localSrc}/renderer/` },
  { find: /^@common\//, replacement: `${localSrc}/common/` },
  { find: /^@services$/, replacement: `${localSrc}/services` },
  { find: /^@services\//, replacement: `${localSrc}/services/` },
  { find: /^@build\//, replacement: `${buildDir}/` }
];

// The renderer is a sandboxed web context: `electron` resolves to the preload
// bridge, and `path` to a browser implementation. Main/preload keep the real
// Node modules.
const rendererAlias = [
  {
    find: /^electron$/,
    replacement: resolve(appDir, 'src/renderer/electron-shim.ts')
  },
  { find: /^path$/, replacement: 'path-browserify' },
  // electron-vite adds the `node` resolve condition, which otherwise pulls Vue's
  // full build (template compiler) even though every template is precompiled.
  { find: /^vue$/, replacement: 'vue/dist/vue.runtime.esm-bundler.js' },
  ...commonAlias
];

// Build constants reach all three processes as import.meta.env.VITE_APP_*.
const appInfoDefine = {
  'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  'import.meta.env.VITE_APP_COMMIT': JSON.stringify(appCommit)
};

// Vue compile-time flags. The Options API is used throughout, so it must stay
// on; devtools and hydration-mismatch details are production dead weight.
const rendererDefine = {
  ...appInfoDefine,
  __VUE_OPTIONS_API__: 'true',
  __VUE_PROD_DEVTOOLS__: 'false',
  __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
};

const rendererRoot = resolve(appDir, 'src', 'renderer');
const rendererPages = {
  chat: resolve(rendererRoot, 'index.html'),
  window: resolve(rendererRoot, 'window.html'),
  settings: resolve(rendererRoot, 'settings.html'),
  changelog: resolve(rendererRoot, 'changelog.html'),
  exporter: resolve(rendererRoot, 'exporter.html'),
  about: resolve(rendererRoot, 'about.html')
};

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  const sourcemap = isProd ? false : 'inline';

  return {
    main: {
      plugins: [externalizeDepsPlugin({ exclude: ['@horizon/shared'] })],
      define: appInfoDefine,
      resolve: { alias: commonAlias },
      build: {
        outDir,
        // main builds first; it owns the wipe so a stale app/ never survives a
        // rebuild without a separate clean step.
        emptyOutDir: true,
        sourcemap,
        rollupOptions: { input: { main: resolve(appDir, 'src/main/main.ts') } }
      }
    },

    preload: {
      plugins: [externalizeDepsPlugin({ exclude: ['@horizon/shared'] })],
      define: appInfoDefine,
      resolve: { alias: commonAlias },
      build: {
        outDir,
        emptyOutDir: false,
        sourcemap,
        rollupOptions: {
          input: { preload: resolve(appDir, 'src/preload/preload.ts') }
        }
      }
    },

    renderer: {
      root: rendererRoot,
      base: './',
      define: rendererDefine,
      plugins: [
        vue({
          template: {
            compilerOptions: { isCustomElement: tag => tag === 'webview' }
          }
        }),
        staticAssets(outDir, isProd)
      ],
      resolve: { alias: rendererAlias },
      css: { preprocessorOptions: { scss: scssOptions } },
      worker: { format: 'es' },
      build: {
        outDir,
        emptyOutDir: false,
        sourcemap,
        target: 'es2022',
        rollupOptions: { input: rendererPages }
      }
    }
  };
});

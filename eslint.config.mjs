import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';

// & Anything that is generated, vendored, or not ours to lint.
const ignores = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.turbo/**',
  '**/coverage/**',
  'src/electron/app/**',
  'src/electron/build/**',
  'src/electron/release_artifacts/**',
  'src/themes/**/*.css',
  'webchat/dist/**',
  'reference/**',
  '**/*.bin'
];

// note: main/preload/build tooling run under Node; everything else is the renderer (browser).
const nodeGlobs = [
  'src/electron/src/main/main.ts',
  'src/electron/src/preload/preload.ts',
  'src/electron/src/main/ipc-handlers.ts',
  'src/electron/src/renderer/secure-store.ts',
  'src/electron/src/main/browser_windows.ts',
  'src/electron/src/main/tab-manager.ts',
  'src/electron/build/**',
  '**/scripts/**/*.{js,mjs,cjs,ts}',
  '.github/**/*.{js,mjs,cjs}',
  '**/*.config.{js,mjs,cjs}',
  'src/themes/**/*.js'
];

// note: Bare Node built-ins shared/ must not import. Listed as exact `paths`,
//       not glob patterns, so local modules like @/platform/path (a browser-safe
//       shim) are not caught by a bare-name segment match.
const nodeBuiltins = [
  'fs',
  'node:fs',
  'path',
  'node:path',
  'os',
  'node:os',
  'child_process',
  'node:child_process',
  'worker_threads',
  'node:worker_threads',
  'module',
  'node:module'
];
const nodeBuiltinMessage =
  'shared/ must run in a browser too. Node built-ins are not available on the web/tauri targets; use a browser-safe shim or the platform bridge.';

export default [
  { ignores },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],

  {
    files: ['**/*.{js,mjs,cjs,ts,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.es2021 }
    }
  },

  // * <script lang="ts"> inside SFCs needs the TS parser.
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } }
  },

  {
    files: nodeGlobs,
    languageOptions: { globals: { ...globals.node, ...globals.es2024 } }
  },

  /*
   * ! The point of this whole file: keep @horizon/shared platform-neutral.
   * ! shared/ is consumed by every target (electron now, web/tauri later), so
   * ! it must not reach for Electron or Node built-ins directly. Anything it
   * ! needs from the host arrives through the preload bridge / a platform
   * ! interface. This is the regression guard once the leaks are cleaned up.
   */
  {
    files: ['src/shared/**/*.{ts,js,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['electron', 'electron/*', '@electron/*'],
              message:
                'shared/ must stay platform-neutral. Reach the host through the preload bridge / a platform interface, not Electron directly.'
            },
            {
              // Subpath imports of Node's fs; bare builtins live in `paths`.
              group: ['fs/*', 'node:fs/*'],
              message: nodeBuiltinMessage
            }
          ],
          paths: [
            {
              name: 'electron-log',
              message:
                'shared/ must stay platform-neutral; log through the platform logger, not electron-log.'
            },
            ...nodeBuiltins.map(name => ({ name, message: nodeBuiltinMessage }))
          ]
        }
      ]
    }
  },

  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  },

  // Webview-injected preload and standalone devtools query snippets run outside
  // the app, so the shared logger is unavailable; console is their only output.
  {
    files: ['**/chat/preview/assets/**', '**/learn/store/queries/**'],
    rules: { 'no-console': 'off' }
  },

  {
    files: ['**/*.{ts,vue}'],
    rules: { 'no-undef': 'off' }
  },

  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off'
    }
  },

  prettier
];

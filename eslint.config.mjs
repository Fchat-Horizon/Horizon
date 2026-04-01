import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import sonarjs from 'eslint-plugin-sonarjs';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

const nodeTargetGlobs = [
  'electron/main.ts',
  'electron/webpack.config.js',
  '**/*.config.{js,mjs,cjs,ts,mts,cts}'
];

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/.git/**',
      'electron/app/**',
      'electron/dist/**',
      'electron/release_artifacts/**',
      'mobile/**',
      'webchat/dist/**',
      'test.ts'
    ]
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021
      }
    }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    }
  },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-deprecated-data-object-declaration': 'off',
      'vue/no-side-effects-in-computed-properties': 'warn',
      'vue/require-v-for-key': 'warn',
      'vue/no-deprecated-slot-scope-attribute': 'warn',
      'vue/no-deprecated-destroyed-lifecycle': 'off',
      'vue/no-deprecated-slot-attribute': 'warn',
      'vue/no-deprecated-delete-set': 'off',
      'vue/no-deprecated-v-on-native-modifier': 'off'
    }
  },
  sonarjs.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    rules: {
      // We should tighten this over time
      complexity: ['warn', 15],
      'max-depth': ['warn', 5],
      'no-console': 'off',
      'no-undef': 'off',

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-namespace': 'off',
      'no-useless-escape': 'warn',

      // SonarJS, we're old as piss so we have to disable / keep it lean on a bunch
      'sonarjs/todo-tag': 'off',
      'sonarjs/no-commented-code': 'off',
      'sonarjs/cognitive-complexity': ['warn', 30],
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/different-types-comparison': 'off',
      'sonarjs/sonar-no-fallthrough': 'off',
      'sonarjs/no-nested-conditional': 'warn',
      'sonarjs/no-misused-promises': 'off',
      'sonarjs/no-unknown-property': 'off',
      'sonarjs/deprecation': 'off',
      'sonarjs/no-unused-expressions': 'off',
      'sonarjs/sonar-prefer-optional-chain': 'off',
      'sonarjs/slow-regex': 'warn',
      'sonarjs/prefer-nullish-coalescing': 'off',
      'sonarjs/no-dead-store': 'off',
      'sonarjs/sonar-no-unused-vars': 'off',
      'sonarjs/redundant-type-aliases': 'off',
      'sonarjs/no-small-switch': 'off',
      'sonarjs/function-return-type': 'off',
      'sonarjs/no-selector-parameter': 'off',
      'sonarjs/void-use': 'off',
      'sonarjs/pseudo-random': 'off',
      'sonarjs/concise-regex': 'off',
      'sonarjs/no-nested-assignment': 'off',
      'sonarjs/no-redundant-jump': 'off',
      'sonarjs/no-nested-template-literals': 'off',
      'sonarjs/no-ignored-exceptions': 'warn',
      'sonarjs/unused-import': 'warn',

      // Electron app — these are expected
      'sonarjs/os-command': 'off',
      'sonarjs/no-os-command-from-path': 'off',
      'sonarjs/constructor-for-side-effects': 'off',
      'sonarjs/code-eval': 'off',
      'sonarjs/disabled-auto-escaping': 'off',

      // Too noisy / stylistic for legacy code
      'sonarjs/updated-loop-counter': 'off',
      'sonarjs/no-inverted-boolean-check': 'off',
      'sonarjs/no-redundant-boolean': 'off',
      'sonarjs/prefer-single-boolean-return': 'off',
      'sonarjs/no-nested-functions': 'off',
      'sonarjs/use-type-alias': 'off',
      'sonarjs/public-static-readonly': 'off',
      'sonarjs/regex-complexity': 'off',
      'sonarjs/no-gratuitous-expressions': 'warn',
      'sonarjs/no-redundant-assignments': 'warn',
      'sonarjs/single-char-in-character-classes': 'warn',
      'sonarjs/duplicates-in-character-class': 'warn',
      'sonarjs/no-regex-spaces': 'off',

      // Downgrade to warn
      'no-empty': 'warn',
      'no-case-declarations': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',

      // Vue 2 compat
      'vue/no-use-v-if-with-v-for': 'warn',
      'vue/no-v-for-template-key-on-child': 'warn',
      'vue/no-mutating-props': 'warn',
      'vue/no-deprecated-events-api': 'warn',
      'vue/no-deprecated-props-default-this': 'off',
      'vue/no-dupe-keys': 'warn'
    }
  },
  {
    files: nodeTargetGlobs,
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2024
      }
    }
  }
];

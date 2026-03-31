/** @type {import("stylelint").Config} */
const config = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-sass-guidelines',
    'stylelint-prettier/recommended'
  ],
  ignoreFiles: [
    '**/node_modules/**',
    '**/.git/**',
    'electron/app/**',
    'electron/dist/**',
    'electron/release_artifacts/**',
    'mobile/**',
    'webchat/dist/**',
    'reference/**'
  ],
  rules: {
    'max-nesting-depth': 4,
    'selector-max-id': null,
    'selector-max-compound-selectors': 4,
    'color-named': null,
    'color-function-notation': null,
    'alpha-value-notation': null,
    'color-hex-length': null,
    'font-family-name-quotes': null,
    'font-family-no-missing-generic-family-keyword': null,
    'at-rule-empty-line-before': null,
    'rule-empty-line-before': null,
    'declaration-empty-line-before': null,
    'scss/dollar-variable-empty-line-before': null,

    // Naming, we choose our names!
    'selector-class-pattern': null,
    'selector-id-pattern': null,
    'custom-property-pattern': null,
    'selector-no-qualifying-type': null,

    // Legacy compat
    'no-invalid-position-at-import-rule': null,
    'length-zero-no-unit': null,
    'value-no-vendor-prefix': null,
    'property-no-vendor-prefix': null,
    'hue-degree-notation': null,
    'value-keyword-case': null,
    'shorthand-property-no-redundant-values': null,
    'declaration-property-value-disallowed-list': null,
    'property-no-deprecated': null,
    'selector-not-notation': null,
    'selector-pseudo-element-colon-notation': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'comment-whitespace-inside': null,
    'block-no-redundant-nested-style-rules': null,

    '@stylistic/indentation': 2,
    '@stylistic/string-quotes': 'single',
    '@stylistic/function-parentheses-space-inside': 'never-single-line'
  },
  overrides: [
    {
      files: ['**/*.scss'],
      customSyntax: 'postcss-scss',
      extends: ['stylelint-config-standard-scss'],
      rules: {
        'declaration-property-value-no-unknown': null,
        'color-function-alias-notation': null,
        'scss/dollar-variable-pattern': null,
        'scss/no-global-function-names': null,
        'scss/double-slash-comment-whitespace-inside': null,
        'scss/double-slash-comment-empty-line-before': null,
        'scss/load-no-partial-leading-underscore': null,
        'scss/operator-no-newline-after': null,
        'scss/at-extend-no-missing-placeholder': null,
        'scss/selector-no-redundant-nesting-selector': null,
        'scss/load-partial-extension': null,
        'scss/at-import-partial-extension-disallowed-list': null,
        'scss/operator-no-unspaced': null,
        'scss/comment-no-empty': null,
        'scss/at-mixin-argumentless-call-parentheses': null
      }
    },
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html',
      extends: [
        'stylelint-config-standard-scss',
        'stylelint-config-standard-vue',
        'stylelint-config-standard-vue/scss'
      ],
      rules: {
        'declaration-property-value-no-unknown': null,
        'color-function-alias-notation': null,
        'scss/dollar-variable-pattern': null,
        'scss/no-global-function-names': null,
        'scss/double-slash-comment-whitespace-inside': null,
        'scss/double-slash-comment-empty-line-before': null,
        'scss/load-no-partial-leading-underscore': null,
        'scss/operator-no-newline-after': null,
        'scss/at-extend-no-missing-placeholder': null,
        'scss/selector-no-redundant-nesting-selector': null,
        'scss/load-partial-extension': null,
        'scss/at-import-partial-extension-disallowed-list': null,
        'scss/operator-no-unspaced': null,
        'scss/comment-no-empty': null,
        'scss/at-mixin-argumentless-call-parentheses': null
      }
    }
  ]
};

export default config;

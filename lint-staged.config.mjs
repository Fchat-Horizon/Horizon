const jsAndVueGlobs = '*.{js,jsx,ts,tsx,mjs,cjs,vue}';
const styleGlobs = '*.{css,scss,vue}';
const prettifiableTextGlobs = '*.{json,md,markdown,html,yml,yaml}';

/** @type {import('lint-staged').Config} */
const config = {
  [jsAndVueGlobs]: ['pnpm eslint --fix'],
  [styleGlobs]: ['pnpm stylelint --fix'],
  [prettifiableTextGlobs]: ['pnpm prettier --write']
};

export default config;

import Vue from 'vue';
// Runtime uses en_us only. en.json exists for Weblate but is not referenced here.
const enUS: { [k: string]: string } = require('./locales/en_us.json');
// Ensure Webpack can resolve dynamic locale filenames (including hyphens)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const localeContext: any = (require as any).context(
  './locales',
  false,
  /\.json$/
);

// Reactive state so templates depending on l() update when language changes.
export const i18nState = Vue.observable({ locale: 'en_us', version: 0 });

let current: { [k: string]: string } = { ...enUS }; // start with US English only

// List of available display languages (extend when new JSON files are added)
// Name is what we show in the dropdown. Code is the file name (code.json)
export const availableDisplayLanguages: { code: string; name: string }[] = [
  { code: 'en_us', name: 'English (US)' },
  { code: 'en_uwu', name: 'Cyute Engwish' },
  { code: 'fr', name: 'Français (France)' },
  { code: 'de', name: 'Deutsch (Deutschland)' },
  { code: 'es', name: 'Español (España)' },
  { code: 'it', name: 'Italiano (Italia)' }
];

export function setLanguage(lang: string | undefined): void {
  const code = (lang && String(lang)) || 'en_us';
  if (code === i18nState.locale) return;
  try {
    const data: { [k: string]: string } = localeContext(`./${code}.json`);
    current = { ...enUS, ...data };
    i18nState.locale = code;
  } catch (e) {
    current = { ...enUS };
    i18nState.locale = 'en_us';
    if (process.env.NODE_ENV !== 'production')
      console.warn('Missing locale file for', code, e);
  }
  i18nState.version++;
}

export default function l(key: string, ...args: (string | number)[]): string {
  i18nState.version;
  let str = current[key];
  if (str === undefined) {
    str = enUS[key];
    if (str === undefined) {
      if (process.env.NODE_ENV !== 'production')
        console.warn(`Missing translation key: ${key}`);
      return key;
    }
  }
  for (let i = args.length - 1; i >= 0; i--)
    str = str.replace(new RegExp(`\\{${i}\\}`, 'g'), args[i].toString());
  return str;
}

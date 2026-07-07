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
// ^ lp() needs the raw locale layer; `current` merges en_us over it
let localeData: { [k: string]: string } = {};

// List of available display languages (extend when new JSON files are added)
// Name is what we show in the dropdown. Code is the file name (code.json)
export const availableDisplayLanguages: { code: string; name: string }[] = [
  { code: 'en_us', name: 'English (US)' },
  { code: 'en_uwu', name: 'Cyute Engwish' },
  { code: 'fr', name: 'Français (France)' },
  { code: 'de', name: 'Deutsch (Deutschland)' },
  { code: 'es', name: 'Español (España)' },
  { code: 'it', name: 'Italiano (Italia)' },
  { code: 'hu', name: 'Magyar (Magyarország)' },
  { code: 'ru', name: 'Русский (Россия)' },
  ...(process.env.NODE_ENV !== 'production'
    ? [{ code: 'test', name: 'Test Language' }]
    : [])
];

export function setLanguage(lang: string | undefined): void {
  const code = (lang && String(lang)) || 'en_us';
  if (code === i18nState.locale) return;

  // Handle special test language (dev mode only)
  if (code === 'test' && process.env.NODE_ENV !== 'production') {
    current = { ...enUS };
    localeData = {};
    i18nState.locale = code;
    i18nState.version++;
    return;
  }

  try {
    const data: { [k: string]: string } = localeContext(`./${code}.json`);
    current = { ...enUS, ...data };
    localeData = data;
    i18nState.locale = code;
  } catch (e) {
    current = { ...enUS };
    localeData = {};
    i18nState.locale = 'en_us';
    if (process.env.NODE_ENV !== 'production')
      console.warn('Missing locale file for', code, e);
  }
  i18nState.version++;
}

export type LocalizeParams = Record<string, string | number>;

// ! en_us, en_uwu and test are not valid BCP47; Intl.PluralRules throws
const bcp47Overrides: Record<string, string> = {
  en_us: 'en',
  en_uwu: 'en',
  test: 'en'
};
const pluralRulesCache = new Map<string, Intl.PluralRules>();

function pluralCategory(count: number): string {
  const code = bcp47Overrides[i18nState.locale] ?? i18nState.locale;
  let rules = pluralRulesCache.get(code);
  if (rules === undefined) {
    try {
      rules = new Intl.PluralRules(code);
    } catch {
      rules = new Intl.PluralRules('en');
    }
    pluralRulesCache.set(code, rules);
  }
  return rules.select(count);
}

function format(str: string, params?: LocalizeParams): string {
  // Test language transformation (dev mode only)
  if (i18nState.locale === 'test' && process.env.NODE_ENV !== 'production')
    str = str.replace(/\b\w+\b/g, 'test');
  if (params === undefined) return str;
  return str.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}

export default function l(key: string, params: LocalizeParams): string;
export default function l(key: string, ...args: (string | number)[]): string;
export default function l(
  key: string,
  ...args: (string | number | LocalizeParams)[]
): string {
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

  if (args.length === 1 && typeof args[0] === 'object')
    return format(str, args[0]);

  str = format(str);
  for (let i = args.length - 1; i >= 0; i--)
    str = str.replace(new RegExp(`\\{${i}\\}`, 'g'), String(args[i]));
  return str;
}

export function lp(
  key: string,
  count: number,
  params?: LocalizeParams
): string {
  i18nState.version;
  const exact = `${key}_${pluralCategory(count)}`;
  const other = `${key}_other`;
  const str =
    localeData[exact] ?? localeData[other] ?? enUS[exact] ?? enUS[other];
  if (str === undefined) {
    if (process.env.NODE_ENV !== 'production')
      console.warn(`Missing plural translation key: ${key}`);
    return key;
  }
  // ^ spread lets callers override the injected count (LocalizedText slots)
  return format(str, { count, ...params });
}

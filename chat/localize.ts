import Vue from 'vue';
import type { Locale } from 'date-fns';
import { enUS as dateEnUS, fr, de, es, it, hu, ru } from 'date-fns/locale';
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
    ? [{ code: 'test', name: 'Pseudo-locale (dev)' }]
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

const dateLocales: Record<string, Locale> = {
  en: dateEnUS,
  fr,
  de,
  es,
  it,
  hu,
  ru
};

// ! Display formatting only - never for filenames or serialized dates
export function dateLocale(): Locale {
  i18nState.version;
  return dateLocales[i18nState.locale.split('-')[0]] ?? dateEnUS;
}

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

// prettier-ignore
const pseudoChars: Record<string, string> = {
  a: 'á', b: 'ƀ', c: 'ç', d: 'ð', e: 'é', f: 'ƒ', g: 'ĝ', h: 'ĥ', i: 'í',
  j: 'ĵ', k: 'ķ', l: 'ļ', m: 'ɱ', n: 'ñ', o: 'ó', p: 'þ', q: 'ǫ', r: 'ŕ',
  s: 'š', t: 'ŧ', u: 'ú', v: 'ṽ', w: 'ŵ', x: 'ẋ', y: 'ý', z: 'ž',
  A: 'Á', B: 'Ɓ', C: 'Ç', D: 'Ð', E: 'É', F: 'Ƒ', G: 'Ĝ', H: 'Ĥ', I: 'Í',
  J: 'Ĵ', K: 'Ķ', L: 'Ļ', M: 'Ṁ', N: 'Ñ', O: 'Ó', P: 'Þ', Q: 'Ǫ', R: 'Ŕ',
  S: 'Š', T: 'Ŧ', U: 'Ú', V: 'Ṽ', W: 'Ŵ', X: 'Ẋ', Y: 'Ý', Z: 'Ž'
};

// ^ Accents flag untranslated strings; the padding simulates the ~35%
//   expansion of real translations so tight layouts clip visibly in dev.
//   Long text wraps anyway, so the padding is capped.
function pseudolocalize(str: string): string {
  let visible = 0;
  const mapped = str
    .split(/(\{\w+\})/g)
    .map((part, i) => {
      if (i % 2 === 1) return part;
      visible += part.length;
      return part.replace(/[a-zA-Z]/g, c => pseudoChars[c]);
    })
    .join('');
  const padding = Math.min(Math.ceil(visible * 0.35), 10);
  return `[${mapped}${'·'.repeat(padding)}]`;
}

function format(str: string, params?: LocalizeParams): string {
  if (i18nState.locale === 'test' && process.env.NODE_ENV !== 'production')
    str = pseudolocalize(str);
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

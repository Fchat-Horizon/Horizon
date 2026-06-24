import { reactive } from 'vue';
import { createLogger } from '@/logger';
import enUSJson from './locales/en_us.json';

const log = createLogger('localize');

const enUS: { [k: string]: string } = enUSJson;

// Non-English locales load on demand via a lazy glob so editing one during dev
// updates only that JSON chunk instead of forcing a full chat-tab reload.
const localeLoaders = import.meta.glob<{ default: { [k: string]: string } }>([
  './locales/*.json',
  '!./locales/en_us.json'
]);

// Reactive state so templates depending on l() update when language changes.
export const i18nState = reactive({ locale: 'en_us', version: 0 });

let current: { [k: string]: string } = { ...enUS }; // start with US English only

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
  ...(import.meta.env.DEV ? [{ code: 'test', name: 'Test Language' }] : [])
];

export async function setLanguage(lang: string | undefined): Promise<void> {
  const code = (lang && String(lang)) || 'en_us';
  if (code === i18nState.locale) return;

  // Handle special test language (dev mode only)
  if (code === 'test' && import.meta.env.DEV) {
    current = { ...enUS };
    i18nState.locale = code;
    i18nState.version++;
    return;
  }

  // English is the statically-bundled fallback; no loader needed.
  if (code === 'en_us') {
    current = { ...enUS };
    i18nState.locale = 'en_us';
    i18nState.version++;
    return;
  }

  try {
    const loader = localeLoaders[`./locales/${code}.json`];
    if (loader === undefined)
      throw new Error(`Missing locale file for ${code}`);
    const mod = await loader();
    current = { ...enUS, ...mod.default };
    i18nState.locale = code;
  } catch (e) {
    current = { ...enUS };
    i18nState.locale = 'en_us';
    if (import.meta.env.DEV) log.warn('Missing locale file for', code, e);
  }
  i18nState.version++;
}

// Dev HMR: re-apply en_us strings into reactive state instead of letting Vite
// fall back to a full page reload (which would tear down the open chat tab).
if (import.meta.hot) {
  import.meta.hot.accept('./locales/en_us.json', mod => {
    if (!mod) return;
    Object.assign(enUS, mod.default);
    const prev = i18nState.locale;
    i18nState.locale = ''; // force setLanguage past its no-op guard
    void setLanguage(prev);
  });
}

export default function l(key: string, ...args: (string | number)[]): string {
  i18nState.version;
  let str = current[key];
  if (str === undefined) {
    str = enUS[key];
    if (str === undefined) {
      if (import.meta.env.DEV) log.warn(`Missing translation key: ${key}`);
      return key;
    }
  }

  // Apply test language transformation (dev mode only)
  if (i18nState.locale === 'test' && import.meta.env.DEV) {
    str = str.replace(/\b\w+\b/g, 'test');
  }

  for (let i = args.length - 1; i >= 0; i--)
    str = str.replace(new RegExp(`\\{${i}\\}`, 'g'), args[i].toString());
  return str;
}

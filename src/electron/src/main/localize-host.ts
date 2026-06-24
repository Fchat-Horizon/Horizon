/*
 * English-only localization for the main process (menu labels, notifications,
 * importer prompts are always English; the renderer owns locale switching via
 * @horizon/shared/chat/localize). Kept separate so the commonjs main build
 * never pulls in the renderer localizer's import.meta.glob / import.meta.hot.
 */
import enUS from '@horizon/shared/chat/locales/en_us.json';

const strings: { [k: string]: string } = enUS;

export default function l(key: string, ...args: (string | number)[]): string {
  let str = strings[key];
  if (str === undefined) return key;
  for (let i = args.length - 1; i >= 0; i--)
    str = str.replace(new RegExp(`\\{${i}\\}`, 'g'), args[i].toString());
  return str;
}

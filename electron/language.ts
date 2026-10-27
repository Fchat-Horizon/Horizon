import * as _ from 'lodash';
import { formatLanguage, knownLanguageNames } from '../chat/languages';

export { formatLanguage, knownLanguageNames };

export function getSafeLanguages(
  langs: string | string[] | undefined
): string[] {
  const initialLanguages = _.isString(langs)
    ? [langs.replace('_', '-')]
    : langs || [];

  const initialCount = initialLanguages.length;
  const safeLanguages = _.filter(
    initialLanguages,
    il => _.indexOf(supportedLanguages, il) >= 0
  );

  if (initialCount > 0 && !safeLanguages.length) {
    safeLanguages.push('en-GB');
  }

  return safeLanguages;
}

let supportedLanguages: string[] = [];

export function updateSupportedLanguages(langs: string[]): void {
  supportedLanguages = langs;
}

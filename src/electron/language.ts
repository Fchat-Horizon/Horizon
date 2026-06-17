import * as _ from 'lodash';

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

export const knownLanguageNames = {
  af: 'Afrikaans',
  bg: 'Bulgarian',
  ca: 'Catalan',
  cs: 'Czech',
  cy: 'Welsh',
  da: 'Danish',
  de: 'German, Generic',
  'de-DE': 'German',
  el: 'Greek',

  'en-AU': 'English, Australian',
  'en-CA': 'English, Canadian',
  'en-GB': 'English, British',
  'en-GB-oxendict': 'English, British, Oxford Spelling',
  'en-US': 'English, American',

  es: 'Spanish',
  'es-419': 'Spanish, Latin America and Caribbean',
  'es-AR': 'Spanish, Argentine',
  'es-ES': 'Spanish, Castilian',
  'es-MX': 'Spanish, Mexican',
  'es-US': 'Spanish, American',

  et: 'Estonian',
  fa: 'Persian',
  fo: 'Faroese',
  fr: 'French, Generic',
  'fr-FR': 'French',
  he: 'Hebrew',
  hi: 'Hindi',
  hr: 'Croatian',
  hu: 'Hungarian',
  hy: 'Armenian',
  id: 'Indonesian',
  it: 'Italian, Generic',
  'it-IT': 'Italian',
  ko: 'Korean',
  lt: 'Lithuanian',
  lv: 'Latvian',
  nb: 'Norwegian',
  nl: 'Dutch',
  pl: 'Polish',

  'pt-BR': 'Portuguese, Brazilian',
  'pt-PT': 'Portuguese, European',
  pt: 'Portuguese, Generic',

  ro: 'Romanian',
  ru: 'Russian',
  sh: 'Serbo-Croatian',
  sk: 'Slovak',
  sl: 'Slovenian',
  sq: 'Albanian',
  sr: 'Serbian',
  sv: 'Swedish',
  ta: 'Tamil',
  tg: 'Tajik',
  tr: 'Turkish',
  uk: 'Ukranian',
  vi: 'Vietnamese'
};

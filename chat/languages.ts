//These are all i18n language codes, right?

/**
 * A map of known language codes to their display names.
 * Example: 'en-US' => 'English, American'
 * This is used to display the language name in the UI.
 * The keys are the language codes, and the values are the display names.
 */
export const knownLanguageNames: Readonly<Record<string, string>> = {
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
  uk: 'Ukrainian',
  vi: 'Vietnamese'
};

export function formatLanguage(code: string): string {
  const name = knownLanguageNames[code];
  return name === undefined ? code : `${name} (${code})`;
}

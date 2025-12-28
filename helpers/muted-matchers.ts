export type BoundaryMode = 'none' | 'word' | 'string';

const ASCII_WORD_CHAR = /[A-Za-z0-9_]/;
const UNICODE_WORD_CLASS = '[\\p{L}\\p{N}\\p{M}_]';
let cachedUnicodeWordChar: RegExp | null | undefined;

function getUnicodeWordChar(): RegExp | null {
  if (cachedUnicodeWordChar !== undefined) return cachedUnicodeWordChar;
  try {
    cachedUnicodeWordChar = new RegExp(UNICODE_WORD_CLASS, 'u');
  } catch {
    cachedUnicodeWordChar = null;
  }
  return cachedUnicodeWordChar;
}

function firstChar(value: string): string {
  const chars = Array.from(value);
  return chars[0] || '';
}

function lastChar(value: string): string {
  const chars = Array.from(value);
  return chars.length ? chars[chars.length - 1] : '';
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyBoundary(
  pattern: string,
  trimmed: string,
  boundary: BoundaryMode,
  hasStartWildcard: boolean,
  hasEndWildcard: boolean,
  useUnicodeBoundary: boolean
): string {
  if (boundary === 'string') {
    if (!hasStartWildcard) pattern = '^' + pattern;
    if (!hasEndWildcard) pattern = pattern + '$';
    return pattern;
  }

  if (boundary === 'word') {
    const unicodeWordChar = useUnicodeBoundary ? getUnicodeWordChar() : null;
    const useUnicode = Boolean(unicodeWordChar);
    const wordChar = useUnicode ? unicodeWordChar! : ASCII_WORD_CHAR;
    const startChar = firstChar(trimmed);
    const endChar = lastChar(trimmed);
    if (!hasStartWildcard && startChar && wordChar.test(startChar)) {
      pattern = useUnicode
        ? `(?<!${UNICODE_WORD_CLASS})${pattern}`
        : `\\b${pattern}`;
    }
    if (!hasEndWildcard && endChar && wordChar.test(endChar)) {
      pattern = useUnicode
        ? `${pattern}(?!${UNICODE_WORD_CLASS})`
        : `${pattern}\\b`;
    }
  }

  return pattern;
}

export function toPatternSource(
  entry: string,
  boundary: BoundaryMode = 'none',
  useUnicodeBoundary: boolean = false
): string {
  const trimmed = entry.trim();
  if (!trimmed) return '';

  const hasStartWildcard = trimmed.startsWith('*');
  const hasEndWildcard = trimmed.endsWith('*');

  const escaped = escapeRegExp(trimmed);
  // Keep wildcards within non-whitespace.
  let pattern = escaped.replace(/\\\*/g, '\\S*');

  pattern = applyBoundary(
    pattern,
    trimmed,
    boundary,
    hasStartWildcard,
    hasEndWildcard,
    useUnicodeBoundary
  );

  return pattern;
}

export function buildMutedMatcher(
  entries: string[],
  boundary: BoundaryMode = 'none'
): RegExp | null {
  const buildRegExp = (source: string, flags: string): RegExp | null => {
    try {
      return new RegExp(source, flags);
    } catch {
      return null;
    }
  };

  const buildFromEntries = (
    useUnicodeBoundary: boolean,
    flags: string
  ): RegExp | null => {
    const sources = entries
      .map(entry => toPatternSource(entry, boundary, useUnicodeBoundary))
      .filter(source => source.length > 0);
    if (!sources.length) return null;

    const combined = sources.map(source => `(?:${source})`).join('|');
    const combinedRegex = buildRegExp(combined, flags);
    if (combinedRegex) return combinedRegex;

    const fallback = entries
      .map(entry => escapeRegExp(entry.trim()))
      .filter(entry => entry.length > 0);
    if (!fallback.length) return null;

    return buildRegExp(
      fallback.map(source => `(?:${source})`).join('|'),
      flags
    );
  };

  if (boundary === 'word') {
    const unicodeAvailable = Boolean(getUnicodeWordChar());
    const unicodeFlags = unicodeAvailable ? 'giu' : 'gi';
    return (
      buildFromEntries(unicodeAvailable, unicodeFlags) ||
      buildFromEntries(false, 'gi')
    );
  }

  return buildFromEntries(false, 'gi');
}

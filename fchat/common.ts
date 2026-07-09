const ltRegex = /&lt;/gi,
  gtRegex = /&gt;/gi,
  quotRegex = /&quot;/gi,
  aposRegex = /&#0*39;/g,
  ampRegex = /&amp;/gi;

export function decodeHTML(this: void | never, str: string): string {
  // Inverse of PHP htmlspecialchars(ENT_QUOTES) as sent by the f-list API.
  // &amp; is replaced last so any literally-escaped entity text survives.
  return str
    .replace(ltRegex, '<')
    .replace(gtRegex, '>')
    .replace(quotRegex, '"')
    .replace(aposRegex, "'")
    .replace(ampRegex, '&');
}

// Prototype-less lookup maps for name/id keys, so a key like "constructor" or
// "__proto__" can't collide with an inherited Object member. Never use `{}`.
export function emptyMap<T>(this: void | never): { [key: string]: T } {
  return Object.create(null);
}

// Copy a (possibly prototype-bearing) source, e.g. one loaded from storage,
// into a fresh prototype-less map.
export function toMap<T>(
  this: void | never,
  source: { [key: string]: T } | null | undefined
): { [key: string]: T } {
  const map = emptyMap<T>();
  if (source) Object.assign(map, source);
  return map;
}

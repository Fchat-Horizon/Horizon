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

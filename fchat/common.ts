const ltRegex = /&lt;/gi,
  gtRegex = /&gt;/gi,
  ampRegex = /&amp;/gi;

export function decodeHTML(this: void | never, str: string): string {
  return str.replace(ltRegex, '<').replace(gtRegex, '>').replace(ampRegex, '&');
}

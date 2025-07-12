import {
  BBCodeCustomTag,
  BBCodeParser,
  BBCodeSimpleTag,
  BBCodeTextTag
} from './parser';

const urlFormat = '((?:https?|ftps?|irc)://[^\\s/$.?#"\']+\\.[^\\s"]+)';
export const findUrlRegex = new RegExp(`(\\[url[=\\]]\\s*)?${urlFormat}`, 'gi');
export const urlRegex = new RegExp(`^${urlFormat}$`);

export type BBCodeElement = HTMLElement & { cleanup?(): void };

export function domain(url: string): string | undefined {
  const pieces = urlRegex.exec(url);
  if (pieces === null) return;
  const match = pieces[1].match(
    /(?:(https?|ftps?|irc):)?\/\/(?:www.)?([^\/]+)/
  );
  return match !== null ? match[2] : undefined;
}

function fixURL(url: string): string {
  if (/^www\./.test(url)) url = `https://${url}`;
  return url.replace(/ /g, '%20');
}

// tslint:disable-next-line: max-line-length
export function analyzeUrlTag(
  parser: BBCodeParser,
  param: string,
  content: string
): { success: boolean; url?: string; domain?: string; textContent: string } {
  let url: string | undefined,
    textContent: string = content;
  let success = true;

  if (param.length > 0) {
    url = param.trim();
    if (content.length === 0) textContent = param;
  } else if (content.length > 0) {
    const m = content.match(/^\[url=?](.+)\[\/url]$/i);

    url = m ? m[1] : content;
  } else {
    parser.warning('url tag contains no url.');
    textContent = '';
    success = false;
  }

  if (success && url) {
    // This fixes problems where content based urls are marked as invalid if they contain spaces.
    url = fixURL(url);

    if (!urlRegex.test(url)) {
      textContent = `[BAD URL] ${url}`;
      success = false;
    }
  }

  return {
    success,
    url,
    textContent,
    domain: url ? domain(url) : undefined
  };
}

export class CoreBBCodeParser extends BBCodeParser {
  /*tslint:disable-next-line:typedef*/ //https://github.com/palantir/tslint/issues/711
  constructor(public makeLinksClickable = true) {
    super();
    this.addTag(new BBCodeSimpleTag('b', 'strong'));
    this.addTag(new BBCodeSimpleTag('i', 'em'));
    this.addTag(new BBCodeSimpleTag('u', 'u'));
    this.addTag(new BBCodeSimpleTag('s', 'del'));
    this.addTag(new BBCodeSimpleTag('noparse', 'span', [], []));
    this.addTag(
      new BBCodeSimpleTag('sub', 'sub', [], ['b', 'i', 'u', 's', 'color'])
    );
    this.addTag(
      new BBCodeSimpleTag('sup', 'sup', [], ['b', 'i', 'u', 's', 'color'])
    );

    this.addTag(
      new BBCodeTextTag('url', (parser, parent, param, content) => {
        const tagData = analyzeUrlTag(parser, param, content);
        const element = parser.createElement('span');

        parent.appendChild(element);

        if (!tagData.success) {
          element.textContent = tagData.textContent;
          return;
        }

        const fa = parser.createElement('i');
        fa.className = 'fa fa-link';
        element.appendChild(fa);
        const a = parser.createElement('a');
        a.href = tagData.url as string;
        a.rel = 'nofollow noreferrer noopener';
        a.target = '_blank';
        a.className = 'user-link';
        a.title = tagData.url as string;
        a.textContent = tagData.textContent;
        element.appendChild(a);
        const span = document.createElement('span');
        span.className = 'link-domain bbcode-pseudo';
        span.textContent = ` [${tagData.domain}]`;
        element.appendChild(span);

        return element;
      })
    );
    this.addTag(
      new BBCodeCustomTag('spoiler', (parser, parent) => {
        const link = parser.createElement('a');
        const content = parser.createElement('span');
        link.href = '#';
        link.onclick = e => {
          const target = e.target as HTMLElement;
          target.parentElement!.replaceChild(content, target);
          return false;
        };
        link.appendChild(document.createTextNode('[click to show spoiler]'));
        parent.appendChild(link);
        return content;
      })
    );
  }

  parseEverything(input: string): HTMLElement {
    if (this.makeLinksClickable && input.length > 0)
      input = input.replace(findUrlRegex, (match, tag) =>
        tag === undefined ? `[url]${match}[/url]` : match
      );
    return super.parseEverything(input);
  }
}

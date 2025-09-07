import {
  BBCodeCustomTag,
  BBCodeParser,
  BBCodeSimpleTag,
  BBCodeTextTag
} from './parser';
import * as Utils from '../site/utils';
import { default as IconView } from '../bbcode/IconView.vue';
import UrlTagView from './UrlTagView.vue';
import core from '../chat/core';

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
  cleanup: Vue[] = [];
  /*tslint:disable-next-line:typedef*/ //https://github.com/palantir/tslint/issues/711
  constructor(public makeLinksClickable = true) {
    super();
    this.addTag(new BBCodeSimpleTag('b', 'strong'));
    this.addTag(new BBCodeSimpleTag('i', 'em'));
    this.addTag(new BBCodeSimpleTag('u', 'u'));
    this.addTag(new BBCodeSimpleTag('s', 'del'));
    this.addTag(new BBCodeSimpleTag('noparse', 'span', [], []));
    this.addTag(
      new BBCodeTextTag('icon', (parser, parent, param, content) => {
        if (param.length > 0)
          parser.warning('Unexpected parameter on icon tag.');
        const uregex = /^[a-zA-Z0-9_\-\s]+$/;
        if (!uregex.test(content)) return;
        const root = parser.createElement('span');
        const el = parser.createElement('span');
        parent.appendChild(root);
        root.appendChild(el);
        const view = new IconView({
          el,
          propsData: {
            character: core.characters.get(content)
          }
        });

        this.cleanup.push(view);
        return root;
      })
    );
    this.addTag(
      new BBCodeTextTag('eicon', (parser, parent, param, content) => {
        if (param.length > 0)
          parser.warning('Unexpected parameter on eicon tag.');
        const uregex = /^[a-zA-Z0-9_\-\s]+$/;
        if (!uregex.test(content)) return;
        let extension = '.gif';
        if (!Utils.settings.animateEicons) extension = '.png';
        const img = parser.createElement('img');
        img.src = `https://static.f-list.net/images/eicon/${content.toLowerCase()}${extension}`;
        img.title = img.alt = content;
        img.className = 'character-avatar icon';
        if (Utils.settings.animateEicons && Utils.settings.smoothMosaics) {
          img.classList.add('loading');
          img.addEventListener('load', evt => {
            //whenever an image is loaded, check if every other image in the span has been loaded. Only then should you show them all
            let imgs = [];
            for (let i of (evt.target as Node).parentElement?.children || []) {
              if (i.tagName == 'IMG') {
                imgs.push(i);
                if (!(i as HTMLImageElement).complete) {
                  return;
                }
              }
            }
            for (let i of imgs) {
              i.classList.remove('loading'); //perhaps we could use a spinner here instead of that. Tried it but it looks terrible on mosaics and the transition is smooth
            }
          });
        }
        parent.appendChild(img);
        return img;
      })
    );
    this.addTag(
      new BBCodeTextTag('url', (parser, parent, _, content) => {
        const tagData = analyzeUrlTag(parser, _, content);
        const root = parser.createElement('span');

        parent.appendChild(root);

        if (!tagData.success) {
          root.textContent = tagData.textContent;
          return;
        }

        const view = new UrlTagView({
          el: root,
          propsData: {
            url: tagData.url,
            text: tagData.textContent,
            domain: tagData.domain
          }
        });
        this.cleanup.push(view);

        return root;
      })
    );
    this.addTag(
      new BBCodeCustomTag('spoiler', (parser, parent) => {
        const link = parser.createElement('a');
        const content = parser.createElement('span');
        link.href = '#';
        link.className = 'spoiler-tag';
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

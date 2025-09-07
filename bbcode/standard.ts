import Vue from 'vue';
import { BBCodeElement } from './core';
import { InlineDisplayMode, InlineImage } from '../interfaces';
import * as Utils from '../site/utils';
import { CoreBBCodeParser } from './core';
import { BBCodeCustomTag, BBCodeSimpleTag, BBCodeTextTag } from './parser';

const usernameRegex = /^[a-zA-Z0-9_\-\s]+$/;

export class StandardBBCodeParser extends CoreBBCodeParser {
  inlines: { [key: string]: InlineImage | undefined } | undefined;

  cleanup: Vue[] = [];

  createInline(inline: InlineImage): HTMLElement {
    const p1 = inline.hash.substr(0, 2);
    const p2 = inline.hash.substr(2, 2);
    const outerEl = this.createElement('div');
    const el = this.createElement('img');
    el.className = 'inline-image';
    el.title = el.alt = inline.name;
    el.src = `${Utils.staticDomain}images/charinline/${p1}/${p2}/${inline.hash}.${inline.extension}`;
    outerEl.appendChild(el);
    return outerEl;
  }

  constructor() {
    super();
    const hrTag = new BBCodeSimpleTag(
      'hr',
      'hr',
      [],
      [
        'url',
        'i',
        'b',
        'u',
        's',
        'color',
        'sub',
        'sup',
        'big',
        'small',
        'heading',
        'hr',
        'icon',
        'user',
        'img',
        'eicon',
        'quote',
        'collapse',
        'left',
        'center',
        'right',
        'justify',
        'indent',
        'noparse'
      ]
    );
    hrTag.noClosingTag = true;
    this.addTag(hrTag);
    this.addTag(
      new BBCodeCustomTag('quote', (parser, parent, param) => {
        if (param !== '') parser.warning('Unexpected paramter on quote tag.');
        const element = parser.createElement('blockquote');
        const innerElement = parser.createElement('div');
        innerElement.className = 'quoteHeader';
        innerElement.appendChild(document.createTextNode('Quote:'));
        element.appendChild(innerElement);
        parent.appendChild(element);
        return element;
      })
    );
    this.addTag(new BBCodeSimpleTag('left', 'span', ['leftText']));
    this.addTag(new BBCodeSimpleTag('right', 'span', ['rightText']));
    this.addTag(new BBCodeSimpleTag('center', 'span', ['centerText']));
    this.addTag(new BBCodeSimpleTag('justify', 'span', ['justifyText']));
    this.addTag(new BBCodeSimpleTag('sub', 'sub', [], ['i', 'u', 'b', 'hr']));
    this.addTag(new BBCodeSimpleTag('sup', 'sup', [], ['i', 'u', 'b', 'hr']));
    this.addTag(
      new BBCodeCustomTag('color', (parser, parent, param) => {
        const cregex =
          /^(red|blue|white|yellow|pink|gray|green|orange|purple|black|brown|cyan)$/;
        if (!cregex.test(param)) {
          parser.warning('Invalid color parameter provided.');
          const el = parser.createElement('span');
          el.className = `Text`;
          parent.appendChild(el);
          return el;
        }
        const el = parser.createElement('span');
        el.className = `${param}Text`;
        parent.appendChild(el);
        return el;
      })
    );
    this.addTag(
      new BBCodeSimpleTag(
        'big',
        'span',
        ['bigText'],
        ['url', 'i', 'u', 'b', 'color', 's', 'hr']
      )
    );
    this.addTag(
      new BBCodeSimpleTag(
        'small',
        'span',
        ['smallText'],
        ['url', 'i', 'u', 'b', 'color', 's', 'hr']
      )
    );
    this.addTag(new BBCodeSimpleTag('indent', 'div', ['indentText']));
    this.addTag(
      new BBCodeSimpleTag(
        'heading',
        'h2',
        [],
        [
          'url',
          'i',
          'b',
          'u',
          's',
          'color',
          'sub',
          'sup',
          'big',
          'small',
          'heading',
          'hr',
          'icon',
          'user',
          'img',
          'eicon',
          'quote',
          'collapse',
          'left',
          'center',
          'right',
          'justify',
          'indent',
          'noparse'
        ]
      )
    );
    this.addTag(new BBCodeSimpleTag('row', 'div', ['row']));
    this.addTag(
      new BBCodeCustomTag('col', (parser, parent, param) => {
        const col = parser.createElement('div');
        col.className =
          param === '1'
            ? 'col-lg-3 col-md-4 col-12'
            : param === '2'
              ? 'col-lg-4 col-md-6 col-12'
              : param === '3'
                ? 'col-lg-6 col-md-8 col-12'
                : 'col-md';
        parent.appendChild(col);
        return col;
      })
    );
    this.addTag(
      new BBCodeCustomTag('collapse', (parser, parent, param) => {
        if (param === '') {
          //tslint:disable-line:curly
          parser.warning('title parameter is required.');
          // HACK: Compatability fix with old site. Titles are not trimmed on old site, so empty collapse titles need to be allowed.
          //return null;
        }
        const outer = parser.createElement('div');
        outer.className = 'card bg-light bbcode-collapse collapsed';
        const headerText = parser.createElement('div');
        headerText.className = 'card-header bbcode-collapse-header';
        const icon = parser.createElement('i');
        icon.className = 'fas fa-chevron-down';
        icon.style.marginRight = '10px';
        // HACK: to allow [hr] in header part
        if (param.startsWith('[hr]')) {
          headerText.appendChild(parser.createElement('hr'));
          param = param.slice(4);
        }
        headerText.appendChild(icon);
        const splitParam = param.split('[hr]');
        for (let iii = 0; iii < splitParam.length; iii++) {
          const element = splitParam[iii];
          headerText.appendChild(document.createTextNode(element));
          if (iii < splitParam.length - 1)
            headerText.appendChild(parser.createElement('hr'));
        }
        outer.appendChild(headerText);
        const body = parser.createElement('div');
        body.className = 'bbcode-collapse-body';
        body.style.height = '0';
        outer.appendChild(body);
        const inner = parser.createElement('div');
        inner.className = 'card-body';
        body.appendChild(inner);
        let timeout: number;
        headerText.addEventListener('click', () => {
          //???
          const isCollapsed = parseInt(body.style.height!, 10) === 0;
          if (isCollapsed)
            timeout = window.setTimeout(() => (body.style.height = ''), 200);
          else {
            clearTimeout(timeout);
            body.style.transition = 'initial';
            setImmediate(() => {
              body.style.transition = '';
              body.style.height = '0';
            });
          }
          body.style.height = `${body.scrollHeight}px`;
          outer.className = `card bg-light bbcode-collapse ${!isCollapsed ? 'collapsed' : ''}`;
          headerText.className = `card-header bbcode-collapse-header bbcode-collapse-header-${isCollapsed ? 'up' : 'down'}`;
          icon.className = `fas fa-chevron-${isCollapsed ? 'up' : 'down'}`;
        });
        parent.appendChild(outer);
        return inner;
      })
    );
    this.addTag(
      new BBCodeTextTag('user', (parser, parent, param, content) => {
        if (param !== '') parser.warning('Unexpected parameter on user tag.');
        if (!usernameRegex.test(content)) return;
        const a = parser.createElement('a');
        a.href = `${Utils.siteDomain}c/${content}`;
        a.target = '_blank';
        a.className = 'character-link';
        a.appendChild(document.createTextNode(content));
        parent.appendChild(a);
        return a;
      })
    );
    this.addTag(
      new BBCodeTextTag('img', (p, parent, param, content) => {
        const parser = <StandardBBCodeParser>p;
        if (typeof parser.inlines === 'undefined') {
          parser.warning('This page does not support inline images.');
          const el = parser.createElement('span');
          el.className = `Text`;
          el.innerText = ``;
          parent.appendChild(el);
          return el;
        }
        const displayMode = Utils.settings.inlineDisplayMode;
        if (!/^\d+$/.test(param)) {
          parser.warning('img tag parameters must be numbers.');
          const el = parser.createElement('span');
          el.className = `Text`;
          el.innerText = ``;
          parent.appendChild(el);
          return el;
        }
        const inline = parser.inlines[param];
        if (typeof inline !== 'object') {
          parser.warning(
            `Could not find an inline image with id ${param} It will not be visible.`
          );
          const el = parser.createElement('span');
          el.className = `Text`;
          el.innerText = ``;
          parent.appendChild(el);
          return el;
        }
        inline.name = content;
        let element: HTMLElement;
        if (
          displayMode === InlineDisplayMode.DISPLAY_NONE ||
          (displayMode === InlineDisplayMode.DISPLAY_SFW && inline.nsfw)
        ) {
          const el = (element = parser.createElement('a'));
          el.className = 'unloadedInline';
          el.href = '#';
          el.dataset.inlineId = param;
          el.onclick = () => {
            (<HTMLElement[]>(
              Array.prototype.slice.call(
                document.getElementsByClassName('unloadedInline')
              )
            )).forEach(e => {
              const showInline = parser.inlines![e.dataset.inlineId!];
              if (typeof showInline !== 'object') return;
              e.parentElement!.replaceChild(parser.createInline(showInline), e);
            });
            return false;
          };
          const prefix = inline.nsfw ? '[NSFW Inline] ' : '[Inline] ';
          el.appendChild(document.createTextNode(prefix));
          parent.appendChild(el);
        } else parent.appendChild((element = parser.createInline(inline)));
        return element;
      })
    );
  }

  parseEverything(input: string): BBCodeElement {
    const elm = <BBCodeElement>super.parseEverything(input);
    if (this.cleanup.length > 0)
      elm.cleanup = ((cleanup: Vue[]) => () => {
        for (const component of cleanup) component.$destroy();
      })(this.cleanup);
    this.cleanup = [];
    return elm;
  }
}

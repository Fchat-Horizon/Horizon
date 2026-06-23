import Vue from 'vue';
import { BBCodeElement } from './core';
import { CoreBBCodeParser } from './core';
import { BBCodeCustomTag } from './parser';

export class UserInterfaceBBCodeParser extends CoreBBCodeParser {
  cleanup: Vue[] = [];

  constructor() {
    super();
    this.removeTag('noparse');
    this.removeTag('icon');
    this.removeTag('eicon');
    this.removeTag('spoiler');
    this.removeTag('url');

    this.addTag(
      new BBCodeCustomTag('kbd', (parser, parent) => {
        const el = parser.createElement('kbd');
        el.className = 'text-bg-secondary px-1 py-0';
        parent.appendChild(el);
        return el;
      })
    );
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

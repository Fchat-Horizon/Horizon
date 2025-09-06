import Vue from 'vue';
import { BBCodeElement, CoreBBCodeParser } from '../bbcode/core';
//tslint:disable-next-line:match-default-export-name
import BaseEditor from '../bbcode/Editor.vue';
import {
  BBCodeTextTag,
  BBCodeCustomTag,
  BBCodeSimpleTag
} from '../bbcode/parser';
import ChannelView from './ChannelTagView.vue';
// import {characterImage} from './common';
import core from './core';
// import {Character} from './interfaces';
import UserView from './UserView.vue';

export class Editor extends BaseEditor {
  parser = core.bbCodeParser;
}

export default class BBCodeParser extends CoreBBCodeParser {
  cleanup: Vue[] = [];

  constructor() {
    super();
    this.addTag(
      new BBCodeSimpleTag('sub', 'sub', [], ['b', 'i', 'u', 's', 'color'])
    );
    this.addTag(
      new BBCodeSimpleTag('sup', 'sup', [], ['b', 'i', 'u', 's', 'color'])
    );
    this.addTag(
      new BBCodeCustomTag('color', (parser, parent, param) => {
        const cregex =
          /^(red|blue|white|yellow|pink|gray|green|orange|purple|black|brown|cyan)$/;
        if (!cregex.test(param)) {
          parser.warning('Invalid color parameter provided.');
          return undefined;
        }
        const el = parser.createElement('span');
        el.className = `${param}Text`;
        parent.appendChild(el);
        return el;
      })
    );
    this.addTag(
      new BBCodeTextTag('user', (parser, parent, param, content) => {
        if (param.length > 0)
          parser.warning('Unexpected parameter on user tag.');
        const uregex = /^[a-zA-Z0-9_\-\s]+$/;
        if (!uregex.test(content)) return;
        const el = parser.createElement('span');
        parent.appendChild(el);
        const view = new UserView({
          el,
          propsData: {
            character: core.characters.get(content),
            isMarkerShown: core.connection.character
              ? core.state.settings.horizonShowGenderMarker
              : false
          }
        });
        this.cleanup.push(view);
        return el;
      })
    );
    this.addTag(
      new BBCodeTextTag('session', (parser, parent, param, content) => {
        const root = parser.createElement('span');
        const el = parser.createElement('span');
        parent.appendChild(root);
        root.appendChild(el);
        const view = new ChannelView({
          el,
          propsData: { id: content, text: param }
        });
        this.cleanup.push(view);
        return root;
      })
    );
    this.addTag(
      new BBCodeTextTag('channel', (parser, parent, _, content) => {
        const root = parser.createElement('span');
        const el = parser.createElement('span');
        parent.appendChild(root);
        root.appendChild(el);
        const view = new ChannelView({
          el,
          propsData: { id: content, text: content }
        });
        this.cleanup.push(view);
        return root;
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

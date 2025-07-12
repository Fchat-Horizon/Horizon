import Vue from 'vue';
import { BBCodeElement, CoreBBCodeParser, analyzeUrlTag } from '../bbcode/core';
//tslint:disable-next-line:match-default-export-name
import BaseEditor from '../bbcode/Editor.vue';
import { BBCodeTextTag, BBCodeCustomTag } from '../bbcode/parser';
import ChannelView from './ChannelTagView.vue';
// import {characterImage} from './common';
import core from './core';
// import {Character} from './interfaces';
import { default as UrlView } from '../bbcode/UrlTagView.vue';
import { default as IconView } from '../bbcode/IconView.vue';
import UserView from './UserView.vue';

export class Editor extends BaseEditor {
  parser = core.bbCodeParser;
}

export default class BBCodeParser extends CoreBBCodeParser {
  cleanup: Vue[] = [];

  constructor() {
    super();
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

        /* const img = parser.createElement('img');
            img.src = characterImage(content);
            img.style.cursor = 'pointer';
            img.className = 'character-avatar icon';
            img.title = img.alt = content;
            (<HTMLImageElement & {character: Character}>img).character = core.characters.get(content);
            parent.appendChild(img);
            return img; */
      })
    );
    this.addTag(
      new BBCodeTextTag('eicon', (parser, parent, param, content) => {
        if (param.length > 0)
          parser.warning('Unexpected parameter on eicon tag.');
        const uregex = /^[a-zA-Z0-9_\-\s]+$/;
        if (!uregex.test(content)) return;
        const extension =
          core.connection.isOpen && !core.state.settings.animatedEicons
            ? 'png'
            : 'gif';
        const img = parser.createElement('img');
        img.src = `https://static.f-list.net/images/eicon/${content.toLowerCase()}.${extension}`;
        img.title = img.alt = content;
        img.className = 'character-avatar icon';
        parent.appendChild(img);
        return img;
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

    this.addTag(
      new BBCodeTextTag('url', (parser, parent, _, content) => {
        const tagData = analyzeUrlTag(parser, _, content);

        const root = parser.createElement('span');
        // const el = parser.createElement('span');
        parent.appendChild(root);
        // root.appendChild(el);

        if (!tagData.success) {
          root.textContent = tagData.textContent;
          return;
        }

        const view = new UrlView({
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

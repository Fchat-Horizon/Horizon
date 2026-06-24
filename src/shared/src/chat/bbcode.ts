import { createApp, defineComponent, type App } from 'vue';
import type { BBCodeElement } from '@/bbcode/core';
import { CoreBBCodeParser } from '@/bbcode/core';
//tslint:disable-next-line:match-default-export-name
import BaseEditor from '@/bbcode/Editor.vue';
import {
  BBCodeTextTag,
  BBCodeCustomTag,
  BBCodeSimpleTag
} from '@/bbcode/parser';
import ChannelView from './ChannelTagView.vue';
import { normalizeCharacterName } from './common';
import core from './core';
import UserView from './UserView.vue';

// Re-points the parser at core's shared instance after the base created() runs.
export const Editor = defineComponent({
  extends: BaseEditor,
  created() {
    (this as any).parser = core.bbCodeParser;
  }
});

export default class BBCodeParser extends CoreBBCodeParser {
  cleanup: App[] = [];

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
        const characterName = normalizeCharacterName(content);
        const el = parser.createElement('span');
        parent.appendChild(el);
        const app = createApp(UserView, {
          character: core.characters.get(characterName),
          displayName: content, // so the non-normalized name is displayed
          isMarkerShown: core.connection.character
            ? core.state.settings.horizonShowGenderMarker
            : false
        });
        app.mount(el);
        this.cleanup.push(app);
        return el;
      })
    );
    this.addTag(
      new BBCodeTextTag('session', (parser, parent, param, content) => {
        const root = parser.createElement('span');
        const el = parser.createElement('span');
        parent.appendChild(root);
        root.appendChild(el);
        const app = createApp(ChannelView, { id: content, text: param });
        app.mount(el);
        this.cleanup.push(app);
        return root;
      })
    );
    this.addTag(
      new BBCodeTextTag('channel', (parser, parent, _, content) => {
        const root = parser.createElement('span');
        const el = parser.createElement('span');
        parent.appendChild(root);
        root.appendChild(el);
        const app = createApp(ChannelView, { id: content, text: content });
        app.mount(el);
        this.cleanup.push(app);
        return root;
      })
    );
  }

  parseEverything(input: string): BBCodeElement {
    const elm = <BBCodeElement>super.parseEverything(input);
    if (this.cleanup.length > 0)
      elm.cleanup = ((cleanup: App[]) => () => {
        for (const app of cleanup) app.unmount();
      })(this.cleanup);
    this.cleanup = [];
    return elm;
  }
}

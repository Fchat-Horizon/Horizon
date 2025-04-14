import { Component, Hook, Prop } from '@f-list/vue-ts';
import {
  CreateElement,
  default as Vue,
  VNode,
  VNodeChildrenArrayContents
} from 'vue';
import { Channel } from '../fchat';
import { Score } from '../learn/matcher';
import { BBCodeView } from '../bbcode/view';
import { formatTime } from './common';
import core from './core';
import { Conversation } from './interfaces';
import UserView from './UserView.vue';
import { Scoring } from '../learn/matcher-types';

const userPostfix: { [key: number]: string | undefined } = {
  [Conversation.Message.Type.Message]: ': ',
  [Conversation.Message.Type.Ad]: ': ',
  [Conversation.Message.Type.Action]: ''
};
@Component({
  render(this: MessageView, createElement: CreateElement): VNode {
    const message = this.message;

    // setTimeout(
    //     () => {
    //         console.log('Now scoring high!', message.text.substr(0, 64));
    //         message.score = Scoring.MATCH;
    //     },
    //     5000
    // );

    const children: VNodeChildrenArrayContents = [
      createElement(
        'span',
        { staticClass: 'message-time' },
        `${formatTime(message.time)}`
      )
    ];
    const separators = core.connection.isOpen
      ? core.state.settings.messageSeparators
      : false;
    /*tslint:disable-next-line:prefer-template*/ //unreasonable here
    let classes =
      `message message-${Conversation.Message.Type[message.type].toLowerCase()}` +
      (separators ? ' message-block' : '') +
      (message.type !== Conversation.Message.Type.Event &&
      message.sender.name === core.connection.character
        ? ' message-own'
        : '') +
      (this.classes !== undefined ? ` ${this.classes}` : '') +
      ` ${this.scoreClasses}` +
      ` ${this.filterClasses}`;
    if (message.type !== Conversation.Message.Type.Event) {
      children.push(
        message.type === Conversation.Message.Type.Action
          ? createElement('i', { class: 'message-pre fas fa-star-of-life' })
          : '',
        createElement(UserView, {
          props: {
            avatar: core.state.settings.risingShowPortraitInMessage,
            character: message.sender,
            channel: this.channel
          }
        }),
        userPostfix[message.type] !== undefined
          ? createElement(
              'span',
              { class: 'message-post' },
              userPostfix[message.type]
            )
          : ' '
      );
      if ('isHighlight' in message && message.isHighlight)
        classes += ' message-highlight';
    }
    const isAd = message.type === Conversation.Message.Type.Ad && !this.logs;
    children.push(
      createElement(BBCodeView(core.bbCodeParser), {
        props: {
          unsafeText: message.text,
          afterInsert: isAd
            ? (elm: HTMLElement) => {
                setImmediate(() => {
                  elm = elm.parentElement!;
                  if (elm.scrollHeight > elm.offsetHeight) {
                    const expand = document.createElement('div');
                    expand.className = 'expand fas fa-caret-down';
                    expand.addEventListener('click', function (): void {
                      this.parentElement!.className += ' expanded';
                    });
                    elm.appendChild(expand);
                  }
                });
              }
            : undefined
        }
      })
    );
    const node = createElement('div', { attrs: { class: classes } }, children);
    node.key = message.id;
    return node;
  }
})
export default class MessageView extends Vue {
  @Prop({ required: true })
  readonly message!: Conversation.Message;
  @Prop
  readonly classes?: string;
  @Prop
  readonly channel?: Channel;
  @Prop
  readonly logs?: true;

  scoreClasses = this.getMessageScoreClasses(this.message);
  filterClasses = this.getMessageFilterClasses(this.message);

  scoreWatcher: (() => void) | null =
    this.message.type === Conversation.Message.Type.Ad &&
    this.message.score === 0
      ? this.$watch('message.score', () => this.scoreUpdate())
      : null;

  @Hook('beforeDestroy')
  onBeforeDestroy(): void {
    // console.log('onbeforedestroy');

    if (this.scoreWatcher) {
      // console.log('onbeforedestroy killed');

      this.scoreWatcher(); // stop watching
      this.scoreWatcher = null;
    }
  }

  // @Watch('message.score')
  scoreUpdate(): void {
    const oldScoreClasses = this.scoreClasses;
    const oldFilterClasses = this.filterClasses;

    this.scoreClasses = this.getMessageScoreClasses(this.message);
    this.filterClasses = this.getMessageFilterClasses(this.message);

    if (
      this.scoreClasses !== oldScoreClasses ||
      this.filterClasses !== oldFilterClasses
    ) {
      this.$forceUpdate();
    }

    if (this.scoreWatcher) {
      // console.log('watch killed');

      this.scoreWatcher(); // stop watching
      this.scoreWatcher = null;
    }
  }

  getMessageScoreClasses(message: Conversation.Message): string {
    if (
      !core.state.settings.risingAdScore ||
      message.type !== Conversation.Message.Type.Ad
    ) {
      return '';
    }

    return `message-score ${Score.getClasses(message.score as Scoring)}`;
  }

  getMessageFilterClasses(message: Conversation.Message): string {
    if (!message.filterMatch) {
      return '';
    }

    return 'filter-match';
  }
}

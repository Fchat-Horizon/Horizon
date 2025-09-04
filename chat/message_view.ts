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
import { formatTime, characterImage } from './common';
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
    const layoutMode = core.state.settings.chatLayoutMode || 'classic';
    let modernInner: VNode | null = null; // track modern inner wrapper

    // setTimeout(
    //     () => {
    //         console.log('Now scoring high!', message.text.substr(0, 64));
    //         message.score = Scoring.MATCH;
    //     },
    //     5000
    // );

    // Classic layout: existing inline format.
    // Modern layout: avatar-first with header (name + time) and bubble content.
    let children: VNodeChildrenArrayContents;
    if (layoutMode === 'modern') {
      children = [];
    } else {
      children = [
        createElement(
          'span',
          { staticClass: 'message-time' },
          `${formatTime(message.time)}`
        )
      ];
    }
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
      if (layoutMode === 'modern') {
        // Modern layout: separate avatar column so time can sit directly after name
        const headerChildren: VNodeChildrenArrayContents = [];
        headerChildren.push(
          createElement(UserView, {
            props: {
              avatar: false, // custom avatar element
              character: message.sender,
              channel: this.channel,
              isMarkerShown: core.connection.character
                ? core.state.settings.horizonShowGenderMarker
                : false
            }
          })
        );
        headerChildren.push(
          createElement(
            'span',
            { staticClass: 'message-time' },
            `${formatTime(message.time)}`
          )
        );

        const showAvatar = core.connection.character
          ? core.state.settings.risingShowPortraitInMessage
          : false;
        const avatarNode = showAvatar
          ? createElement('img', {
              attrs: {
                src: characterImage(message.sender.name),
                alt: message.sender.name,
                class: 'message-avatar'
              }
            })
          : createElement('div', { staticClass: 'message-avatar-spacer' });

        children.push(avatarNode);
        modernInner = createElement(
          'div',
          { staticClass: 'message-modern-inner' },
          [
            createElement(
              'div',
              { staticClass: 'message-header' },
              headerChildren
            )
          ]
        );
        children.push(modernInner);
      } else {
        children.push(
          message.type === Conversation.Message.Type.Action
            ? createElement('i', { class: 'message-pre fas fa-star-of-life' })
            : '',
          createElement(UserView, {
            props: {
              avatar: core.connection.character
                ? core.state.settings.risingShowPortraitInMessage
                : false,
              character: message.sender,
              channel: this.channel,
              isMarkerShown: core.connection.character
                ? core.state.settings.horizonShowGenderMarker
                : false
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
      }
      if ('isHighlight' in message && message.isHighlight)
        classes += ' message-highlight';
    }

    const isModernAction =
      layoutMode === 'modern' &&
      message.type === Conversation.Message.Type.Action;
    const isAd = message.type === Conversation.Message.Type.Ad && !this.logs;
    const bbcodeNode = createElement(BBCodeView(core.bbCodeParser), {
      props: {
        unsafeText: isModernAction
          ? ' ' + message.sender.name + message.text
          : message.text,
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
    });

    if (layoutMode === 'modern') {
      if (modernInner && modernInner.children) {
        if (message.type === Conversation.Message.Type.Action) {
          (modernInner.children as VNodeChildrenArrayContents).push(
            createElement('div', { staticClass: 'message-content' }, [
              createElement('i', { class: 'message-pre fas fa-star-of-life' }),
              bbcodeNode
            ])
          );
        } else {
          (modernInner.children as VNodeChildrenArrayContents).push(
            createElement('div', { staticClass: 'message-content' }, [
              bbcodeNode
            ])
          );
        }
      } else {
        // fallback just append bbcode
        children.push(bbcodeNode);
      }
    } else {
      children.push(bbcodeNode);
    }

    if (layoutMode === 'modern') classes += ' message-modern';
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
    if (!core.connection.character) return '';
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

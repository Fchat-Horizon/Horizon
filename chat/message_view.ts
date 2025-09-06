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
import IconView from '../bbcode/IconView.vue';
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
    if (
      layoutMode === 'modern' &&
      message.type !== Conversation.Message.Type.Event
    ) {
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

    const showHeader =
      !core.state.settings.messageGrouping ||
      this.previous == undefined ||
      this.previous.sender !== this.message.sender ||
      this.previous.time.getTime() + 120000 < this.message.time.getTime();

    const separators = core.connection.isOpen
      ? core.state.settings.messageSeparators &&
        (showHeader || message.type == Conversation.Message.Type.Event)
      : false;
    /*tslint:disable-next-line:prefer-template*/ //unreasonable here
    let classes =
      `message message-${Conversation.Message.Type[message.type].toLowerCase()}` +
      (separators ? ' message-block' : ' message-blockless') +
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
        if (showHeader) {
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
            ? createElement(IconView, {
                props: {
                  character: message.sender
                },
                class: 'message-avatar'
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
        } else {
          const avatarNode = createElement('div', {
            staticClass: 'message-avatar-spacer'
          });
          children.push(avatarNode);
          modernInner = createElement(
            'div',
            { staticClass: 'message-modern-inner' },
            []
          );
        }
        children.push(modernInner);
      } else {
        // Classic Layout: Action Star > UserView (with icon logic) > Post type colon
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

    let messageAdjustment = '';
    switch (message.type) {
      case Conversation.Message.Type.Action:
        messageAdjustment = ' ' + message.sender.name + message.text;
        break;
      case Conversation.Message.Type.Roll:
        messageAdjustment = ' ' + message.sender.name + ' ' + message.text;
        break;
      case Conversation.Message.Type.Warn:
        messageAdjustment = ' ' + message.text;
        break;
      default:
        messageAdjustment = message.text;
    }
    const isAd = message.type == Conversation.Message.Type.Ad && !this.logs;
    const bbcodeNode = createElement(BBCodeView(core.bbCodeParser), {
      props: {
        unsafeText: layoutMode === 'modern' ? messageAdjustment : message.text,
        afterInsert: isAd
          ? (elm: HTMLElement) => {
              setImmediate(() => {
                if (layoutMode === 'modern') {
                  elm = elm.parentElement!.parentElement!.parentElement!;
                  if (elm.scrollHeight > elm.offsetHeight) {
                    const expand = document.createElement('div');
                    expand.className = 'expand fas fa-caret-down';
                    expand.addEventListener('click', function (): void {
                      this.parentElement!.className += ' expanded';
                    });
                    elm.appendChild(expand);
                  }
                } else {
                  elm = elm.parentElement!;
                  if (elm.scrollHeight > elm.offsetHeight) {
                    const expand = document.createElement('div');
                    expand.className = 'expand fas fa-caret-down';
                    expand.addEventListener('click', function (): void {
                      this.parentElement!.className += ' expanded';
                    });
                    elm.appendChild(expand);
                  }
                }
              });
            }
          : undefined
      }
    });

    if (layoutMode === 'modern') {
      if (modernInner && modernInner.children) {
        let messagePrefix = '';
        switch (message.type) {
          case Conversation.Message.Type.Action:
            messagePrefix = createElement('i', {
              class: 'message-pre fa fa-fw fa-star-of-life'
            });
            break;
          case Conversation.Message.Type.Roll:
            messagePrefix = createElement('i', {
              class: 'message-pre fa fa-fw fa-dice-d6'
            });
            break;
          case Conversation.Message.Type.Warn:
            messagePrefix = createElement('i', {
              class: 'message-pre fa fa-fw fa-triangle-exclamation'
            });
            break;
          default:
            messagePrefix = '';
        }
        (modernInner.children as VNodeChildrenArrayContents).push(
          createElement('div', { staticClass: 'message-content' }, [
            messagePrefix,
            bbcodeNode
          ])
        );
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
  @Prop
  readonly previous?: Conversation.Message;

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

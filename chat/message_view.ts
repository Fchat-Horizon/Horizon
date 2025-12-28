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
import { applyMutedWords, getFilterKey } from './muted-filter';

const userPostfix: { [key: number]: string | undefined } = {
  [Conversation.Message.Type.Message]: ': ',
  [Conversation.Message.Type.Ad]: ': ',
  [Conversation.Message.Type.Action]: ''
};

@Component({
  render(this: MessageView, createElement: CreateElement): VNode {
    const message = this.message;
    const layoutMode = core.connection.isOpen
      ? core.state.settings.chatLayoutMode || 'classic'
      : 'classic';
    const isModern = layoutMode === 'modern';
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
    if (isModern && message.type !== Conversation.Message.Type.Event) {
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
      !isModern ||
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
      if (isModern) {
        // Modern layout: separate avatar column so time can sit directly after name
        const headerChildren: VNodeChildrenArrayContents = [];
        if (showHeader) {
          // Create UserView in headerChildren
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
          // Create message-time in headerChildren
          headerChildren.push(
            createElement(
              'span',
              { staticClass: 'message-time' },
              `${formatTime(message.time)}`
            )
          );

          // Create IconView (or spacer) in children (this makes it visible as children elements are displayed when they are put in)
          const showAvatar = core.connection.character
            ? core.state.settings.risingShowPortraitInMessage
            : false;
          const avatarNode = showAvatar
            ? createElement(IconView, {
                props: {
                  character: message.sender,
                  useOriginalAvatar: core.state?.settings
                    ? !core.state.settings.horizonMessagePortraitHighQuality
                    : true
                },
                class: 'message-avatar'
              })
            : createElement('div', { staticClass: 'message-avatar-spacer' });
          children.push(avatarNode);

          // Create message with header, putting headerChildren objects inside
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
          // Creates spacer without avatar (when no header needed) in children
          const avatarNode = createElement(
            'div',
            {
              staticClass: 'message-avatar-spacer'
            },
            [
              createElement(
                'span',
                { staticClass: 'message-time' },
                `${formatTime(message.time, true)}`
              )
            ]
          );
          children.push(avatarNode);
          // Creates message without header, keeping similar message structure
          modernInner = createElement(
            'div',
            { staticClass: 'message-modern-inner' },
            []
          );
        }
        // Pushes the inner with or without header into children to make it visible
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
              useOriginalAvatar: core.connection.character
                ? !core.state.settings.horizonMessagePortraitHighQuality
                : true,
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

    //3.0 (and Horizon's classic view) users often prepend their message with an empty linefeed to format things like eicon collages
    //Therefore, we filter that out in modern view mode, since it's unnecessary there.
    let messageAdjustment = message.text.replace(/^\n/, '');
    switch (message.type) {
      case Conversation.Message.Type.Action:
        messageAdjustment = ' ' + message.sender.name + messageAdjustment;
        break;
      case Conversation.Message.Type.Roll:
        messageAdjustment = ' ' + message.sender.name + ' ' + messageAdjustment;
        break;
      case Conversation.Message.Type.Warn:
        messageAdjustment = ' ' + messageAdjustment;
        break;
    }
    const isAd = message.type == Conversation.Message.Type.Ad && !this.logs;
    const filterKey = getFilterKey();
    const bbcodeNode = createElement(BBCodeView(core.bbCodeParser), {
      key: `${message.id}:${filterKey}`,
      props: {
        unsafeText: isModern ? messageAdjustment : message.text,
        afterInsert: (elm: HTMLElement) => {
          const mutedResult = applyMutedWords(elm);

          // Handle message-level filtering
          if (mutedResult.action === 'hide-message') {
            // Find the message container and hide it
            const messageContainer = isModern
              ? elm.closest('.message')
              : elm.parentElement;
            if (messageContainer) {
              (messageContainer as HTMLElement).style.display = 'none';
              (messageContainer as HTMLElement).classList.add(
                'filtered-hidden'
              );
            }
            return;
          }

          if (!isAd) return;
          setImmediate(() => {
            if (isModern) {
              // Pushes elm up three times rather than one with modern to make it parent to the top level of a message.
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
      }
    });

    if (isModern) {
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

    if (isModern) classes += ' message-modern';
    const node = createElement('div', { attrs: { class: classes } }, children);
    node.key = `${message.id}:${filterKey}`;
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

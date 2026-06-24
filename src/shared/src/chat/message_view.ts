import { defineComponent, h, type VNode } from 'vue';
import { Channel } from '@/fchat';
import { Score } from '@/learn/matcher';
import { BBCodeView } from '@/bbcode/view';
import { formatTime } from './common';
import core from './core';
import { Conversation } from './interfaces';
import UserView from './UserView.vue';
import IconView from '@/bbcode/IconView.vue';
import type { Scoring } from '@/learn/matcher-types';

type RenderChild = VNode | string;

const userPostfix: { [key: number]: string | undefined } = {
  [Conversation.Message.Type.Message]: ': ',
  [Conversation.Message.Type.Ad]: ': ',
  [Conversation.Message.Type.Action]: ''
};

// BBCodeView(parser) builds a component type bound to a parser. Calling it inline
// in render() would yield a fresh type every render, so Vue 3 (which diffs vnode
// types by identity) would unmount+remount the whole BBCode subtree each time -
// re-parsing and restarting eicon/GIF animations. Memoize once against the stable
// core parser so re-renders just patch props on the same instance.
let messageBBCodeView: ReturnType<typeof BBCodeView> | undefined;
function getMessageBBCodeView(): ReturnType<typeof BBCodeView> {
  return (messageBBCodeView ??= BBCodeView(core.bbCodeParser));
}

export default defineComponent({
  render(this: any): VNode {
    const message = this.message;
    const layoutMode = core.connection.isOpen
      ? core.state.settings.chatLayoutMode || 'classic'
      : 'classic';
    const isModern = layoutMode === 'modern';
    let modernInner: VNode | null = null; // track modern inner wrapper

    // Classic layout: existing inline format.
    // Modern layout: avatar-first with header (name + time) and bubble content.
    let children: RenderChild[];
    if (
      isModern &&
      message.type !== Conversation.Message.Type.Event &&
      message.type !== Conversation.Message.Type.Bcast
    ) {
      children = [];
    } else {
      children = [
        h('span', { class: 'message-time' }, `${formatTime(message.time)}`)
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
      message.type !== Conversation.Message.Type.Bcast &&
      message.sender.name === core.connection.character
        ? ' message-own'
        : '') +
      (this.classes !== undefined ? ` ${this.classes}` : '') +
      ` ${this.scoreClasses}` +
      ` ${this.filterClasses}`;
    if (
      message.type !== Conversation.Message.Type.Event &&
      message.type !== Conversation.Message.Type.Bcast
    ) {
      if (isModern) {
        // Modern layout: separate avatar column so time can sit directly after name
        const headerChildren: RenderChild[] = [];
        if (showHeader) {
          // Create UserView in headerChildren
          headerChildren.push(
            h(UserView, {
              avatar: false, // custom avatar element
              character: message.sender,
              channel: this.channel,
              isMarkerShown: core.connection.character
                ? core.state.settings.horizonShowGenderMarker
                : false
            })
          );
          // Create message-time in headerChildren
          headerChildren.push(
            h('span', { class: 'message-time' }, `${formatTime(message.time)}`)
          );

          // Create IconView (or spacer) in children (this makes it visible as children elements are displayed when they are put in)
          const showAvatar = core.connection.character
            ? core.state.settings.risingShowPortraitInMessage
            : false;
          const avatarNode = showAvatar
            ? h(IconView, {
                character: message.sender,
                useOriginalAvatar: core.state?.settings
                  ? !core.state.settings.horizonMessagePortraitHighQuality
                  : true,
                class: 'message-avatar'
              })
            : h('div', { class: 'message-avatar-spacer' });
          children.push(avatarNode);

          // Create message with header, putting headerChildren objects inside
          modernInner = h('div', { class: 'message-modern-inner' }, [
            h('div', { class: 'message-header' }, headerChildren)
          ]);
        } else {
          // Creates spacer without avatar (when no header needed) in children
          const avatarNode = h('div', { class: 'message-avatar-spacer' }, [
            h(
              'span',
              { class: 'message-time' },
              `${formatTime(message.time, true)}`
            )
          ]);
          children.push(avatarNode);
          // Creates message without header, keeping similar message structure
          modernInner = h(
            'div',
            { class: 'message-modern-inner' },
            [] as RenderChild[]
          );
        }
        // Pushes the inner with or without header into children to make it visible
        children.push(modernInner);
      } else {
        // Classic Layout: Action Star > UserView (with icon logic) > Post type colon
        children.push(
          message.type === Conversation.Message.Type.Action
            ? h('i', { class: 'message-pre fas fa-star-of-life' })
            : '',
          h(UserView, {
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
          }),
          userPostfix[message.type] !== undefined
            ? h('span', { class: 'message-post' }, userPostfix[message.type])
            : ' '
        );
      }
      if ('isHighlight' in message && message.isHighlight)
        classes += ' message-highlight';
    }

    //3.0 (and Horizon's classic view) users often prepend their message with an empty linefeed to format things like eicon collages
    //Therefore, we filter that out in modern view mode, since it's unnecessary there.
    const hadLeadingNewline = message.text.startsWith('\n');
    let messageAdjustment = message.text.replace(/^\n/, '');
    switch (message.type) {
      case Conversation.Message.Type.Action:
        messageAdjustment =
          ' ' +
          message.sender.name +
          (hadLeadingNewline ? '\n' : '') +
          messageAdjustment;
        break;
      case Conversation.Message.Type.Roll:
        messageAdjustment = ' ' + message.sender.name + ' ' + messageAdjustment;
        break;
      case Conversation.Message.Type.Warn:
        messageAdjustment = ' ' + messageAdjustment;
        break;
    }
    // A newline-only message collapses to empty after the strip above and renders
    // as a broken, empty bubble in modern view; fall back to the raw text so it
    // shows as a blank line like classic view does.
    if (messageAdjustment === '') messageAdjustment = message.text;
    const isAd = message.type == Conversation.Message.Type.Ad && !this.logs;
    const bbcodeNode = h(getMessageBBCodeView(), {
      unsafeText: isModern ? messageAdjustment : message.text,
      afterInsert: isAd
        ? (elm: HTMLElement) => {
            setTimeout(() => {
              if (isModern) {
                // Pushes elm up three times rather than one with modern to make it parent to the top level of a message.
                elm = elm.parentElement!.parentElement!.parentElement!;
              } else {
                elm = elm.parentElement!;
              }
              if (elm.scrollHeight > elm.offsetHeight) {
                const expand = document.createElement('div');
                expand.className = 'expand fas fa-caret-down';
                expand.addEventListener('click', function (): void {
                  const ad = this.parentElement!;
                  ad.className += ' expanded';
                  // * Restart eicon GIF animations so mosaics re-sync
                  const eicons =
                    ad.querySelectorAll<HTMLImageElement>('img.eicon');
                  for (const eicon of eicons) {
                    const src = eicon.src;
                    eicon.src = '';
                    eicon.src = src;
                  }
                });
                elm.appendChild(expand);
              }
            }, 0);
          }
        : undefined
    });

    if (isModern) {
      if (modernInner && Array.isArray(modernInner.children)) {
        let messagePrefix: RenderChild = '';
        switch (message.type) {
          case Conversation.Message.Type.Action:
            messagePrefix = h('i', {
              class: 'message-pre fa fa-fw fa-star-of-life'
            });
            break;
          case Conversation.Message.Type.Roll:
            messagePrefix = h('i', {
              class: 'message-pre fa fa-fw fa-dice-d6'
            });
            break;
          case Conversation.Message.Type.Warn:
            messagePrefix = h('i', {
              class: 'message-pre fa fa-fw fa-triangle-exclamation'
            });
            break;
          default:
            messagePrefix = '';
        }
        (modernInner.children as RenderChild[]).push(
          h('div', { class: 'message-content' }, [messagePrefix, bbcodeNode])
        );
      } else {
        // fallback just append bbcode
        children.push(bbcodeNode);
      }
    } else {
      children.push(bbcodeNode);
    }

    if (
      isModern &&
      message.type !== Conversation.Message.Type.Event &&
      message.type !== Conversation.Message.Type.Bcast
    )
      classes += ' message-modern';
    if (this.selectable) {
      classes += ' message-selectable';
      const checkbox = h('input', {
        type: 'checkbox',
        checked: this.selected || undefined,
        class: 'message-select-checkbox',
        onClick: (e: MouseEvent) => {
          e.stopPropagation();
          this.$emit('toggle-select', e);
        }
      });
      children.unshift(checkbox);
    }

    return h('div', { class: classes, key: message.id }, children);
  },
  props: {
    message: { required: true as const },
    classes: {},
    channel: {},
    logs: {},
    previous: {},
    selectable: {},
    selected: {}
  },
  data() {
    return {
      scoreClasses: (this as any).getMessageScoreClasses((this as any).message),
      filterClasses: (this as any).getMessageFilterClasses(
        (this as any).message
      ),
      scoreWatcher: ((this as any).message.type ===
        Conversation.Message.Type.Ad && (this as any).message.score === 0
        ? (this as any).$watch('message.score', () =>
            (this as any).scoreUpdate()
          )
        : null) as (() => void) | null
    };
  },
  beforeUnmount() {
    if (this.scoreWatcher) {
      this.scoreWatcher(); // stop watching
      this.scoreWatcher = null;
    }
  },
  methods: {
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
        this.scoreWatcher(); // stop watching
        this.scoreWatcher = null;
      }
    },

    getMessageScoreClasses(message: Conversation.Message): string {
      if (!core.connection.character) return '';
      if (
        !core.state.settings.risingAdScore ||
        message.type !== Conversation.Message.Type.Ad
      ) {
        return '';
      }

      return `message-score ${Score.getClasses(message.score as Scoring)}`;
    },

    getMessageFilterClasses(message: Conversation.Message): string {
      if (!message.filterMatch) {
        return '';
      }

      return 'filter-match';
    }
  }
});

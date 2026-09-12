<template>
  <div class="recon row">
    <div class="col-sm-10 recon-loading" v-if="loading">
      <div class="alert alert-info">
        <i class="fa-solid fa-spinner fa-spin fa-fw"></i>
        {{ l('profile.recon.loading') }}
      </div>
    </div>

    <div class="col-sm-10 recon-empty" v-else-if="isEmpty">
      <div class="alert alert-info">{{ l('profile.recon.empty') }}</div>
    </div>

    <template v-else>
      <div
        class="col-sm-10 recon-section recon-summary"
        v-if="relationshipFlags.length > 0"
      >
        <div class="recon-flags">
          <span
            class="badge recon-flag"
            v-for="flag in relationshipFlags"
            :key="flag.label"
            :class="flag.cls"
          >
            <i class="fa-solid fa-fw" :class="flag.icon"></i>
            {{ flag.label }}
          </span>
        </div>
      </div>

      <div class="col-sm-10 recon-section shared-channels">
        <h4>
          <i class="fa-solid fa-hashtag fa-fw"></i>
          {{ l('profile.recon.sharedChannels') }}
        </h4>

        <div class="shared-channel-list" v-if="sharedChannels.length > 0">
          <button
            type="button"
            v-for="channel in sharedChannels"
            :key="channel.channel.id"
            class="shared-channel-chip"
            :title="channel.name"
            @click="jumpToChannel(channel)"
          >
            #{{ channel.name }}
          </button>
        </div>
        <i v-else>{{
          l('profile.recon.sharedChannels.none', {
            character: characterName()
          })
        }}</i>
      </div>

      <div
        class="col-sm-10 recon-section character-history"
        v-if="history.length > 0"
      >
        <h4>
          <i class="fa-solid fa-clock-rotate-left fa-fw"></i>
          {{ l('profile.recon.history') }}
        </h4>

        <div class="list-group">
          <button
            type="button"
            v-for="entry in history"
            :key="entry.character"
            class="list-group-item list-group-item-action recon-history-item"
            :class="{ active: entry.character === selectedCharacter }"
            @click="selectCharacter(entry.character)"
          >
            <img
              class="recon-avatar"
              :src="avatarUrl(entry.character)"
              :title="entry.character"
              :alt="entry.character"
            />
            <span class="recon-history-name" :title="entry.character">{{
              entry.character
            }}</span>
            <span
              v-if="isOwnCharacter(entry.character)"
              class="recon-history-current"
              :title="l('profile.recon.currentCharacter')"
            >
              <i class="fa-solid fa-user-check fa-fw"></i>
            </span>
            <span class="message-time">{{ formatDate(entry.lastDate) }}</span>
          </button>
        </div>
      </div>

      <div
        class="col-sm-10 recon-section conversation"
        v-if="conversation && conversation.length > 0"
      >
        <h4>
          <i class="fa-solid fa-comments fa-fw"></i>
          {{
            l('profile.recon.latestMessages', { character: selectedCharacter })
          }}
          <button
            type="button"
            class="btn btn-sm btn-secondary recon-view-logs"
            :title="l('profile.recon.viewFullLogs')"
            @click="viewFullLogs"
          >
            <i class="fa-solid fa-book fa-fw"></i>
            {{ l('profile.recon.viewFullLogs') }}
          </button>
        </h4>

        <div :class="getMessageWrapperClasses()">
          <template v-for="(message, i) in conversation">
            <message-view
              :message="message"
              :key="message.id"
              :previous="conversation[i - 1]"
            >
            </message-view>
          </template>
        </div>
      </div>

      <div class="col-sm-10 recon-section ad-viewer" v-if="ads.length > 0">
        <h4>
          <i class="fa-solid fa-bullhorn fa-fw"></i>
          {{ l('profile.recon.latestAds') }}
        </h4>

        <div class="recon-ad" v-for="(message, i) in ads" :key="i">
          <h5 class="recon-ad-channel">
            #{{ message.channelName }}
            <span class="message-time">{{
              formatTime(message.datePosted)
            }}</span>
          </h5>
          <div class="border-bottom">
            <bbcode :text="message.message"></bbcode>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';
  import { Character } from './interfaces';
  import { Conversation } from '../../chat/interfaces';
  import core from '../../chat/core';
  import * as _ from 'lodash';
  import { AdCachedPosting } from '../../learn/ad-cache';
  import MessageView from '../../chat/message_view';
  import { BBCodeView } from '../../bbcode/view';

  import l from '../../chat/localize';
  import { formatTime } from '../../chat/common';
  import { format } from 'date-fns';
  import { avatarURL } from '../utils';
  import { Character as ChatCharacter } from '../../fchat/interfaces';

  interface CharacterHistory {
    character: string;
    lastDate: Date;
  }

  interface RelationshipFlag {
    label: string;
    cls: string;
    icon: string;
  }

  export default Vue.extend({
    components: {
      'message-view': MessageView,
      bbcode: BBCodeView(core.bbCodeParser)
    },
    props: {
      character: { required: true as const }
    },
    data() {
      return {
        conversation: [] as Conversation.Message[],
        ads: [] as AdCachedPosting[],
        history: [] as CharacterHistory[],
        sharedChannels: [] as Conversation.ChannelConversation[],
        selectedCharacter: null as string | null,
        loading: false,
        l: l,
        formatTime: formatTime
      };
    },
    computed: {
      liveCharacter(): ChatCharacter {
        return core.characters.get(
          (this.character as Character).character.name
        );
      },
      relationshipFlags(): RelationshipFlag[] {
        const c = this.liveCharacter;
        const flags: RelationshipFlag[] = [];
        if (c.isFriend)
          flags.push({
            label: l('user.friend'),
            cls: 'text-bg-success',
            icon: 'fa-user-group'
          });
        if (c.isBookmarked)
          flags.push({
            label: l('profile.recon.flag.bookmarked'),
            cls: 'text-bg-info',
            icon: 'fa-bookmark'
          });
        if (c.isIgnored)
          flags.push({
            label: l('profile.recon.flag.ignored'),
            cls: 'text-bg-danger',
            icon: 'fa-ban'
          });
        return flags;
      },
      isEmpty(): boolean {
        return (
          this.relationshipFlags.length === 0 &&
          this.sharedChannels.length === 0 &&
          this.history.length === 0 &&
          this.ads.length === 0
        );
      }
    },
    methods: {
      async show(): Promise<void> {
        await this.load();
      },
      async load(): Promise<void> {
        this.loading = true;
        this.conversation = [];
        this.ads = [];
        this.history = [];
        this.sharedChannels = [];
        this.selectedCharacter = null;

        this.loadSharedChannels();

        try {
          await Promise.all([this.loadAds(), this.loadHistory()]);

          this.selectedCharacter =
            this.history.length > 0 ? this.history[0].character : null;
          await this.loadConversation(this.selectedCharacter);
        } finally {
          this.loading = false;
        }
      },
      async loadAds(): Promise<void> {
        const char = this.character as Character;
        const cache = core.cache.adCache.get(char.character.name);

        this.ads = _.uniq(
          cache ? _.takeRight(cache.posts, 5).reverse() : []
        ) as AdCachedPosting[];
      },
      loadSharedChannels(): void {
        const char = this.character as Character;

        this.sharedChannels = _.sortBy(
          _.filter(
            core.conversations.channelConversations,
            cc => !!cc.channel.members[char.character.name]
          ),
          'name'
        );
      },
      jumpToChannel(channel: Conversation.ChannelConversation): void {
        channel.show();
      },
      characterName(): string {
        return (this.character as Character).character.name;
      },
      viewFullLogs(): void {
        if (this.selectedCharacter === null) return;
        const name = this.characterName();
        this.$emit('view-logs', {
          character: this.selectedCharacter,
          conversation: { key: name.toLowerCase(), name }
        });
      },
      async loadHistory(): Promise<void> {
        const char = this.character as Character;
        const logKey = char.character.name.toLowerCase();
        const mine = await core.logs.getAvailableCharacters();

        const results = await Promise.all(
          mine.map(async ownName => {
            const logDates = await core.logs.getLogDates(ownName, logKey);

            return logDates.length > 0
              ? { character: ownName, lastDate: _.last(logDates) as Date }
              : null;
          })
        );

        this.history = _.compact(results).sort(
          (a, b) => b.lastDate.getTime() - a.lastDate.getTime()
        );
      },
      async selectCharacter(ownName: string): Promise<void> {
        this.selectedCharacter = ownName;
        await this.loadConversation(ownName);
      },
      async loadConversation(ownName: string | null): Promise<void> {
        this.conversation = [];

        if (ownName === null || ownName.length === 0) return;

        const char = this.character as Character;
        const logKey = char.character.name.toLowerCase();
        const logDates = await core.logs.getLogDates(ownName, logKey);

        if (logDates.length === 0) {
          return;
        }

        const messages = await core.logs.getLogs(
          ownName,
          logKey,
          _.last(logDates) as Date
        );
        const matcher = /\[AUTOMATED MESSAGE]/;

        this.conversation = _.takeRight(
          _.filter(messages, m => !matcher.exec(m.text)),
          5
        );
      },
      avatarUrl(name: string): string {
        return avatarURL(name);
      },
      formatDate(date: Date): string {
        return format(date, 'yyyy-MM-dd');
      },
      isOwnCharacter(ownName: string): boolean {
        return ownName === core.characters.ownCharacter.name;
      },
      getMessageWrapperClasses(): any {
        const classes: any = {};
        const layout = core.state.settings.chatLayoutMode || 'classic';
        classes['layout-' + layout] = true;
        return classes;
      }
    }
  });
</script>

<style lang="scss">
  .recon {
    .recon-section {
      padding: 10px 0 12px;

      & + .recon-section {
        border-top: 1px solid var(--bs-border-color, rgba(128, 128, 128, 0.3));
      }

      > h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        > i {
          opacity: 0.7;
        }

        .recon-view-logs {
          margin-left: auto;
          font-size: 0.8rem;
          white-space: nowrap;
        }
      }
    }

    .recon-summary .recon-flags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .recon-flag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-weight: normal;
    }

    .shared-channels {
      .shared-channel-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 4px;
      }

      .shared-channel-chip {
        display: inline-flex;
        align-items: center;
        padding: 1px 10px;
        border-radius: 999px;
        border: 1px solid var(--bs-border-color, rgba(128, 128, 128, 0.4));
        background-color: var(--bs-secondary-bg, rgba(128, 128, 128, 0.15));
        color: var(--bs-body-color, inherit);
        font-size: 0.875em;
        line-height: 1.6;
        cursor: pointer;

        &:hover {
          background-color: var(--bs-tertiary-bg, rgba(128, 128, 128, 0.28));
        }

        &:focus-visible {
          outline: 2px solid var(--bs-focus-ring-color, rgba(13, 110, 253, 0.5));
          outline-offset: 1px;
        }
      }
    }

    .recon-history-item {
      display: flex;
      align-items: center;
      gap: 8px;
      text-align: left;

      &:focus-visible {
        outline: 2px solid var(--bs-focus-ring-color, rgba(13, 110, 253, 0.5));
        outline-offset: -2px;
        z-index: 1;
      }

      .recon-avatar {
        width: 24px;
        height: 24px;
        border-radius: 3px;
        object-fit: cover;
        flex-shrink: 0;
      }

      .recon-history-current {
        opacity: 0.7;
      }

      .message-time {
        margin-left: auto;
        color: var(--messageTimeFgColor);
      }
    }

    .recon-ad-channel {
      margin-top: 8px;
    }
  }
</style>

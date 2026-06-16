<template>
  <div class="recon row">
    <div
      class="recon-summary row"
      v-if="!loading && relationshipFlags.length > 0"
    >
      <div class="col-sm-10" style="margin-top: 5px">
        <span class="recon-flags">
          <span
            class="badge recon-flag"
            v-for="flag in relationshipFlags"
            :key="flag.label"
            :class="flag.cls"
            >{{ flag.label }}</span
          >
        </span>
      </div>
    </div>

    <div class="shared-channels row" v-if="!loading">
      <div class="col-sm-10" style="margin-top: 5px">
        <h4>Shared Channels</h4>

        <div class="shared-channel-list" v-if="sharedChannels.length > 0">
          <a
            v-for="channel in sharedChannels"
            :key="channel.channel.id"
            href="#"
            class="shared-channel-chip"
            :title="channel.name"
            @click.prevent="jumpToChannel(channel)"
            >#{{ channel.name }}</a
          >
        </div>
        <i v-else>{{ characterName() }} isn't in any channel you're in.</i>
      </div>
    </div>

    <div class="character-history" v-if="history.length > 0">
      <div class="col-sm-10" style="margin-top: 5px">
        <h4>Your Characters' History</h4>

        <div class="list-group">
          <a
            v-for="entry in history"
            :key="entry.character"
            href="#"
            class="list-group-item"
            :class="{ active: entry.character === selectedCharacter }"
            @click.prevent="selectCharacter(entry.character)"
          >
            <img
              :src="avatarUrl(entry.character)"
              :title="entry.character"
              style="
                width: 24px;
                height: 24px;
                border-radius: 3px;
                margin-right: 8px;
                vertical-align: middle;
                object-fit: cover;
              "
            />
            {{ entry.character }}
            <span v-if="isOwnCharacter(entry.character)"> (current)</span>
            <span class="message-time">{{ formatDate(entry.lastDate) }}</span>
          </a>
        </div>
      </div>
    </div>

    <div class="conversation" v-if="conversation && conversation.length > 0">
      <h4>Latest Messages (as {{ selectedCharacter }})</h4>

      <div
        :class="getMessageWrapperClasses()"
        class="col-sm-10"
        style="margin-top: 5px"
      >
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

    <div class="row ad-viewer" v-if="ads.length > 0">
      <div class="col-sm-10" style="margin-top: 5px">
        <h4>Latest Ads</h4>

        <template v-for="message in ads">
          <h3>
            #{{ message.channelName }}
            <span class="message-time">{{
              formatTime(message.datePosted)
            }}</span>
          </h3>
          <div class="border-bottom">
            <bbcode :text="message.message"></bbcode>
          </div>
        </template>
      </div>
    </div>

    <div class="row" v-if="loading">
      <div class="col-sm-10" style="margin-top: 5px">Loading…</div>
    </div>

    <div
      class="row"
      v-if="!loading && ads.length === 0 && history.length === 0"
    >
      <div class="col-sm-10" style="margin-top: 5px">
        You have not seen any ads or messages from this character.
      </div>
    </div>
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
        if (c.isFriend) flags.push({ label: 'Friend', cls: 'text-bg-success' });
        if (c.isBookmarked)
          flags.push({ label: 'Bookmarked', cls: 'text-bg-info' });
        if (c.isIgnored)
          flags.push({ label: 'Ignored', cls: 'text-bg-danger' });
        return flags;
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
      async loadHistory(): Promise<void> {
        const char = this.character as Character;
        const logKey = char.character.name.toLowerCase();
        const mine = await core.logs.getAvailableCharacters();
        const results: CharacterHistory[] = [];

        for (const ownName of mine) {
          const logDates = await core.logs.getLogDates(ownName, logKey);

          if (logDates.length > 0)
            results.push({
              character: ownName,
              lastDate: _.last(logDates) as Date
            });
        }

        this.history = results.sort(
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
  .recon .recon-summary {
    .recon-flags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .recon-flag {
      font-weight: normal;
    }
  }

  .recon .shared-channels {
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
      text-decoration: none;

      &:hover,
      &:focus {
        background-color: var(--bs-tertiary-bg, rgba(128, 128, 128, 0.28));
        text-decoration: none;
      }
    }
  }
</style>

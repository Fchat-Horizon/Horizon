<template>
  <div class="recon row">
    <div class="conversation" v-if="conversation && conversation.length > 0">
      <h4>Latest Messages</h4>

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

    <div class="row" v-if="ads.length === 0 && conversation.length === 0">
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
        formatTime: formatTime
      };
    },
    async mounted(): Promise<void> {
      await this.load();
    },
    methods: {
      async load(): Promise<void> {
        this.conversation = [];
        this.ads = [];

        await Promise.all([this.loadAds(), this.loadConversation()]);
      },
      async loadAds(): Promise<void> {
        const char = this.character as Character;
        const cache = core.cache.adCache.get(char.character.name);

        this.ads = _.uniq(
          cache ? _.takeRight(cache.posts, 5).reverse() : []
        ) as AdCachedPosting[];
      },
      async loadConversation(): Promise<void> {
        const char = this.character as Character;
        const ownName = core.characters.ownCharacter.name;
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
      getMessageWrapperClasses(): any {
        const classes: any = {};
        const layout = core.state.settings.chatLayoutMode || 'classic';
        classes['layout-' + layout] = true;
        return classes;
      }
    }
  });
</script>

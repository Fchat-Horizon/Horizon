<template>
  <div class="recon row">
    <div class="conversation" v-if="conversation && conversation.length > 0">
      <div class="col-sm-10" style="margin-top: 5px">
        <h4>Latest Messages</h4>

        <template v-for="message in conversation">
          <message-view :message="message" :key="message.id"> </message-view>
        </template>
      </div>
    </div>

    <div class="row ad-viewer" v-if="ads.length > 0">
      <div class="col-sm-10" style="margin-top: 5px">
        <h4>Latest Ads</h4>

        <template v-for="message in ads">
          <h3>
            #{{ message.channelName }} <span class="message-time">{{ formatTime(message.datePosted) }}</span>
          </h3>
          <div class="border-bottom">
            <bbcode :text="message.message"></bbcode>
          </div>
        </template>
      </div>
    </div>

    <div class="row" v-if="ads.length === 0 && conversation.length === 0">
      <div class="col-sm-10" style="margin-top: 5px">You have not seen any ads or messages from this character.</div>
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Hook, Prop } from '@f-list/vue-ts';
  import Vue from 'vue';
  import { Character } from './interfaces';
  import { Conversation } from '../../chat/interfaces';
  import core from '../../chat/core';
  import * as _ from 'lodash';
  import { AdCachedPosting } from '../../learn/ad-cache';
  import MessageView from '../../chat/message_view';

  import { formatTime } from '../../chat/common';

  @Component({
    components: {
      'message-view': MessageView
    }
  })
  export default class ReconView extends Vue {
    @Prop({ required: true })
    readonly character!: Character;

    conversation: Conversation.Message[] = [];
    ads: AdCachedPosting[] = [];

    formatTime = formatTime;

    @Hook('mounted')
    async mounted(): Promise<void> {
      await this.load();
    }

    async load(): Promise<void> {
      this.conversation = [];
      this.ads = [];

      await Promise.all([this.loadAds(), this.loadConversation()]);
    }

    async loadAds(): Promise<void> {
      const cache = core.cache.adCache.get(this.character.character.name);

      this.ads = _.uniq(cache ? _.takeRight(cache.posts, 5).reverse() : []) as AdCachedPosting[];
    }

    async loadConversation(): Promise<void> {
      const ownName = core.characters.ownCharacter.name;
      const logKey = this.character.character.name.toLowerCase();
      const logDates = await core.logs.getLogDates(ownName, logKey);

      if (logDates.length === 0) {
        return;
      }

      const messages = await core.logs.getLogs(ownName, logKey, _.last(logDates) as Date);
      const matcher = /\[AUTOMATED MESSAGE]/;

      this.conversation = _.takeRight(
        _.filter(messages, m => !matcher.exec(m.text)),
        5
      );
    }
  }
</script>

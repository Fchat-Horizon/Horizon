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
  import { computed, defineComponent, onMounted, ref } from 'vue';
  import { Character } from './interfaces';
  import { Conversation } from '../../chat/interfaces';
  import core from '../../chat/core';
  import * as _ from 'lodash';
  import { AdCachedPosting } from '../../learn/ad-cache';
  import MessageView from '../../chat/message_view';

  import { formatTime } from '../../chat/common';

  export default defineComponent({
    name: 'ReconView',
    components: {
      'message-view': MessageView
    },
    props: {
      character: {
        type: Object as () => Character,
        required: true
      }
    },
    setup(props) {
      const conversation = ref<Conversation.Message[]>([]);
      const ads = ref<AdCachedPosting[]>([]);

      const loadAds = async () => {
        const cache = core.cache.adCache.get(props.character.character.name);
        ads.value = _.uniq(
          cache ? _.takeRight(cache.posts, 5).reverse() : []
        ) as AdCachedPosting[];
      };

      const loadConversation = async () => {
        const ownName = core.characters.ownCharacter.name;
        const logKey = props.character.character.name.toLowerCase();
        const logDates = await core.logs.getLogDates(ownName, logKey);

        if (logDates.length === 0) return;

        const messages = await core.logs.getLogs(
          ownName,
          logKey,
          _.last(logDates) as Date
        );
        const matcher = /\[AUTOMATED MESSAGE]/;

        conversation.value = _.takeRight(
          _.filter(messages, m => !matcher.exec(m.text)),
          5
        );
      };

      const load = async () => {
        conversation.value = [];
        ads.value = [];
        await Promise.all([loadAds(), loadConversation()]);
      };

      const messageWrapperClasses = computed(() => {
        const layout = core.state.settings.chatLayoutMode || 'classic';
        return {
          ['layout-' + layout]: true
        };
      });

      onMounted(async () => {
        await load();
      });

      return {
        conversation,
        ads,
        formatTime,
        load,
        loadAds,
        loadConversation,
        getMessageWrapperClasses: () => messageWrapperClasses.value
      };
    }
  });
</script>

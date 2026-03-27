<template>
  <modal
    :buttons="false"
    ref="dialog"
    @open="onOpen"
    @close="onClose"
    style="width: 98%"
    dialogClass="ads-dialog"
  >
    <template slot="title">
      {{ l('characterAd.title') }}
      <user :character="character" :isMarkerShown="false">{{
        character.name
      }}</user>
    </template>

    <div class="row ad-viewer" ref="pageBody" v-if="messages.length > 0">
      <template v-for="message in messages">
        <h3>
          #{{ message.channelName }}
          <span class="message-time">{{ formatTime(message.datePosted) }}</span>
        </h3>
        <div class="border-bottom">
          <bbcode :text="message.message"></bbcode>
        </div>
      </template>
    </div>

    <div class="row ad-viewer" ref="pageBody" v-else>
      <i>{{ l('characterAd.noAds', character.name) }}</i>
    </div>
  </modal>
</template>

<script lang="ts">
  import * as _ from 'lodash';
  import CustomDialog from '../../components/custom_dialog';
  import Modal from '../../components/Modal.vue';
  import { Character } from '../../fchat/interfaces';
  import { AdCachedPosting } from '../../learn/ad-cache';
  import core from '../core';
  import { formatTime } from '../common';
  import UserView from '../UserView.vue';
  import { BBCodeView } from '../../bbcode/view';
  import l from '../localize';

  export default CustomDialog.extend({
    components: {
      modal: Modal,
      user: UserView,
      bbcode: BBCodeView(core.bbCodeParser)
    },
    props: {
      character: { required: true as const }
    },
    data() {
      return {
        messages: [] as AdCachedPosting[],
        formatTime: formatTime,
        l: l
      };
    },
    watch: {
      character(): void {
        this.update();
      }
    },
    mounted(): void {
      this.update();
    },
    methods: {
      update(): void {
        if (!this.character) {
          this.messages = [];
          return;
        }

        const cache = core.cache.adCache.get(this.character.name);

        this.messages = (
          cache ? _.takeRight(cache.posts, 10).reverse() : []
        ) as AdCachedPosting[];
      },
      async onOpen(): Promise<void> {
        // empty
        return;
      },
      async onClose(): Promise<void> {
        // empty
        return;
      }
    }
  });
</script>

<template>
  <modal :buttons="false" ref="dialog" style="width: 98%" dialogClass="">
    <template #title>
      Channels for
      <user :character="character" :isMarkerShown="false">{{
        character.name
      }}</user>
    </template>

    <div class="user-channel-list" ref="pageBody" v-if="channels.length > 0">
      <template v-for="channel in channels" :key="channel.channel.id">
        <h3>
          <a href="#" @click.prevent="jumpToChannel(channel)"
            >#{{ channel.name }}</a
          >
        </h3>
      </template>
    </div>

    <div class="user-channel-list" ref="pageBody" v-else>
      <i
        ><user :character="character" :isMarkerShown="false">{{
          character.name
        }}</user>
        is not on any of the channels you are on.</i
      >
    </div>
  </modal>
</template>

<script lang="ts">
  import * as _ from 'lodash';
  import CustomDialog from '@/components/custom_dialog';
  import Modal from '@/components/Modal.vue';
  import type { Character } from '@/fchat/interfaces';
  import core from '../core';
  import type { Conversation } from '../interfaces';
  import UserView from '../UserView.vue';
  import type { PropType } from 'vue';
  import { defineComponent } from 'vue';

  type ChannelConversation = Conversation.ChannelConversation;

  // Vue's reactive unwrapping makes data() items deeply readonly in the
  // template, so jumpToChannel takes the minimal shape it actually uses
  // rather than the mutable ChannelConversation, which would not assign.
  interface ShowableChannel {
    show(): void;
  }

  export default defineComponent({
    extends: CustomDialog,
    components: { modal: Modal, user: UserView },
    props: {
      character: { type: Object as PropType<Character>, required: true }
    },
    data() {
      return {
        channels: [] as ChannelConversation[]
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
          this.channels = [];
          return;
        }

        this.channels = _.sortBy(
          _.filter(
            core.conversations.channelConversations,
            (cc: ChannelConversation) =>
              !!cc.channel.members[this.character.name]
          ),
          'name'
        );
      },
      jumpToChannel(channel: ShowableChannel): void {
        channel.show();
      }
    }
  });
</script>

<style lang="scss">
  .user-channel-list h3 {
    font-size: 120%;
  }
</style>

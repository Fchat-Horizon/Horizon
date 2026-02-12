<template>
  <a
    href="#"
    @click.prevent="joinChannel()"
    :disabled="channel && channel.isJoined"
  >
    <span class="fa fa-hashtag"></span>
    <!-- This doesn't look particularly nice, but Prettier breaks the formatting of the actual tag component. -->
    <!-- prettier-ignore -->
    <template v-if="channel">{{ channel.name }}<span class="bbcode-pseudo"> ({{ channel.memberCount }})</span></template>
    <template v-else>{{ text }}</template>
  </a>
</template>

<script lang="ts">
  import Vue from 'vue';
  import core from './core';
  import { Channel } from './interfaces';

  export default Vue.extend({
    props: {
      id: { required: true as const },
      text: { required: true as const }
    },
    computed: {
      channel(): Channel.ListItem | undefined {
        return core.channels.getChannelItem(this.id);
      }
    },
    mounted(): void {
      core.channels.requestChannelsIfNeeded(300000);
    },
    methods: {
      joinChannel(): void {
        if (this.channel === undefined || !this.channel.isJoined)
          core.channels.join(this.id);
        const channel = core.conversations.byKey(`#${this.id}`);
        if (channel !== undefined) channel.show();
      }
    }
  });
</script>

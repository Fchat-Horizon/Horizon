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
  import { computed, defineComponent, onMounted } from 'vue';
  import core from './core';
  import { Channel } from './interfaces';

  export default defineComponent({
    name: 'ChannelView',
    props: {
      id: {
        type: String,
        required: true
      },
      text: {
        type: String,
        required: true
      }
    },
    setup(props) {
      const channel = computed<Channel.ListItem | undefined>(() =>
        core.channels.getChannelItem(props.id)
      );

      const joinChannel = () => {
        if (!channel.value || !channel.value.isJoined) {
          core.channels.join(props.id);
        }
        const conversation = core.conversations.byKey(`#${props.id}`);
        if (conversation !== undefined) conversation.show();
      };

      onMounted(() => {
        core.channels.requestChannelsIfNeeded(300000);
      });

      return {
        channel,
        joinChannel
      };
    }
  });
</script>

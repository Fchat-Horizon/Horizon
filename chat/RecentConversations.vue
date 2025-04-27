<template>
  <modal
    :buttons="false"
    :action="l('chat.recentConversations')"
    dialogClass="w-100 modal-lg"
  >
    <tabs
      style="flex-shrink: 0; margin-bottom: 10px"
      v-model="selectedTab"
      :tabs="[l('chat.pms'), l('chat.channels')]"
    ></tabs>
    <div>
      <div v-show="selectedTab === '0'" class="recent-conversations">
        <user-view
          v-for="recent in recentPrivate"
          v-if="recent.character"
          :key="recent.character"
          :character="getCharacter(recent.character)"
          :isMarkerShown="shouldShowMarker"
        ></user-view>
      </div>
      <div v-show="selectedTab === '1'" class="recent-conversations">
        <channel-view
          v-for="recent in recentChannels"
          :key="recent.channel"
          :id="recent.channel"
          :text="recent.name"
        ></channel-view>
      </div>
    </div>
  </modal>
</template>

<script lang="ts">
  import { Component } from '@f-list/vue-ts';
  import CustomDialog from '../components/custom_dialog';
  import Modal from '../components/Modal.vue';
  import Tabs from '../components/tabs';
  import ChannelView from './ChannelTagView.vue';
  import core from './core';
  import { Character, Conversation } from './interfaces';
  import l from './localize';
  import UserView from './UserView.vue';

  @Component({
    components: {
      'user-view': UserView,
      'channel-view': ChannelView,
      modal: Modal,
      tabs: Tabs
    }
  })
  export default class RecentConversations extends CustomDialog {
    l = l;
    selectedTab = '0';

    get recentPrivate(): ReadonlyArray<Conversation.RecentPrivateConversation> {
      return core.conversations.recent;
    }

    get recentChannels(): ReadonlyArray<Conversation.RecentChannelConversation> {
      return core.conversations.recentChannels;
    }

    getCharacter(name: string): Character {
      return core.characters.get(name);
    }

    get shouldShowMarker(): boolean {
      return core.state.settings.horizonShowGenderMarker;
    }
  }
</script>

<style lang="scss">
  .recent-conversations {
    display: flex;
    flex-direction: column;
    max-height: 500px;
    flex-wrap: wrap;
    & > * {
      margin: 3px;
    }
  }
</style>

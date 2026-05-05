<template>
  <div class="channel-group">
    <div class="channel-group-header" @click="toggleCollapse">
      <span
        class="fas fa-fw fa-chevron-right channel-group-chevron"
        :class="{ expanded: !group.collapsed }"
      ></span>
      <span
        v-if="!renaming"
        class="channel-group-name"
        @dblclick.stop="startRename"
        >{{ group.name }}</span
      >
      <input
        v-else
        ref="renameInput"
        class="channel-group-rename-input"
        v-model="renameValue"
        @keydown.enter.prevent="commitRename"
        @keydown.esc.prevent="cancelRename"
        @blur="commitRename"
        @click.stop
      />
      <span
        class="fas fa-fw fa-trash channel-group-delete"
        @click.stop="deleteGroup"
        :aria-label="'Delete group'"
      ></span>
    </div>
    <div
      v-show="!group.collapsed"
      ref="channelList"
      class="list-group conversation-nav channel-group-list"
      :data-group-id="group.id"
    >
      <a
        v-for="conversation in conversations"
        href="#"
        @click.prevent="conversation.show()"
        :class="getClasses(conversation)"
        class="list-group-item list-group-item-action item-channel"
        :key="conversation.key"
        :data-channel-id="conversation.channel.id"
        @click.middle.prevent.stop="conversation.close()"
      >
        <span class="name">{{ conversation.name }}</span>
        <span class="conversation-actions">
          <span
            class="badge rounded-pill text-bg-danger"
            v-show="shouldShowNotificationBadge(conversation)"
            >{{ conversation.unreadCount }}</span
          >
          <span
            v-if="conversation.hasAutomatedAds()"
            class="fas fa-ad ads"
            :class="{ active: conversation.isSendingAutomatedAds() }"
            :aria-label="l('chat.toggleAds')"
            @click.stop="conversation.toggleAutomatedAds()"
          ></span>
          <group-picker
            :groups="allGroups"
            :current-group-id="group.id"
            @assign="id => onAssign(conversation, id)"
            @create="onCreateAndAssign(conversation)"
          ></group-picker>
          <span
            class="fas fa-times leave"
            @click.stop="conversation.close()"
            :aria-label="l('chat.closeTab')"
          ></span>
        </span>
      </a>
    </div>
  </div>
</template>

<script lang="ts">
  import Sortable from 'sortablejs'; // tslint:disable-line:no-require-imports
  import Vue from 'vue';
  import core from './core';
  import { Conversation } from './interfaces';
  import l from './localize';
  import GroupPicker from './GroupPicker.vue';

  const unreadClasses = {
    [Conversation.UnreadState.None]: '',
    [Conversation.UnreadState.Mention]: 'list-group-item-warning',
    [Conversation.UnreadState.Unread]: 'list-group-item-danger'
  };

  export default Vue.extend({
    name: 'ChannelGroupSection',
    components: { 'group-picker': GroupPicker },
    props: {
      group: { required: true as const },
      conversations: { required: true as const },
      allGroups: { required: true as const },
      startEditing: { default: false }
    },
    data() {
      return {
        l,
        renaming: false,
        renameValue: ''
      };
    },
    mounted() {
      if (this.startEditing) {
        this.$nextTick(() => {
          this.startRename();
          this.$emit('editing-started');
        });
      }
      Sortable.create(<HTMLElement>this.$refs['channelList'], {
        group: { name: 'channels', pull: true, put: true },
        animation: 50,
        fallbackTolerance: 5,
        onStart: () => {
          document.body.classList.add('channel-dragging');
        },
        onAdd: (e: any) => {
          // Channel dropped into this group from ungrouped or another group
          const channelId = (e.item as HTMLElement).dataset?.channelId;
          if (channelId)
            core.conversations.setChannelGroup(
              channelId,
              (this.group as any).id
            );
        },
        onRemove: (e: any) => {
          // Channel dragged out — only clear assignment if destination is ungrouped (no groupId)
          const destGroupId = (e.to as HTMLElement).dataset?.groupId;
          if (!destGroupId) {
            const channelId = (e.item as HTMLElement).dataset?.channelId;
            if (channelId) core.conversations.setChannelGroup(channelId, null);
          }
        },
        onEnd: async (e: any) => {
          document.body.classList.remove('channel-dragging');
          if (e.to !== e.from || e.oldIndex === e.newIndex) return;
          // Reorder within this group
          const groupConvs = this.conversations as any[];
          const conv = groupConvs[e.oldIndex];
          if (!conv) return;
          const targetConv = groupConvs[e.newIndex];
          const newAbsIndex = targetConv
            ? core.conversations.channelConversations.indexOf(targetConv)
            : core.conversations.channelConversations.length - 1;
          void conv.sort(newAbsIndex);
        }
      });
    },
    methods: {
      toggleCollapse() {
        (this.group as any).collapsed = !(this.group as any).collapsed;
        void core.conversations.saveChannelGroups();
      },
      startRename() {
        this.renameValue = (this.group as any).name;
        this.renaming = true;
        this.$nextTick(() => {
          (<HTMLInputElement>this.$refs['renameInput'])?.focus();
        });
      },
      commitRename() {
        if (!this.renaming) return;
        this.renaming = false;
        const name = this.renameValue.trim();
        if (name)
          core.conversations.renameChannelGroup((this.group as any).id, name);
      },
      cancelRename() {
        this.renaming = false;
      },
      deleteGroup() {
        core.conversations.deleteChannelGroup((this.group as any).id);
      },
      getClasses(conversation: Conversation.Conversation): string {
        return conversation === core.conversations.selectedConversation
          ? ' active'
          : unreadClasses[conversation.unread];
      },
      shouldShowNotificationBadge(
        conversation: Conversation.Conversation
      ): boolean {
        return (
          core.state.generalSettings
            ?.horizonShowWindowAndChatNotificationBadge !== false &&
          conversation.unreadCount > 0
        );
      },
      onAssign(conversation: any, groupId: string | null) {
        core.conversations.setChannelGroup(conversation.channel.id, groupId);
      },
      onCreateAndAssign(conversation: any) {
        const id = core.conversations.createChannelGroup('New Group');
        core.conversations.setChannelGroup(conversation.channel.id, id);
        this.$emit('create-and-rename', id);
      }
    }
  });
</script>

<style>
  .channel-group-header {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 4px 8px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.8;
    user-select: none;
  }
  .channel-group-header:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.05);
  }
  .channel-group-chevron {
    transition: transform 0.15s;
    margin-right: 4px;
    flex-shrink: 0;
  }
  .channel-group-chevron.expanded {
    transform: rotate(90deg);
  }
  .channel-group-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .channel-group-rename-input {
    flex: 1;
    font-size: inherit;
    font-weight: inherit;
    padding: 0 2px;
    border: 1px solid rgba(0, 0, 0, 0.3);
    border-radius: 3px;
    background: transparent;
    color: inherit;
    min-width: 0;
  }
  .channel-group-delete {
    opacity: 0;
    margin-left: 4px;
    flex-shrink: 0;
    color: var(--bs-danger, #dc3545);
  }
  .channel-group-header:hover .channel-group-delete {
    opacity: 0.7;
  }
  .channel-group-delete:hover {
    opacity: 1 !important;
  }
  .channel-group-list {
    padding-left: 8px;
  }
</style>

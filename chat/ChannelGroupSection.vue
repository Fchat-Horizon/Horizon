<template>
  <div class="channel-group" :class="{ collapsed: group.collapsed }">
    <div
      class="channel-group-header align-items-center px-2 py-1 fw-semibold user-select-none"
      :data-group-id="group.id"
      @click="toggleCollapse"
    >
      <span
        class="fas fa-fw fa-chevron-right channel-group-chevron flex-shrink-0 me-1"
        :class="{ expanded: !group.collapsed }"
      ></span>
      <span
        v-if="!renaming"
        class="flex-fill text-truncate"
        @dblclick.stop="startRename"
        >{{ group.name }}</span
      >
      <input
        v-else
        ref="renameInput"
        class="form-control form-control-sm channel-group-rename-input flex-fill bg-transparent py-0 px-1"
        v-model="renameValue"
        @keydown.enter.prevent="commitRename"
        @keydown.esc.prevent="cancelRename"
        @blur="commitRename"
        @click.stop
      />
      <span
        v-if="shouldShowCollapsedNotificationBadge()"
        class="badge rounded-pill channel-group-badge flex-shrink-0 me-1"
        :class="collapsedUnreadClass"
        >{{ collapsedUnreadCount }}</span
      >
      <button
        type="button"
        class="btn btn-link link-danger p-0 ms-1 flex-shrink-0 channel-group-delete"
        @click.stop="deleteGroup"
        :aria-label="l('channel.group.delete')"
      >
        <span class="fas fa-fw fa-trash"></span>
      </button>
    </div>
    <div
      v-if="group.collapsed && activeConversation"
      class="list-group conversation-nav channel-group-list"
    >
      <a
        href="#"
        @click.prevent="activeConversation.show()"
        :class="getClasses(activeConversation)"
        class="list-group-item list-group-item-action item-channel"
        :data-channel-id="activeConversation.channel.id"
        @click.middle.prevent.stop="activeConversation.close()"
      >
        <span class="name">{{ activeConversation.name }}</span>
        <span class="conversation-actions">
          <span
            class="fas fa-times leave"
            @click.stop="activeConversation.close()"
            :aria-label="l('chat.closeTab')"
          ></span>
        </span>
      </a>
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
            role="button"
          ></span>
          <span
            class="fas fa-thumbtack pin pin-toggle pinned"
            @click="unpinConversation(conversation)"
            :aria-label="l('chat.pin.remove')"
            role="button"
          >
          </span>
          <span
            class="fas fa-times leave"
            @click.stop="conversation.close()"
            :aria-label="l('chat.closeTab')"
            role="button"
          ></span>
        </span>
      </a>
    </div>
  </div>
</template>

<script lang="ts">
  import Sortable from 'sortablejs'; // tslint:disable-line:no-require-imports
  import Vue, { PropType } from 'vue';
  import core from './core';
  import {
    endChannelDragging,
    setActiveDropZone,
    startChannelDragging
  } from './channelDragDropHighlight';
  import { Conversation } from './interfaces';
  import l from './localize';
  import { Dialog } from '../helpers/dialog';

  const unreadClasses = {
    [Conversation.UnreadState.None]: '',
    [Conversation.UnreadState.Mention]: 'list-group-item-warning',
    [Conversation.UnreadState.Unread]: 'list-group-item-danger'
  };

  export default Vue.extend({
    name: 'ChannelGroupSection',
    props: {
      group: {
        type: Object as PropType<Conversation.ChannelGroup>,
        required: true as const
      },
      conversations: {
        type: Array as PropType<Conversation.ChannelConversation[]>,
        required: true as const
      },
      allGroups: {
        type: Array as PropType<Conversation.ChannelGroup[]>,
        required: true as const
      },
      startEditing: { type: Boolean, default: false }
    },
    data() {
      return {
        l,
        renaming: false,
        renameValue: ''
      };
    },
    computed: {
      activeConversation(): Conversation.ChannelConversation | null {
        return (
          this.conversations.find(
            c => c === core.conversations.selectedConversation
          ) ?? null
        );
      },
      collapsedUnreadCount(): number {
        return this.conversations.reduce((sum, c) => sum + c.unreadCount, 0);
      },
      collapsedUnreadClass(): string {
        const hasMention = this.conversations.some(
          c => c.unread === Conversation.UnreadState.Mention
        );
        return hasMention ? 'text-bg-danger' : 'text-bg-warning';
      }
    },
    watch: {
      startEditing(val: boolean) {
        if (val) {
          this.$nextTick(() => {
            this.startRename();
            this.$emit('editing-started');
          });
        }
      }
    },
    mounted() {
      if (this.startEditing) {
        this.$nextTick(() => {
          this.startRename();
          this.$emit('editing-started');
        });
      }
      Sortable.create(<HTMLElement>this.$refs['channelList'], {
        group: { name: 'channels', pull: true, put: ['channels'] },
        animation: 50,
        fallbackTolerance: 5,
        onStart: () => startChannelDragging(),
        onMove: (e: any) => setActiveDropZone(e.to as HTMLElement | undefined),
        onAdd: (e: Sortable.SortableEvent) => {
          const channelId = (e.item as HTMLElement).dataset?.channelId;
          if (!channelId) return;
          core.conversations.setChannelGroup(channelId, this.group.id);

          const allConvs = core.conversations.channelConversations;
          const draggedConv = allConvs.find(c => c.channel.id === channelId);
          if (!draggedConv) return;

          const groupConvs = allConvs.filter(
            c =>
              core.conversations.channelGroupAssignments[c.channel.id] ===
              this.group.id
          );
          const othersInGroup = groupConvs.filter(c => c !== draggedConv);
          if (othersInGroup.length === 0) return;

          const targetNewIndex = e.newIndex ?? 0;
          const draggedAbsIdx = allConvs.indexOf(draggedConv);
          let targetAbsIndex: number;

          if (targetNewIndex >= groupConvs.length - 1) {
            const lastOther = othersInGroup[othersInGroup.length - 1];
            const lastOtherAbsIdx = allConvs.indexOf(lastOther);
            targetAbsIndex =
              lastOtherAbsIdx - (draggedAbsIdx < lastOtherAbsIdx ? 1 : 0) + 1;
          } else {
            const nextInGroup = othersInGroup[targetNewIndex];
            const nextAbsIdx = allConvs.indexOf(nextInGroup);
            targetAbsIndex = nextAbsIdx - (draggedAbsIdx < nextAbsIdx ? 1 : 0);
          }

          void draggedConv.sort(targetAbsIndex);
        },
        onRemove: (e: Sortable.SortableEvent) => {
          const destGroupId = (e.to as HTMLElement).dataset?.groupId;
          if (!destGroupId) {
            const channelId = (e.item as HTMLElement).dataset?.channelId;
            if (channelId) core.conversations.setChannelGroup(channelId, null);
          }
        },
        onEnd: async (e: Sortable.SortableEvent) => {
          endChannelDragging();
          if (e.to !== e.from || e.oldIndex === e.newIndex) return;
          const conv = this.conversations[e.oldIndex!];
          if (!conv) return;
          const targetConv = this.conversations[e.newIndex!];
          const newAbsIndex = targetConv
            ? core.conversations.channelConversations.indexOf(targetConv)
            : core.conversations.channelConversations.length - 1;
          void conv.sort(newAbsIndex);
        }
      });
    },
    methods: {
      toggleCollapse() {
        this.group.collapsed = !this.group.collapsed;
        void core.conversations.saveChannelGroups();
      },
      startRename() {
        this.renameValue = this.group.name;
        this.renaming = true;
        this.$nextTick(() => {
          (<HTMLInputElement>this.$refs['renameInput'])?.focus();
        });
      },
      commitRename() {
        if (!this.renaming) return;
        this.renaming = false;
        const name = this.renameValue.trim();
        if (name) core.conversations.renameChannelGroup(this.group.id, name);
      },
      cancelRename() {
        this.renaming = false;
      },
      deleteGroup(e: MouseEvent) {
        if (
          e.getModifierState('Shift') ||
          this.group.channels.length < 1 ||
          Dialog.confirmDialog(
            l('channel.group.delete.confirm', { name: this.group.name || '' })
          )
        ) {
          core.conversations.deleteChannelGroup(this.group.id);
        }
      },
      unpinConversation(conversation: Conversation.ChannelConversation) {
        core.conversations.setChannelGroup(conversation.channel.id, null);
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
      shouldShowCollapsedNotificationBadge(): boolean {
        return (
          this.group.collapsed &&
          this.collapsedUnreadCount > 0 &&
          core.state.generalSettings
            ?.horizonShowWindowAndChatNotificationBadge !== false
        );
      }
    }
  });
</script>

<style>
  .channel-group:only-child:not(.editing):not(.collapsed) {
    .channel-group-header {
      display: none;
    }
    .channel-group-list .list-group-item.item-channel {
      margin-left: 0px;
    }
  }
  .channel-group-header {
    display: flex;
    cursor: pointer;
    font-size: 0.8rem;
    letter-spacing: 0.05em;
    opacity: 0.8;
  }
  .channel-group-header:hover {
    opacity: 1;
    background: var(--bs-tertiary-bg);
  }
  .channel-group-chevron {
    transition: transform 0.15s;
  }
  .channel-group-chevron.expanded {
    transform: rotate(90deg);
  }
  .channel-group-rename-input {
    min-height: 0;
    line-height: inherit;
    font-size: inherit;
    font-weight: inherit;
    color: inherit;
    min-width: 0;
  }
  .channel-group-badge {
    font-size: 0.7em;
  }
  .channel-group-delete {
    --bs-btn-font-size: inherit;
    opacity: 0;
  }
  .channel-group-header:hover .channel-group-delete {
    opacity: 0.7;
  }
  .channel-group-delete:hover,
  .channel-group-delete:focus-visible {
    opacity: 1 !important;
  }
</style>

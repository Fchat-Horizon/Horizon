<template>
  <div
    v-if="showMenu"
    :style="position"
    style="position: fixed; z-index: 1100"
    ref="menu"
  >
    <custom-context-menu
      id="channelGroupMenu"
      :menu-items="channelMenuItems"
      style="display: block; min-width: 220px; max-width: 350px; z-index: 1100"
    >
      <div class="list-group-item" id="channelGroupMenu-header">
        <span class="fas fa-fw fa-folder" style="margin-right: 3px"></span>
        <span class="userInfo-name">{{ channelGroup?.name }}</span>
      </div>
    </custom-context-menu>
  </div>
</template>

<script lang="ts">
  import { defineComponent } from 'vue';
  import type { Conversation } from './interfaces';
  import type { ContextMenuItemProps } from '@/components/CustomContextMenu.vue';
  import CustomContextMenu from '@/components/CustomContextMenu.vue';
  import l from './localize';
  import { Dialog } from '@/helpers/dialog';
  import core from './core';

  export default defineComponent({
    name: 'ChannelGroupMenu',
    components: {
      CustomContextMenu
    },
    emits: ['open', 'close', 'rename'],
    data() {
      return {
        l,
        showMenu: false,
        position: {} as { left: string; top: string },
        channelGroup: null as Conversation.ChannelGroup | null,
        currentGroupId: null as string | null,
        groups: [] as Conversation.ChannelGroup[]
      };
    },
    computed: {
      channelMenuItems(): ContextMenuItemProps[] {
        const sorted = [...this.groups].sort((a, b) => a.order - b.order);
        const currentIdx = sorted.findIndex(g => g.id === this.currentGroupId);
        const otherGroups = this.groups.filter(
          g => g.id !== this.currentGroupId
        );

        const items: ContextMenuItemProps[] = [
          {
            label: l('channel.group.menu.markRead'),
            iconClass: 'fas fa-fw fa-check-double',
            onClick: () => {
              this.markAsRead();
            }
          },
          {
            label: l('action.rename'),
            iconClass: 'fas fa-fw fa-edit',
            onClick: () => {
              this.renameGroup();
            }
          },
          {
            label: l('action.move.up'),
            iconClass: 'fas fa-fw fa-arrow-up',
            disabled: currentIdx <= 0,
            onClick: () => {
              this.moveUp();
            }
          },
          {
            label: l('action.move.down'),
            iconClass: 'fas fa-fw fa-arrow-down',
            disabled: currentIdx < 0 || currentIdx >= sorted.length - 1,
            onClick: () => {
              this.moveDown();
            }
          },
          ...(otherGroups.length > 1
            ? [
                {
                  label: l('channel.group.menu.merge'),
                  iconClass: 'fas fa-fw fa-compress',
                  children: otherGroups.map(g => ({
                    label: g.name,
                    onClick: () => {
                      this.mergeGroup(g.id);
                    }
                  }))
                }
              ]
            : otherGroups.length === 1
              ? [
                  {
                    label: l(
                      'channel.group.menu.merge.single',
                      otherGroups[0].name
                    ),
                    iconClass: 'fas fa-fw fa-compress',
                    onClick: () => {
                      this.mergeGroup(otherGroups[0].id);
                    }
                  }
                ]
              : []),
          {
            label: l('channel.group.delete'),
            iconClass: 'fas fa-fw fa-trash',
            dangerous: true,
            onClick: () => {
              if (
                (this.channelGroup && this.channelGroup?.channels.length < 1) ||
                Dialog.confirmDialog(
                  l(
                    'channel.group.delete.confirm',
                    this.channelGroup?.name || ''
                  )
                )
              ) {
                core.conversations.deleteChannelGroup(this.channelGroup!.id);
                this.close();
              }
            }
          }
        ];
        return items;
      }
    },
    methods: {
      handleEvent(
        e: MouseEvent,
        group: Conversation.ChannelGroup,
        groups: Conversation.ChannelGroup[]
      ): void {
        this.channelGroup = group;
        this.currentGroupId = group.id;
        this.groups = groups;
        this.position = {
          left: `${e.clientX}px`,
          top: `${e.clientY}px`
        };
        this.showMenu = true;
        this.$emit('open');
        this.$nextTick(() => {
          const menu = this.$refs['menu'] as HTMLElement | undefined;
          if (!menu) return;
          if (
            parseInt(this.position.left, 10) + menu.offsetWidth >
            window.innerWidth
          )
            this.position.left = `${window.innerWidth - menu.offsetWidth - 1}px`;
          if (
            parseInt(this.position.top, 10) + menu.offsetHeight >
            window.innerHeight
          )
            this.position.top = `${window.innerHeight - menu.offsetHeight - 1}px`;
        });
        document.addEventListener('click', this.close, { once: true });
      },
      close(): void {
        if (!this.showMenu) return;
        this.showMenu = false;
        this.$emit('close');
      },
      markAsRead(): void {
        if (!this.channelGroup) return;
        const channels = this.channelGroup.channels;
        core.conversations.channelConversations
          .filter(c => channels.includes(c.channel.id))
          .forEach(c => c.markRead());
        this.close();
      },
      renameGroup(): void {
        this.$emit('rename', this.currentGroupId);
        this.close();
      },
      mergeGroup(targetGroupId: string): void {
        if (!this.channelGroup) return;
        const channels = [...this.channelGroup.channels];
        for (const channelId of channels) {
          core.conversations.setChannelGroup(channelId, targetGroupId);
        }
        core.conversations.deleteChannelGroup(this.channelGroup.id);
        this.close();
      },
      moveUp(): void {
        if (!this.channelGroup) return;
        const sorted = [...this.groups].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex(g => g.id === this.channelGroup!.id);
        if (idx <= 0) return;
        const prev = sorted[idx - 1];
        const tmp = prev.order;
        prev.order = this.channelGroup.order;
        this.channelGroup.order = tmp;
        void core.conversations.saveChannelGroups();
        this.close();
      },
      moveDown(): void {
        if (!this.channelGroup) return;
        const sorted = [...this.groups].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex(g => g.id === this.channelGroup!.id);
        if (idx < 0 || idx >= sorted.length - 1) return;
        const next = sorted[idx + 1];
        const tmp = next.order;
        next.order = this.channelGroup.order;
        this.channelGroup.order = tmp;
        void core.conversations.saveChannelGroups();
        this.close();
      }
    }
  });
</script>

<style lang="scss">
  #channelGroupMenu-header {
    display: flex;
    align-items: center;
    font-size: 1.1em;
    padding: 7px 10px 5px 6px;
    font-weight: bold;
  }

  #channelGroupMenu-header .userInfo-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }
</style>

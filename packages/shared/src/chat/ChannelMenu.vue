<template>
  <div
    v-if="conversation && showMenu"
    :style="position"
    style="position: fixed; z-index: 1100"
    ref="menu"
  >
    <custom-context-menu
      id="channelMenu"
      :menu-items="channelMenuItems"
      style="display: block; min-width: 220px; max-width: 350px; z-index: 1100"
    >
      <div class="list-group-item" id="channelMenu-header">
        <span
          class="fas fa-fw"
          :class="
            conversation.channel.id.startsWith('adh-')
              ? 'fa-hashtag'
              : 'fa-star'
          "
          style="margin-right: 3px"
        ></span>
        <span class="userInfo-name">{{ conversation.name }}</span>
      </div>
    </custom-context-menu>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';
  import { Conversation } from './interfaces';
  import CustomContextMenu, {
    ContextMenuItemProps
  } from '@/components/CustomContextMenu.vue';
  import l from './localize';

  export default Vue.extend({
    name: 'ChannelMenu',
    components: {
      CustomContextMenu
    },
    data() {
      return {
        l,
        showMenu: false,
        position: {} as { left: string; top: string },
        conversation: null as Conversation.ChannelConversation | null,
        groups: [] as Conversation.ChannelGroup[],
        currentGroupId: null as string | null
      };
    },
    computed: {
      channelMenuItems(): ContextMenuItemProps[] {
        const items: ContextMenuItemProps[] = [
          {
            label: this.l('channel.menu.markRead'),
            iconClass: 'fas fa-fw fa-check-double',
            onClick: () => this.markAsRead()
          },
          {
            label: this.l('channel.menu.copyCode'),
            iconClass: 'fas fa-fw fa-copy',
            onClick: () => this.copyCode()
          }
        ];

        const otherGroups = this.groups.filter(
          g => g.id !== this.currentGroupId
        );
        items.push({
          label: this.l('channel.menu.moveTo'),
          iconClass: 'fas fa-fw fa-folder-tree',
          topBorder: true,
          children: [
            {
              label: `${this.l('channel.group.newGroup')}...`,
              iconClass: 'fas fa-fw fa-plus',
              onClick: () => this.createGroup()
            },
            ...(otherGroups.length
              ? otherGroups.map(group => ({
                  label: group.name,
                  iconClass: 'fas fa-fw fa-folder',
                  onClick: () => this.assignToGroup(group.id),
                  topBorder: otherGroups.indexOf(group) === 0
                }))
              : []),
            ...(this.currentGroupId
              ? [
                  {
                    label: this.l('channel.menu.removeFromGroup'),
                    iconClass: 'fas fa-fw fa-border-none',
                    onClick: () => this.assignToGroup(null),
                    topBorder: true,
                    dangerous: true
                  }
                ]
              : [])
          ]
        });

        if (this.currentGroupId) {
          items.push();
        }
        return items;
      }
    },
    methods: {
      handleEvent(
        e: MouseEvent,
        conv: Conversation.ChannelConversation,
        groups: Conversation.ChannelGroup[],
        currentGroupId: string | null
      ): void {
        this.conversation = conv;
        this.groups = groups;
        this.currentGroupId = currentGroupId;
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
        if (this.conversation) this.conversation.markRead();
        this.close();
      },
      copyCode(): void {
        const channel = this.conversation?.channel;
        if (!channel) return;
        const code = channel.id.startsWith('adh-')
          ? `[session=${channel.name}]${channel.id}[/session]`
          : `[channel]${channel.name}[/channel]`;
        navigator.clipboard.writeText(code);
        this.close();
      },
      assignToGroup(groupId: string | null): void {
        if (!this.conversation) return;
        this.$emit('assign', this.conversation.channel.id, groupId);
        this.close();
      },
      createGroup(): void {
        if (!this.conversation) return;
        this.$emit('create-group', this.conversation.channel.id);
        this.close();
      }
    }
  });
</script>

<style lang="scss">
  #channelMenu-header {
    display: flex;
    align-items: center;
    padding: 7px 10px 5px 6px;
    font-weight: bold;
  }

  #channelMenu-header .userInfo-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }
</style>

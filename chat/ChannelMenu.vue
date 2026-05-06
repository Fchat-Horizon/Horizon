<template>
  <div
    class="shadow-sm"
    v-if="conversation && showMenu"
    :style="position"
    style="position: fixed; z-index: 1100"
    ref="menu"
  >
    <div
      id="channelMenu"
      class="list-group bg-solid-text"
      style="display: block; min-width: 220px; z-index: 1100"
    >
      <div class="list-group-item" id="channelMenu-header">
        <span class="fas fa-fw fa-hashtag"></span>
        <span class="userInfo-name">{{ conversation.name }}</span>
      </div>
      <a
        href="#"
        class="list-group-item list-group-item-action"
        @click.prevent="markAsRead"
      >
        <span class="fas fa-fw fa-check-double"></span>
        <span class="action-label">Mark as read</span>
      </a>
      <a
        href="#"
        class="list-group-item list-group-item-action"
        @click.prevent="copyCode"
      >
        <span class="fas fa-fw fa-copy"></span>
        <span class="action-label">Copy channel code</span>
      </a>
      <template v-if="groups.length || currentGroupId">
        <div class="list-group-item channel-menu-divider"></div>
        <a
          v-for="group in otherGroups"
          :key="group.id"
          href="#"
          class="list-group-item list-group-item-action"
          @click.prevent="assignToGroup(group.id)"
        >
          <span class="fas fa-fw fa-folder"></span>
          <span class="action-label"
            >Move to &ldquo;{{ group.name }}&rdquo;</span
          >
        </a>
        <a
          v-if="!currentGroupId"
          href="#"
          class="list-group-item list-group-item-action"
          @click.prevent="createGroup"
        >
          <span class="fas fa-fw fa-folder-plus"></span>
          <span class="action-label">Add to new group</span>
        </a>
        <a
          v-if="currentGroupId"
          href="#"
          class="list-group-item list-group-item-action channel-menu-danger"
          @click.prevent="assignToGroup(null)"
        >
          <span class="fas fa-fw fa-folder-minus"></span>
          <span class="action-label">Remove from group</span>
        </a>
      </template>
      <template v-else>
        <div class="list-group-item channel-menu-divider"></div>
        <a
          href="#"
          class="list-group-item list-group-item-action"
          @click.prevent="createGroup"
        >
          <span class="fas fa-fw fa-folder-plus"></span>
          <span class="action-label">Add to new group</span>
        </a>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';

  export default Vue.extend({
    name: 'ChannelMenu',
    data() {
      return {
        showMenu: false,
        position: {} as { left: string; top: string },
        conversation: null as any,
        groups: [] as any[],
        currentGroupId: null as string | null
      };
    },
    computed: {
      otherGroups(): any[] {
        return (this.groups as any[]).filter(
          (g: any) => g.id !== this.currentGroupId
        );
      }
    },
    methods: {
      handleEvent(
        e: MouseEvent,
        conv: any,
        groups: any[],
        currentGroupId: string | null
      ): void {
        this.conversation = conv;
        this.groups = groups;
        this.currentGroupId = currentGroupId;
        this.position = {
          left: `${(e as MouseEvent).clientX}px`,
          top: `${(e as MouseEvent).clientY}px`
        };
        this.showMenu = true;
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
        this.showMenu = false;
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
        this.$emit('assign', this.conversation.channel.id, groupId);
        this.close();
      },
      createGroup(): void {
        this.$emit('create-group', this.conversation.channel.id);
        this.close();
      }
    }
  });
</script>

<style lang="scss">
  #channelMenu {
    border-radius: 15px;
    max-width: 265px;
  }

  #channelMenu .list-group-item {
    padding: 3px 5px 3px 5px;
  }

  #channelMenu .list-group-item-action {
    font-size: 1.04em;
    border-top-width: 0;
    border-top-style: solid;
    border-color: var(--bs-border-color);
  }

  #channelMenu .list-group-item .fa-fw,
  #channelMenu .list-group-item .action-label {
    margin-left: 0.4rem;
  }

  #channelMenu-header {
    padding: 7px 10px 5px 10px;
    font-size: 1.1em;
    font-weight: bold;
  }

  .channel-menu-divider {
    padding: 0 !important;
    height: 1px;
    background: var(--bs-border-color);
    border: none;
  }

  .channel-menu-danger {
    color: var(--bs-danger, #dc3545);
  }
</style>

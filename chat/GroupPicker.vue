<template>
  <span style="display: inline-block">
    <span
      class="fas fa-folder-open group-picker-trigger"
      :class="{ active: currentGroupId }"
      :aria-label="'Move to group'"
      @mousedown.prevent.stop="toggle"
    ></span>
    <teleport-dropdown v-if="open" :rect="triggerRect" @close="close">
      <div class="group-picker-dropdown" @mousedown.stop>
        <div
          v-for="group in groups"
          :key="group.id"
          class="group-picker-item"
          :class="{ selected: group.id === currentGroupId }"
          @mousedown.prevent="assign(group.id)"
        >
          <span class="fas fa-fw fa-folder"></span> {{ group.name }}
        </div>
        <div class="group-picker-divider" v-if="groups.length"></div>
        <div class="group-picker-item" @mousedown.prevent="createGroup">
          <span class="fas fa-fw fa-plus"></span> New group
        </div>
        <div
          class="group-picker-item danger"
          v-if="currentGroupId"
          @mousedown.prevent="assign(null)"
        >
          <span class="fas fa-fw fa-times"></span> Remove from group
        </div>
      </div>
    </teleport-dropdown>
  </span>
</template>

<script lang="ts">
  import Vue from 'vue';

  const TeleportDropdown = Vue.extend({
    props: { rect: { required: true as const } },
    mounted() {
      document.body.appendChild(this.$el);
      this._outsideHandler = (e: MouseEvent) => {
        if (!(<HTMLElement>this.$el).contains(<Node>e.target))
          this.$emit('close');
      };
      document.addEventListener('mousedown', this._outsideHandler);
    },
    beforeDestroy() {
      document.removeEventListener('mousedown', this._outsideHandler);
      if (this.$el.parentNode) this.$el.parentNode.removeChild(this.$el);
    },
    computed: {
      style(): object {
        const r = this.rect as DOMRect;
        return {
          position: 'fixed',
          top: `${r.bottom + 2}px`,
          left: `${r.left}px`,
          zIndex: 9999
        };
      }
    },
    render(h) {
      return h('div', { style: this.style }, this.$slots.default);
    }
  } as any);

  export default Vue.extend({
    name: 'GroupPicker',
    components: { 'teleport-dropdown': TeleportDropdown },
    props: {
      groups: { required: true as const },
      currentGroupId: { default: null }
    },
    data() {
      return { open: false, triggerRect: null as DOMRect | null };
    },
    methods: {
      toggle() {
        if (this.open) {
          this.open = false;
        } else {
          this.triggerRect = (<HTMLElement>this.$el)
            .querySelector('.group-picker-trigger')!
            .getBoundingClientRect();
          this.open = true;
        }
      },
      close() {
        this.open = false;
      },
      assign(groupId: string | null) {
        this.open = false;
        this.$emit('assign', groupId);
      },
      createGroup() {
        this.open = false;
        this.$emit('create');
      }
    }
  });
</script>

<style>
  .group-picker-trigger {
    cursor: pointer;
    opacity: 0.5;
  }
  .group-picker-trigger:hover,
  .group-picker-trigger.active {
    opacity: 1;
  }
  .group-picker-dropdown {
    background: var(--bs-body-bg, #fff);
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 4px;
    min-width: 160px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    padding: 4px 0;
  }
  .group-picker-item {
    padding: 5px 12px;
    cursor: pointer;
    white-space: nowrap;
    font-size: 0.875rem;
  }
  .group-picker-item:hover {
    background: rgba(0, 0, 0, 0.08);
  }
  .group-picker-item.selected {
    font-weight: bold;
  }
  .group-picker-item.danger {
    color: var(--bs-danger, #dc3545);
  }
  .group-picker-divider {
    height: 1px;
    background: rgba(0, 0, 0, 0.1);
    margin: 4px 0;
  }
</style>

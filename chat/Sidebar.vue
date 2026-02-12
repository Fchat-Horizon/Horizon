<template>
  <div class="sidebar-wrapper" :class="{ open: expanded }">
    <div :class="'sidebar sidebar-' + (right ? 'right' : 'left')">
      <button
        @click="expanded = !expanded"
        class="btn btn-secondary btn-xs expander"
        :aria-label="label"
      >
        <span :class="'fa fa-fw fa-rotate-270 ' + icon" v-if="right"></span>
        <span
          class="fa"
          :class="{ 'fa-chevron-down': !expanded, 'fa-chevron-up': expanded }"
        ></span>
        <span :class="'fa fa-fw fa-rotate-90 ' + icon" v-if="!right"></span>
      </button>
      <div class="body" :style="{ width: bodyWidth + 'px' }" ref="body">
        <slot></slot>
        <div
          class="resize-handle"
          :class="right ? 'resize-handle-left' : 'resize-handle-right'"
          @mousedown="startResize"
        ></div>
      </div>
    </div>
    <div class="modal-backdrop show" @click="expanded = false"></div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';

  export default Vue.extend({
    props: {
      right: {},
      label: {},
      icon: { required: true as const },
      open: { default: false }
    },
    data() {
      return {
        expanded: this.open as boolean,
        bodyWidth: 0,
        bodyElement: undefined as any as HTMLElement,
        isResizing: false,
        startX: 0,
        startWidth: 0
      };
    },
    watch: {
      open(): void {
        this.expanded = this.open as boolean;
      }
    },
    mounted(): void {
      this.bodyElement = this.$refs.body as HTMLElement;
      this.bodyWidth = this.bodyElement.offsetWidth;
    },
    methods: {
      startResize(e: MouseEvent): void {
        this.isResizing = true;
        this.startX = e.clientX;
        this.startWidth = this.bodyWidth;
        document.addEventListener('mousemove', this.onResize);
        document.addEventListener('mouseup', this.stopResize);
        e.preventDefault();
      },
      onResize(e: MouseEvent): void {
        if (!this.isResizing) return;
        const delta = e.clientX - this.startX;
        //Our widths are clamped by CSS values. in stopResize we then set our variable value to the effectize size.
        //This is because if those values don't match, you might run into problems where it tries to resize 'outside' its boundaries, and the variable changes but the actual DOM element is clamped.
        this.bodyWidth = this.right
          ? this.startWidth - delta
          : this.startWidth + delta;
      },
      stopResize(): void {
        this.isResizing = false;
        document.removeEventListener('mousemove', this.onResize);
        document.removeEventListener('mouseup', this.stopResize);
        this.bodyWidth = this.bodyElement.offsetWidth;
      }
    }
  });
</script>

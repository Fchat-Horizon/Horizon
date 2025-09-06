<template>
  <div :class="wrapClass" @focusout="blur">
    <slot name="split"></slot>
    <a
      :class="linkClass"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      @click.prevent="isOpen = !isOpen"
      href="#"
      :style="linkStyle"
      role="button"
      tabindex="-1"
      ref="button"
    >
      <i :class="iconClass" v-if="!!iconClass"></i>
      <slot name="title">{{ title }}</slot>
    </a>
    <div
      class="dropdown-menu"
      ref="menu"
      @mousedown.prevent.stop
      @click.prevent.stop="menuClick()"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';
  import { Component, Prop, Watch } from '@f-list/vue-ts';

  @Component
  export default class Dropdown extends Vue {
    isOpen = false;
    @Prop({ default: 'btn btn-secondary dropdown-toggle' })
    readonly linkClass!: string;
    @Prop({ default: 'dropdown' })
    readonly wrapClass!: string;
    @Prop
    readonly iconClass?: string;
    @Prop
    readonly keepOpen?: boolean;
    @Prop
    readonly title?: string;
    @Prop({ default: 'width:100%;text-align:left;align-items:center' })
    readonly linkStyle!: string;

    @Watch('isOpen')
    onToggle(): void {
      const menu = this.$refs['menu'] as HTMLElement;
      const button = this.$refs['button'] as HTMLElement;
      if (!this.isOpen) {
        menu.style.cssText = '';
        return;
      }
      menu.style.display = 'block';
      const offset = menu.getBoundingClientRect();
      menu.style.position = 'fixed';
      menu.style.minWidth = `${button.clientWidth}px`;
      menu.style.left =
        offset.right < window.innerWidth
          ? `${offset.left}px`
          : `${window.innerWidth - offset.width}px`;
      menu.style.top =
        offset.bottom < window.innerHeight
          ? `${offset.top}px`
          : `${offset.top - offset.height - (<HTMLElement>this.$el).offsetHeight}px`;
    }

    blur(event: FocusEvent): void {
      let elm = <HTMLElement | null>event.relatedTarget;
      while (elm) {
        if (elm === this.$refs['menu']) return;
        elm = elm.parentElement;
      }
      this.isOpen = false;
    }

    menuClick(): void {
      if (!this.keepOpen) this.isOpen = false;
    }
  }
</script>

<template>
  <div class="card bg-light">
    <div class="card-header" @click="toggle()" style="cursor: pointer" :class="headerClass">
      <h4>{{ title }} <span class="fas" :class="'fa-chevron-' + (collapsed ? 'down' : 'up')"></span></h4>
    </div>
    <div :style="style" style="overflow: hidden">
      <div class="card-body" ref="content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';
  import { Component, Prop } from '@f-list/vue-ts';

  @Component
  export default class Collapse extends Vue {
    @Prop({ required: true })
    readonly title!: string;
    @Prop
    readonly headerClass?: string;
    collapsed = true;
    timeout = 0;
    style = { height: <string | undefined>'0', transition: 'height .2s' };

    toggle(state?: boolean) {
      clearTimeout(this.timeout);
      this.collapsed = state !== undefined ? state : !this.collapsed;
      this.$emit(this.collapsed ? 'close' : 'open');
      if (this.collapsed) {
        this.style.transition = 'initial';
        this.style.height = `${(<HTMLElement>this.$refs['content']).scrollHeight}px`;
        setTimeout(() => {
          this.style.transition = 'height .2s';
          this.style.height = '0';
        }, 0);
      } else {
        this.style.height = `${(<HTMLElement>this.$refs['content']).scrollHeight}px`;
        this.timeout = window.setTimeout(() => (this.style.height = undefined), 200);
      }
    }
  }
</script>

<template>
  <div class="sidebar-wrapper" :class="{ open: expanded }">
    <div :class="'sidebar sidebar-' + (right ? 'right' : 'left')">
      <button @click="expanded = !expanded" class="btn btn-secondary btn-xs expander" :aria-label="label">
        <span :class="'fa fa-fw fa-rotate-270 ' + icon" v-if="right"></span>
        <span class="fa" :class="{ 'fa-chevron-down': !expanded, 'fa-chevron-up': expanded }"></span>
        <span :class="'fa fa-fw fa-rotate-90 ' + icon" v-if="!right"></span>
      </button>
      <div class="body">
        <slot></slot>
      </div>
    </div>
    <div class="modal-backdrop show" @click="expanded = false"></div>
  </div>
</template>

<script lang="ts">
  import { Component, Prop, Watch } from '@f-list/vue-ts';
  import Vue from 'vue';

  @Component
  export default class Sidebar extends Vue {
    @Prop
    readonly right?: true;
    @Prop
    readonly label?: string;
    @Prop({ required: true })
    readonly icon!: string;
    @Prop({ default: false })
    readonly open!: boolean;
    expanded = this.open;

    @Watch('open')
    watchOpen(): void {
      this.expanded = this.open;
    }
  }
</script>

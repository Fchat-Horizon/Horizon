<template>
  <a
    :href="`${Utils.siteDomain}c/${character}`"
    target="_blank"
    @mouseover.prevent="show()"
    @mouseenter.prevent="show()"
    @mouseleave.prevent="dismiss()"
    @click.middle.prevent.stop="toggleStickyness()"
    @click.right.passive="dismiss(true)"
    @click.left.passive="dismiss(true)"
    ><img :src="getAvatarUrl()" class="character-avatar icon" :title="character" :alt="character" v-once
  /></a>
</template>

<script lang="ts">
  import { Component, Hook, Prop } from '@f-list/vue-ts';
  import Vue from 'vue';
  import { EventBus } from '../chat/preview/event-bus';
  import * as Utils from '../site/utils';
  import { characterImage } from '../chat/common';

  @Component
  export default class IconView extends Vue {
    Utils = Utils;

    @Prop({ required: true })
    readonly character!: string;

    @Hook('mounted')
    mounted(): void {
      // do nothing
    }

    @Hook('beforeDestroy')
    beforeDestroy(): void {
      this.dismiss();
    }

    @Hook('deactivated')
    deactivate(): void {
      this.dismiss();
    }

    getCharacterUrl(): string {
      return `flist-character://${this.character}`;
    }

    getAvatarUrl(): string {
      return characterImage(this.character);
    }

    dismiss(force: boolean = false): void {
      // if (!this.preview) {
      //   return;
      // }

      EventBus.$emit('imagepreview-dismiss', { url: this.getCharacterUrl(), force });
    }

    show(): void {
      // if (!this.preview) {
      //   return;
      // }

      EventBus.$emit('imagepreview-show', { url: this.getCharacterUrl() });
    }

    toggleStickyness(): void {
      // if (!this.preview) {
      //   return;
      // }

      EventBus.$emit('imagepreview-toggle-stickyness', { url: this.getCharacterUrl() });
    }
  }
</script>

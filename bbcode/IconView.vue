<template>
  <a
    :href="`${Utils.siteDomain}c/${character.name}`"
    target="_blank"
    v-bind:character.prop="character"
    @mouseover.prevent="show()"
    @mouseenter.prevent="show()"
    @mouseleave.prevent="dismiss()"
    @click.middle.prevent.stop="toggleStickyness()"
    @click.right.passive="dismiss(true)"
    @click.left.passive="dismiss(true)"
    ><img
      :src="characterImage(character.name, useOriginalAvatar)"
      class="character-avatar icon"
      id="img"
      :title="character.name"
      :alt="character.name"
      @error="onImageError"
  /></a>
</template>

<script lang="ts">
  import Vue from 'vue';
  import { EventBus } from '../chat/preview/event-bus';
  import * as Utils from '../site/utils';
  import { characterImage } from '../chat/common';
  import { Character } from '../fchat';

  export default Vue.extend({
    props: {
      character: { required: true as const },
      useOriginalAvatar: { default: false }
    },
    data() {
      return {
        Utils: Utils,
        characterImage: characterImage
      };
    },
    mounted(): void {
      // do nothing
    },
    beforeDestroy(): void {
      this.dismiss();
    },
    deactivated(): void {
      this.dismiss();
    },
    methods: {
      getCharacterUrl(): string {
        return `flist-character://${(this.character as Character).name}`;
      },
      dismiss(force: boolean = false): void {
        EventBus.$emit('imagepreview-dismiss', {
          url: this.getCharacterUrl(),
          force
        });
      },
      show(): void {
        EventBus.$emit('imagepreview-show', { url: this.getCharacterUrl() });
      },
      toggleStickyness(): void {
        EventBus.$emit('imagepreview-toggle-stickyness', {
          url: this.getCharacterUrl()
        });
      },
      onImageError(): void {
        (this.character as Character).overrides.avatarUrl = undefined;
      }
    }
  });
</script>

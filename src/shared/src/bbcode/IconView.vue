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
  import type { PropType } from 'vue';
  import { defineComponent } from 'vue';
  import { EventBus } from '@/chat/preview/event-bus';
  import * as Utils from '@/site/utils';
  import { characterImage, normalizeCharacterName } from '@/chat/common';
  import type { Character } from '@/fchat';

  export default defineComponent({
    props: {
      character: { type: Object as PropType<Character>, required: true },
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
    beforeUnmount(): void {
      this.dismiss();
    },
    deactivated(): void {
      this.dismiss();
    },
    methods: {
      getCharacterUrl(): string {
        return `flist-character://${normalizeCharacterName(this.character.name)}`;
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
        // eslint-disable-next-line vue/no-mutating-props -- shared character object; intended override reset
        this.character.overrides.avatarUrl = undefined;
      }
    }
  });
</script>

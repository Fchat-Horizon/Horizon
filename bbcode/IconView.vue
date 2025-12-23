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
  import {
    defineComponent,
    onBeforeUnmount,
    onDeactivated,
    PropType
  } from 'vue';
  import { EventBus } from '../chat/preview/event-bus';
  import * as Utils from '../site/utils';
  import { characterImage } from '../chat/common';
  import { Character } from '../fchat';

  export default defineComponent({
    name: 'IconView',
    props: {
      character: {
        type: Object as PropType<Character>,
        required: true
      },
      useOriginalAvatar: {
        type: Boolean,
        default: false
      }
    },
    setup(props) {
      const getCharacterUrl = () => `flist-character://${props.character.name}`;

      const dismiss = (force = false) => {
        // if (!this.preview) {
        //   return;
        // }

        EventBus.$emit('imagepreview-dismiss', {
          url: getCharacterUrl(),
          force
        });
      };

      const show = () => {
        // if (!this.preview) {
        //   return;
        // }

        EventBus.$emit('imagepreview-show', { url: getCharacterUrl() });
      };

      const toggleStickyness = () => {
        // if (!this.preview) {
        //   return;
        // }

        EventBus.$emit('imagepreview-toggle-stickyness', {
          url: getCharacterUrl()
        });
      };

      const onImageError = () => {
        props.character.overrides.avatarUrl = undefined;
      };

      onBeforeUnmount(() => {
        dismiss();
      });

      onDeactivated(() => {
        dismiss();
      });

      return {
        Utils,
        characterImage,
        dismiss,
        show,
        toggleStickyness,
        onImageError
      };
    }
  });
</script>

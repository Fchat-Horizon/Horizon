<template>
  <span :class="linkClasses" v-if="character">
    <slot v-if="deleted">{{ l('character.deletedLabel') }} {{ name }}</slot>
    <a :href="characterUrl" class="characterLinkLink" v-else :target="target"
      ><slot>{{ name }}</slot></a
    >
  </span>
</template>

<script lang="ts">
  import { computed, defineComponent, PropType } from 'vue';
  import { SimpleCharacter } from '../interfaces';
  import * as Utils from '../site/utils';
  import l from '../chat/localize';

  export default defineComponent({
    name: 'CharacterLink',
    props: {
      character: {
        type: [Object, String] as PropType<SimpleCharacter | string>,
        required: true
      },
      target: {
        type: String,
        default: '_blank'
      }
    },
    setup(props) {
      const name = computed(() =>
        typeof props.character === 'string'
          ? props.character
          : props.character.name
      );

      const deleted = computed(() =>
        typeof props.character === 'string' ? false : props.character.deleted
      );

      const linkClasses = computed(() =>
        deleted.value ? 'characterLinkDeleted' : 'characterLink'
      );

      const characterUrl = computed(() => Utils.characterURL(name.value));

      return {
        l,
        name,
        deleted,
        linkClasses,
        characterUrl
      };
    }
  });
</script>

<template>
  <span :class="linkClasses" v-if="character">
    <slot v-if="deleted">{{ l('character.deletedLabel') }} {{ name }}</slot>
    <a :href="characterUrl" class="characterLinkLink" v-else :target="target"
      ><slot>{{ name }}</slot></a
    >
  </span>
</template>

<script lang="ts">
  import Vue from 'vue';
  import { SimpleCharacter } from '../interfaces';
  import * as Utils from '../site/utils';
  import l from '../chat/localize';

  export default Vue.extend({
    props: {
      character: { required: true as const },
      target: { default: '_blank' }
    },
    data() {
      return {
        l: l
      };
    },
    computed: {
      deleted(): boolean {
        return typeof this.character === 'string'
          ? false
          : (this.character as SimpleCharacter).deleted;
      },
      linkClasses(): string {
        return this.deleted ? 'characterLinkDeleted' : 'characterLink';
      },
      characterUrl(): string {
        return Utils.characterURL(this.name);
      },
      name(): string {
        return typeof this.character === 'string'
          ? this.character
          : (this.character as SimpleCharacter).name;
      }
    }
  });
</script>

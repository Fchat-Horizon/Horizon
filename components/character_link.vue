<template>
  <span :class="linkClasses" v-if="character">
    <slot v-if="deleted">{{ l('character.deletedLabel') }} {{ name }}</slot>
    <a :href="characterUrl" class="characterLinkLink" v-else :target="target"
      ><slot>{{ name }}</slot></a
    >
  </span>
</template>

<script lang="ts">
  import { Component, Prop } from '@f-list/vue-ts';
  import Vue from 'vue';
  import { SimpleCharacter } from '../interfaces';
  import * as Utils from '../site/utils';
  import l from '../chat/localize';

  @Component
  export default class CharacterLink extends Vue {
    l = l;
    @Prop({ required: true })
    readonly character!: SimpleCharacter | string;
    @Prop({ default: '_blank' })
    readonly target!: string;

    get deleted(): boolean {
      return typeof this.character === 'string'
        ? false
        : this.character.deleted;
    }

    get linkClasses(): string {
      return this.deleted ? 'characterLinkDeleted' : 'characterLink';
    }

    get characterUrl(): string {
      return Utils.characterURL(this.name);
    }

    get name(): string {
      return typeof this.character === 'string'
        ? this.character
        : this.character.name;
    }
  }
</script>

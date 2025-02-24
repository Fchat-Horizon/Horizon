<template>
  <div class="contact-method" :title="infotag.name">
    <span v-if="contactLink" class="contact-link">
      <a :href="contactLink" target="_blank" rel="nofollow noreferrer noopener">
        <img :src="iconUrl" /><span class="contact-value">{{ value }}</span>
      </a>
    </span>
    <span v-else>
      <img :src="iconUrl" /><span class="contact-value">{{ value }}</span>
    </span>
  </div>
</template>

<script lang="ts">
  import { Component, Prop } from '@f-list/vue-ts';
  import Vue from 'vue';
  import { CharacterInfotag, Infotag } from '../../interfaces';
  import { formatContactLink, formatContactValue } from './contact_utils';
  import { methods } from './data_store';

  @Component
  export default class ContactMethodView extends Vue {
    @Prop({ required: true })
    readonly infotag!: Infotag;
    @Prop({ required: true })
    readonly data!: CharacterInfotag;

    get iconUrl(): string {
      return methods.contactMethodIconUrl(this.infotag.name);
    }

    get value(): string {
      return formatContactValue(this.infotag, this.data.string!);
    }

    get contactLink(): string | undefined {
      return formatContactLink(this.infotag, this.data.string!);
    }
  }
</script>

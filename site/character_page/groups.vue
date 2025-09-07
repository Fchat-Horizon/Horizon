<template>
  <div class="character-groups">
    <div v-show="loading" class="alert alert-info">
      {{ l('profile.groups.loading') }}
    </div>
    <template v-if="!loading">
      <div class="character-group" v-for="group in groups" :key="group.id">
        <a :href="groupUrl(group)"
          >{{ group.title }}: {{ group.threadCount }}</a
        >
      </div>
    </template>
    <div v-if="!loading && !groups.length" class="alert alert-info">
      {{ l('profile.groups.none') }}
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Prop } from '@f-list/vue-ts';
  import Vue from 'vue';
  import * as Utils from '../utils';
  import { methods } from './data_store';
  import { Character, CharacterGroup } from './interfaces';
  import core from '../../chat/core';
  import l from '../../chat/localize';

  @Component
  export default class GroupsView extends Vue {
    @Prop({ required: true })
    private readonly character!: Character;
    private shown = false;
    groups: CharacterGroup[] = [];
    loading = true;
    error = '';
    l = l;

    groupUrl(group: CharacterGroup): string {
      return `${Utils.staticDomain}threads/group/${group.id}`;
    }

    async show(): Promise<void> {
      if (this.shown) return;
      try {
        this.error = '';
        this.shown = true;
        this.loading = true;
        this.groups = await this.resolveGroups();
      } catch (e) {
        this.shown = false;
        if (Utils.isJSONError(e)) this.error = <string>e.response.data.error;
        Utils.ajaxError(e, l('profile.groups.unableLoad'));
      }
      this.loading = false;
    }

    async resolveGroups(): Promise<CharacterGroup[]> {
      const c = await core.cache.profileCache.get(
        this.character.character.name
      );

      if (c && c.meta && c.meta.groups) {
        return c.meta.groups;
      }

      return methods.groupsGet(this.character.character.id);
    }
  }
</script>

<template>
  <div id="character-friends">
    <div v-show="loading" class="alert alert-info">
      {{ l('profile.friends.loading') }}
    </div>
    <template v-if="!loading">
      <div class="character-friend" v-for="friend in friends" :key="friend.id">
        <a :href="characterUrl(friend.name)"
          ><img
            class="character-avatar"
            :src="avatarUrl(friend.name)"
            :title="friend.name"
        /></a>
      </div>
    </template>
    <div v-if="!loading && !friends.length" class="alert alert-info">
      {{ l('profile.friends.none') }}
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Prop } from '@f-list/vue-ts';
  import Vue from 'vue';
  import * as Utils from '../utils';
  import { methods } from './data_store';
  import { Character } from './interfaces';
  import { SimpleCharacter } from '../../interfaces';
  import core from '../../chat/core';
  import l from '../../chat/localize';

  @Component
  export default class FriendsView extends Vue {
    @Prop({ required: true })
    private readonly character!: Character;
    private shown = false;
    friends: SimpleCharacter[] = [];
    loading = true;
    error = '';
    l = l;

    avatarUrl = Utils.avatarURL;
    characterUrl = Utils.characterURL;

    async show(): Promise<void> {
      if (this.shown) return;
      try {
        this.error = '';
        this.shown = true;
        this.loading = true;
        this.friends = await this.resolveFriends();
      } catch (e) {
        this.shown = false;
        if (Utils.isJSONError(e)) this.error = <string>e.response.data.error;
        Utils.ajaxError(e, l('profile.friends.unableLoad'));
      }
      this.loading = false;
    }

    async resolveFriends(): Promise<SimpleCharacter[]> {
      const c = await core.cache.profileCache.get(
        this.character.character.name
      );

      if (c && c.meta && c.meta.friends) {
        return c.meta.friends;
      }

      return methods.friendsGet(this.character.character.id);
    }
  }
</script>

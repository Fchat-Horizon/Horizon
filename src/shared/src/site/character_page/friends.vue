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

<script setup lang="ts">
  import { ref } from 'vue';
  import * as Utils from '../utils';
  import { methods } from './data_store';
  import type { Character } from './interfaces';
  import type { SimpleCharacter } from '@/interfaces';
  import core from '@/chat/core';
  import l from '@/chat/localize';

  const props = defineProps<{
    character: Character;
  }>();

  const shown = ref(false);
  const friends = ref<SimpleCharacter[]>([]);
  const loading = ref(true);
  const error = ref('');

  const avatarUrl = Utils.avatarURL;
  const characterUrl = Utils.characterURL;

  async function resolveFriends(): Promise<SimpleCharacter[]> {
    const c = await core.cache.profileCache.get(props.character.character.name);

    if (c && c.meta && c.meta.friends) {
      return c.meta.friends;
    }

    return methods.friendsGet(props.character.character.id);
  }

  async function show(): Promise<void> {
    if (shown.value) return;
    try {
      error.value = '';
      shown.value = true;
      loading.value = true;
      friends.value = await resolveFriends();
    } catch (e) {
      shown.value = false;
      if (Utils.isJSONError(e)) error.value = <string>e.response.data.error;
      Utils.ajaxError(e, l('profile.friends.unableLoad'));
    }
    loading.value = false;
  }

  defineExpose({
    show
  });
</script>

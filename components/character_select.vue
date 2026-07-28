<template>
  <filterable-select
    class="character-select-component"
    v-model="selectedObj"
    :options="characters"
    :filterFunc="filterCharacter"
    :placeholder="l('filter')"
  >
    <template slot-scope="s">
      <template v-if="s.option">
        <img
          :src="avatarUrl(s.option.name)"
          class="character-select-avatar"
          loading="lazy"
          @error="hideBrokenAvatar"
        />
        <span class="text-truncate">{{ s.option.name }}</span>
      </template>
      <template v-else>
        <span class="text-truncate">{{ l('friends.character') }}</span>
      </template>
    </template>
  </filterable-select>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { SimpleCharacter } from '../interfaces';
  import * as Utils from '../site/utils';
  import FilterableSelect from './FilterableSelect.vue';
  import l from '../chat/localize';

  const props = defineProps<{
    // Maintaining Vue 2 backwards-compat, remove after full Vue 3 migration
    value?: number;

    // Forward-compat for Vue 3
    modelValue?: number;
  }>();

  const emit = defineEmits<{
    // Maintaining Vue 2 backwards-compat, remove after full Vue 3 migration
    (e: 'input', value: number): void;

    // Forward-compat for Vue 3
    (e: 'update:modelValue', value: number): void;
  }>();

  const characters = computed<SimpleCharacter[]>(() => Utils.characters);
  const selectedObj = computed<SimpleCharacter | undefined>({
    get() {
      const id =
        props.modelValue !== undefined ? props.modelValue : props.value;
      return characters.value.find(character => character.id === id);
    },
    set(character) {
      if (character === undefined) return;

      // Maintaining Vue 2 backwards-compat, remove after full Vue 3 migration
      emit('input', character.id);

      // Forward-compat for Vue 3
      emit('update:modelValue', character.id);
    }
  });

  const filterCharacter = (
    filter: RegExp,
    character: SimpleCharacter
  ): boolean => {
    return filter.test(character.name);
  };

  const avatarUrl = Utils.avatarURL;

  const hideBrokenAvatar = (evt: Event): void => {
    (evt.target as HTMLImageElement).style.display = 'none';
  };
</script>

<style lang="scss">
  .character-select-avatar {
    width: 20px;
    height: 20px;
    border-radius: 3px;
    margin-right: 6px;
    object-fit: cover;
  }

  .input-group > .character-select-component {
    position: relative;
    flex: 1 1 auto;
    width: 1%;
    min-width: 0;

    & > .form-select {
      display: flex;
      align-items: center;
      overflow: hidden;
    }

    &:not(:first-child) > .form-select {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }

    &:not(:last-child) > .form-select {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
  }
</style>

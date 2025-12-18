<template>
  <select :value="selectValue" @change="onSelectChange" class="form-select">
    <option
      v-for="character in characters"
      :key="character.id"
      :value="character.id"
    >
      {{ character.name }}
    </option>
    <slot></slot>
  </select>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { SimpleCharacter } from '../interfaces';
  import * as Utils from '../site/utils';

  const props = defineProps<{
    selectValue?: number;
  }>();

  const emit = defineEmits<{
    (e: 'update:selectValue', value: number): void;
  }>();

  const characters = computed<SimpleCharacter[]>(() => Utils.characters);

  const onSelectChange = (evt: Event): void => {
    const target = evt.target as HTMLSelectElement;
    const newValue = parseInt(target.value, 10);

    emit('update:selectValue', newValue);
  };
</script>

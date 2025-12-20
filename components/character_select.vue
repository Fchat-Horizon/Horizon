<template>
  <select :value="selected" @change="onSelectChange" class="form-select">
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
    // Maintaining Vue 2 backwards-compat, remove after full Vue 3 migration
    value: number;

    // Forward-compat for Vue 3
    modelValue: number;
  }>();

  const emit = defineEmits<{
    // Maintaining Vue 2 backwards-compat, remove after full Vue 3 migration
    (e: 'input', value: number): void;

    // Forward-compat for Vue 3
    (e: 'update:modelValue', value: number): void;
  }>();

  const characters = computed<SimpleCharacter[]>(() => Utils.characters);
  const selected = computed<number>(() => {
    return props.modelValue !== undefined ? props.modelValue : props.value;
  });

  const onSelectChange = (evt: Event): void => {
    const target = evt.target as HTMLSelectElement;
    const newValue = parseInt(target.value, 10);

    // Maintaining Vue 2 backwards-compat, remove after full Vue 3 migration
    emit('input', newValue);

    // Forward-compat for Vue 3
    emit('update:modelValue', newValue);
  };
</script>

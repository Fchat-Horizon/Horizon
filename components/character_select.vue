<template>
  <select :value="modelValue" @change="onSelectChange" class="form-select">
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
    modelValue?: number;
  }>();

  const emit = defineEmits<{
    (e: 'update:modelValue', value: number): void;
  }>();

  const characters = computed<SimpleCharacter[]>(() => Utils.characters);

  const onSelectChange = (evt: Event): void => {
    const target = evt.target as HTMLSelectElement;
    const newValue = parseInt(target.value, 10);

    emit('update:modelValue', newValue);
  };
</script>

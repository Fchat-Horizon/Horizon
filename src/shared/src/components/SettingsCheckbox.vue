<template>
  <div
    class="btn-group"
    role="group input-group"
    aria-label="Basic radio toggle button group"
  >
    <input
      type="radio"
      class="btn-check form-control"
      :name="name"
      :id="`${name}-true`"
      autocomplete="off"
      :title="l('conversationSettings.true')"
      :checked="current === true"
      :disabled="disabled"
      @change="select(true)"
    />
    <label class="btn btn-outline-success" :for="`${name}-true`">
      <i class="fa-solid fa-check"></i>
    </label>

    <input
      type="radio"
      class="btn-check"
      :name="name"
      :id="`${name}-false`"
      autocomplete="off"
      :title="l('conversationSettings.false')"
      :checked="current === false"
      :disabled="disabled"
      @change="select(false)"
    />
    <label class="btn btn-outline-danger" :for="`${name}-false`">
      <i class="fa-solid fa-xmark"></i>
    </label>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import l from '@/chat/localize';

  // value/input is the Vue 2 contract; modelValue/update:modelValue the Vue 3
  // one. Both are accepted so plain :value call sites and v-model both bind.
  const props = defineProps<{
    value?: boolean;
    modelValue?: boolean;
    name: string;
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'input', value: boolean): void;
    (e: 'update:modelValue', value: boolean): void;
  }>();

  const current = computed(() =>
    props.modelValue !== undefined ? props.modelValue : props.value
  );

  function select(value: boolean): void {
    emit('input', value);
    emit('update:modelValue', value);
  }
</script>

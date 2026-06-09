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
      :checked="value === true"
      :disabled="disabled"
      @change="$emit('input', true)"
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
      :checked="value === false"
      :disabled="disabled"
      @change="$emit('input', false)"
    />
    <label class="btn btn-outline-danger" :for="`${name}-false`">
      <i class="fa-solid fa-xmark"></i>
    </label>
  </div>
</template>

<script setup lang="ts">
  import l from '../chat/localize';

  interface Props {
    value?: boolean;
    name: string;
    disabled?: boolean;
  }

  defineProps<Props>();
  defineEmits<{
    (e: 'input', value: boolean): void;
  }>();
</script>

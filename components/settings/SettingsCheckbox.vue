<template>
  <div class="form-check form-switch">
    <input
      class="form-check-input"
      type="checkbox"
      :id="name"
      :name="name"
      :checked="value"
      :disabled="disabled"
      @change="$emit('input', value ? false : true)"
      switch
      role="switch"
      :aria-label="
        l(value ? 'conversationSettings.true' : 'conversationSettings.false')
      "
    />
  </div>
</template>

<script setup lang="ts">
  import l from '../../chat/localize';

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

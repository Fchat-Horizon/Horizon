<template>
  <input
    type="number"
    class="form-control"
    :placeholder="placeholder"
    :disabled="disabled"
    :value="globalValue"
    @input="onGlobalInput"
    v-if="usingGlobal"
  />
  <input
    type="number"
    class="form-control"
    :placeholder="globalValue.toString()"
    :disabled="disabled"
    :value="overrideValue"
    @input="onOverrideInput"
    v-else
  />
</template>
<script setup lang="ts">
  const props = defineProps({
    usingGlobal: {
      type: Boolean,
      required: true
    },
    disabled: {
      type: Boolean,
      default: undefined
    },
    placeholder: {
      type: String,
      default: ''
    },
    globalValue: {
      type: Number,
      required: true
    },
    overrideValue: {
      type: Number,
      default: 0
    }
  });

  const emit = defineEmits<{
    (e: 'update:globalValue', value: number): void;
    (e: 'update:overrideValue', value: number): void;
  }>();

  function toNumber(value: string): number {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  function onGlobalInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    emit('update:globalValue', toNumber(target?.value ?? ''));
  }

  function onOverrideInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    emit('update:overrideValue', toNumber(target?.value ?? ''));
  }
</script>

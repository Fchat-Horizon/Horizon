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
  <div class="input-group" v-else>
    <input
      type="number"
      class="form-control"
      :placeholder="globalValue.toString()"
      :disabled="disabled"
      :value="overrideValue"
      @input="onOverrideInput"
    />
    <button class="btn btn-outline-secondary" type="button">
      <i
        class="fa fa-eraser"
        aria-hidden="true"
        @click="emit('update:overrideValue', undefined)"
      >
      </i>
    </button>
  </div>
</template>
<script setup lang="ts">
  interface Props {
    usingGlobal: boolean;
    disabled?: boolean;
    placeholder?: string;
    globalValue: number;
    overrideValue?: number;
  }
  const props = defineProps<Props>();

  const emit = defineEmits<{
    (e: 'update:globalValue', value: number): void;
    (e: 'update:overrideValue', value: number | undefined): void;
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
    const value = target?.value ?? '';
    emit('update:overrideValue', value === '' ? undefined : toNumber(value));
  }
</script>

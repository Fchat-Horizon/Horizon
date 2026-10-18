<template>
  <select
    :id="name"
    class="form-select"
    :value="selectedValue"
    :disabled="disabled"
    @change="onChange"
  >
    <option v-if="!usingGlobal" :value="fallbackValue">
      {{ resolvedFallbackLabel }}
    </option>
    <option
      v-for="option in options"
      :key="option.value"
      :value="option.value"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </option>
  </select>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import l from '../chat/localize';

  const fallbackValue = '__settings_select_override_global__';

  interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
  }

  interface Props {
    globalValue: string;
    overrideValue?: string;
    usingGlobal: boolean;
    name: string;
    options: ReadonlyArray<SelectOption>;
    fallbackLabel?: string;
    disabled?: boolean;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    (e: 'update:globalValue', value: string): void;
    (e: 'update:overrideValue', value: string | undefined): void;
  }>();

  const selectedValue = computed(() => {
    if (props.usingGlobal) return props.globalValue;
    return props.overrideValue ?? fallbackValue;
  });

  const resolvedFallbackLabel = computed(
    () => props.fallbackLabel ?? l('settings.override.useGlobal')
  );

  function onChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const value = target?.value;

    if (value === undefined) return;

    if (props.usingGlobal) {
      emit('update:globalValue', value);
      return;
    }

    emit('update:overrideValue', value === fallbackValue ? undefined : value);
  }
</script>

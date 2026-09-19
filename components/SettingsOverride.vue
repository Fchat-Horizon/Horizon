<template>
  <SettingsCheckbox
    v-if="usingGlobal"
    :value="globalValue"
    :name="`${name}-global`"
    :disabled="disabled"
    @input="$emit('update:globalValue', $event)"
  />
  <SettingsTriState
    v-else
    :value="overrideValue"
    :name="`${name}-override`"
    :globalValue="globalValue"
    :disabled="disabled"
    @input="$emit('update:overrideValue', $event)"
  />
</template>

<script setup lang="ts">
  import { PropType } from 'vue';
  import SettingsCheckbox from './SettingsCheckbox.vue';
  import SettingsTriState from './SettingsTriState.vue';

  const props = defineProps({
    overrideValue: {
      type: Boolean as PropType<boolean | undefined>,
      default: undefined
    },
    globalValue: {
      type: Boolean,
      required: true
    },
    usingGlobal: {
      type: Boolean,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    disabled: {
      type: Boolean,
      default: undefined
    }
  });
</script>

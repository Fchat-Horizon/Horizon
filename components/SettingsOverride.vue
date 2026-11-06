<template>
  <div class="mb-3">
    <div class="d-flex p-2 justify-content-between align-items-start">
      <div class="w-50">
        <label class="control-label" :for="name">{{ label }}</label>
        <div v-if="description" class="form-text text-muted">
          {{ description }}
        </div>
      </div>
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
    </div>
  </div>
</template>

<script setup lang="ts">
  import { PropType } from 'vue';
  import SettingsCheckbox from './SettingsCheckbox.vue';
  import SettingsTriState from './SettingsTriState.vue';

  const props = defineProps({
    label: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: undefined
    },
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

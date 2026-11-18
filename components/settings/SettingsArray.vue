<template>
  <div class="d-inline-block w-100">
    <label class="form-label">{{ name }}</label>
    <div
      v-if="usingGlobal"
      class="settings-array-overrides form-control form-tag"
    >
      <InputTag
        :value="globalValue"
        :read-only="disabled"
        :placeholder="placeholder"
        @input="onGlobalInput"
        :add-tag-on-blur="true"
        :add-tag-on-keys="[13, 188, 9]"
      />
    </div>
    <div v-else class="settings-array-overrides form-control form-tag">
      <div
        v-if="globalValue.length"
        class="vue-input-tag-wrapper inherited-tags"
      >
        <button
          v-for="tag in globalValue"
          :key="tag"
          type="button"
          class="input-tag"
          :class="{ excluded: excludedValue?.includes(tag) }"
          :disabled="disabled || !excludedValue"
          @click="toggleExcluded(tag)"
        >
          {{ tag }}
        </button>
      </div>
      <InputTag
        :value="overrideValue ?? []"
        :read-only="disabled"
        :placeholder="placeholder"
        @input="onOverrideInput"
        class="override-tags"
        :add-tag-on-blur="true"
        :add-tag-on-keys="[13, 188, 9]"
      />
    </div>
    <label class="form-text">
      {{ l('settings.arrayInstructions') }}
      <template v-if="excludedValue && !usingGlobal && globalValue.length">
        {{ l('settings.arrayExcludeInstructions') }}
      </template>
    </label>
  </div>
</template>

<script setup lang="ts">
  import { PropType } from 'vue';
  import InputTag from 'vue-input-tag';
  import l from '../../chat/localize';

  // Character overrides are additive: the effective list is the global list
  // plus the override. An empty override is therefore the same as no override,
  // and is emitted as `undefined` so it isn't persisted as a meaningless `[]`.
  const props = defineProps({
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
      default: false
    },
    placeholder: {
      type: String,
      default: ''
    },
    globalValue: {
      type: Array as PropType<ReadonlyArray<string>>,
      required: true
    },
    overrideValue: {
      type: Array as PropType<ReadonlyArray<string> | undefined>,
      default: undefined
    },
    excludedValue: {
      type: Array as PropType<ReadonlyArray<string> | undefined>,
      default: undefined
    }
  });

  const emit = defineEmits<{
    (e: 'update:globalValue', value: string[]): void;
    (e: 'update:overrideValue', value: string[] | undefined): void;
    (e: 'update:excludedValue', value: string[] | undefined): void;
  }>();

  function toggleExcluded(tag: string): void {
    const excluded = props.excludedValue!.filter(t => t !== tag);
    if (excluded.length === props.excludedValue!.length) excluded.push(tag);
    emit('update:excludedValue', excluded.length > 0 ? excluded : undefined);
  }

  // InputTag emits its internal array and keeps mutating it, so always copy.
  function onGlobalInput(tags: string[]): void {
    emit('update:globalValue', [...tags]);
  }

  function onOverrideInput(tags: string[]): void {
    emit('update:overrideValue', tags.length > 0 ? [...tags] : undefined);
  }
</script>

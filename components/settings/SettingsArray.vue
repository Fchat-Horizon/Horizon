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
      <InputTag
        v-if="globalValue.length"
        :value="globalValue"
        class="inherited-tags"
        :read-only="true"
      />
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
  defineProps({
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
    }
  });

  const emit = defineEmits<{
    (e: 'update:globalValue', value: string[]): void;
    (e: 'update:overrideValue', value: string[] | undefined): void;
  }>();

  // InputTag emits its internal array and keeps mutating it, so always copy.
  function onGlobalInput(tags: string[]): void {
    emit('update:globalValue', [...tags]);
  }

  function onOverrideInput(tags: string[]): void {
    emit('update:overrideValue', tags.length > 0 ? [...tags] : undefined);
  }
</script>

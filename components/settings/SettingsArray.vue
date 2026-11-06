<template>
  <div class="d-inline-block w-100">
    <label :for="name" class="form-label">{{ name }}</label>
    <InputTag
      v-model="globalValue"
      :disabled="disabled"
      :placeholder="placeholder"
      @input="$emit('update:globalValue', globalValue)"
      v-if="usingGlobal"
      class="form-control form-tag"
      :add-tag-on-blur="true"
      :add-tag-on-keys="[13, 188, 9]"
    />
    <div v-else class="settings-array-overrides form-control form-tag">
      <InputTag
        v-if="globalValue.length"
        :value="globalValue"
        :disabled="disabled"
        class="inherited-tags"
        :read-only="true"
      />
      <InputTag
        v-model="overrideValue"
        :disabled="disabled"
        :placeholder="placeholder"
        @input="$emit('update:overrideValue', overrideValue)"
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
  import InputTag from 'vue-input-tag';
  import l from '../../chat/localize';

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
      default: undefined
    },
    placeholder: {
      type: String,
      default: ''
    },
    globalValue: {
      type: Array as () => ReadonlyArray<string>,
      required: true
    },
    overrideValue: {
      type: Array as () => ReadonlyArray<string>,
      default: () => []
    }
  });
</script>

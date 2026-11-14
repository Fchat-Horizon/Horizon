<template>
  <div class="form-check form-switch">
    <input
      class="form-check-input"
      type="checkbox"
      :id="name"
      :name="name"
      :checked="isChecked"
      :indeterminate.prop="isIntermediate"
      :disabled="disabled"
      :title="defaultTitle"
      @change="handleChange"
      switch
      role="switch"
      :aria-label="l('settings.override.true')"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import l from '../../chat/localize';

  interface Props {
    value?: boolean;
    name: string;
    globalValue: boolean;
    disabled?: boolean;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<{
    (e: 'input', value: boolean | undefined): void;
  }>();

  const defaultTitle = computed(() => {
    const globalState = props.globalValue
      ? l('settings.override.globalOn')
      : l('settings.override.globalOff');
    return `${l('settings.override.useGlobal')} (${globalState})`;
  });

  const isIntermediate = computed(() => props.value === undefined);
  const isChecked = computed(() => props.value === true);

  function handleChange(event: Event) {
    let nextValue: boolean | undefined;

    if (props.value === false) {
      nextValue = undefined;
    } else if (isIntermediate.value) {
      nextValue = true;
    } else {
      nextValue = false;
    }

    const input = event.currentTarget as HTMLInputElement;
    input.checked = nextValue === true;
    input.indeterminate = nextValue === undefined;
    emit('input', nextValue);
  }
</script>

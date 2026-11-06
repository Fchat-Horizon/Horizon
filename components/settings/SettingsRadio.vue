<template>
  <div class="form-check form-switch">
    <input
      class="form-check-input"
      type="checkbox"
      :name="name"
      :id="name"
      :checked="isChecked"
      :indeterminate.prop="isDefault"
      :title="title"
      @change="handleChange"
      switch
      role="switch"
      :aria-label="l('settings.checkbox.override')"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { Conversation as Interfaces } from '../../chat/interfaces';
  import l from '../../chat/localize';

  interface Props {
    value: Interfaces.Setting;
    name: string;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    (e: 'input', value: Interfaces.Setting): void;
  }>();

  const setting = Interfaces.Setting;
  const isChecked = computed(() => props.value === setting.True);
  const isDefault = computed(() => props.value === setting.Default);
  const title = computed(() => {
    if (props.value === setting.True) return l('conversationSettings.true');
    if (props.value === setting.False) return l('conversationSettings.false');
    return l('conversationSettings.default');
  });

  function handleChange(event: Event): void {
    const nextValue = isChecked.value
      ? setting.Default
      : isDefault.value
        ? setting.False
        : setting.True;
    const input = event.currentTarget as HTMLInputElement;

    input.checked = nextValue === setting.True;
    input.indeterminate = nextValue === setting.Default;
    emit('input', nextValue);
  }
</script>

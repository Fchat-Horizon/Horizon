<template>
  <div
    class="btn-group"
    role="group input-group"
    :aria-label="l('settings.checkbox.override')"
  >
    <input
      type="radio"
      class="btn-check form-control"
      :name="name"
      :id="`${name}-true`"
      autocomplete="off"
      :title="l('conversationSettings.true')"
      :checked="value === setting.True"
      @change="$emit('input', setting.True)"
    />
    <label class="btn btn-outline-success" :for="`${name}-true`">
      <i class="fa-solid fa-check"></i>
    </label>

    <input
      type="radio"
      class="btn-check"
      :name="name"
      :id="`${name}-default`"
      autocomplete="off"
      :title="l('conversationSettings.default')"
      :checked="value === setting.Default"
      @change="$emit('input', setting.Default)"
    />
    <label class="btn btn-outline-secondary" :for="`${name}-default`">
      <i class="fa-solid fa-minus"></i>
    </label>

    <input
      type="radio"
      class="btn-check"
      :name="name"
      :id="`${name}-false`"
      autocomplete="off"
      :title="l('conversationSettings.false')"
      :checked="value === setting.False"
      @change="$emit('input', setting.False)"
    />
    <label class="btn btn-outline-danger" :for="`${name}-false`">
      <i class="fa-solid fa-xmark"></i>
    </label>
  </div>
</template>

<script setup lang="ts">
  import { Conversation as Interfaces } from '../chat/interfaces';
  import l from '../chat/localize';

  interface Props {
    value: Interfaces.Setting;
    name: string;
  }

  defineProps<Props>();

  defineEmits<{
    (e: 'input', value: Interfaces.Setting): void;
  }>();

  const setting = Interfaces.Setting;
</script>

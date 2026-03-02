<template>
  <div
    class="btn-group"
    role="group input-group"
    aria-label="Settings tri-state toggle"
  >
    <input
      type="radio"
      class="btn-check form-control"
      :name="name"
      :id="`${name}-true`"
      autocomplete="off"
      :title="l('settings.override.true')"
      :checked="value === true"
      :disabled="disabled"
      @change="emitTrue"
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
      :title="defaultTitle"
      :checked="value === undefined"
      :disabled="disabled"
      @change="emitUndefined"
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
      :title="l('settings.override.false')"
      :checked="value === false"
      :disabled="disabled"
      @change="emitFalse"
    />
    <label class="btn btn-outline-danger" :for="`${name}-false`">
      <i class="fa-solid fa-xmark"></i>
    </label>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import l from '../chat/localize';

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

  function emitTrue() {
    emit('input', true);
  }

  function emitUndefined() {
    emit('input', undefined);
  }

  function emitFalse() {
    emit('input', false);
  }
</script>

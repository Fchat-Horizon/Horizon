<template>
  <div
    class="toast show horizon-toast shadow-sm position-fixed bottom-0 end-0 m-3 overflow-hidden"
    :class="{ 'border-danger': variant === 'error' }"
    role="status"
  >
    <div class="toast-body d-flex align-items-center gap-2 py-2">
      <span>
        <span
          v-if="icon"
          class="fas fa-fw"
          :class="[icon, { 'fa-spin': iconSpin }]"
        ></span>
        {{ message }}
      </span>
      <button
        type="button"
        class="btn btn-sm btn-link link-secondary p-0 ms-auto"
        @click="$emit('dismiss')"
        aria-label="Dismiss"
      >
        <span class="fas fa-times"></span>
      </button>
    </div>
    <div
      v-if="progress !== undefined"
      class="progress rounded-0"
      style="height: 3px"
    >
      <div
        class="progress-bar bg-success"
        :style="{
          width: Math.round(progress * 100) + '%',
          transition: 'width 0.3s ease'
        }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
  withDefaults(
    defineProps<{
      message: string;
      icon?: string;
      iconSpin?: boolean;
      variant?: 'default' | 'error' | 'success';
      progress?: number;
    }>(),
    {
      icon: '',
      iconSpin: false,
      variant: 'default',
      progress: undefined
    }
  );

  defineEmits<{ (e: 'dismiss'): void }>();
</script>

<style lang="scss">
  .horizon-toast {
    z-index: 1090;
    width: auto;
    min-width: 220px;
    font-size: 0.8rem;
  }
</style>

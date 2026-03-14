<template>
  <div class="horizon-toast" :class="'toast-' + variant">
    <div class="toast-content">
      <span>
        <span
          v-if="icon"
          class="fas fa-fw"
          :class="[icon, { 'fa-spin': iconSpin }]"
        ></span>
        {{ message }}
      </span>
      <a
        href="#"
        class="toast-dismiss"
        @click.prevent="$emit('dismiss')"
        aria-label="Dismiss"
      >
        <span class="fas fa-times"></span>
      </a>
    </div>
    <div
      v-if="progress !== undefined"
      class="progress"
      style="height: 3px; border-radius: 0"
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
    position: fixed;
    bottom: 16px;
    right: 16px;
    z-index: 9999;
    background: var(--bs-body-bg, #212529);
    color: var(--bs-body-color, #adb5bd);
    border: 1px solid var(--bs-border-color, rgba(255, 255, 255, 0.1));
    padding: 0;
    border-radius: 6px;
    font-size: 0.8rem;
    min-width: 220px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    opacity: 0.85;
    overflow: hidden;

    &.toast-error {
      border-color: var(--bs-danger, #dc3545);
    }

    .toast-content {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
    }

    .toast-dismiss {
      margin-left: auto;
      color: inherit;
      opacity: 0.5;
      text-decoration: none;
      &:hover {
        opacity: 1;
      }
    }
  }
</style>

<template>
  <span v-show="isShown">
    <div
      class="modal"
      @mousedown.self="hideWithCheck()"
      style="display: flex; justify-content: center"
    >
      <div
        class="modal-dialog"
        :class="dialogClass"
        style="
          display: flex;
          align-items: center;
          margin-left: 0;
          margin-right: 0;
        "
      >
        <div class="modal-content" style="max-height: 100%">
          <div class="modal-header" style="flex-shrink: 0">
            <h4 class="modal-title">
              <slot name="title">{{ action }}</slot>
            </h4>
            <button
              type="button"
              class="close"
              @click="hide"
              aria-label="Close"
              v-show="!keepOpen"
            >
              &times;
            </button>
          </div>
          <div
            class="modal-body"
            style="overflow: auto; -webkit-overflow-scrolling: auto"
            tabindex="-1"
          >
            <slot></slot>
          </div>
          <div class="modal-footer" v-if="buttons">
            <button
              type="button"
              class="btn btn-secondary"
              @click="hideWithCheck"
              v-if="showCancel"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn"
              :class="buttonClass"
              @click="submit"
              :disabled="shouldBeDisabled"
            >
              {{ submitText }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop show"></div>
  </span>
</template>

<script lang="ts">
  import {
    defineComponent,
    ref,
    computed,
    onMounted,
    onBeforeUnmount,
    watch,
    nextTick
  } from 'vue';
  import { getKey } from '../chat/common';
  import { Keys } from '../keys';

  const dialogStack: any[] = [];
  let isShowing = false;

  export default defineComponent({
    name: 'Modal',
    props: {
      action: {
        type: String,
        default: ''
      },
      dialogClass: { type: String, default: 'modal-dialog' },
      buttons: {
        type: Boolean,
        default: true
      },
      buttonClass: {
        type: Object,
        default: () => ({ 'btn-primary': true })
      },
      disabled: Boolean,
      showCancel: {
        type: Boolean,
        default: true
      },
      buttonText: String
    },
    emits: ['submit', 'open', 'close', 'reopen'],
    setup(props, { emit }) {
      const isShown = ref(false);
      const keepOpen = ref(false);
      const forcedDisabled = ref(false);

      function submit(e: Event) {
        emit('submit', e);
        if (!e.defaultPrevented) hideWithCheck();
      }

      function show(keep = false) {
        keepOpen.value = keep;
        if (isShown.value) {
          emit('reopen');
          return;
        }
        isShown.value = true;
        dialogStack.push(api);
        emit('open');
        isShowing = true;
      }

      function hide() {
        isShown.value = false;
        emit('close');
        dialogStack.pop();
        if (dialogStack.length === 0) isShowing = false;
      }

      function hideWithCheck() {
        if (keepOpen.value) return;
        hide();
      }

      function forceDisabled(disabled: boolean) {
        forcedDisabled.value = disabled;
      }

      const shouldBeDisabled = computed(() => {
        return props.disabled || forcedDisabled.value;
      });

      const submitText = computed(() => {
        return props.buttonText !== undefined ? props.buttonText : props.action;
      });

      // Keyboard and backbutton listeners (global, only once)
      function keydownListener(e: KeyboardEvent) {
        if (getKey(e) === Keys.Escape && dialogStack.length > 0) {
          dialogStack[dialogStack.length - 1].hideWithCheck();
        }
      }
      function backbuttonListener(e: Event) {
        if (dialogStack.length > 0) {
          e.stopPropagation();
          e.preventDefault();
          dialogStack[dialogStack.length - 1].hide();
        }
      }

      onMounted(() => {
        window.addEventListener('keydown', keydownListener);
        window.addEventListener('backbutton', backbuttonListener, true);
      });

      onBeforeUnmount(() => {
        window.removeEventListener('keydown', keydownListener);
        window.removeEventListener('backbutton', backbuttonListener, true);
        if (isShown.value) hide();
      });

      // Expose API for dialogStack
      const api = {
        hideWithCheck,
        hide,
        show,
        isShown
      };

      return {
        isShown,
        keepOpen,
        forcedDisabled,
        submit,
        show,
        hide,
        hideWithCheck,
        forceDisabled,
        shouldBeDisabled,
        submitText
      };
    }
  });
</script>

<style>
  .flex-modal .modal-body > .form-group {
    margin-left: 0;
    margin-right: 0;
  }

  .modal-body:focus {
    outline: none !important;
  }
</style>

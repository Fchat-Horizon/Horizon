<template>
  <span v-show="!hasFinishedHiding">
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
        <transition name="slide">
          <div v-show="isShown" class="modal-content" style="max-height: 100%">
            <div class="modal-header" style="flex-shrink: 0">
              <h5 class="modal-title">
                <i v-if="iconClass" :class="iconClass" class="fa-fw"></i>
                <slot name="title">{{ action }}</slot>
              </h5>
              <a
                type="button"
                class="btn-close btn"
                @click="hide"
                :aria-label="l('action.close')"
                v-show="!keepOpen"
              >
                <i class="fa fa-times fa-lg"></i>
              </a>
            </div>
            <div
              class="modal-body hidden-scrollbar"
              style="overflow-x: auto; -webkit-overflow-scrolling: auto"
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
                {{ l('action.cancel') }}
              </button>
              <button
                type="button"
                class="btn"
                :class="buttonClass"
                @click="submit"
                :disabled="shouldBeDisabled()"
              >
                {{ submitText }}
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>
    <transition name="dimmer" v-on:after-leave="hasFinishedHiding = true"
      ><div v-show="isShown" class="modal-backdrop show"></div
    ></transition>
  </span>
</template>

<script lang="ts">
  import Vue from 'vue';
  import { getKey } from '../chat/common';
  import { Keys } from '../keys';
  import l from '../chat/localize';

  const dialogStack: Modal[] = [];
  window.addEventListener('keydown', e => {
    if (getKey(e) === Keys.Escape && dialogStack.length > 0)
      dialogStack[dialogStack.length - 1].hideWithCheck();
  });
  if (process.platform === 'darwin') {
    window.addEventListener('keydown', e => {
      if (e.metaKey && e.key == 'w' && dialogStack.length > 0) {
        dialogStack[dialogStack.length - 1].hideWithCheck();
      }
    });
  }
  window.addEventListener(
    'backbutton',
    e => {
      if (dialogStack.length > 0) {
        e.stopPropagation();
        e.preventDefault();
        dialogStack[dialogStack.length - 1].hide();
      }
    },
    true
  );

  export let isShowing = false;

  type Modal = InstanceType<typeof Modal>;
  const Modal = Vue.extend({
    props: {
      action: { default: '' },
      dialogClass: {},
      buttons: { default: true },
      buttonClass: { default: () => ({ 'btn-primary': true }) },
      disabled: {},
      showCancel: { default: true },
      buttonText: {},
      iconClass: {}
    },
    data() {
      return {
        l: l,
        isShown: false,
        hasFinishedHiding: true,
        keepOpen: false,
        forcedDisabled: false
      };
    },
    computed: {
      submitText(): string {
        return this.buttonText !== undefined ? this.buttonText : this.action;
      }
    },
    beforeDestroy(): void {
      if (this.isShown) this.hide();
    },
    methods: {
      forceDisabled(disabled: boolean): void {
        this.forcedDisabled = disabled;
      },
      shouldBeDisabled(): boolean {
        return this.disabled || this.forcedDisabled;
      },
      submit(e: Event): void {
        this.$emit('submit', e);
        if (!e.defaultPrevented) this.hideWithCheck();
      },
      show(keepOpen: boolean = false): void {
        this.keepOpen = keepOpen;
        if (this.isShown) {
          this.$emit('reopen');
          return;
        }
        this.isShown = true;
        this.hasFinishedHiding = false;
        dialogStack.push(this);
        this.$emit('open');
        isShowing = true;
      },
      hide(): void {
        this.isShown = false;
        this.$emit('close');
        dialogStack.pop();
        if (dialogStack.length === 0) isShowing = false;
      },
      hideWithCheck(): void {
        if (this.keepOpen) return;
        this.hide();
      }
    }
  });
  export default Modal;
</script>

<style>
  .flex-modal .modal-body > .form-group {
    margin-left: 0;
    margin-right: 0;
  }

  .modal-body:focus {
    outline: none !important;
  }

  .modal-title .fa-fw {
    margin-right: 0.5rem;
  }
  .slide-enter-active {
    animation: slide-in 0.3s;
  }
  .slide-leave-active {
    animation: slide-in reverse 0.15s;
  }

  .profile-viewer .slide-leave-active {
    animation: spread-out 0.2s;
  }

  .profile-viewer .slide-enter-active {
    animation: spread-out reverse 0.2s;
  }
  @keyframes slide-in {
    0% {
      opacity: 0;
      transform: translateY(-7vh);
    }
    60% {
      opacity: 1;
    }
    100% {
      transform: translateY(0vh);
    }
  }

  @keyframes spread-out {
    0% {
      opacity: 1;
      transform: scale(1);
    }

    100% {
      opacity: 0;
      transform: scale(1.03);
    }
  }
  .dimmer-enter-active,
  .dimmer-leave-active {
    transition: opacity 0.3s;
  }

  .dimmer-enter,
  .dimmer-leave-to {
    opacity: 0 !important;
  }

  @media (prefers-reduced-motion: reduce) {
    .slide-enter-active,
    .slide-leave-active {
      animation: none;
    }
    .dimmer-enter-active,
    .dimmer-leave-active {
      transition: none;
    }
  }
</style>

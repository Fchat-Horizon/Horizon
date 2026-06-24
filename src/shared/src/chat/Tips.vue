<template>
  <div
    v-if="show"
    ref="tipContainer"
    class="tip-container bg-body-tertiary"
    :style="containerHeight && { height: containerHeight + 'px' }"
  >
    <div ref="tipContent" class="tip-content">
      <div class="tip-label text-info-emphasis">{{ l('tips') }}</div>
      <div class="tip-text">
        <transition
          :name="transitionName"
          mode="out-in"
          @after-leave="calculateHeight"
          @after-enter="calculateHeight"
        >
          <bbcode style="display: inline-block" :text="tip" :key="tip" />
        </transition>
      </div>
    </div>
    <div class="tip-controls">
      <div class="tip-nav">
        <button type="button" class="tip-btn" @click="handlePrevious()">
          <i class="fa-solid fa-chevron-up" />
        </button>
        <button type="button" class="tip-btn" @click="handleNext()">
          <i class="fa-solid fa-chevron-down" />
        </button>
      </div>
      <button
        type="button"
        class="tip-btn tip-btn--dismiss"
        @click="show = !show"
      >
        <i class="fa-solid fa-xmark" />
      </button>
    </div>
  </div>
</template>

<script>
  import {
    defineComponent,
    ref,
    watch,
    nextTick,
    computed,
    onMounted,
    onBeforeUnmount
  } from 'vue';
  import tip, { previousTip, nextTip } from './tips';
  import l from './localize';
  import { BBCodeView } from '@/bbcode/view';
  import { UserInterfaceBBCodeParser } from '@/bbcode/user-interface';

  export default defineComponent({
    components: { bbcode: BBCodeView(new UserInterfaceBBCodeParser()) },
    setup() {
      const show = ref(true);
      const tipContainer = ref(null);
      const tipContent = ref(null);
      const containerHeight = ref(null);
      const transitionDirection = ref('down'); // 'up' or 'down'
      const currentTip = computed(() => tip());

      const transitionName = computed(() => {
        return transitionDirection.value === 'up'
          ? 'tip-text-up'
          : 'tip-text-down';
      });

      const calculateHeight = async () => {
        await nextTick();
        if (!tipContent.value) return;
        /*
        ! The chat view starts out hidden until it has finished loading; any
        ! height measured in that state can be garbage (the layout may not
        ! have its final size yet). The visibilitychange listener
        ! below re-measures once the view is actually shown.
        */
        if (document.hidden) return;
        const { scrollHeight } = tipContent.value;
        const { paddingTop, paddingBottom } = window.getComputedStyle(
          tipContainer.value
        );
        containerHeight.value = Math.max(
          Math.ceil(scrollHeight) +
            parseFloat(paddingTop) +
            parseFloat(paddingBottom),
          44
        );
      };

      const recalculate = () => {
        void calculateHeight();
      };

      const handleNext = () => {
        transitionDirection.value = 'up';
        nextTip();
      };

      const handlePrevious = () => {
        transitionDirection.value = 'down';
        previousTip();
      };

      watch(currentTip, calculateHeight);

      onMounted(() => {
        calculateHeight();
        // ~ The pinned height depends on the laid-out text width, so it has
        // ~ to follow resizes and the view's hidden-until-loaded reveal.
        window.addEventListener('resize', recalculate);
        document.addEventListener('visibilitychange', recalculate);
      });

      onBeforeUnmount(() => {
        window.removeEventListener('resize', recalculate);
        document.removeEventListener('visibilitychange', recalculate);
      });

      return {
        show,
        handleNext,
        handlePrevious,
        l,
        tip: currentTip,
        tipContainer,
        tipContent,
        containerHeight,
        transitionName,
        calculateHeight
      };
    }
  });
</script>

<!---
NOTE: dear god help me why is this so long?
-->
<style scoped lang="scss">
  .tip-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--chat-tip-border, var(--bs-border-color));
    border-radius: var(--bs-border-radius);
    color: var(--chat-tip-color, var(--bs-body-color));
    font-size: 13px;
    line-height: 1.4;
    overflow: hidden;
    transition: height 0.2s ease;
  }

  .tip-content {
    flex: 1;
    min-width: 0;
  }

  .tip-label {
    font-weight: 600;
  }

  .tip-text {
    color: var(
      --chat-tip-secondary,
      var(--bs-secondary-color, var(--bs-body-color))
    );
  }

  .tip-controls {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .tip-nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .tip-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 18px;
    padding: 0;
    background: transparent;
    border: 0;
    color: var(
      --chat-tip-button-color,
      var(--bs-secondary-color, var(--bs-body-color))
    );
    transition:
      background-color 0.15s,
      color 0.15s;

    &:hover,
    &:focus-visible {
      background: color-mix(
        in srgb,
        var(--bs-secondary-bg, var(--bs-tertiary-bg)) 70%,
        transparent
      );
      color: var(--chat-tip-button-hover-color, var(--bs-body-color));
    }

    &:focus-visible {
      outline: 2px solid var(--bs-primary);
      outline-offset: -2px;
    }

    &--dismiss {
      height: 38px;
    }
  }

  .tip-text-down-enter-active,
  .tip-text-down-leave-active {
    transition: all 0.2s;
  }

  .tip-text-down-enter-from {
    transform: translateY(-100%);
    opacity: 0;
  }

  .tip-text-down-leave-to {
    transform: translateY(100%);
    opacity: 0;
  }

  .tip-text-up-enter-active,
  .tip-text-up-leave-active {
    transition: all 0.2s;
  }

  .tip-text-up-enter-from {
    transform: translateY(100%);
    opacity: 0;
  }

  .tip-text-up-leave-to {
    transform: translateY(-100%);
    opacity: 0;
  }
</style>

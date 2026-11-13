<template>
  <div
    v-if="show"
    ref="tipContainer"
    class="tip-container d-flex align-items-center gap-2 px-2 py-2 rounded bg-body-tertiary overflow-hidden"
    :style="containerHeight && { height: containerHeight + 'px' }"
  >
    <div ref="tipContent" class="flex-fill" style="min-width: 0">
      <div class="fw-semibold text-info-emphasis">{{ l('tips') }}</div>
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
    <div class="d-flex align-items-center gap-1">
      <div class="tip-nav d-flex flex-column">
        <button
          type="button"
          class="btn btn-link tip-btn"
          @click="handlePrevious()"
        >
          <i class="fa-solid fa-chevron-up" />
        </button>
        <button
          type="button"
          class="btn btn-link tip-btn"
          @click="handleNext()"
        >
          <i class="fa-solid fa-chevron-down" />
        </button>
      </div>
      <button
        type="button"
        class="btn btn-link tip-btn tip-btn--dismiss"
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
  import { BBCodeView } from '../bbcode/view';
  import { UserInterfaceBBCodeParser } from '../bbcode/user-interface';

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
    border: 1px solid var(--chat-tip-border, var(--bs-border-color));
    color: var(--chat-tip-color, var(--bs-body-color));
    font-size: 13px;
    line-height: 1.4;
    transition: height 0.2s ease;
  }

  .tip-text {
    color: var(
      --chat-tip-secondary,
      var(--bs-secondary-color, var(--bs-body-color))
    );
  }

  .tip-nav {
    gap: 2px;
  }

  .tip-btn {
    --bs-btn-padding-x: 0;
    --bs-btn-padding-y: 0;
    --bs-btn-border-width: 0;
    --bs-btn-color: var(
      --chat-tip-button-color,
      var(--bs-secondary-color, var(--bs-body-color))
    );
    --bs-btn-hover-color: var(
      --chat-tip-button-hover-color,
      var(--bs-body-color)
    );
    --bs-btn-active-color: var(--bs-btn-hover-color);
    --bs-btn-hover-bg: var(--bs-secondary-bg);
    --bs-btn-line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 18px;

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

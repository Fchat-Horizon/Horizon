<template>
  <div class="card bg-light">
    <div
      class="card-header"
      @click="toggle()"
      style="cursor: pointer"
      :class="headerClass"
    >
      <h4>
        {{ title }}
        <span
          class="fas"
          :class="'fa-chevron-' + (collapsed ? 'down' : 'up')"
        ></span>
      </h4>
    </div>
    <div :style="style" style="overflow: hidden">
      <div class="card-body" ref="contentRef">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, reactive, ref } from 'vue';

  export default defineComponent({
    name: 'Collapse',
    props: {
      title: {
        type: String,
        required: true
      },
      headerClass: {
        type: String,
        required: false
      }
    },
    emits: ['open', 'close'],
    setup(props, { emit }) {
      const collapsed = ref(true);
      const timeout = ref(0);
      const contentRef = ref<HTMLElement | null>(null);
      const style = reactive<{ height: string | undefined; transition: string }>({
        height: '0',
        transition: 'height .2s'
      });

      const toggle = (state?: boolean) => {
        clearTimeout(timeout.value);
        collapsed.value = state !== undefined ? state : !collapsed.value;
        emit(collapsed.value ? 'close' : 'open');

        const content = contentRef.value;
        if (!content) return;

        if (collapsed.value) {
          style.transition = 'initial';
          style.height = `${content.scrollHeight}px`;
          setTimeout(() => {
            style.transition = 'height .2s';
            style.height = '0';
          }, 0);
        } else {
          style.height = `${content.scrollHeight}px`;
          timeout.value = window.setTimeout(() => {
            style.height = undefined;
          }, 200);
        }
      };

      return {
        collapsed,
        style,
        toggle,
        contentRef
      };
    }
  });
</script>

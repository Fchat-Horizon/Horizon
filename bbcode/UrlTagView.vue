<template>
  <span>
    <i class="fa fa-link"></i>
    <!-- No prevent for @click on purpose -->
    <a
      :href="url"
      rel="nofollow noreferrer noopener"
      target="_blank"
      class="user-link"
      @click="handleClick"
      @mouseover.prevent="show()"
      @mouseenter.prevent="show()"
      @mouseleave.prevent="dismiss()"
      @click.middle.prevent.stop="toggleStickyness()"
      >{{ text }}</a
    >
    <span class="link-domain bbcode-pseudo"> [{{ domain }}]</span>
  </span>
</template>

<script lang="ts">
  import {
    defineComponent,
    getCurrentInstance,
    onBeforeUnmount,
    onDeactivated,
    onMounted
  } from 'vue';
  import { EventBus } from '../chat/preview/event-bus';
  // import core from './core';

  export default defineComponent({
    name: 'UrlTagView',
    props: {
      url: {
        type: String,
        required: true
      },
      text: {
        type: String,
        required: true
      },
      domain: {
        type: String,
        required: true
      }
    },
    setup(props) {
      const type = 'UrlTagView' as const;
      const instance = getCurrentInstance();

      const dismiss = (force = false) => {
        EventBus.$emit('imagepreview-dismiss', { url: props.url, force });
      };

      const show = () => {
        EventBus.$emit('imagepreview-show', { url: props.url });
      };

      const toggleStickyness = () => {
        EventBus.$emit('imagepreview-toggle-stickyness', { url: props.url });
      };

      const handleClick = (e: MouseEvent) => {
        if (e.altKey) {
          toggleStickyness();
          e.preventDefault();
        } else {
          dismiss(true);
        }
      };

      onMounted(() => {
        const el = instance?.proxy?.$el as any;
        if (!el) return;
        el.bbcodeTag = 'url';
        el.bbcodeParam = props.url;
      });

      onBeforeUnmount(() => {
        dismiss();
      });

      onDeactivated(() => {
        dismiss();
      });

      return {
        type,
        dismiss,
        show,
        toggleStickyness,
        handleClick
      };
    }
  });
</script>

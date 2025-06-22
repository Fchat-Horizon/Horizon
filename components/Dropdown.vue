<template>
  <div :class="wrapClass" @focusout="blur">
    <slot name="split"></slot>
    <a
      :class="linkClass"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      @click.prevent="toggleOpen"
      href="#"
      :style="linkStyle"
      role="button"
      tabindex="-1"
      ref="button"
    >
      <i :class="iconClass" v-if="!!iconClass"></i>
      <slot name="title">{{ title }}</slot>
    </a>
    <div
      class="dropdown-menu"
      ref="menu"
      @mousedown.prevent.stop
      @click.prevent.stop="menuClick"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, watch, nextTick } from 'vue';

  export default defineComponent({
    name: 'Dropdown',
    props: {
      linkClass: {
        type: String,
        default: 'btn btn-secondary dropdown-toggle'
      },
      wrapClass: {
        type: String,
        default: 'dropdown'
      },
      iconClass: String,
      keepOpen: Boolean,
      title: String,
      linkStyle: {
        type: String,
        default: 'width:100%;text-align:left;align-items:center'
      }
    },
    setup(props, { slots }) {
      const isOpen = ref(false);
      const menu = ref<HTMLElement | null>(null);

      function toggleOpen() {
        isOpen.value = !isOpen.value;
      }

      watch(isOpen, async open => {
        await nextTick();
        if (!menu.value) return;
        if (!open) {
          menu.value.style.cssText = '';
          return;
        }
        menu.value.style.display = 'block';
        const offset = menu.value.getBoundingClientRect();
        menu.value.style.position = 'fixed';
        menu.value.style.left =
          offset.right < window.innerWidth
            ? `${offset.left}px`
            : `${window.innerWidth - offset.width}px`;
        menu.value.style.top =
          offset.bottom < window.innerHeight
            ? `${offset.top}px`
            : `${offset.top - offset.height - ((menu.value.parentElement as HTMLElement)?.offsetHeight ?? 0)}px`;
      });

      function blur(event: FocusEvent) {
        let elm = event.relatedTarget as HTMLElement | null;
        while (elm) {
          if (elm === menu.value) return;
          elm = elm.parentElement;
        }
        isOpen.value = false;
      }

      function menuClick() {
        if (!props.keepOpen) isOpen.value = false;
      }

      return {
        isOpen,
        menu,
        toggleOpen,
        blur,
        menuClick
      };
    }
  });
</script>

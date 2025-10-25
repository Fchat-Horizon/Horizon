<template>
  <div :class="wrapClass" @focusout="blur">
    <slot name="split"></slot>
    <a
      :class="linkClass"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      @click.prevent="isOpen = !isOpen"
      href="#"
      :style="linkStyle"
      role="button"
      tabindex="-1"
      ref="buttonRef"
    >
      <i :class="iconClass" v-if="!!iconClass"></i>
      <slot name="title">{{ title }}</slot>
    </a>
    <div
      class="dropdown-menu"
      ref="menuRef"
      @mousedown.prevent.stop
      @click="menuClick"
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
      iconClass: {
        type: String,
        required: false
      },
      keepOpen: {
        type: Boolean,
        required: false
      },
      title: {
        type: String,
        required: false
      },
      linkStyle: {
        type: String,
        default: 'width:100%;text-align:left;align-items:center'
      },
      dropup: {
        type: Boolean,
        default: false
      }
    },
    setup(props) {
      const isOpen = ref(false);
      const menuRef = ref<HTMLElement>();
      const buttonRef = ref<HTMLElement>();

      const positionMenu = async () => {
        await nextTick();
        const menu = menuRef.value;
        const button = buttonRef.value;

        if (!menu || !button) return;

        if (!isOpen.value) {
          menu.style.cssText = '';
          return;
        }

        menu.style.visibility = 'hidden';
        menu.style.display = 'block';
        menu.style.position = 'fixed';
        menu.style.left = '0px';
        menu.style.top = '0px';

        const menuWidth =
          menu.offsetWidth || menu.getBoundingClientRect().width;
        const menuHeight =
          menu.offsetHeight || menu.getBoundingClientRect().height;
        const buttonRect = button.getBoundingClientRect();

        menu.style.minWidth = `${button.clientWidth}px`;

        const spaceLeft = buttonRect.left;
        const spaceRight = window.innerWidth - buttonRect.right;

        let leftPos: number;
        if (spaceLeft > spaceRight) {
          leftPos = Math.round(buttonRect.right - menuWidth);
        } else {
          leftPos = Math.round(buttonRect.left);
        }

        if (leftPos + menuWidth > window.innerWidth)
          leftPos = Math.round(window.innerWidth - menuWidth);
        if (leftPos < 0) leftPos = 0;

        let topPos: number;
        if (props.dropup) {
          topPos = Math.round(buttonRect.top - menuHeight);
        } else {
          const spaceBelow = window.innerHeight - buttonRect.bottom;
          const spaceAbove = buttonRect.top;

          if (spaceBelow >= menuHeight || spaceBelow > spaceAbove) {
            topPos = Math.round(buttonRect.bottom);
          } else {
            topPos = Math.round(buttonRect.top - menuHeight);
          }
        }

        menu.style.left = `${leftPos}px`;
        menu.style.top = `${topPos}px`;
        menu.style.visibility = '';
        menu.style.display = 'block';
      };

      watch(isOpen, positionMenu);

      const blur = (event: FocusEvent) => {
        let elm = event.relatedTarget as HTMLElement | null;
        while (elm) {
          if (elm === menuRef.value) return;
          elm = elm.parentElement;
        }
        isOpen.value = false;
      };

      const menuClick = (event: Event) => {
        if (
          props.keepOpen &&
          (event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLButtonElement ||
            (event.target as HTMLElement).closest('input, button'))
        ) {
          return;
        }

        if (!props.keepOpen) isOpen.value = false;
      };

      return {
        isOpen,
        menuRef,
        buttonRef,
        blur,
        menuClick
      };
    }
  });
</script>

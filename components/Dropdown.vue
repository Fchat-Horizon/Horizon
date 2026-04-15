<template>
  <div :class="wrapClass" @focusout="blur" ref="wrapRef">
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
      },
      gap: {
        type: Number,
        default: 3
      }
    },
    emits: ['opened', 'closed'],
    setup(props, { emit }) {
      const isOpen = ref(false);
      const menuRef = ref<HTMLElement>();
      const buttonRef = ref<HTMLElement>();
      const wrapRef = ref<HTMLElement>();

      const positionMenu = async () => {
        await nextTick();
        const menu = menuRef.value;
        const button = buttonRef.value;
        const wrap = wrapRef.value;

        if (!menu || !button || !wrap) return;

        if (!isOpen.value) {
          menu.style.cssText = '';
          return;
        }

        menu.style.display = 'block';
        menu.style.position = 'fixed';

        //Calculate combined width of split slot (if any) and button
        const buttonRect = button.getBoundingClientRect();

        //Find split slot element (first child that's not the button or dropdown menu)
        const splitElement = Array.from(wrap.children).find(
          child => child !== button && child !== menu
        ) as HTMLElement;

        //Set min width based on if we have a split element
        let minWidth: number;
        if (splitElement) {
          const splitWidth = splitElement.getBoundingClientRect().width;
          minWidth = splitWidth + buttonRect.width;
        } else {
          minWidth = buttonRect.width;
        }

        menu.style.minWidth = `${minWidth}px`;

        const menuRect = menu.getBoundingClientRect();

        //horizontal positioning. align to leftmost element (split or button)
        const leftmostLeft = splitElement
          ? splitElement.getBoundingClientRect().left
          : buttonRect.left;
        menu.style.left =
          menuRect.right < window.innerWidth
            ? `${leftmostLeft}px`
            : `${window.innerWidth - menuRect.width}px`;

        // Handle vertical positioning based on dropup prop
        if (props.dropup) {
          menu.style.top = `${buttonRect.top - menuRect.height - props.gap}px`;
        } else {
          // Auto-detect if there's space below, otherwise open upward
          const spaceBelow = window.innerHeight - buttonRect.bottom;
          const spaceAbove = buttonRect.top;

          if (spaceBelow >= menuRect.height || spaceBelow > spaceAbove) {
            menu.style.top = `${buttonRect.bottom + props.gap}px`;
          } else {
            menu.style.top = `${buttonRect.top - menuRect.height - props.gap}px`;
          }
        }
      };

      watch(isOpen, (newValue: boolean) => {
        positionMenu();
        nextTick(() => {
          emit(newValue ? 'opened' : 'closed');
        });
      });

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
        wrapRef,
        blur,
        menuClick
      };
    }
  });
</script>

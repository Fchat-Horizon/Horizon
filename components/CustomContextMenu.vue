<template>
  <div class="list-group bg-solid-text context-menu shadow-sm">
    <slot></slot>
    <a
      v-for="(item, index) in menuItems"
      :key="index"
      :href="item.href || '#'"
      target="_blank"
      tabindex="-1"
      class="list-group-item list-group-item-action"
      :class="{
        disabled: item.disabled,
        'list-group-item-danger': item.dangerous,
        'parent-menu-item': item.children && item.children.length > 0
      }"
      :style="item.topBorder ? { borderTopWidth: '1px' } : undefined"
      @mouseenter="item.children?.length ? positionChild($event) : undefined"
      @click="
        e => {
          if (item.onClick) {
            e.preventDefault();
            item.onClick();
          }
        }
      "
    >
      <span v-if="item.iconClass" :class="item.iconClass" class="fa-fw"></span>
      <span class="action-label">{{ item.label }}</span>
      <span
        v-if="item.children && item.children.length > 0"
        class="fas fa-fw fa-caret-right"
        style="
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
        "
      ></span>
      <custom-context-menu
        v-if="item.children && item.children.length > 0"
        :menu-items="item.children"
        class="child-menu"
      />
    </a>
  </div>
</template>

<script lang="ts">
  import Vue, { PropType } from 'vue';

  /**
   * @interface ContextMenuItemProps
   * @description Represents a single item in the context menu, which can optionally have child items for nested submenus.
   */
  export interface ContextMenuItemProps {
    /**
     * The display text for the menu item.
     */
    label: string;
    /**
     * Indicates whether the menu item is disabled. Disabled items are not interactive and are styled accordingly.
     */
    disabled?: boolean;
    /**
     * An optional URL that the menu item links to.
     */
    href?: string;
    /**
     * An optional click handler function that is called when the menu item is clicked.
     */
    onClick?: () => void;
    /**
     * An optional CSS class for an icon to be displayed alongside the menu item label. This allows for visual enhancement of the menu item.
     */
    iconClass?: string;
    /**
     * An optional array of child menu items, allowing for the creation of nested submenus. Each child item is also of type {@link ContextMenuItemProps}.
     */
    children?: ContextMenuItemProps[];
    /**
     * An optional boolean that, when true, adds a top border to the menu item. This can be used to visually separate groups of items within the menu.
     */
    topBorder?: boolean;
    /**
     * An optional boolean that, when true, styles the menu item as dangerous, typically indicating a destructive action.
     */
    dangerous?: boolean;
  }

  export default Vue.extend({
    name: 'CustomContextMenu',
    props: {
      menuItems: {
        type: Array as PropType<ContextMenuItemProps[]>,
        required: true
      }
    },
    methods: {
      onItemClick(item: ContextMenuItemProps): void {
        if (item.disabled) return;
        item.onClick?.();
      },
      positionChild(event: MouseEvent): void {
        const item = event.currentTarget as HTMLElement;
        const child = item.querySelector<HTMLElement>(':scope > .child-menu');
        if (!child) return;

        child.style.visibility = 'hidden';
        child.style.display = 'block';
        const itemRect = item.getBoundingClientRect();
        const childW = child.offsetWidth;
        const childH = child.offsetHeight;
        child.style.visibility = '';
        child.style.display = '';

        child.style.left =
          itemRect.right + childW > window.innerWidth ? 'auto' : '100%';
        child.style.right =
          itemRect.right + childW > window.innerWidth ? '100%' : 'auto';

        const overflowBottom = itemRect.top + childH - window.innerHeight;
        child.style.top = overflowBottom > 0 ? `${-overflowBottom}px` : '0';
      }
    }
  });
</script>

<style scoped lang="scss">
  .parent-menu-item {
    position: relative;

    .child-menu {
      display: none;
      position: absolute;
      left: 100%;
      top: 0;
      z-index: 1000;
      min-width: 220px;
    }
    &:hover .child-menu {
      display: block;
    }
  }
  .context-menu {
    border-radius: 15px;
    max-width: 265px;

    & .list-group-item {
      padding: 3px 5px 3px 5px;
    }

    & .list-group-item-action {
      font-size: 1.04em;
      border-top-width: 0;
      border-top-style: solid;
      border-color: var(--bs-border-color);
    }
    .action-label {
      margin-left: 0.4rem;
    }
  }
</style>

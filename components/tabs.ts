import { defineComponent, ref, computed, watch, PropType } from 'vue';
import { CreateElement, VNode } from 'vue';

/**
 * Tab item interface for regular tabs.
 * @interface TabTabItem
 * @property {string} [type] The type of the item, always 'tab' for this interface. Used internally.
 * @property {string} id The unique identifier for the tab. The tab component uses this to track the opened tab, while its parent is expected to show content dynamically based on this value.
 * @property {string} label The label text for the tab.
 * @property {string} [iconClass] Optional CSS class for an icon to display in the tab. Mostly a FontAwesome one.
 */
interface TabTabItem {
  readonly type?: 'tab';
  readonly id: string;
  readonly label: string;
  readonly iconClass?: string;
}

/**
 * Tab label item interface.
 * @interface TabLabelItem
 * @property {string} type The type of the item, always 'label'. Used internally.
 * @property {string} label The label text for the tab.
 * @property {string} [iconClass] Optional CSS class for an icon to display in the tab. Mostly a FontAwesome one.
 */
interface TabLabelItem {
  readonly type: 'label';
  readonly label: string;
  readonly iconClass?: string;
}

/**
 * Tab divider item interface.
 * @interface TabDividerItem
 * @property {string} type The type of the item, always 'divider'. Used internally.
 */
interface TabDividerItem {
  readonly type: 'divider';
}
/**
 * Union type for all possible tab items.
 * @type {TabItem}
 * @property {TabTabItem} Tab item.
 * @property {TabLabelItem} Label item.
 * @property {TabDividerItem} Divider item.
 */
type TabItem = TabTabItem | TabLabelItem | TabDividerItem;

/**
 * Props interface for the Tabs component.
 * @interface TabsProps
 * @property {string} [value] The currently selected tab's id.
 * @property {ReadonlyArray<TabItem>} [tabs] The array of tab items to display.
 * @property {boolean} [fullWidth] Whether the tabs should take the full width of the container.
 * @property {string} [tabClass] Optional CSS class for the tab container.
 */
interface TabsProps {
  value?: string;
  tabs?: ReadonlyArray<TabItem>;
  fullWidth?: boolean;
  tabClass?: string;
}

const Tabs = defineComponent({
  name: 'Tabs',
  props: {
    value: {
      type: String as PropType<string | undefined>,
      default: undefined
    },
    tabs: {
      type: Array as PropType<ReadonlyArray<TabItem>>,
      default: () => []
    },
    fullWidth: {
      type: Boolean,
      default: false
    },
    tabClass: {
      type: String,
      default: 'nav-tabs'
    }
  },
  emits: ['input'],
  setup(props: TabsProps, { emit }) {
    const internalValue = ref<string | undefined>(props.value);

    const items = computed<ReadonlyArray<TabItem>>(() => props.tabs || []);

    const tabIds = computed(() =>
      items.value.reduce<string[]>((result, item) => {
        if (item.type !== 'label' && item.type !== 'divider') {
          result.push(item.id);
        }
        return result;
      }, [])
    );

    const isTabActive = (id: string) => internalValue.value === id;

    const getFirstTabId = () => tabIds.value[0];

    const shouldSelectFirstTab = () =>
      internalValue.value === undefined ||
      !tabIds.value.includes(internalValue.value);

    const selectFirstTabIfNeeded = () => {
      if (shouldSelectFirstTab()) {
        const firstId = getFirstTabId();
        if (firstId) {
          internalValue.value = firstId;
          emit('input', firstId);
        }
      }
    };

    watch(
      () => props.value,
      newValue => {
        internalValue.value = newValue;
      }
    );

    watch(
      [items, () => props.value],
      () => {
        selectFirstTabIfNeeded();
      },
      { immediate: true }
    );

    const handleTabClick = (key: string) => {
      internalValue.value = key;
      emit('input', key);
    };

    return {
      internalValue,
      items,
      handleTabClick,
      fullWidth: computed(() => props.fullWidth),
      tabClass: computed(() => props.tabClass),
      isTabActive
    };
  },
  render(createElement: CreateElement): VNode {
    const renderItem = (item: TabItem, index: number) => {
      if (item.type === 'divider') {
        return createElement('li', {
          key: `divider-${index}`,
          staticClass: 'nav-item nav-divider'
        });
      }

      if (item.type === 'label') {
        const labelChildren: Array<VNode | string> = [];
        if (item.iconClass) {
          labelChildren.push(
            createElement('i', {
              class: item.iconClass,
              style: { marginRight: '0.35rem' }
            })
          );
        }
        labelChildren.push(item.label);

        return createElement(
          'li',
          { key: `label-${index}`, staticClass: 'nav-item disabled' },
          [
            createElement(
              'span',
              {
                staticClass: 'nav-link disabled',
                attrs: { 'aria-disabled': 'true' }
              },
              labelChildren
            )
          ]
        );
      }

      const tabChildren: Array<VNode | string> = [];
      if (item.iconClass) {
        tabChildren.push(
          createElement('i', {
            class: item.iconClass,
            style: { marginRight: '0.35rem' }
          })
        );
      }
      tabChildren.push(item.label);

      return createElement(
        'li',
        { key: `tab-${item.id}`, staticClass: 'nav-item' },
        [
          createElement(
            'a',
            {
              attrs: { href: '#' },
              staticClass: 'nav-link',
              class: { active: this.isTabActive(item.id) },
              on: {
                click: (event: MouseEvent) => {
                  event.preventDefault();
                  this.handleTabClick(item.id);
                }
              }
            },
            tabChildren
          )
        ]
      );
    };

    return createElement(
      'div',
      {
        staticClass: `${this.tabClass} ${this.fullWidth ? 'nav-justified' : ''}`
      },
      [
        createElement('ul', { staticClass: `nav ${this.tabClass}` }, [
          this.items.map((item: TabItem, index: number) =>
            renderItem(item, index)
          ),
          ...(this.fullWidth
            ? []
            : [createElement('div', { staticClass: 'nav-tab-spacer' })])
        ])
      ]
    );
  }
});

export default Tabs;

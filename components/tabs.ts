import { defineComponent, ref, computed, watch, PropType } from 'vue';
import { CreateElement, VNode } from 'vue';

interface TabListTabItem {
  readonly type: 'tab';
  readonly key: string;
  readonly label: string;
  readonly iconClass?: string;
}

interface TabListLabelItem {
  readonly type: 'label';
  readonly label: string;
  readonly iconClass?: string;
}

interface TabListDividerItem {
  readonly type: 'divider';
}

type TabListItem = TabListTabItem | TabListLabelItem | TabListDividerItem;

interface TabInputTabItem {
  readonly type?: 'tab';
  readonly id?: string;
  readonly key?: string;
  readonly value?: string;
  readonly label: string;
  readonly iconClass?: string;
}

interface TabInputLabelItem {
  readonly type: 'label';
  readonly label: string;
  readonly iconClass?: string;
}

interface TabInputDividerItem {
  readonly type: 'divider';
}

type TabInputItem = TabInputTabItem | TabInputLabelItem | TabInputDividerItem;

interface TabsProps {
  value?: string;
  tabs?: { readonly [key: string]: string } | Array<string | TabInputItem>;
  fullWidth?: boolean;
  tabClass?: string;
}

// I'm so sorry for this. It's a (hopefully temporary!!!) placeholder.
// We didn't want to update every instance of the tabs component to use the new format yet, so we need to support both the old and the new format for now.
// This is a bit of a mess, but it should be fine as long as we remove the old format support soon™.
// Trust me, it's on the checklist for the settings PR. (#640)

function isDividerItem(item: unknown): item is TabInputDividerItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    (item as { type?: string }).type === 'divider'
  );
}

function isLabelItem(item: unknown): item is TabInputLabelItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    (item as { type?: string }).type === 'label'
  );
}

function isTabItem(item: unknown): item is TabInputTabItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    (!('type' in (item as object)) ||
      (item as { type?: string }).type === 'tab')
  );
}

const Tabs = defineComponent({
  name: 'Tabs',
  props: {
    value: {
      type: String as PropType<string | undefined>,
      default: undefined
    },
    tabs: {
      type: [Object, Array] as PropType<
        { readonly [key: string]: string } | Array<string | TabInputItem>
      >,
      default: () => ({})
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

    const items = computed<TabListItem[]>(() => {
      const tabs = props.tabs || [];

      if (Array.isArray(tabs)) {
        return tabs.reduce<TabListItem[]>((result, tab, index) => {
          if (typeof tab === 'string') {
            result.push({ type: 'tab', key: String(index), label: tab });
            return result;
          }

          if (isDividerItem(tab)) {
            result.push({ type: 'divider' });
            return result;
          }

          if (isLabelItem(tab)) {
            result.push({
              type: 'label',
              label: tab.label,
              iconClass: tab.iconClass
            });
            return result;
          }

          if (isTabItem(tab)) {
            const key = tab.id ?? tab.key ?? tab.value ?? String(index);
            result.push({
              type: 'tab',
              key,
              label: tab.label,
              iconClass: tab.iconClass
            });
          }

          return result;
        }, []);
      }

      return Object.keys(tabs).map(key => ({
        type: 'tab' as const,
        key,
        label: tabs[key]!
      }));
    });

    const tabsByKey = computed<{ [key: string]: TabListTabItem }>(() => {
      const result: { [key: string]: TabListTabItem } = {};
      items.value.forEach(item => {
        if (item.type === 'tab') {
          result[item.key] = item;
        }
      });
      return result;
    });

    const keys = computed(() =>
      items.value.reduce<string[]>((result, item) => {
        if (item.type === 'tab') {
          result.push(item.key);
        }
        return result;
      }, [])
    );

    const isTabActive = (key: string) => internalValue.value === key;

    const getFirstTabKey = () => keys.value[0];

    const shouldSelectFirstTab = () =>
      internalValue.value === undefined ||
      tabsByKey.value[internalValue.value] === undefined;

    const selectFirstTabIfNeeded = () => {
      if (shouldSelectFirstTab()) {
        const firstKey = getFirstTabKey();
        if (firstKey) {
          internalValue.value = firstKey;
          emit('input', firstKey);
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
    const renderItem = (item: TabListItem, index: number) => {
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
        { key: `tab-${item.key}`, staticClass: 'nav-item' },
        [
          createElement(
            'a',
            {
              attrs: { href: '#' },
              staticClass: 'nav-link',
              class: { active: this.isTabActive(item.key) },
              on: {
                click: (event: MouseEvent) => {
                  event.preventDefault();
                  this.handleTabClick(item.key);
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
          this.items.map((item: TabListItem, index: number) =>
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

import {
  defineComponent,
  ref,
  computed,
  watch,
  h,
  type PropType,
  type VNode
} from 'vue';

interface TabsProps {
  modelValue?: string;
  tabs?: { readonly [key: string]: string } | string[];
  fullWidth?: boolean;
  tabClass?: string;
}

const Tabs = defineComponent({
  name: 'Tabs',
  props: {
    modelValue: {
      type: String as PropType<string | undefined>,
      default: undefined
    },
    tabs: {
      type: [Object, Array] as PropType<
        { readonly [key: string]: string } | string[]
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
  emits: ['update:modelValue', 'input'],
  setup(props: TabsProps, { emit }) {
    const internalValue = ref<string | undefined>(props.modelValue);

    const children = computed(() => {
      let result: { [key: string]: string };
      const tabs = props.tabs || [];

      if (Array.isArray(tabs)) {
        result = {};
        tabs.forEach((tab, index) => {
          result[String(index)] = tab;
        });
      } else {
        result = tabs;
      }

      return result;
    });

    const keys = computed(() => Object.keys(children.value));

    watch(
      () => props.modelValue,
      newValue => {
        internalValue.value = newValue;
      }
    );

    // first-tab auto-select syncs the parent via v-model but must not fire the
    // user-facing 'input' event: it can run during setup before the parent has
    // mounted its refs.
    watch(
      [children, () => props.modelValue],
      () => {
        if (
          internalValue.value === undefined ||
          children.value[internalValue.value] === undefined
        ) {
          const firstKey = keys.value[0];
          if (firstKey !== undefined && firstKey !== internalValue.value) {
            internalValue.value = firstKey;
            emit('update:modelValue', firstKey);
          }
        }
      },
      { immediate: true }
    );

    const handleTabClick = (key: string) => {
      internalValue.value = key;
      emit('update:modelValue', key);
      emit('input', key);
    };

    return {
      internalValue,
      children,
      keys,
      handleTabClick
    };
  },
  render(): VNode {
    return h(
      'div',
      { class: `${this.tabClass} ${this.fullWidth ? 'nav-justified' : ''}` },
      [
        h('ul', { class: `nav ${this.tabClass}` }, [
          this.keys.map((key: string) =>
            h('li', { class: 'nav-item' }, [
              h(
                'a',
                {
                  href: '#',
                  class: ['nav-link', { active: this.internalValue === key }],
                  onClick: () => this.handleTabClick(key)
                },
                [this.children[key]!]
              )
            ])
          ),
          ...(this.fullWidth ? [] : [h('div', { class: 'nav-tab-spacer' })])
        ])
      ]
    );
  }
});

export default Tabs;

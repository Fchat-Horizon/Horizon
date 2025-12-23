<template>
  <dropdown
    class="filterable-select"
    linkClass="form-select"
    :keepOpen="multiple"
    :gap="0"
  >
    <template slot="title" v-if="multiple">{{ label }}</template>
    <slot v-else slot="title" :option="selected">{{ label }}</slot>

    <div class="p-2">
      <input
        v-model="filter"
        class="form-control"
        :placeholder="placeholder"
        @mousedown.stop
        @click.stop
      />
    </div>
    <div class="overflow-auto dropdown-items">
      <template v-if="multiple">
        <a
          href="#"
          @click.stop="select(option)"
          v-for="option in filtered"
          class="dropdown-item d-flex align-items-center"
        >
          <input
            type="checkbox"
            class="form-check-input me-2"
            :checked="isSelected(option)"
          />
          <slot :option="option">{{ option }}</slot>
        </a>
      </template>
      <template v-else>
        <a
          href="#"
          @click="select(option)"
          v-for="option in filtered"
          class="dropdown-item"
        >
          <slot :option="option">{{ option }}</slot>
        </a>
      </template>
    </div>
  </dropdown>
</template>

<script lang="ts">
  import { computed, defineComponent, ref, watch, PropType } from 'vue';
  import Dropdown from '../components/Dropdown.vue';

  export default defineComponent({
    name: 'FilterableSelect',
    components: { dropdown: Dropdown },
    props: {
      placeholder: {
        type: String,
        required: false
      },
      options: {
        type: Array as PropType<object[]>,
        required: true
      },
      filterFunc: {
        type: Function as PropType<(filter: RegExp, value: object) => boolean>,
        default: (filter: RegExp, value: object) => filter.test(String(value))
      },
      multiple: {
        type: null as unknown as PropType<true | undefined>,
        required: false
      },
      value: {
        type: null as unknown as PropType<object | object[] | undefined>,
        required: false
      },
      title: {
        type: String,
        required: false
      }
    },
    setup(props, { emit }) {
      const filter = ref('');

      const normalizeSelected = (value: object | object[] | undefined) =>
        props.multiple !== undefined ? (Array.isArray(value) ? value : []) : value;

      const selected = ref<object | object[] | undefined>(
        normalizeSelected(props.value)
      );

      watch(
        () => props.value,
        newValue => {
          selected.value = normalizeSelected(newValue);
        }
      );

      const filterRegex = computed(
        () => new RegExp(filter.value.replace(/[^\w]/gi, '\\$&'), 'i')
      );

      const filtered = computed(() =>
        props.options.filter(x => props.filterFunc(filterRegex.value, x))
      );

      const selectedList = computed(() =>
        Array.isArray(selected.value) ? selected.value : []
      );

      const label = computed(() => {
        if (props.multiple !== undefined) {
          return `${props.title} - ${selectedList.value.length}`;
        }

        return selected.value !== undefined
          ? selected.value.toString()
          : props.title;
      });

      const select = (item: object) => {
        if (props.multiple !== undefined) {
          const list = selectedList.value;
          const index = list.indexOf(item);
          if (index === -1) list.push(item);
          else list.splice(index, 1);
          selected.value = list;
        } else {
          selected.value = item;
        }
        emit('input', selected.value);
      };

      const isSelected = (option: object) =>
        selectedList.value.indexOf(option) !== -1;

      return {
        filter,
        selected,
        filtered,
        label,
        select,
        isSelected
      };
    }
  });
</script>

<style lang="scss">
  .filterable-select {
    .dropdown-items {
      max-height: 200px;
    }

    button {
      display: flex;
      text-align: start;
    }
  }
</style>

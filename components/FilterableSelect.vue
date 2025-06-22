<template>
  <dropdown
    class="filterable-select"
    linkClass="custom-select"
    :keepOpen="true"
  >
    <template #title v-if="multiple">{{ label }}</template>
    <template v-else #title>
      <slot :option="selected">{{ label }}</slot>
    </template>

    <div style="padding: 10px">
      <input
        v-model="filter"
        class="form-control"
        :placeholder="placeholder"
        @mousedown.stop
      />
    </div>
    <div class="dropdown-items">
      <template v-if="multiple">
        <a
          href="#"
          @click.stop="select(option)"
          v-for="option in filtered"
          :key="optionKey(option)"
          class="dropdown-item"
        >
          <input type="checkbox" :checked="isSelected(option)" />
          <slot :option="option">{{ option }}</slot>
        </a>
      </template>
      <template v-else>
        <a
          href="#"
          @click="select(option)"
          v-for="option in filtered"
          :key="optionKey(option)"
          class="dropdown-item"
        >
          <slot :option="option">{{ option }}</slot>
        </a>
      </template>
    </div>
  </dropdown>
</template>

<script lang="ts">
  import { defineComponent, ref, computed, watch } from 'vue';
  import Dropdown from '../components/Dropdown.vue';

  export default defineComponent({
    name: 'FilterableSelect',
    components: { dropdown: Dropdown },
    props: {
      placeholder: String,
      options: {
        type: Array as () => object[]
      },
      filterFunc: {
        type: Function as unknown as () => (
          filter: RegExp,
          value: object
        ) => boolean,
        default: () => (filter: RegExp, value: any) =>
          filter.test(value.toString())
      },
      multiple: Boolean,
      value: {
        type: [Object, Array] as () => object | object[] | undefined,
        default: undefined
      },
      title: String
    },
    emits: ['input'],
    setup(props, { emit, slots }) {
      const filter = ref('');
      const selected = ref<object | object[] | undefined>(
        props.value !== undefined
          ? props.value
          : props.multiple
            ? []
            : undefined
      );

      watch(
        () => props.value,
        newValue => {
          selected.value = newValue;
        }
      );

      function select(item: object): void {
        if (props.multiple) {
          const arr = Array.isArray(selected.value) ? [...selected.value] : [];
          const index = arr.indexOf(item);
          if (index === -1) arr.push(item);
          else arr.splice(index, 1);
          selected.value = arr;
        } else {
          selected.value = item;
        }
        emit('input', selected.value);
      }

      function isSelected(option: object): boolean {
        return Array.isArray(selected.value)
          ? selected.value.indexOf(option) !== -1
          : false;
      }

      const filterRegex = computed(
        () => new RegExp(filter.value.replace(/[^\w]/gi, '\\$&'), 'i')
      );

      const filtered = computed(() =>
        props.options.filter(x => props.filterFunc(filterRegex.value, x))
      );

      const label = computed(() => {
        if (props.multiple) {
          return `${props.title} - ${Array.isArray(selected.value) ? selected.value.length : 0}`;
        } else {
          return selected.value !== undefined
            ? selected.value.toString()
            : props.title;
        }
      });

      // Helper for v-for key
      function optionKey(option: object) {
        // Try to use a unique property if available, fallback to string
        return (option as any).id ?? option.toString();
      }

      return {
        filter,
        selected,
        select,
        isSelected,
        filtered,
        label,
        filterRegex,
        optionKey
      };
    }
  });
</script>

<style lang="scss">
  .filterable-select {
    .dropdown-items {
      max-height: 200px;
      overflow-y: auto;
    }

    button {
      display: flex;
      text-align: left;
    }

    input[type='checkbox'] {
      vertical-align: text-bottom;
      margin-right: 5px;
    }
  }
</style>

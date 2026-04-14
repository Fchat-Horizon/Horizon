<template>
  <dropdown
    class="filterable-select"
    linkClass="form-select"
    :keepOpen="multiple"
    :gap="0"
    @opened="selectOpened"
    ref="dropdown"
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
        @keydown.enter="enterPressed"
        ref="filterInput"
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
          :class="selected === option ? 'selected' : ''"
        >
          <slot :option="option">{{ option }}</slot>
        </a>
      </template>
    </div>
  </dropdown>
</template>

<script lang="ts">
  import Vue from 'vue';
  import Dropdown from '../components/Dropdown.vue';

  export default Vue.extend({
    components: { dropdown: Dropdown },
    props: {
      placeholder: { type: String, default: 'Filter...' },
      options: { type: Array, required: true as const },
      filterFunc: {
        type: Function,
        default: () => (filter: RegExp, value: unknown) =>
          filter.test(String(value))
      },
      multiple: { type: Boolean, default: undefined },
      value: { default: undefined },
      title: { type: String }
    },
    data() {
      return {
        filter: '',
        selected: (this.value !== undefined
          ? this.value
          : this.multiple !== undefined
            ? []
            : undefined) as unknown | unknown[] | undefined
      };
    },
    computed: {
      filtered(): unknown[] {
        return (this.options as unknown[]).filter((option: unknown) =>
          (this.filterFunc as (filter: RegExp, value: unknown) => boolean)(
            this.filterRegex,
            option
          )
        );
      },
      label(): string | undefined {
        if (this.multiple !== undefined) {
          return `${this.title} - ${
            Array.isArray(this.selected) ? this.selected.length : 0
          }`;
        }

        return this.selected !== undefined ? String(this.selected) : this.title;
      },
      filterRegex(): RegExp {
        return new RegExp(this.filter.replace(/[^A-Za-z0-9_]/g, '\\$&'), 'i');
      }
    },
    watch: {
      value(newValue: unknown): void {
        this.selected = newValue;
      }
    },
    methods: {
      select(item: unknown): void {
        if (this.multiple !== undefined) {
          const selected = Array.isArray(this.selected)
            ? (this.selected as unknown[])
            : [];
          const index = selected.indexOf(item);
          if (index === -1) selected.push(item);
          else selected.splice(index, 1);
          this.selected = selected;
        } else {
          this.selected = item;
        }

        this.$emit('input', this.selected);
      },
      isSelected(option: unknown): boolean {
        if (Array.isArray(this.selected)) {
          return this.selected.indexOf(option) !== -1;
        }

        return this.selected === option;
      },
      selectOpened() {
        this.$nextTick(() => {
          (this.$refs['filterInput'] as HTMLInputElement).focus();
        });
      },
      enterPressed() {
        if (this.filtered.length > 0) {
          this.select(this.filtered[0]);
          if (!this.multiple) {
            (this.$refs['dropdown'] as any).isOpen = false;
          }
        }
      }
    }
  });
</script>

<style lang="scss">
  .filterable-select {
    .dropdown-items {
      max-height: 200px;

      .dropdown-item.selected {
        background-color: var(--bs-dropdown-link-active-bg);
        color: var(--bs-dropdown-link-active-color);
      }
    }

    button {
      display: flex;
      text-align: start;
    }
  }
</style>

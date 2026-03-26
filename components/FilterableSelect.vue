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
          :class="value === option ? 'selected' : ''"
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
      placeholder: {},
      options: { required: true as const },
      filterFunc: {
        default: () => (filter: RegExp, value: string) => filter.test(value)
      },
      multiple: { default: undefined },
      value: { default: undefined },
      title: {}
    },
    data() {
      return {
        filter: '',
        selected: (this.value !== undefined
          ? this.value
          : this.multiple !== undefined
            ? []
            : undefined) as object | object[] | undefined
      };
    },
    computed: {
      filtered(): object[] {
        return this.options.filter((x: object) =>
          this.filterFunc(this.filterRegex, x)
        );
      },
      label(): string | undefined {
        return this.multiple !== undefined
          ? `${this.title} - ${(<object[]>this.selected).length}`
          : this.selected !== undefined
            ? this.selected.toString()
            : this.title;
      },
      filterRegex(): RegExp {
        return new RegExp(this.filter.replace(/[^\w]/gi, '\\$&'), 'i');
      }
    },
    watch: {
      value(newValue: object | object[] | undefined): void {
        this.selected = newValue;
      }
    },
    methods: {
      select(item: object): void {
        if (this.multiple !== undefined) {
          const selected = <object[]>this.selected;
          const index = selected.indexOf(item);
          if (index === -1) selected.push(item);
          else selected.splice(index, 1);
        } else this.selected = item;
        this.$emit('input', this.selected);
      },
      isSelected(option: object): boolean {
        return (<object[]>this.selected).indexOf(option) !== -1;
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

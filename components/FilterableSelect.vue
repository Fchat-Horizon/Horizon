<template>
  <dropdown
    class="filterable-select"
    linkClass="custom-select"
    :keepOpen="true"
  >
    <template slot="title" v-if="multiple">{{ label }}</template>
    <slot v-else slot="title" :option="selected">{{ label }}</slot>

    <div style="padding: 10px">
      <input
        v-model="filter"
        class="form-control"
        :placeholder="placeholder"
        @mousedown.stop
      />
    </div>
    <div class="hidden-scrollbar dropdown-items">
      <template v-if="multiple">
        <a
          href="#"
          @click.stop="select(option)"
          v-for="option in filtered"
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
          class="dropdown-item"
        >
          <slot :option="option">{{ option }}</slot>
        </a>
      </template>
    </div>
  </dropdown>
</template>

<script lang="ts">
  import { Component, Prop, Watch } from '@f-list/vue-ts';
  import Vue from 'vue';
  import Dropdown from '../components/Dropdown.vue';

  @Component({
    components: { dropdown: Dropdown }
  })
  export default class FilterableSelect extends Vue {
    @Prop
    readonly placeholder?: string;
    @Prop({ required: true })
    readonly options!: object[];
    @Prop({
      default: () => (filter: RegExp, value: string) => filter.test(value)
    })
    readonly filterFunc!: (filter: RegExp, value: object) => boolean;
    @Prop
    readonly multiple?: true = undefined;
    @Prop
    readonly value?: object | object[] = undefined;
    @Prop
    readonly title?: string;
    filter = '';
    // noinspection TypeScriptValidateTypes
    selected: object | object[] | undefined =
      this.value !== undefined
        ? this.value
        : this.multiple !== undefined
          ? []
          : undefined;

    @Watch('value')
    watchValue(newValue: object | object[] | undefined): void {
      this.selected = newValue;
    }

    select(item: object): void {
      if (this.multiple !== undefined) {
        const selected = <object[]>this.selected;
        const index = selected.indexOf(item);
        if (index === -1) selected.push(item);
        else selected.splice(index, 1);
      } else this.selected = item;
      this.$emit('input', this.selected);
    }

    isSelected(option: object): boolean {
      return (<object[]>this.selected).indexOf(option) !== -1;
    }

    get filtered(): object[] {
      // tslint:disable-next-line:no-unsafe-any
      return this.options.filter(x => this.filterFunc(this.filterRegex, x));
    }

    get label(): string | undefined {
      return this.multiple !== undefined
        ? `${this.title} - ${(<object[]>this.selected).length}`
        : this.selected !== undefined
          ? this.selected.toString()
          : this.title;
    }

    get filterRegex(): RegExp {
      return new RegExp(this.filter.replace(/[^\w]/gi, '\\$&'), 'i');
    }
  }
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

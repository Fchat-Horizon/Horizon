<template>
  <div
    class="character-kink"
    :class="kinkClasses"
    :id="kink.key"
    @click="toggleSubkinks"
    @mouseover.stop="showTooltip = true"
    @mouseout.stop="showTooltip = false"
  >
    <i v-show="kink.hasSubkinks" class="fa" :class="{ 'fa-minus': !listClosed, 'fa-plus': listClosed }"></i>
    <i v-show="!kink.hasSubkinks && kink.isCustom" class="far custom-kink-icon"></i>
    <span class="kink-name">{{ kink.name }}</span>
    <span class="kink-custom-desc" v-if="kink.isCustom && expandedCustom">{{ kink.description }}</span>
    <template v-if="kink.hasSubkinks">
      <div class="subkink-list" :class="{ closed: this.listClosed }">
        <kink v-for="subkink in kink.subkinks" :kink="subkink" :key="subkink.id" :comparisons="comparisons" :highlights="highlights"></kink>
      </div>
    </template>
    <div class="popover popover-top" v-if="showTooltip && (!kink.isCustom || !expandedCustom)">
      <div class="arrow" style="left: 10%"></div>
      <h5 class="popover-header">{{ kink.name }}</h5>
      <div class="popover-body">
        <p>{{ kink.description }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Prop, Watch } from '@f-list/vue-ts';
  import Vue from 'vue';
  import { DisplayKink } from './interfaces';
  import { kinkComparisonSwaps } from '../../learn/matcher-types';

  @Component({ name: 'kink' })
  export default class KinkView extends Vue {
    @Prop({ required: true })
    readonly kink!: DisplayKink;
    @Prop({ required: true })
    readonly highlights!: { [key: number]: boolean };
    @Prop({ required: true })
    readonly comparisons!: { [key: number]: string | undefined };

    @Prop({ required: false })
    // tslint:disable-next-line: vue-props
    expandedCustom = false;

    listClosed = true;
    initialListClosedState = true;
    showTooltip = false;

    @Watch('expandedCustom')
    onExpandedCustomChange(): void {
      if (this.expandedCustom) {
        this.initialListClosedState = this.listClosed;
        this.listClosed = false;
      } else {
        this.listClosed = this.initialListClosedState;
      }
    }

    toggleExpandedCustoms(): void {
      this.expandedCustom = !this.expandedCustom;
    }

    toggleSubkinks(): void {
      if (!this.kink.hasSubkinks) return;

      this.listClosed = !this.listClosed;
      this.initialListClosedState = this.listClosed;
    }

    get kinkClasses(): { [key: string]: boolean } {
      const classes: { [key: string]: boolean } = {
        'stock-kink': !this.kink.isCustom,
        'custom-kink': this.kink.isCustom,
        highlighted: !this.kink.isCustom && this.highlights[this.kink.id],
        subkink: this.kink.hasSubkinks,
        'expanded-custom-kink': this.expandedCustom
      };
      classes[`kink-id-${this.kink.key}`] = true;
      classes[`kink-group-${this.kink.group}`] = true;

      const theirKinkId = this.kink.id in kinkComparisonSwaps ? kinkComparisonSwaps[this.kink.id] : this.kink.id;

      if (!this.kink.isCustom && typeof this.comparisons[theirKinkId] !== 'undefined') {
        classes['comparison-result'] = true;
        classes[`comparison-${this.comparisons[theirKinkId]}`] = true;
      }

      return classes;
    }

    get customId(): number | undefined {
      return this.kink.isCustom ? this.kink.id : undefined;
    }
  }
</script>

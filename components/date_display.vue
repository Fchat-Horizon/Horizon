<template>
  <span class="localizable-date" :title="secondary">{{ primary }}</span>
</template>

<script lang="ts">
  import { Component, Hook, Prop, Watch } from '@f-list/vue-ts';
  import { formatDistanceToNow, format } from 'date-fns';
  import Vue from 'vue';
  import { settings } from '../site/utils';

  @Component
  export default class DateDisplay extends Vue {
    @Prop({ required: true })
    readonly time!: string | null | number;
    primary: string | undefined;
    secondary: string | undefined;

    @Hook('mounted')
    @Watch('time')
    update(): void {
      if (this.time === null || this.time === 0) return;
      const date = isNaN(+this.time) ? new Date(`${this.time}+00:00`) : new Date(+this.time * 1000);
      const absolute = format(date, 'yyyy-MM-dd HH:mm');
      const relative = formatDistanceToNow(date, { addSuffix: true });
      if (settings.fuzzyDates) {
        this.primary = relative;
        this.secondary = absolute;
      } else {
        this.primary = absolute;
        this.secondary = relative;
      }
    }
  }
</script>

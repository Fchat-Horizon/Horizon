<template>
  <div class="scroll-spy" @scroll="onScroll">
    <slot></slot>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';

  export default Vue.extend({
    props: {
      value: { type: Number, default: 0 }
    },
    methods: {
      top(section: Element): number {
        const el = this.$el as HTMLElement;
        return (
          (section as HTMLElement).offsetTop -
          parseFloat(getComputedStyle(el).paddingTop)
        );
      },
      jumpTo(i: number): void {
        this.$el.scrollTop = this.top(this.$el.children[i]);
      },
      onScroll(): void {
        const el = this.$el;
        const i = Math.max(
          0,
          Array.from(el.children).filter(s => this.top(s) <= el.scrollTop + 1)
            .length - 1
        );
        if (i !== this.value) this.$emit('input', i);
      }
    }
  });
</script>

<style lang="scss">
  .scroll-spy {
    position: relative;

    > :last-child {
      min-height: 100%;
    }
  }
</style>

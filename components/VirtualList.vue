<template>
  <div class="virtual-list" ref="scroller" @scroll="onScroll">
    <div class="virtual-list-spacer" :style="{ height: totalHeight + 'px' }">
      <div class="virtual-list-window" :style="{ top: offset + 'px' }">
        <div
          class="virtual-list-row"
          :class="rowClass"
          v-for="(item, index) in visibleItems"
          :key="getItemKey(item, index)"
          :style="{ height: itemHeight + 'px' }"
        >
          <slot :item="item" :index="visibleStart + index"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';

  export default Vue.extend({
    props: {
      items: { required: true as const },
      itemHeight: { required: true as const },
      overscan: { default: 8 },
      keyField: {},
      keyFunc: {},
      rowClass: {},
      resetKey: {}
    },
    data() {
      return {
        scrollTop: 0,
        containerHeight: 0,
        visibleStart: 0,
        visibleEnd: 0,
        scrollRaf: undefined as number | undefined,
        resizeListener: () => this.onResize()
      };
    },
    computed: {
      visibleItems(): ReadonlyArray<any> {
        return this.items.slice(this.visibleStart, this.visibleEnd);
      },
      totalHeight(): number {
        return this.items.length * this.itemHeight;
      },
      offset(): number {
        return this.visibleStart * this.itemHeight;
      },
      scroller(): HTMLElement | undefined {
        return this.$refs['scroller'] as HTMLElement | undefined;
      }
    },
    watch: {
      items(): void {
        this.$nextTick(() => {
          this.updateContainerHeight();
          this.updateVisibleRange();
        });
      },
      itemHeight(): void {
        this.updateVisibleRange();
      },
      overscan(): void {
        this.updateVisibleRange();
      },
      resetKey(): void {
        this.resetScroll();
      }
    },
    mounted(): void {
      this.updateContainerHeight();
      this.updateVisibleRange();
      window.addEventListener('resize', this.resizeListener);
    },
    beforeDestroy(): void {
      if (this.scrollRaf !== undefined) {
        window.cancelAnimationFrame(this.scrollRaf);
      }
      window.removeEventListener('resize', this.resizeListener);
    },
    methods: {
      onResize(): void {
        this.updateContainerHeight();
        this.updateVisibleRange();
      },
      resetScroll(): void {
        const el = this.scroller;
        if (!el) return;
        this.scrollTop = 0;
        el.scrollTop = 0;
        this.updateVisibleRange();
      },
      onScroll(): void {
        if (this.scrollRaf !== undefined) return;
        this.scrollRaf = window.requestAnimationFrame(() => {
          this.scrollRaf = undefined;
          const el = this.scroller;
          if (!el) return;
          this.scrollTop = el.scrollTop;
          if (this.containerHeight !== el.clientHeight) {
            this.containerHeight = el.clientHeight;
          }
          this.updateVisibleRange();
        });
      },
      updateContainerHeight(): void {
        const el = this.scroller;
        if (el) this.containerHeight = el.clientHeight;
      },
      updateVisibleRange(): void {
        const listLength = this.items.length;
        const containerHeight = this.containerHeight;
        const maxScrollTop = Math.max(
          0,
          listLength * this.itemHeight - containerHeight
        );
        const nextScrollTop = Math.min(this.scrollTop, maxScrollTop);
        if (nextScrollTop !== this.scrollTop) {
          this.scrollTop = nextScrollTop;
          const el = this.scroller;
          if (el) el.scrollTop = nextScrollTop;
        }
        const start = Math.max(
          0,
          Math.floor(this.scrollTop / this.itemHeight) - this.overscan
        );
        const visibleCount =
          Math.ceil(containerHeight / this.itemHeight) + this.overscan * 2;
        const end = Math.min(listLength, start + visibleCount);
        this.visibleStart = start;
        this.visibleEnd = end;
      },
      getItemKey(item: any, index: number): string | number {
        const actualIndex = this.visibleStart + index;
        if (this.keyFunc) return this.keyFunc(item, actualIndex);
        if (this.keyField && item && item[this.keyField] !== undefined) {
          return item[this.keyField];
        }
        return actualIndex;
      }
    }
  });
</script>

<style lang="scss">
  .virtual-list {
    position: relative;
    overflow: auto;
  }

  .virtual-list-spacer {
    position: relative;
    width: 100%;
  }

  .virtual-list-window {
    position: absolute;
    left: 0;
    right: 0;
  }

  .virtual-list-row {
    width: 100%;
  }
</style>

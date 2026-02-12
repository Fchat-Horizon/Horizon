<template>
  <div
    class="virtual-list"
    ref="scroller"
    @scroll="onScroll"
    @mousedown="onMouseDown"
  >
    <div class="virtual-list-spacer" :style="{ height: totalHeight + 'px' }">
      <div class="virtual-list-window" :style="{ top: offset + 'px' }">
        <div
          class="virtual-list-row"
          :class="rowClass"
          v-for="(item, index) in visibleItems"
          :key="getItemKey(item, visibleStart + index)"
        >
          <slot
            :item="item"
            :index="visibleStart + index"
            :isScrolling="isScrolling"
          ></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Hook, Prop, Watch } from '@f-list/vue-ts';
  import Vue from 'vue';

  @Component
  export default class VirtualList extends Vue {
    @Prop({ required: true })
    readonly items!: ReadonlyArray<any>;
    @Prop({ required: true })
    readonly itemHeight!: number;
    @Prop({ default: 8 })
    readonly overscan!: number;
    @Prop()
    readonly keyField?: string;
    @Prop()
    readonly keyFunc?: (item: any, index: number) => string | number;
    @Prop()
    readonly rowClass?: string;
    @Prop()
    readonly resetKey?: unknown;
    scrollTop = 0;
    containerHeight = 0;
    visibleStart = 0;
    visibleEnd = 0;
    scrollRaf: number | undefined;
    resizeListener = () => this.onResize();
    isScrolling = false;
    scrollbarHeld = false;
    settleTimer: ReturnType<typeof setTimeout> | undefined;
    mouseUpListener = () => this.onMouseUp();

    heightCache: Map<string | number, number> = new Map();
    totalHeight = 0;
    offset = 0;

    prefixSums: number[] = [0];
    prefixSumsDirty = true;
    programmaticScroll = false;
    measureCooldown = false;

    get visibleItems(): ReadonlyArray<any> {
      return this.items.slice(this.visibleStart, this.visibleEnd);
    }

    getItemHeight(index: number): number {
      const key = this.getItemKey(this.items[index], index);
      return this.heightCache.get(key) ?? this.itemHeight;
    }

    rebuildPrefixSums(): void {
      if (!this.prefixSumsDirty) return;
      const len = this.items.length;
      const sums = new Array(len + 1);
      sums[0] = 0;
      for (let i = 0; i < len; i++) {
        sums[i + 1] = sums[i] + this.getItemHeight(i);
      }
      this.prefixSums = sums;
      this.prefixSumsDirty = false;
    }

    getCumHeight(index: number): number {
      if (index <= 0) return 0;
      if (index < this.prefixSums.length) return this.prefixSums[index];
      return this.prefixSums[this.prefixSums.length - 1];
    }

    findStartIndex(scrollTop: number): number {
      const sums = this.prefixSums;
      let lo = 0;
      let hi = sums.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (sums[mid + 1] <= scrollTop) {
          lo = mid + 1;
        } else {
          hi = mid;
        }
      }
      return lo;
    }

    @Hook('mounted')
    mounted(): void {
      this.updateContainerHeight();
      this.updateVisibleRange();
      window.addEventListener('resize', this.resizeListener);
    }

    @Hook('updated')
    onUpdated(): void {
      this.measureRows();
    }

    @Hook('beforeDestroy')
    beforeDestroy(): void {
      if (this.scrollRaf !== undefined) {
        window.cancelAnimationFrame(this.scrollRaf);
      }
      if (this.settleTimer !== undefined) {
        clearTimeout(this.settleTimer);
      }
      window.removeEventListener('resize', this.resizeListener);
      if (this.scrollbarHeld)
        window.removeEventListener('mouseup', this.mouseUpListener);
    }

    @Watch('items')
    onItemsChange(): void {
      this.prefixSumsDirty = true;
      this.$nextTick(() => {
        this.updateContainerHeight();
        this.updateVisibleRange();
      });
    }

    @Watch('itemHeight')
    onItemHeightChange(): void {
      this.prefixSumsDirty = true;
      this.updateVisibleRange();
    }

    @Watch('overscan')
    onOverscanChange(): void {
      this.updateVisibleRange();
    }

    @Watch('resetKey')
    onResetKeyChange(): void {
      this.heightCache.clear();
      this.prefixSumsDirty = true;
      this.resetScroll();
    }

    get scroller(): HTMLElement | undefined {
      return this.$refs['scroller'] as HTMLElement | undefined;
    }

    onResize(): void {
      this.updateContainerHeight();
      this.updateVisibleRange();
    }

    resetScroll(): void {
      const el = this.scroller;
      if (!el) return;
      this.scrollTop = 0;
      this.programmaticScroll = true;
      el.scrollTop = 0;
      this.isScrolling = false;
      this.updateVisibleRange();
    }

    onMouseDown(e: MouseEvent): void {
      const el = this.scroller;
      if (!el) return;
      const scrollbarStart = el.getBoundingClientRect().left + el.clientWidth;
      if (e.clientX < scrollbarStart) return;
      this.scrollbarHeld = true;
      window.addEventListener('mouseup', this.mouseUpListener, {
        once: true
      });
    }

    onMouseUp(): void {
      this.scrollbarHeld = false;
      if (this.settleTimer !== undefined) clearTimeout(this.settleTimer);
      this.settleTimer = setTimeout(() => {
        this.isScrolling = false;
      }, 150);
    }

    onScroll(): void {
      if (this.programmaticScroll) {
        this.programmaticScroll = false;
        return;
      }
      if (this.settleTimer !== undefined) clearTimeout(this.settleTimer);
      if (!this.scrollbarHeld) {
        this.settleTimer = setTimeout(() => {
          if (this.isScrolling) this.isScrolling = false;
        }, 100);
      }
      if (this.scrollRaf !== undefined) return;
      this.scrollRaf = window.requestAnimationFrame(() => {
        this.scrollRaf = undefined;
        const el = this.scroller;
        if (!el) return;
        const prev = this.scrollTop;
        this.scrollTop = el.scrollTop;
        if (this.containerHeight !== el.clientHeight) {
          this.containerHeight = el.clientHeight;
        }
        const delta = Math.abs(this.scrollTop - prev);
        if (delta > this.containerHeight * 1.5 && !this.isScrolling) {
          this.isScrolling = true;
        }
        this.updateVisibleRange();
        this.$emit('scroll', this.scrollTop);
        if (
          !this.scrollbarHeld &&
          this.scrollTop < this.containerHeight * 0.5
        ) {
          this.$emit('near-top');
        }
      });
    }

    updateContainerHeight(): void {
      const el = this.scroller;
      if (el) this.containerHeight = el.clientHeight;
    }

    updateVisibleRange(): void {
      this.rebuildPrefixSums();
      this.totalHeight = this.getCumHeight(this.items.length);
      const listLength = this.items.length;
      const containerHeight = this.containerHeight;
      const total = this.totalHeight;
      const maxScrollTop = Math.max(0, total - containerHeight);
      const nextScrollTop = Math.min(this.scrollTop, maxScrollTop);
      if (nextScrollTop !== this.scrollTop) {
        this.scrollTop = nextScrollTop;
        const el = this.scroller;
        if (el) {
          this.programmaticScroll = true;
          el.scrollTop = nextScrollTop;
        }
      }

      let start = this.findStartIndex(nextScrollTop);
      start = Math.max(0, start - this.overscan);

      const endThreshold = nextScrollTop + containerHeight;
      let end = start;
      let cum = this.getCumHeight(start);
      while (end < listLength) {
        if (cum >= endThreshold + this.overscan * this.itemHeight) break;
        cum += this.getItemHeight(end);
        end++;
      }
      end = Math.min(listLength, end);

      this.visibleStart = start;
      this.offset = this.getCumHeight(start);
      this.visibleEnd = end;
    }

    measureRows(): void {
      if (this.isScrolling || this.measureCooldown) return;
      const el = this.scroller;
      if (!el) return;
      const listWindow = el.querySelector('.virtual-list-window');
      if (!listWindow) return;
      const rows = listWindow.children;
      let changed = false;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as HTMLElement;
        const actualIndex = this.visibleStart + i;
        if (actualIndex >= this.items.length) break;
        const key = this.getItemKey(this.items[actualIndex], actualIndex);
        const measured = row.offsetHeight;
        if (measured > 0 && this.heightCache.get(key) !== measured) {
          this.heightCache.set(key, measured);
          changed = true;
        }
      }

      if (changed) {
        this.prefixSumsDirty = true;
        this.measureCooldown = true;
        this.updateVisibleRange();
        this.$nextTick(() => {
          this.measureCooldown = false;
        });
      }
    }

    scrollToBottom(): void {
      const el = this.scroller;
      if (!el) return;
      this.prefixSumsDirty = true;
      this.rebuildPrefixSums();
      this.totalHeight = this.getCumHeight(this.items.length);
      this.scrollTop = this.totalHeight;
      this.programmaticScroll = true;
      el.scrollTop = this.totalHeight;
      this.updateVisibleRange();
    }

    adjustScrollForPrepend(addedCount: number): void {
      const el = this.scroller;
      if (!el) return;
      let added = 0;
      for (let i = 0; i < addedCount; i++) {
        added += this.getItemHeight(i);
      }
      this.scrollTop += added;
      this.programmaticScroll = true;
      el.scrollTop += added;
      this.updateVisibleRange();
    }

    getItemKey(item: any, index: number): string | number {
      if (this.keyFunc) return this.keyFunc(item, index);
      if (this.keyField && item && item[this.keyField] !== undefined) {
        return item[this.keyField];
      }
      return index;
    }
  }
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

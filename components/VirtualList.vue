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
        resizeListener: (() => {}) as () => void,
        isScrolling: false,
        scrollbarHeld: false,
        settleTimer: undefined as ReturnType<typeof setTimeout> | undefined,
        mouseUpListener: (() => {}) as () => void,
        resizeObserver: undefined as ResizeObserver | undefined,
        heightCache: new Map<string | number, number>(),
        totalHeight: 0,
        offset: 0,
        prefixSums: [0] as number[],
        prefixSumsDirty: true,
        programmaticScroll: false,
        measureCooldown: false,
        scrollLockedToBottom: false
      };
    },
    computed: {
      visibleItems(): ReadonlyArray<any> {
        return this.items.slice(this.visibleStart, this.visibleEnd);
      },
      scroller(): HTMLElement | undefined {
        return this.$refs['scroller'] as HTMLElement | undefined;
      }
    },
    watch: {
      items(): void {
        this.prefixSumsDirty = true;
        this.$nextTick(() => {
          this.updateContainerHeight();
          this.updateVisibleRange();
        });
      },
      itemHeight(): void {
        this.prefixSumsDirty = true;
        this.updateVisibleRange();
      },
      overscan(): void {
        this.updateVisibleRange();
      },
      resetKey(): void {
        (this.heightCache as Map<string | number, number>).clear();
        this.prefixSumsDirty = true;
        this.resetScroll();
      }
    },
    mounted(): void {
      this.resizeListener = () => this.onResize();
      this.mouseUpListener = () => this.onMouseUp();
      this.updateContainerHeight();
      this.updateVisibleRange();
      window.addEventListener('resize', this.resizeListener);
      const el = this.scroller;
      if (el && typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.onResize());
        this.resizeObserver.observe(el);
      }
    },
    updated(): void {
      this.measureRows();
    },
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
      if (this.resizeObserver) this.resizeObserver.disconnect();
    },
    methods: {
      getItemHeight(index: number): number {
        const key = this.getItemKey(this.items[index], index);
        return (
          (this.heightCache as Map<string | number, number>).get(key) ??
          this.itemHeight
        );
      },

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
      },

      syncSpacerHeight(): void {
        this.rebuildPrefixSums();
        this.totalHeight = this.getCumHeight(this.items.length);
        const el = this.scroller;
        if (el) {
          const spacer = el.querySelector('.virtual-list-spacer') as
            | HTMLElement
            | undefined;
          if (spacer) {
            spacer.style.height = this.totalHeight + 'px';
          }
        }
      },

      getCumHeight(index: number): number {
        if (index <= 0) return 0;
        if (index < this.prefixSums.length) return this.prefixSums[index];
        return this.prefixSums[this.prefixSums.length - 1];
      },

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
      },

      onResize(): void {
        this.updateContainerHeight();
        this.updateVisibleRange();
      },

      resetScroll(): void {
        const el = this.scroller;
        if (!el) return;
        this.scrollLockedToBottom = false;
        this.syncSpacerHeight();
        this.scrollTop = 0;
        this.programmaticScroll = true;
        el.scrollTop = 0;
        this.isScrolling = false;
        this.updateVisibleRange();
      },

      invalidate(): void {
        this.updateContainerHeight();
        (this.heightCache as Map<string | number, number>).clear();
        this.prefixSumsDirty = true;
        this.updateVisibleRange();
      },

      onMouseDown(e: MouseEvent): void {
        const el = this.scroller;
        if (!el) return;
        const scrollbarStart = el.getBoundingClientRect().left + el.clientWidth;
        if (e.clientX < scrollbarStart) return;
        this.scrollbarHeld = true;
        window.addEventListener('mouseup', this.mouseUpListener, {
          once: true
        } as any);
      },

      onMouseUp(): void {
        this.scrollbarHeld = false;
        if (this.settleTimer !== undefined) clearTimeout(this.settleTimer);
        this.settleTimer = setTimeout(() => {
          this.isScrolling = false;
        }, 150);
      },

      onScroll(): void {
        if (this.programmaticScroll) {
          this.programmaticScroll = false;
          return;
        }
        const el = this.scroller;
        if (el) {
          this.scrollLockedToBottom =
            Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) <= 1;
        } else {
          this.scrollLockedToBottom = false;
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
      },

      updateContainerHeight(): void {
        const el = this.scroller;
        if (el) this.containerHeight = el.clientHeight;
      },

      updateVisibleRange(): void {
        this.syncSpacerHeight();
        if (this.scrollLockedToBottom) {
          const targetScrollTop = Math.max(
            0,
            this.totalHeight - this.containerHeight
          );
          this.scrollTop = targetScrollTop;
          const el = this.scroller;
          if (el) {
            this.programmaticScroll = true;
            el.scrollTop = el.scrollHeight - el.clientHeight;
          }
        }

        const listLength = this.items.length;
        const containerHeight = this.containerHeight;
        const total = this.totalHeight;
        const maxScrollTop = Math.max(0, total - containerHeight);
        const nextScrollTop = Math.min(this.scrollTop, maxScrollTop);
        if (nextScrollTop !== this.scrollTop) {
          this.scrollTop = nextScrollTop;
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
        this.visibleEnd = end;

        if (this.scrollLockedToBottom && end === listLength) {
          let windowHeight = 0;
          for (let i = start; i < end; i++) {
            windowHeight += this.getItemHeight(i);
          }
          this.offset = Math.max(0, this.totalHeight - windowHeight);
        } else {
          this.offset = this.getCumHeight(start);
        }
      },

      measureRows(): void {
        if (this.isScrolling || this.scrollbarHeld || this.measureCooldown)
          return;
        const el = this.scroller;
        if (!el) return;
        const listWindow = el.querySelector('.virtual-list-window');
        if (!listWindow) return;
        const rows = listWindow.children;
        let changed = false;
        let heightDiff = 0;
        const firstVisible = this.findStartIndex(this.scrollTop);

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i] as HTMLElement;
          const actualIndex = this.visibleStart + i;
          if (actualIndex >= this.items.length) break;
          const key = this.getItemKey(this.items[actualIndex], actualIndex);
          const measured = row.getBoundingClientRect().height;
          const oldHeight =
            (this.heightCache as Map<string | number, number>).get(key) ??
            this.itemHeight;
          if (measured > 0 && oldHeight !== measured) {
            (this.heightCache as Map<string | number, number>).set(
              key,
              measured
            );
            changed = true;
            if (actualIndex < firstVisible) {
              heightDiff += measured - oldHeight;
            }
          }
        }

        if (changed) {
          this.prefixSumsDirty = true;
          this.measureCooldown = true;
          if (heightDiff !== 0 && !this.scrollLockedToBottom) {
            this.syncSpacerHeight();
            this.scrollTop += heightDiff;
            this.programmaticScroll = true;
            el.scrollTop += heightDiff;
          }
          this.updateVisibleRange();
          this.$nextTick(() => {
            this.measureCooldown = false;
            if (this.scrollLockedToBottom) {
              this.measureRows();
            }
          });
        }
      },

      scrollToBottom(): void {
        const el = this.scroller;
        if (!el) return;
        this.updateContainerHeight();
        this.prefixSumsDirty = true;
        this.scrollLockedToBottom = true;
        this.updateVisibleRange();
      },

      scrollToIndex(index: number, block: 'start' | 'center' = 'center'): void {
        const el = this.scroller;
        if (!el) return;
        this.scrollLockedToBottom = false;
        this.syncSpacerHeight();
        let top = this.getCumHeight(index);
        if (block === 'center') {
          top = Math.max(
            0,
            top - this.containerHeight / 2 + this.getItemHeight(index) / 2
          );
        }
        this.scrollTop = top;
        this.programmaticScroll = true;
        el.scrollTop = top;
        this.updateVisibleRange();
      },

      adjustScrollForPrepend(addedCount: number): void {
        const el = this.scroller;
        if (!el) return;
        this.syncSpacerHeight();
        let added = 0;
        for (let i = 0; i < addedCount; i++) {
          added += this.getItemHeight(i);
        }
        this.scrollTop += added;
        this.programmaticScroll = true;
        el.scrollTop += added;
        this.updateVisibleRange();
      },

      getItemKey(item: any, index: number): string | number {
        if (this.keyFunc) return this.keyFunc(item, index);
        if (this.keyField && item && item[this.keyField] !== undefined) {
          return item[this.keyField];
        }
        return index;
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

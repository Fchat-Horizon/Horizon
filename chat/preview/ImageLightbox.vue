<template>
  <div
    v-if="isOpen"
    class="image-lightbox"
    @click.self="handleBackdropClick()"
    @wheel.prevent="onWheel"
  >
    <button
      v-if="hasMultiple"
      class="image-lightbox-nav image-lightbox-nav-left"
      @click="prev()"
    >
      <i class="fa-solid fa-chevron-left"></i>
    </button>
    <button
      v-if="hasMultiple"
      class="image-lightbox-nav image-lightbox-nav-right"
      @click="next()"
    >
      <i class="fa-solid fa-chevron-right"></i>
    </button>

    <div
      class="image-lightbox-viewport"
      @mousedown="onPanStart"
      @click.self="handleBackdropClick()"
    >
      <div
        v-if="previewLoading"
        class="image-lightbox-spinner spinner-border text-light"
        role="status"
        aria-label="Loading"
      ></div>
      <img
        v-show="!previewLoading"
        :src="currentImageUrl"
        class="image-lightbox-image"
        :style="imageTransformStyle"
        referrerpolicy="no-referrer"
        draggable="false"
        @load="onImageLoad"
        @error="onImageError"
        @click.self="handleImageClick()"
      />
    </div>

    <div class="image-lightbox-controls">
      <span class="image-lightbox-description">
        <template v-if="currentImage.description">
          {{ currentImage.description }}
        </template>
        <i v-else>{{ l('profile.noDescription') }}</i>
      </span>
      <span v-if="hasMultiple" class="image-lightbox-counter">
        {{ currentIndex + 1 }} / {{ images.length }}
      </span>
      <button class="image-lightbox-btn" title="Zoom in" @click="zoomIn()">
        <i class="fa-solid fa-magnifying-glass-plus"></i>
      </button>
      <button class="image-lightbox-btn" title="Zoom out" @click="zoomOut()">
        <i class="fa-solid fa-magnifying-glass-minus"></i>
      </button>
      <button
        class="image-lightbox-btn"
        :class="{ 'copy-success': copySuccess }"
        :title="copySuccess ? 'Copied!' : 'Copy link'"
        @click="copyLink()"
      >
        <i
          :class="copySuccess ? 'fa-solid fa-check' : 'fa-regular fa-copy'"
        ></i>
      </button>
      <a
        :href="currentSourceUrl"
        target="_blank"
        rel="nofollow noreferrer noopener"
        class="image-lightbox-btn"
        title="Open original"
        @click.stop
      >
        <i class="fa-solid fa-arrow-up-right-from-square"></i>
      </a>
      <button class="image-lightbox-btn" title="Close" @click="close()">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';
  import { clipboard } from 'electron';
  import { EventBus, LightboxImage, LightboxOpenEvent } from './event-bus';
  import l from '../localize';

  const MIN_ZOOM = 1;
  const MAX_ZOOM = 10;
  const ZOOM_STEP = 1.25;

  export default Vue.extend({
    data() {
      return {
        l,
        isOpen: false,
        images: [] as LightboxImage[],
        currentIndex: 0,
        previewLoading: true,
        copySuccess: false,
        copyTimer: null as ReturnType<typeof setTimeout> | null,
        keydownListener: null as ((e: KeyboardEvent) => void) | null,

        zoom: 1,
        panX: 0,
        panY: 0,
        isPanning: false,
        panStartX: 0,
        panStartY: 0,
        panOriginX: 0,
        panOriginY: 0,
        mouseMoveListener: null as ((e: MouseEvent) => void) | null,
        mouseUpListener: null as (() => void) | null
      };
    },
    computed: {
      currentImage(): LightboxImage {
        return this.images[this.currentIndex] || { url: '' };
      },
      currentImageUrl(): string {
        return this.currentImage.url;
      },
      currentSourceUrl(): string {
        return this.currentImage.sourceUrl || this.currentImage.url;
      },
      hasMultiple(): boolean {
        return this.images.length > 1;
      },
      isZoomed(): boolean {
        return this.zoom > 1;
      },
      imageTransformStyle(): Record<string, string> {
        if (this.zoom === 1) return {};
        return {
          transform: `scale(${this.zoom}) translate(${this.panX}px, ${this.panY}px)`,
          cursor: this.isPanning ? 'grabbing' : 'grab'
        };
      }
    },
    watch: {
      currentIndex(): void {
        this.previewLoading = true;
        this.resetZoom();
      }
    },
    mounted(): void {
      EventBus.$on('lightbox-open', (event: LightboxOpenEvent) => {
        this.open(event);
      });

      EventBus.$on('lightbox-close', () => {
        this.close();
      });
    },
    beforeDestroy(): void {
      this.removeKeyboardListener();
      this.cleanupPanListeners();

      if (this.copyTimer) {
        clearTimeout(this.copyTimer);
      }
    },
    methods: {
      open(event: LightboxOpenEvent): void {
        if (!event.images || !event.images.length) return;

        this.images = event.images;
        this.currentIndex = event.startIndex || 0;
        this.isOpen = true;
        this.previewLoading = true;
        this.copySuccess = false;
        this.resetZoom();

        this.addKeyboardListener();
      },

      close(): void {
        this.isOpen = false;
        this.images = [];
        this.currentIndex = 0;
        this.previewLoading = true;
        this.copySuccess = false;
        this.resetZoom();
        this.cleanupPanListeners();

        this.removeKeyboardListener();
      },

      prev(): void {
        this.currentIndex =
          (this.currentIndex - 1 + this.images.length) % this.images.length;
      },

      next(): void {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
      },

      onImageLoad(): void {
        this.previewLoading = false;
      },

      onImageError(): void {
        this.previewLoading = false;
      },

      copyLink(): void {
        clipboard.writeText(this.currentSourceUrl);
        this.copySuccess = true;

        if (this.copyTimer) clearTimeout(this.copyTimer);
        this.copyTimer = setTimeout(() => {
          this.copySuccess = false;
          this.copyTimer = null;
        }, 3500);
      },

      resetZoom(): void {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
      },

      setZoom(newZoom: number): void {
        this.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));

        if (this.zoom === 1) {
          this.panX = 0;
          this.panY = 0;
        }
      },

      zoomIn(): void {
        this.setZoom(this.zoom * ZOOM_STEP);
      },

      zoomOut(): void {
        this.setZoom(this.zoom / ZOOM_STEP);
      },

      onWheel(e: WheelEvent): void {
        const direction = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
        this.setZoom(this.zoom * direction);
      },

      onPanStart(e: MouseEvent): void {
        if (!this.isZoomed || e.button !== 0) return;

        this.isPanning = true;
        this.panStartX = e.clientX;
        this.panStartY = e.clientY;
        this.panOriginX = this.panX;
        this.panOriginY = this.panY;

        this.mouseMoveListener = (ev: MouseEvent) => this.onPanMove(ev);
        this.mouseUpListener = () => this.onPanEnd();

        window.addEventListener('mousemove', this.mouseMoveListener);
        window.addEventListener('mouseup', this.mouseUpListener);
      },

      onPanMove(e: MouseEvent): void {
        if (!this.isPanning) return;

        this.panX = this.panOriginX + (e.clientX - this.panStartX) / this.zoom;
        this.panY = this.panOriginY + (e.clientY - this.panStartY) / this.zoom;
      },

      onPanEnd(): void {
        this.isPanning = false;
        this.cleanupPanListeners();
      },

      cleanupPanListeners(): void {
        if (this.mouseMoveListener) {
          window.removeEventListener('mousemove', this.mouseMoveListener);
          this.mouseMoveListener = null;
        }
        if (this.mouseUpListener) {
          window.removeEventListener('mouseup', this.mouseUpListener);
          this.mouseUpListener = null;
        }
      },

      handleBackdropClick(): void {
        if (this.isZoomed) {
          this.resetZoom();
        } else {
          this.close();
        }
      },

      handleImageClick(): void {
        if (!this.isZoomed) {
          this.close();
        }
      },

      onKeydown(e: KeyboardEvent): void {
        if (!this.isOpen) return;

        switch (e.key) {
          case 'Escape':
            if (this.isZoomed) {
              this.resetZoom();
            } else {
              this.close();
            }
            break;
          case 'ArrowLeft':
            if (this.hasMultiple) this.prev();
            break;
          case 'ArrowRight':
            if (this.hasMultiple) this.next();
            break;
        }
      },

      addKeyboardListener(): void {
        if (this.keydownListener) return;
        this.keydownListener = (e: KeyboardEvent) => this.onKeydown(e);
        window.addEventListener('keydown', this.keydownListener);
      },

      removeKeyboardListener(): void {
        if (!this.keydownListener) return;
        window.removeEventListener('keydown', this.keydownListener);
        this.keydownListener = null;
      }
    }
  });
</script>

<style lang="scss" scoped>
  .image-lightbox {
    position: fixed;
    inset: 0;
    z-index: 100000;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .image-lightbox-viewport {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .image-lightbox-image {
    max-width: 90vw;
    max-height: 85vh;
    object-fit: contain;
    border-radius: 4px;
    user-select: none;
    transform-origin: center center;
    transition: transform 0.15s ease;
  }

  .image-lightbox-spinner {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 3rem;
    height: 3rem;
    z-index: 3;
  }

  .image-lightbox-nav {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: white;
    font-size: 1.2rem;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
    transition:
      background 0.15s ease,
      opacity 0.15s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      opacity: 1;
    }

    &.image-lightbox-nav-left {
      left: 16px;
    }

    &.image-lightbox-nav-right {
      right: 16px;
    }
  }

  .image-lightbox-controls {
    position: fixed;
    bottom: 16px;
    right: 16px;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    max-width: calc(100vw - 32px);
  }

  .image-lightbox-description {
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.8);
    padding: 0 6px;
    line-height: 1.25;
  }

  .image-lightbox-counter {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
    padding: 2px 8px;
    white-space: nowrap;
  }

  .image-lightbox-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    padding: 6px 8px;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition:
      background 0.15s ease,
      color 0.15s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      color: white;
    }

    &.copy-success {
      color: rgb(72, 199, 116);
    }
  }
</style>

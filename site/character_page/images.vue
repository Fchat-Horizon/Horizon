<template>
  <!--    <div class="character-images row">-->
  <div
    class="character-images"
    :class="
      previewType === 'thumbnail' || previewType === 'hover' ? 'thumbnails' : ''
    "
  >
    <div v-show="loading && images.length === 0" class="w-100 alert alert-info">
      {{ l('profile.images.loading') }}
    </div>
    <template v-if="!loading">
      <template v-if="previewType === 'thumbnail' || previewType === 'hover'">
        <div
          v-for="image in images"
          :key="image.id"
          class="character-image-thumb-wrapper"
        >
          <template v-if="previewType === 'thumbnail'">
            <a
              @click="handleImageClick($event, image)"
              target="_blank"
              :href="imageUrl(image)"
              :title="image.description"
            >
              <img :src="thumbUrl(image)" class="img-thumbnail expandable" />
            </a>
          </template>
          <template v-else>
            <a
              :href="imageUrl(image)"
              target="_blank"
              :title="image.description"
              @mouseover.prevent="showHoverPreview(image)"
              @mouseenter.prevent="showHoverPreview(image)"
              @mouseleave.prevent="hideHoverPreview(image)"
              @click.middle.prevent.stop="toggleStickyness()"
            >
              <img :src="thumbUrl(image)" class="img-thumbnail" />
            </a>
          </template>
        </div>
      </template>

      <template v-else>
        <div
          v-for="image in images"
          :key="image.id"
          class="character-image-wrapper"
        >
          <a :href="imageUrl(image)" target="_blank">
            <img :src="imageUrl(image)" class="character-image" />
          </a>
          <div class="image-description" v-if="!!image.description">
            {{ image.description }}
          </div>
        </div>
      </template>
    </template>
    <div v-if="!loading && !images.length" class="alert alert-info w-100">
      {{ l('profile.images.none') }}
    </div>
    <div
      class="image-preview"
      v-if="previewImage !== undefined"
      @click="handlePreviewClick($event)"
    >
      <div
        class="image-preview-scroll-area"
        ref="previewScrollArea"
        :class="isPanning ? 'is-panning' : ''"
        @pointerdown="startPreviewPan"
        @pointermove="movePreviewPan"
        @pointerup="endPreviewPan"
        @pointercancel="cancelPreviewPan"
        @lostpointercapture="cancelPreviewPan"
      >
        <div class="image-preview-stage">
          <a
            :href="imageUrl(previewImage)"
            target="_blank"
            class="image-preview-link"
            @dragstart.prevent
            :style="getPreviewLinkStyle()"
          >
            <div
              v-if="previewLoading"
              class="position-fixed top-50 start-50 spinner-border text-dark"
              role="status"
              aria-label="Loading"
            ></div>

            <img
              v-if="previewLoading"
              class="blurred"
              :src="thumbUrl(previewImage)"
              draggable="false"
            />

            <img
              v-if="!previewLoading && previewSrc"
              :src="previewSrc"
              @load="onPreviewLoad"
              @error="onPreviewError"
              draggable="false"
            />
          </a>
        </div>
      </div>
      <div
        class="image-preview-buttons-container d-flex flex-grow-1"
        v-if="images.length > 1"
      >
        <div
          class="preview-buttons-left preview-buttons"
          @click.stop="previewPrev()"
          role="button"
          :title="l('action.backForward.previous')"
        >
          <i class="fa-solid fa-arrow-left preview-arrow"></i>
        </div>
        <div class="preview-buttons-spacer flex-grow-1"></div>
        <div
          class="preview-buttons-right preview-buttons"
          @click.stop="previewNext()"
          role="button"
          :title="l('action.backForward.next')"
        >
          <i class="fa-solid fa-arrow-right preview-arrow"></i>
        </div>
      </div>
      <div class="image-preview-info-outer d-flex align-items-end">
        <div
          class="image-preview-info d-flex flex-grow-1"
          @click.stop
          :class="forceShowInfo ? 'force-show-info' : ''"
        >
          <p class="info-description">
            <span v-if="previewImage.description">
              {{ previewImage.description }}
            </span>
            <i v-else> {{ l('profile.noDescription') }} </i>
          </p>

          <div class="d-flex info-buttons flex-wrap">
            <div class="input-group w-auto buttons-numbers">
              <span
                class="image-preview-numbers input-group-text bg-body-tertiary font-monospace"
                v-if="images.length > 1"
              >
                {{ `${images.indexOf(previewImage) + 1}/${images.length}` }}
              </span>
              <a
                :href="imageUrl(previewImage)"
                class="btn btn-outline-secondary"
                :title="l('action.openBrowser')"
              >
                <i class="fa-solid fa-fw fa-arrow-up-right-from-square"></i>
              </a>
              <button
                type="button"
                class="btn"
                :class="copySuccess ? 'btn-success' : 'btn-outline-primary'"
                @click.stop="copyImageLink(previewImage)"
                :title="
                  copySuccess ? l('action.copy.success') : l('action.copyLink')
                "
              >
                <i
                  class="fa-fw"
                  :class="
                    copySuccess ? 'fa-check fa-solid' : 'fa-regular fa-copy'
                  "
                ></i>
              </button>
            </div>
            <div class="input-group w-auto zoom-controls">
              <button
                class="btn btn-outline-secondary zoom-btn out"
                type="button"
                @click="zoomOutClicked"
                :disabled="zoomLevel <= getZoomMin()"
                :title="l('action.zoom.out')"
              >
                <i class="fa-solid fa-magnifying-glass-minus"></i>
              </button>

              <label
                class="input-group-text bg-body-tertiary zoom-number font-monospace"
              >
                {{ `${zoomLevel}%` }}
              </label>
              <label
                class="input-group-text bg-body-tertiary zoom-range-container"
              >
                <input
                  type="range"
                  class="form-range zoom-range"
                  :min="getZoomMin()"
                  :max="getZoomMax()"
                  v-model.number="zoomLevel"
              /></label>

              <button
                class="btn btn-outline-secondary zoom-btn"
                type="button"
                @click="zoomInClicked"
                :disabled="zoomLevel >= getZoomMax()"
                :title="l('action.zoom.in')"
              >
                <i class="fa-solid fa-magnifying-glass-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop show"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import log from 'electron-log'; //tslint:disable-line:match-default-export-name
  import { onUnmounted, ref, watch } from 'vue';
  import { CharacterImage } from '../../interfaces';
  import * as Utils from '../utils';
  import { methods } from './data_store';
  import { Character } from './interfaces';
  import core from '../../chat/core';
  import _ from 'lodash';
  import l from '../../chat/localize';
  import { Keys } from '../../keys';
  import { getKey } from '../../chat/common';
  import { ProfileViewerGalleryType } from '../utils';
  import { EventBus } from '../../chat/preview/event-bus';

  const props = defineProps<{
    character: Character;
    previewType: ProfileViewerGalleryType;
    animatedThumbs?: boolean;
    injectedImages?: CharacterImage[] | null;
  }>();

  /**
   * The duration (in ms) to force showing image info after user interactions like switching or opening images before allowing it to auto-hide again.
   */
  const FORCE_SHOW_INFO_TIMEOUT = 1500;
  /**
   * The duration (in ms) to show a temporary "link copied" confirmation after copying an image link to clipboard.
   */
  const COPY_SUCCESS_TIMEOUT = 3500;
  /**
   * Minimum zoom level percentage.
   */
  const ZOOM_LEVEL_MIN = 100;
  /**
   * Maximum zoom level percentage.
   */
  const ZOOM_LEVEL_MAX = 200;
  /**
   * The step (in percentage points) to increase or decrease the zoom level when clicking the zoom in/out buttons.
   */
  const ZOOM_LEVEL_STEP = 25;
  /**
   * The minimum distance (in pixels) the pointer must move to be considered a pan gesture when dragging the preview image, to prevent accidental pans when trying to click.
   */
  const PAN_DRAG_THRESHOLD = 5;

  const shown = ref(false);
  const previewImage = ref<CharacterImage>();
  const previewLoading = ref(false);
  const previewSrc = ref('');
  const previewLoadRequestId = ref(0);
  const previewScrollArea = ref<HTMLElement>();
  const previewDisplayWidth = ref(0);
  const previewDisplayHeight = ref(0);
  const previewNaturalWidth = ref(0);
  const previewNaturalHeight = ref(0);
  const zoomLevel = ref(ZOOM_LEVEL_MIN);
  const forceShowInfo = ref(false);
  const copySuccess = ref(false);
  const images = ref<CharacterImage[]>([]);
  const loading = ref(true);
  const error = ref('');
  const isPanning = ref(false);
  const panPointerId = ref<number | null>(null);
  const panStartX = ref(0);
  const panStartY = ref(0);
  const panStartScrollLeft = ref(0);
  const panStartScrollTop = ref(0);
  const panHasMoved = ref(false);
  const ignoreNextClick = ref(false);

  watch(
    () => props.character,
    () => {
      const wasShown = shown.value;

      hidePreview();
      shown.value = false;
      images.value = [];
      loading.value = true;
      //The character prop can sometimes update while the image tab is active (ie, with automated periodic profile data refreshes).
      //This resolves the issue where images are permanently shown as 'loading' after this refresh by re-resolving the image list.
      if (wasShown) {
        show();
      }
    }
  );
  watch(
    () => props.previewType,
    previewType => {
      if (previewType !== 'thumbnail') {
        hidePreview();
      }
    }
  );

  const imageUrl = (image: CharacterImage) => methods.imageUrl(image);
  const thumbUrl = (image: CharacterImage) => {
    return props.animatedThumbs && image.extension === 'gif'
      ? methods.imageUrl(image)
      : methods.imageThumbUrl(image);
  };

  const resolveImages = (): CharacterImage[] => {
    log.debug('profile.images.sync.injected', {
      count: props.injectedImages ? props.injectedImages.length : 0
    });

    if (props.injectedImages && props.injectedImages.length) {
      return props.injectedImages;
    }

    const c = core.cache.profileCache.getSync(props.character.character.name);

    log.debug('profile.images.sync.cache', {
      count: _.get(c, 'meta.images.length')
    });

    if (c && c.meta && c.meta.images) {
      return c.meta.images;
    }

    return [];
  };

  const resolveImagesAsync = async (): Promise<CharacterImage[]> => {
    log.debug('profile.images.async.injected', {
      count: props.injectedImages ? props.injectedImages.length : 0
    });

    if (props.injectedImages && props.injectedImages.length) {
      return props.injectedImages;
    }

    const c = await core.cache.profileCache.get(props.character.character.name);

    log.debug('profile.images.async.cache', {
      count: _.get(c, 'meta.images.length')
    });

    if (c && c.meta && c.meta.images) {
      return c.meta.images;
    }

    const fetchedImages = await methods.imagesGet(props.character.character.id);

    log.debug('profile.images.async.api', { count: fetchedImages.length });

    return fetchedImages;
  };

  const updatePreviewDimensions = (): void => {
    if (!previewNaturalWidth.value || !previewNaturalHeight.value) return;

    //This is an awful piece of [dolphin sounds] that makes sure that the preview image fits in the container at the unzoomed stage.
    //Blame fractional scaling, because we cannot effectively round or floor it to a value that we can ensure is equal or lesser than the container size when the actual size can be various fractions.
    const fitScale = Math.min(
      (window.innerWidth - 1) / previewNaturalWidth.value,
      (window.innerHeight - 1) / previewNaturalHeight.value
    );

    log.debug('profile.images.preview.updateDimensions.fitScale', fitScale);

    previewDisplayWidth.value = Math.floor(
      previewNaturalWidth.value * fitScale
    );
    previewDisplayHeight.value = Math.floor(
      previewNaturalHeight.value * fitScale
    );
  };

  const showAsync = async (): Promise<void> => {
    log.debug('profile.images.show.async', {
      shown: shown.value,
      loading: loading.value
    });

    if (shown.value) return;
    const expectedName = props.character.character.name;
    try {
      error.value = '';
      shown.value = true;
      const result = await resolveImagesAsync();
      if (props.character.character.name !== expectedName) {
        shown.value = false;
        return;
      }
      images.value = result;
    } catch (err) {
      if (props.character.character.name !== expectedName) return;
      shown.value = false;
      if (Utils.isJSONError(err)) error.value = <string>err.response.data.error;
      Utils.ajaxError(err, l('profile.images.unableRefresh'));
      log.error('profile.images.show.async.error', { err });
    }
    loading.value = false;
  };

  const show = (): void => {
    log.debug('profile.images.show', {
      shown: shown.value,
      loading: loading.value
    });

    if (shown.value) {
      return;
    }

    images.value = resolveImages();

    if (images.value.length > 0) {
      loading.value = false;
    }

    // this promise is intentionally not part of a chain
    showAsync().catch(err => log.error('profile.images.error', { err }));
  };

  const showPreview = (image: CharacterImage): void => {
    ignoreNextClick.value = false;
    setPreviewImage(image);
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('resize', updatePreviewDimensions);
    browseTimeOut();
  };

  const onPreviewLoad = (): void => {
    previewLoading.value = false;
  };

  const onPreviewError = (): void => {
    previewLoading.value = false;
  };

  const setPreviewImage = (image: CharacterImage): void => {
    const requestId = ++previewLoadRequestId.value;
    previewLoading.value = true;
    previewSrc.value = '';
    previewNaturalWidth.value = 0;
    previewNaturalHeight.value = 0;
    previewDisplayWidth.value = 0;
    previewDisplayHeight.value = 0;

    const url = imageUrl(image);
    const pre = new Image();

    pre.onload = () => {
      if (requestId !== previewLoadRequestId.value) return;
      previewNaturalWidth.value = pre.naturalWidth || 0;
      previewNaturalHeight.value = pre.naturalHeight || 0;
      updatePreviewDimensions();
      previewSrc.value = url;
      previewLoading.value = false;
    };

    pre.onerror = () => {
      if (requestId !== previewLoadRequestId.value) return;
      previewLoading.value = false;
    };

    pre.src = url;

    previewImage.value = image;
    zoomLevel.value = ZOOM_LEVEL_MIN;
    browseTimeOut();
  };

  const hidePreview = (): void => {
    previewLoadRequestId.value++;
    previewImage.value = undefined;
    previewLoading.value = true;
    previewSrc.value = '';
    previewNaturalWidth.value = 0;
    previewNaturalHeight.value = 0;
    previewDisplayWidth.value = 0;
    previewDisplayHeight.value = 0;
    stopPreviewPan(true);
    ignoreNextClick.value = false;
    window.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('resize', updatePreviewDimensions);
    zoomLevel.value = ZOOM_LEVEL_MIN;
  };

  const handleImageClick = (e: MouseEvent, image: CharacterImage): void => {
    if (props.previewType === 'thumbnail') {
      showPreview(image);
      e.preventDefault();
    }
  };

  const zoomOutClicked = (_e: MouseEvent): void => {
    if (zoomLevel.value <= ZOOM_LEVEL_MIN) return;
    zoomLevel.value = Math.max(
      ZOOM_LEVEL_MIN,
      zoomLevel.value - ZOOM_LEVEL_STEP
    );
  };

  const zoomInClicked = (_e: MouseEvent): void => {
    if (zoomLevel.value >= ZOOM_LEVEL_MAX) return;
    zoomLevel.value = Math.min(
      ZOOM_LEVEL_MAX,
      zoomLevel.value + ZOOM_LEVEL_STEP
    );
  };
  const handlePreviewClick = (e: MouseEvent): void => {
    if (ignoreNextClick.value) {
      ignoreNextClick.value = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    hidePreview();
    e.preventDefault();
  };

  const startPreviewPan = (e: PointerEvent): void => {
    if (e.button !== 0 || !previewScrollArea.value || !previewImage.value) {
      return;
    }

    ignoreNextClick.value = false;
    panPointerId.value = e.pointerId;
    panStartX.value = e.clientX;
    panStartY.value = e.clientY;
    panStartScrollLeft.value = previewScrollArea.value.scrollLeft;
    panStartScrollTop.value = previewScrollArea.value.scrollTop;
    panHasMoved.value = false;
    isPanning.value = false;

    previewScrollArea.value.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const movePreviewPan = (e: PointerEvent): void => {
    if (
      panPointerId.value === null ||
      e.pointerId !== panPointerId.value ||
      !previewScrollArea.value
    ) {
      return;
    }

    const deltaX = e.clientX - panStartX.value;
    const deltaY = e.clientY - panStartY.value;

    if (!panHasMoved.value) {
      const distance = Math.hypot(deltaX, deltaY);
      if (distance < PAN_DRAG_THRESHOLD) {
        return;
      }

      panHasMoved.value = true;
      isPanning.value = true;
    }

    previewScrollArea.value.scrollLeft = panStartScrollLeft.value - deltaX;
    previewScrollArea.value.scrollTop = panStartScrollTop.value - deltaY;
    e.preventDefault();
  };

  const stopPreviewPan = (force = false): void => {
    const scrollArea = previewScrollArea.value;
    const pointerId = panPointerId.value;

    if (
      scrollArea &&
      pointerId !== null &&
      scrollArea.hasPointerCapture(pointerId)
    ) {
      scrollArea.releasePointerCapture(pointerId);
    }

    if (panHasMoved.value && !force) {
      ignoreNextClick.value = true;
    }

    panPointerId.value = null;
    panHasMoved.value = false;
    isPanning.value = false;
  };

  const endPreviewPan = (e: PointerEvent): void => {
    if (panPointerId.value === null || e.pointerId !== panPointerId.value) {
      return;
    }

    stopPreviewPan();
  };

  const cancelPreviewPan = (e: PointerEvent): void => {
    if (panPointerId.value === null || e.pointerId !== panPointerId.value) {
      return;
    }

    stopPreviewPan(true);
  };

  const handleKeydown = (e: KeyboardEvent): void => {
    const key = getKey(e);
    if (!previewImage.value) return;

    if (key === Keys.Escape) {
      hidePreview();
    } else if (key === Keys.ArrowLeft) {
      previewPrev();
      e.preventDefault();
    } else if (key === Keys.ArrowRight) {
      previewNext();
      e.preventDefault();
    }
  };

  const previewPrev = async (): Promise<void> => {
    if (!previewImage) return;
    let targetIndex = images.value.indexOf(
      previewImage.value as CharacterImage
    );
    if (targetIndex <= 0) targetIndex = images.value.length;
    targetIndex--;
    setPreviewImage(images.value[targetIndex]);
  };

  const previewNext = async (): Promise<void> => {
    if (!previewImage) return;
    let targetIndex = images.value.indexOf(
      previewImage.value as CharacterImage
    );
    targetIndex++;
    if (targetIndex >= images.value.length) targetIndex = 0;
    setPreviewImage(images.value[targetIndex]);
  };

  const browseTimeOut = (): void => {
    if (!forceShowInfo.value) {
      log.silly('profile.images.forceShowInfo.timer.start');
      window.setTimeout(() => {
        forceShowInfo.value = false;
      }, FORCE_SHOW_INFO_TIMEOUT);
    }
    forceShowInfo.value = true;
    copySuccess.value = false;
  };

  const showHoverPreview = (image: CharacterImage): void => {
    EventBus.$emit('imagepreview-show', { url: imageUrl(image) });
  };

  const hideHoverPreview = (image: CharacterImage): void => {
    EventBus.$emit('imagepreview-dismiss', {
      url: imageUrl(image),
      force: false
    });
  };

  const toggleStickyness = (): void => {
    //nothing yet
  };

  const getZoomMin = (): number => {
    return ZOOM_LEVEL_MIN;
  };
  const getZoomMax = (): number => {
    return ZOOM_LEVEL_MAX;
  };

  const getPreviewLinkStyle = (): Record<string, string | number> => {
    //This is kind of ugly, but it keeps the image size itself CSS driven. Which I like.
    //Also it's extra ugly because we need a case to handle the blurry placeholder.

    //Too bad!
    const style: Record<string, string | number> = {
      '--zoom-level': zoomLevel.value
    };

    if (previewDisplayWidth.value > 0 && previewDisplayHeight.value > 0) {
      style['--image-width'] = `${previewDisplayWidth.value}px`;
      style['--image-height'] = `${previewDisplayHeight.value}px`;
    }

    return style;
  };

  const copyImageLink = (image: CharacterImage): void => {
    navigator.clipboard.writeText(imageUrl(image));
    copySuccess.value = true;
    window.setTimeout(() => {
      copySuccess.value = false;
    }, COPY_SUCCESS_TIMEOUT);
  };

  defineExpose({
    show
  });

  onUnmounted(() => {
    hidePreview();
  });
</script>

<template>
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
  </div>
</template>

<script setup lang="ts">
  import log from 'electron-log'; //tslint:disable-line:match-default-export-name
  import { ref, watch } from 'vue';
  import { CharacterImage } from '../../interfaces';
  import * as Utils from '../utils';
  import { methods } from './data_store';
  import { Character } from './interfaces';
  import core from '../../chat/core';
  import _ from 'lodash';
  import l from '../../chat/localize';
  import { ProfileViewerGalleryType } from '../utils';
  import { EventBus } from '../../chat/preview/event-bus';

  const props = defineProps<{
    character: Character;
    previewType: ProfileViewerGalleryType;
    animatedThumbs?: boolean;
    injectedImages?: CharacterImage[] | null;
  }>();

  const shown = ref(false);
  const images = ref<CharacterImage[]>([]);
  const loading = ref(true);
  const error = ref('');

  watch(
    () => props.character,
    () => {
      shown.value = false;
      images.value = [];
      loading.value = true;
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

  const handleImageClick = (e: MouseEvent, image: CharacterImage): void => {
    if (props.previewType !== 'thumbnail') return;

    e.preventDefault();
    EventBus.$emit('lightbox-open', {
      images: images.value.map(img => ({
        url: imageUrl(img),
        sourceUrl: imageUrl(img),
        description: img.description || undefined
      })),
      startIndex: images.value.indexOf(image)
    });
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

  defineExpose({
    show
  });
</script>

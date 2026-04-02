<template>
  <!--    <div class="character-images row">-->
  <div class="character-images" :class="usePreview ? 'thumbnails' : ''">
    <div v-show="loading && images.length === 0" class="alert alert-info">
      {{ l('profile.images.loading') }}
    </div>
    <template v-if="!loading">
      <template v-if="usePreview">
        <div
          v-for="image in images"
          :key="image.id"
          class="character-image-thumb-wrapper"
        >
          <a
            @click="handleImageClick($event, image)"
            target="_blank"
            :title="image.description"
          >
            <img :src="thumbUrl(image)" class="img-thumbnail" />
          </a>
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
    <div v-if="!loading && !images.length" class="alert alert-info">
      {{ l('profile.images.none') }}
    </div>
    <div
      class="image-preview"
      v-if="previewImage !== undefined"
      @click="previewImage = undefined"
    >
      <img :src="imageUrl(previewImage)" />
      <div class="image-preview-buttons-container d-flex flex-grow-1">
        <div class="preview-buttons-left preview-buttons">
          <button
            type="button"
            @click.stop="previewPrev()"
            class="btn btn-outline-secondary"
          >
            <i class="fa-solid fa-arrow-left"></i>
          </button>
        </div>
        <div class="preview-buttons-spacer flex-grow-1"></div>
        <div class="preview-buttons-right preview-buttons">
          <button
            type="button"
            @click.stop="previewNext()"
            class="btn btn-outline-secondary"
          >
            <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
      <div class="image-preview-info-outer d-flex align-items-end">
        <div class="image-preview-info d-flex flex-grow-1">
          <p class="flex-grow-1">
            <span v-if="previewImage.description">
              {{ previewImage.description }}
            </span>
            <i v-else> No description set yet. </i>
          </p>
          <span
            class="image-preview-numbers border bg-body-secondary border-secondary-subtle"
          >
            {{ `${images.indexOf(previewImage) + 1}/${images.length}` }}
          </span>
          <div class="inline-box">
            <a :href="imageUrl(previewImage)" class="btn btn-lg btn-link">
              <i class="fa-solid fa-fw fa-arrow-up-right-from-square"></i>
            </a>
            <button
              type="button"
              class="btn btn-lg"
              :class="copySuccess ? 'btn-success' : 'btn-outline-primary'"
              @click.stop="copyImageLink(previewImage)"
            >
              <i
                class="fa-fw"
                :class="
                  copySuccess ? 'fa-check fa-solid' : 'fa-regular fa-copy'
                "
              ></i>
            </button>
          </div>
        </div>
      </div>
      <div class="modal-backdrop show"></div>
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

  const props = defineProps<{
    character: Character;
    usePreview?: boolean;
    animatedThumbs?: boolean;
    injectedImages?: CharacterImage[] | null;
  }>();

  const shown = ref(false);
  const previewImage = ref<CharacterImage>();
  const copySuccess = ref(false);
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
      loading.value = true;
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

    // this promise is intentionally not part of a chain
    showAsync().catch(err => log.error('profile.images.error', { err }));
  };

  const handleImageClick = (e: MouseEvent, image: CharacterImage): void => {
    if (props.usePreview) {
      previewImage.value = image;
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
    previewImage.value = images.value[targetIndex];
  };

  const previewNext = async (): Promise<void> => {
    if (!previewImage) return;
    let targetIndex = images.value.indexOf(
      previewImage.value as CharacterImage
    );
    targetIndex++;
    if (targetIndex >= images.value.length) targetIndex = 0;
    previewImage.value = images.value[targetIndex];
  };

  const copyImageLink = (image: CharacterImage): void => {
    navigator.clipboard.writeText(imageUrl(image));
    copySuccess.value = true;
    window.setTimeout(() => {
      copySuccess.value = false;
    }, 3500);
  };

  defineExpose({
    show
  });
</script>

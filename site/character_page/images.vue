<template>
  <!--    <div class="character-images row">-->
  <div class="character-images">
    <div v-show="loading && images.length === 0" class="alert alert-info">
      {{ l('profile.images.loading') }}
    </div>
    <template v-if="!loading">
      <!-- @click="handleImageClick($event, image)" -->
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
    <div v-if="!loading && !images.length" class="alert alert-info">
      {{ l('profile.images.none') }}
    </div>
    <div class="image-preview" v-show="previewImage" @click="previewImage = ''">
      <img :src="previewImage" />
      <div class="modal-backdrop show"></div>
    </div>
  </div>
</template>

<script lang="ts">
  import log from 'electron-log'; //tslint:disable-line:match-default-export-name
  import { Component, Prop } from '@f-list/vue-ts';
  import Vue from 'vue';
  import { CharacterImage } from '../../interfaces';
  import * as Utils from '../utils';
  import { methods } from './data_store';
  import { Character } from './interfaces';
  import core from '../../chat/core';
  import _ from 'lodash';
  import l from '../../chat/localize';

  @Component
  export default class ImagesView extends Vue {
    @Prop({ required: true })
    private readonly character!: Character;
    @Prop
    private readonly usePreview?: boolean;
    @Prop
    private readonly injectedImages?: CharacterImage[] | null;

    private shown = false;
    previewImage = '';
    images: CharacterImage[] = [];
    loading = true;
    error = '';
    l = l;

    imageUrl = (image: CharacterImage) => methods.imageUrl(image);
    thumbUrl = (image: CharacterImage) => methods.imageThumbUrl(image);

    show(): void {
      log.debug('profile.images.show', {
        shown: this.shown,
        loading: this.loading
      });

      if (this.shown) {
        return;
      }

      this.images = this.resolveImages();

      // this promise is intentionally not part of a chain
      this.showAsync().catch(err => log.error('profile.images.error', { err }));
    }

    async showAsync(): Promise<void> {
      log.debug('profile.images.show.async', {
        shown: this.shown,
        loading: this.loading
      });

      if (this.shown) return;
      try {
        this.error = '';
        this.shown = true;
        this.loading = true;
        this.images = await this.resolveImagesAsync();
      } catch (err) {
        this.shown = false;
        if (Utils.isJSONError(err))
          this.error = <string>err.response.data.error;
        Utils.ajaxError(err, l('profile.images.unableRefresh'));
        log.error('profile.images.show.async.error', { err });
      }
      this.loading = false;
    }

    async resolveImagesAsync(): Promise<CharacterImage[]> {
      log.debug('profile.images.async.injected', {
        count: this.injectedImages ? this.injectedImages.length : 0
      });

      if (this.injectedImages && this.injectedImages.length) {
        return this.injectedImages;
      }

      const c = await core.cache.profileCache.get(
        this.character.character.name
      );

      log.debug('profile.images.async.cache', {
        count: _.get(c, 'meta.images.length')
      });

      if (c && c.meta && c.meta.images) {
        return c.meta.images;
      }

      const images = await methods.imagesGet(this.character.character.id);

      log.debug('profile.images.async.api', { count: images.length });

      return images;
    }

    resolveImages(): CharacterImage[] {
      log.debug('profile.images.sync.injected', {
        count: this.injectedImages ? this.injectedImages.length : 0
      });

      if (this.injectedImages && this.injectedImages.length) {
        return this.injectedImages;
      }

      const c = core.cache.profileCache.getSync(this.character.character.name);

      log.debug('profile.images.sync.cache', {
        count: _.get(c, 'meta.images.length')
      });

      if (c && c.meta && c.meta.images) {
        return c.meta.images;
      }

      return [];
    }

    handleImageClick(e: MouseEvent, image: CharacterImage): void {
      if (this.usePreview) {
        this.previewImage = methods.imageUrl(image);
        e.preventDefault();
      }
    }
  }
</script>

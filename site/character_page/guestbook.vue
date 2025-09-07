<template>
  <div class="guestbook">
    <div v-show="loading" class="alert alert-info">
      {{ l('profile.guestbook.loading') }}
    </div>
    <div class="guestbook-controls">
      <label v-show="canEdit" class="control-label"
        >{{ l('profile.guestbook.unapprovedOnly') }}
        <input type="checkbox" v-model="unapprovedOnly" />
      </label>
      <simple-pager
        :next="hasNextPage"
        :prev="page > 1"
        @next="++page"
        @prev="--page"
      ></simple-pager>
    </div>
    <template v-if="!loading">
      <div class="alert alert-info" v-show="posts.length === 0">
        {{ l('profile.guestbook.none') }}
      </div>
      <guestbook-post
        :character="character"
        :post="post"
        :can-edit="canEdit"
        v-for="post in posts"
        :key="post.id"
        @reload="getPage"
      ></guestbook-post>
      <div v-if="authenticated && !oldApi" class="form-horizontal">
        <bbcode-editor
          v-model="newPost.message"
          :maxlength="5000"
          classes="form-control"
        ></bbcode-editor>
        <input
          type="checkbox"
          id="guestbookPostPrivate"
          v-model="newPost.privatePost"
        />
        <label class="control-label" for="guestbookPostPrivate">{{
          l('profile.guestbook.private')
        }}</label
        ><br />
        <label class="control-label" for="guestbook-post-character"
          >{{ l('common.character') }}
        </label>
        <character-select
          id="guestbook-post-character"
          v-model="newPost.character"
        ></character-select>
        <button
          @click="makePost"
          class="btn btn-success"
          :disabled="newPost.posting"
        >
          {{ l('common.post') }}
        </button>
      </div>
    </template>
    <div class="guestbook-controls">
      <simple-pager
        :next="hasNextPage"
        :prev="page > 1"
        @next="++page"
        @prev="--page"
      ></simple-pager>
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Prop, Watch } from '@f-list/vue-ts';
  import Vue from 'vue';
  import * as Utils from '../utils';
  import { methods, Store } from './data_store';
  import { Character, GuestbookPost, Guestbook } from './interfaces';

  import GuestbookPostView from './guestbook_post.vue';
  import core from '../../chat/core';
  import l from '../../chat/localize';

  @Component({
    components: { 'guestbook-post': GuestbookPostView }
  })
  export default class GuestbookView extends Vue {
    @Prop({ required: true })
    readonly character!: Character;
    @Prop
    readonly oldApi?: true;
    loading = true;
    error = '';
    authenticated = Store.authenticated;
    posts: GuestbookPost[] = [];
    unapprovedOnly = false;
    page = 1;
    hasNextPage = false;
    canEdit = false;
    newPost = {
      posting: false,
      privatePost: false,
      character: Utils.settings.defaultCharacter,
      message: ''
    };
    l = l;

    @Watch('unapprovedOnly')
    @Watch('page')
    async getPage(): Promise<void> {
      try {
        this.loading = true;
        const guestbookState = await this.resolvePage();
        this.posts = guestbookState.posts;
        this.hasNextPage = (this.page + 1) * 10 < guestbookState.total;
      } catch (e) {
        this.posts = [];
        this.hasNextPage = false;
        this.canEdit = false;
        if (Utils.isJSONError(e)) this.error = <string>e.response.data.error;
        Utils.ajaxError(e, l('profile.guestbook.unableLoad'));
      } finally {
        this.loading = false;
      }
    }

    async makePost(): Promise<void> {
      try {
        this.newPost.posting = true;
        await methods.guestbookPostPost(
          this.character.character.id,
          this.newPost.character,
          this.newPost.message,
          this.newPost.privatePost
        );
        this.page = 1;
        await this.getPage();
      } catch (e) {
        Utils.ajaxError(e, l('profile.guestbook.unablePost'));
      } finally {
        this.newPost.posting = false;
      }
    }

    async resolvePage(): Promise<Guestbook> {
      if (this.page === 1) {
        const c = await core.cache.profileCache.get(
          this.character.character.name
        );

        if (c && c.meta && c.meta.guestbook) {
          return c.meta.guestbook;
        }
      }

      return methods.guestbookPageGet(
        this.character.character.id,
        (this.page - 1) * 10,
        10,
        this.unapprovedOnly
      );
      // return methods.guestbookPageGet(this.character.character.id, this.page, this.unapprovedOnly);
    }

    async show(): Promise<void> {
      await this.getPage();
    }
  }
</script>

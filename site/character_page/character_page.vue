<template>
  <div class="row character-page" id="pageBody" ref="pageBody">
    <div class="col-12" style="min-height: 0">
      <div class="alert alert-info" v-show="loading">Loading character information.</div>
      <div class="alert alert-danger" v-show="error">{{ error }}</div>
    </div>
    <div class="col-md-4 col-lg-3 col-xl-2" v-if="!loading && character && character.character && characterMatch && selfCharacter">
      <sidebar :character="character" :characterMatch="characterMatch" @memo="memo" @bookmarked="bookmarked" :oldApi="oldApi"></sidebar>
    </div>
    <div
      class="col-md-8 col-lg-9 col-xl-10 profile-body"
      v-if="!loading && character && character.character && characterMatch && selfCharacter"
    >
      <div id="characterView">
        <div>
          <div v-if="character.ban_reason" id="headerBanReason" class="alert alert-warning">
            This character has been banned and is not visible to the public. Reason:
            <br />
            {{ character.ban_reason }}
            <template v-if="character.timeout"
              ><br />Timeout expires:
              <date :time="character.timeout"></date>
            </template>
          </div>
          <div v-if="character.block_reason" id="headerBlocked" class="alert alert-warning">
            This character has been blocked and is not visible to the public. Reason:
            <br />
            {{ character.block_reason }}
          </div>
          <div v-if="character.memo" id="headerCharacterMemo" class="alert alert-info">Memo: {{ character.memo.memo }}</div>
          <div class="card bg-light">
            <div class="card-header character-card-header">
              <tabs class="card-header-tabs" v-model="tab">
                <span>Overview</span>
                <span>Info</span>
                <span v-if="!oldApi"
                  >Groups <span class="tab-count" v-if="groups !== null">({{ groups.length }})</span></span
                >
                <span
                  >Images <span class="tab-count">({{ character.character.image_count }})</span></span
                >
                <span v-if="character.settings.guestbook"
                  >Guestbook <span class="tab-count" v-if="guestbook !== null">({{ guestbook.posts.length }})</span></span
                >
                <span v-if="character.is_self || character.settings.show_friends"
                  >Friends <span class="tab-count" v-if="friends !== null">({{ friends.length }})</span></span
                >
                <span>Recon</span>
              </tabs>
            </div>
            <div class="card-body">
              <div class="tab-content">
                <div role="tabpanel" v-show="tab === '0'" id="overview">
                  <match-report :characterMatch="characterMatch" v-if="shouldShowMatch()"></match-report>

                  <div style="margin-bottom: 10px" class="character-description">
                    <bbcode :text="character.character.description"></bbcode>
                  </div>

                  <character-kinks
                    :character="character"
                    :oldApi="oldApi"
                    ref="tab0"
                    :autoExpandCustoms="autoExpandCustoms"
                  ></character-kinks>
                </div>
                <div role="tabpanel" v-show="tab === '1'" id="infotags">
                  <character-infotags :character="character" ref="tab1" :characterMatch="characterMatch"></character-infotags>
                </div>
                <div role="tabpanel" v-show="tab === '2'" v-if="!oldApi">
                  <character-groups :character="character" ref="tab2"></character-groups>
                </div>
                <div role="tabpanel" v-show="tab === '3'">
                  <character-images
                    :character="character"
                    ref="tab3"
                    :use-preview="imagePreview"
                    :injected-images="images"
                  ></character-images>
                </div>
                <div v-if="character.settings.guestbook" role="tabpanel" v-show="tab === '4'" id="guestbook">
                  <character-guestbook :character="character" :oldApi="oldApi" ref="tab4"></character-guestbook>
                </div>
                <div v-if="character.is_self || character.settings.show_friends" role="tabpanel" v-show="tab === '5'" id="friends">
                  <character-friends :character="character" ref="tab5"></character-friends>
                </div>
                <div role="tabpanel" v-show="tab === '6'">
                  <character-recon :character="character" ref="tab6"></character-recon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import * as _ from 'lodash';

  import { Component, Hook, Prop, Watch } from '@f-list/vue-ts';
  import Vue from 'vue';
  import log from 'electron-log'; //tslint:disable-line:match-default-export-name

  import { StandardBBCodeParser } from '../../bbcode/standard';
  import { BBCodeView } from '../../bbcode/view';
  import { CharacterCacheRecord } from '../../learn/profile-cache';
  import * as Utils from '../utils';
  import { methods, Store } from './data_store';
  import { Character, CharacterGroup, Guestbook, SharedStore } from './interfaces';

  import DateDisplay from '../../components/date_display.vue';
  import Tabs from '../../components/tabs';
  import FriendsView from './friends.vue';
  import GroupsView from './groups.vue';
  import GuestbookView from './guestbook.vue';
  import ImagesView from './images.vue';
  import InfotagsView from './infotags.vue';
  import CharacterKinksView from './kinks.vue';
  import ReconView from './recon.vue';
  import Sidebar from './sidebar.vue';
  import core from '../../chat/core';
  import { Matcher, MatchReport } from '../../learn/matcher';
  import MatchReportView from './match-report.vue';
  import { CharacterImage, SimpleCharacter } from '../../interfaces';

  const CHARACTER_CACHE_EXPIRE = 7 * 24 * 60 * 60 * 1000; // 7 days (milliseconds)
  const CHARACTER_META_CACHE_EXPIRE = 7 * 24 * 60 * 60 * 1000; // 7 days (milliseconds)

  interface ShowableVueTab extends Vue {
    show?(): void;
  }

  const standardParser = new StandardBBCodeParser();

  @Component({
    components: {
      sidebar: Sidebar,
      date: DateDisplay,
      tabs: Tabs,
      'character-friends': FriendsView,
      'character-guestbook': GuestbookView,
      'character-groups': GroupsView,
      'character-infotags': InfotagsView,
      'character-images': ImagesView,
      'character-kinks': CharacterKinksView,
      'character-recon': ReconView,
      'match-report': MatchReportView,
      bbcode: BBCodeView(standardParser)
    }
  })
  export default class CharacterPage extends Vue {
    @Prop
    readonly name?: string;
    @Prop
    readonly id?: number;
    @Prop({ required: true })
    readonly authenticated!: boolean;
    @Prop
    readonly oldApi?: true;
    @Prop
    readonly imagePreview?: true;

    shared: SharedStore = Store;
    character: Character | undefined;
    loading = true;
    refreshing = false;
    error = '';
    tab = '0';
    autoExpandCustoms = false;

    /* guestbookPostCount: number | null = null;
        friendCount: number | null = null;
        groupCount: number | null = null; */

    guestbook: Guestbook | null = null;
    friends: SimpleCharacter[] | null = null;
    groups: CharacterGroup[] | null = null;
    images: CharacterImage[] | null = null;

    selfCharacter: Character | undefined;
    characterMatch: MatchReport | undefined;

    @Hook('beforeMount')
    beforeMount(): void {
      this.shared.authenticated = this.authenticated;

      // console.log('Beforemount');
    }

    @Hook('mounted')
    async mounted(): Promise<void> {
      await this.load(false);

      // console.log('mounted');
    }

    @Watch('tab')
    switchTabHook(): void {
      const target = <ShowableVueTab>this.$refs[`tab${this.tab}`];
      //tslint:disable-next-line:no-unbound-method
      if (typeof target.show === 'function') target.show();
    }

    @Watch('name')
    async onCharacterSet(): Promise<void> {
      this.tab = '0';
      this.autoExpandCustoms = core.state.settings.risingAutoExpandCustomKinks;

      await this.load();

      // Kludge kluge
      this.$nextTick(() => {
        const el = document.querySelector('.modal .profile-viewer .modal-body');

        if (!el) {
          console.error('Could not find modal body for profile view');
          return;
        }

        el.scrollTo(0, 0);
      });
    }

    shouldShowMatch(): boolean {
      if (this.character?.character.name === 'YiffBot 4000') {
        return false;
      }

      return core.state.settings.risingAdScore;
    }

    async reload(): Promise<void> {
      await this.load(true, true);

      const target = <ShowableVueTab>this.$refs[`tab${this.tab}`];

      //tslint:disable-next-line:no-unbound-method
      if (typeof target.show === 'function') target.show();
    }

    async load(mustLoad: boolean = true, skipCache: boolean = false): Promise<void> {
      this.loading = true;
      this.refreshing = false;
      this.error = '';

      try {
        const due: Promise<void>[] = [];

        if (this.name === undefined || this.name.length === 0) return;

        await methods.fieldsGet();

        if (
          (this.selfCharacter === undefined && Utils.settings.defaultCharacter >= 0) ||
          _.get(this.selfCharacter, 'character.name') !== core.characters.ownCharacter.name
        ) {
          due.push(this.loadSelfCharacter());
        }

        if (mustLoad || this.character === undefined) due.push(this._getCharacter(skipCache));

        await Promise.all(due);
      } catch (e) {
        console.error(e);

        this.error = Utils.isJSONError(e) ? <string>e.response.data.error : (<Error>e).message;
        Utils.ajaxError(e, 'Failed to load character information.');
      }

      this.loading = false;
    }

    async updateGuestbook(): Promise<void> {
      try {
        if (!this.character || !_.get(this.character, 'settings.guestbook')) {
          this.guestbook = null;
          return;
        }

        this.guestbook = await methods.guestbookPageGet(this.character.character.id, 1);
      } catch (err) {
        console.error(err);
        this.guestbook = null;
      }
    }

    async updateGroups(): Promise<void> {
      try {
        if (!this.character || this.oldApi) {
          this.groups = null;
          return;
        }

        this.groups = await methods.groupsGet(this.character.character.id);
      } catch (err) {
        console.error('Update groups', err);
        this.groups = null;
      }
    }

    async updateFriends(): Promise<void> {
      try {
        if (!this.character || (!this.character.is_self && !this.character.settings.show_friends)) {
          this.friends = null;
          return;
        }

        this.friends = await methods.friendsGet(this.character.character.id);
      } catch (err) {
        console.error('Update friends', err);
        this.friends = null;
      }
    }

    async updateImages(): Promise<void> {
      try {
        if (!this.character) {
          this.images = null;
          return;
        }

        this.images = await methods.imagesGet(this.character.character.id);
      } catch (err) {
        console.error('Update images', err);
        this.images = null;
      }
    }

    async updateMeta(name: string): Promise<void> {
      await Promise.all([this.updateImages(), this.updateGuestbook(), this.updateFriends(), this.updateGroups()]);

      await core.cache.profileCache.registerMeta(name, {
        lastMetaFetched: new Date(),
        groups: this.groups,
        friends: this.friends,
        guestbook: this.guestbook,
        images: this.images
      });
    }

    memo(memo: { id: number; memo: string }): void {
      Vue.set(this.character!, 'memo', memo);

      void core.cache.profileCache.register(this.character!);
    }

    bookmarked(state: boolean): void {
      Vue.set(this.character!, 'bookmarked', state);

      void core.cache.profileCache.register(this.character!);
    }

    protected async loadSelfCharacter(): Promise<void> {
      // console.log('SELF');

      // const ownChar = core.characters.ownCharacter;

      // this.selfCharacter = await methods.characterData(ownChar.name, -1);
      this.selfCharacter = core.characters.ownProfile;

      // console.log('SELF LOADED');

      this.updateMatches();
    }

    private async fetchCharacterCache(): Promise<CharacterCacheRecord | null> {
      if (!this.name) {
        throw new Error('A man must have a name');
      }

      // tslint:disable-next-line: await-promise
      return (await core.cache.profileCache.get(this.name)) || null;
    }

    private async _getCharacter(skipCache: boolean = false): Promise<void> {
      log.debug('profile.getCharacter', { name: this.name });

      this.character = undefined;
      this.friends = null;
      this.groups = null;
      this.guestbook = null;
      this.images = null;

      if (!this.name) {
        return;
      }

      const cache = await this.fetchCharacterCache();

      this.character = cache && !skipCache ? cache.character : await methods.characterData(this.name, this.id, false);

      standardParser.inlines = this.character.character.inlines;

      if (cache && cache.meta) {
        this.guestbook = cache.meta.guestbook;
        this.friends = cache.meta.friends;
        this.groups = cache.meta.groups;
        this.images = cache.meta.images;
      }

      if (
        cache &&
        !skipCache &&
        cache.meta &&
        cache.meta.lastMetaFetched &&
        Date.now() - cache.meta.lastMetaFetched.getTime() < CHARACTER_META_CACHE_EXPIRE
      ) {
        // do nothing
      } else {
        log.debug('profile.updateMeta', {
          timestamp: cache?.meta?.lastMetaFetched,
          diff: Date.now() - (cache?.meta?.lastMetaFetched?.getTime() || 0)
        });

        // No await on purpose:
        // tslint:disable-next-line no-floating-promises
        this.updateMeta(this.name).catch(err => console.error('profile.updateMeta', err));
      }

      // console.log('LoadChar', this.name, this.character);
      this.updateMatches();

      // old profile cache, let's refresh
      if (cache && cache.lastFetched) {
        if (Date.now() - cache.lastFetched.getTime() >= CHARACTER_CACHE_EXPIRE) {
          // No await on purpose:
          // tslint:disable-next-line no-floating-promises
          this.refreshCharacter();
        }
      }
    }

    private async refreshCharacter(): Promise<void> {
      this.refreshing = true;

      try {
        const character = await methods.characterData(this.name, this.id, false);

        if (!this.refreshing || this.name !== character.character.name) {
          return;
        }

        this.character = character;

        this.updateMatches();

        // No awaits on these on purpose:
        // tslint:disable-next-line no-floating-promises
        this.updateMeta(this.name);
      } finally {
        this.refreshing = false;
      }
    }

    private updateMatches(): void {
      if (!this.selfCharacter || !this.character) return;

      this.characterMatch = Matcher.identifyBestMatchReport(this.selfCharacter.character, this.character.character);

      // console.log('Match', this.selfCharacter.character.name, this.character.character.name, this.characterMatch);
    }
  }
</script>

<style lang="scss">
  .compare-highlight-block {
    margin-bottom: 3px;

    .quick-compare-block button {
      margin-left: 2px;
    }
  }

  .character-kinks-block {
    i.fa {
      margin-right: 0.25rem;
    }

    .character-kink {
      .popover {
        display: block;
        bottom: 100%;
        top: initial;
        // margin-bottom:5px;

        min-width: 200px;
        margin-bottom: 0;
        padding-bottom: 0;

        opacity: 1;
      }

      p {
        line-height: 125%;
      }

      p:last-child {
        margin-bottom: 0;
      }

      &.comparison-result {
        margin: -4px;
        padding: 4px;
        padding-top: 2px;
        padding-bottom: 2px;
        margin-top: 1px;
        margin-bottom: 1px;
        border-radius: 3px;
      }
    }
  }

  .expanded-custom-kink {
    .custom-kink {
      margin-top: 14px;
      margin-bottom: 14px;
    }
  }

  .custom-kink {
    &:first-child {
      margin-top: 0;
    }

    &:last-child {
      margin-bottom: 0;
    }

    .kink-name {
      font-weight: bold;
      color: var(--characterKinkCustomColor);
    }

    i {
      color: var(--characterKinkCustomColor);
    }

    margin-top: 7px;
    margin-bottom: 7px;
    margin-left: -6px;
    margin-right: -6px;
    border: 1px var(--characterKinkCustomBorderColor) solid;
    border-radius: 2px;
    /* border-collapse: collapse; */
    padding: 5px;
  }

  .stock-kink {
    .kink-name,
    i {
      color: var(--characterKinkStockColor);
      font-weight: normal;
    }

    &.highlighted {
      .kink-name,
      i {
        font-weight: bold;
        color: var(--characterKinkStockHighlightedColor);
      }
    }
  }

  .character-kinks-block {
    .highlighting {
      .character-kink.stock-kink {
        .kink-name {
          opacity: 0.4;
        }

        &.highlighted {
          .kink-name {
            opacity: 1;
          }
        }
      }
    }
  }

  .kink-custom-desc {
    display: block;
    font-weight: normal;
    font-size: 0.9rem;
    color: var(--characterInfotagColor);
    line-height: 125%;
  }

  .infotag-label {
    display: block;
    /* margin-bottom: 1rem; */
    font-weight: normal !important;
    line-height: 120%;
    font-size: 85%;
    color: var(--characterInfotagColor);
  }

  .infotag-value {
    display: block;
    margin-bottom: 1rem;
    font-weight: bold;
    line-height: 120%;
  }

  .quick-info-value {
    display: block;
    font-weight: bold;
  }

  .quick-info-label {
    display: block;
    /* margin-bottom: 1rem; */
    font-weight: normal !important;
    line-height: 120%;
    font-size: 85%;
    color: var(--characterInfotagColor);
  }

  .quick-info {
    margin-bottom: 1rem;
    font-size: 0.9rem;
    color: var(--characterInfotagColor);
  }

  .guestbook-post {
    margin-bottom: 15px;
    margin-top: 15px;
    background-color: var(--characterGuestbookPostBg);
    border-radius: 5px;
    padding: 15px;
    border: 1px solid var(--characterGuestbookPostBorderColor);

    .characterLink {
      font-size: 20pt;
    }

    .guestbook-timestamp {
      color: var(--characterGuestbookTimestampFg);
      font-size: 85%;
    }

    .guestbook-message {
      margin-top: 10px;
      display: block;
    }

    .guestbook-reply {
      margin-top: 20px;
      background-color: var(--characterGuestbookReplyBg);
      padding: 15px;
      border-radius: 4px;
    }
  }

  .contact-block {
    margin-top: 25px !important;
    margin-bottom: 25px !important;

    .contact-method {
      font-size: 80%;
      display: block;
      margin-bottom: 2px;

      img {
        border-radius: 2px;
      }
    }
  }

  #character-page-sidebar .character-list-block {
    .character-avatar.icon {
      height: 43px !important;
      width: 43px !important;
      border-radius: 3px;
    }

    .characterLink {
      font-size: 85%;
      padding-left: 3px;
    }
  }

  .character-images {
    column-width: auto;
    column-count: 2;
    column-gap: 0.5rem;

    .character-image-wrapper {
      display: inline-block;
      background-color: var(--characterImageWrapperBg);
      border-radius: 5px;
      box-sizing: border-box;
      margin: 5px;

      a {
        border: none;

        img {
          max-width: 100% !important;
          width: 100% !important;
          height: auto !important;
          object-fit: contain;
          object-position: top center;
          vertical-align: top !important;
          border-radius: 6px;
        }
      }

      .image-description {
        font-size: 85%;
        padding-top: 5px;
        padding-bottom: 5px;
        padding-left: 10px;
        padding-right: 10px;
      }
    }
  }

  .infotag {
    &.match-score {
      padding-top: 2px;
      padding-left: 4px;
      padding-right: 4px;
      margin-left: -4px;
      margin-right: -4px;
      border-radius: 2px;
      padding-bottom: 2px;
      margin-bottom: 1rem;

      .infotag-value {
        margin-bottom: 0;
      }
    }
  }

  .match-report {
    display: flex;
    flex-direction: row;
    background-color: var(--scoreReportBg);
    /* width: 100%; */
    margin-top: -1.2rem;
    margin-left: -1.2rem;
    margin-right: -1.2rem;
    padding: 1rem;
    margin-bottom: 1rem;
    padding-bottom: 0;
    padding-top: 0.5rem;

    .thumbnail {
      width: 50px;
      height: 50px;
    }

    &.minimized {
      height: 0;
      overflow: hidden;
      background-color: transparent;

      .vs,
      .scores {
        display: none;
      }

      .minimize-btn {
        opacity: 0.6;
      }
    }

    h3 {
      font-size: 1.25rem;
    }

    .minimize-btn {
      position: absolute;
      display: block;
      right: 0.5rem;
      background-color: var(--scoreMinimizeButtonBg);
      padding: 0.4rem;
      padding-top: 0.2rem;
      padding-bottom: 0.2rem;
      font-size: 0.8rem;
      color: var(--scoreMinimizeButtonFg);
      border-radius: 4px;
      z-index: 1000;
    }

    .scores {
      float: left;
      flex: 1;
      margin: 0;
      max-width: 25rem;

      &.you {
        margin-right: 1rem;
      }

      &.them {
        margin-left: 1rem;
      }

      .species {
        display: inline-block;
        color: var(--characterInfotagColor);
        // opacity: 0.7;
      }

      ul {
        padding: 0;
        list-style: none;
      }

      .match-score {
        font-size: 0.85rem;
        border-radius: 2px;
        margin-bottom: 4px;
        padding: 2px;
        padding-left: 4px;
        padding-right: 4px;

        span {
          color: var(--scoreTitleColor);
          font-weight: bold;
        }
      }
    }

    .vs {
      margin-left: 1rem;
      margin-right: 1rem;
      text-align: center;
      font-size: 5rem;
      line-height: 0;
      color: rgba(255, 255, 255, 0.3);
      margin-top: auto;
      margin-bottom: auto;
      font-style: italic;
      font-family: 'Times New Roman', Georgia, serif;
    }
  }

  .character-kinks-block .character-kink.comparison-favorite,
  .match-report .scores .match-score.match,
  .infotag.match {
    background-color: var(--scoreMatchBg);
    border: solid 1px var(--scoreMatchFg);
  }

  .character-kinks-block .character-kink.comparison-yes,
  .match-report .scores .match-score.weak-match,
  .infotag.weak-match {
    background-color: var(--scoreWeakMatchBg);
    border: 1px solid var(--scoreWeakMatchFg);
  }

  .character-kinks-block .character-kink.comparison-maybe,
  .match-report .scores .match-score.weak-mismatch,
  .infotag.weak-mismatch {
    background-color: var(--scoreWeakMismatchBg);
    border: 1px solid var(--scoreWeakMismatchFg);
  }

  .character-kinks-block .character-kink.comparison-no,
  .match-report .scores .match-score.mismatch,
  .infotag.mismatch {
    background-color: var(--scoreMismatchBg);
    border: 1px solid var(--scoreMismatchFg);
  }

  .character-kinks-block .highlighting {
    .character-kink {
      &.comparison-favorite {
        background-color: var(--scoreFadedMatchBg);
        border-color: var(--scoreFadedMatchFg);

        &.highlighted {
          background-color: var(--scoreMatchBg);
          border-color: var(--scoreMatchFg);
        }
      }

      &.comparison-yes {
        background-color: var(--scoreWeakMatchBg);
        border-color: var(--scoreWeakMatchFg);

        &.highlighted {
          background-color: var(--scoreWeakMatchBg);
          border-color: var(--scoreWeakMatchFg);
        }
      }

      &.comparison-maybe {
        background-color: var(--scoreWeakMismatchBg);
        border-color: var(--scoreWeakMismatchFg);

        &.highlighted {
          background-color: var(--scoreWeakMismatchBg);
          border-color: var(--scoreWeakMismatchFg);
        }
      }

      &.comparison-no {
        background-color: var(--scoreMismatchBg);
        border-color: var(--scoreMismatchFg);

        &.highlighted {
          background-color: var(--scoreMismatchBg);
          border-color: var(--scoreMismatchFg);
        }
      }
    }
  }

  .tab-count {
    color: var(--tabSecondaryFgColor);
  }

  .character-card-header {
    position: sticky;
    top: -1rem;
    z-index: 10000;
    background: var(--headerBackgroundMaskColor) !important;
  }

  .character-description .bbcode {
    white-space: pre-line !important;

    blockquote {
      margin: 0;
      background-color: var(--characterImageWrapperBg);
      padding: 1em;
      border-radius: 3px;

      .quoteHeader {
        border-bottom: 1px solid;
        text-transform: uppercase;
        font-weight: bold;
        font-size: 80%;
        opacity: 0.7;
      }
    }
  }
</style>

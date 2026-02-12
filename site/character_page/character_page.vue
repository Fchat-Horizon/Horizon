<template>
  <div class="row character-page" id="pageBody" ref="pageBody">
    <div class="col-md-4 col-lg-3 col-xl-2" v-if="loading || !character">
      <div
        class="card characterpage-placeholder"
        style="height: 100%"
        :class="loading ? 'throbber' : 'bg-light'"
      ></div>
    </div>
    <div
      class="col-md-8 col-lg-9 col-xl-10"
      style="padding-left: 0px"
      v-if="loading || !character"
    >
      <div style="min-height: 0">
        <div class="alert alert-info" v-show="loading">
          {{ l('profile.loadingCharacter') }}
        </div>
        <div class="alert alert-danger" v-show="error">{{ error }}</div>
      </div>

      <div
        class="card characterpage-placeholder"
        :class="loading ? 'throbber' : 'bg-light'"
        style="height: 90%"
      ></div>
    </div>

    <div
      class="col-md-4 col-lg-3 col-xl-2"
      v-if="
        !loading &&
        character &&
        character.character &&
        characterMatch &&
        selfCharacter
      "
    >
      <sidebar
        :character="character"
        :characterMatch="characterMatch"
        @memo="memo"
        @bookmarked="bookmarked"
        :oldApi="oldApi"
      ></sidebar>
    </div>
    <div
      class="col-md-8 col-lg-9 col-xl-10 profile-body"
      v-if="
        !loading &&
        character &&
        character.character &&
        characterMatch &&
        selfCharacter
      "
    >
      <div id="characterView">
        <div>
          <div
            v-if="character.ban_reason"
            id="headerBanReason"
            class="alert alert-warning"
          >
            {{ l('profile.bannedNotice') }}
            {{ l('profile.reason') }}
            <br />
            {{ character.ban_reason }}
            <template v-if="character.timeout"
              ><br />{{ l('profile.timeoutExpires') }}
              <date :time="character.timeout"></date>
            </template>
          </div>
          <div
            v-if="character.block_reason"
            id="headerBlocked"
            class="alert alert-warning"
          >
            {{ l('profile.blockedNotice') }}
            {{ l('profile.reason') }}
            <br />
            {{ character.block_reason }}
          </div>
          <div
            v-if="
              character.memo &&
              character.memo.memo !== null &&
              character.memo.memo !== ''
            "
            id="headerCharacterMemo"
            class="alert alert-info"
          >
            {{ l('conversation.memoLabel') }} {{ character.memo.memo }}
          </div>
          <div class="card bg-light">
            <div class="card-header character-card-header">
              <tabs
                class="card-header-tabs"
                v-model="tab"
                :tabs="tabLabels"
              ></tabs>
            </div>
            <div class="card-body">
              <div class="tab-content">
                <div role="tabpanel" v-show="tab === '0'" id="overview">
                  <template v-if="shouldShowMatch()">
                    <profile-analysis
                      :characterName="character.character.name"
                      :characterId="character.character.id"
                      v-if="character.is_self"
                    >
                    </profile-analysis>
                    <match-report
                      :characterMatch="characterMatch"
                      v-else
                    ></match-report>
                  </template>

                  <div
                    style="margin-bottom: 10px"
                    class="character-description"
                  >
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
                  <character-infotags
                    :character="character"
                    ref="tab1"
                    :characterMatch="characterMatch"
                  ></character-infotags>
                </div>
                <div role="tabpanel" v-show="tab === '2'">
                  <character-images
                    :character="character"
                    ref="tab2"
                    :use-preview="imagePreview"
                    :injected-images="images"
                  ></character-images>
                </div>
                <div
                  v-if="character.settings.guestbook"
                  role="tabpanel"
                  v-show="tab === '3'"
                  id="guestbook"
                >
                  <character-guestbook
                    :character="character"
                    :oldApi="oldApi"
                    ref="tab3"
                  ></character-guestbook>
                </div>
                <div
                  v-if="character.is_self || character.settings.show_friends"
                  role="tabpanel"
                  v-show="tab === '4'"
                  id="friends"
                >
                  <character-friends
                    :character="character"
                    ref="tab4"
                  ></character-friends>
                </div>
                <div role="tabpanel" v-show="tab === '5'">
                  <character-recon
                    :character="character"
                    ref="tab5"
                  ></character-recon>
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

  import anyAscii from 'any-ascii';
  import Vue from 'vue';
  import log from 'electron-log'; //tslint:disable-line:match-default-export-name

  import { StandardBBCodeParser } from '../../bbcode/standard';
  import { BBCodeView } from '../../bbcode/view';
  import { CharacterCacheRecord } from '../../learn/profile-cache';
  import * as Utils from '../utils';
  import { methods, Store } from './data_store';
  import {
    Character,
    CharacterGroup,
    Guestbook,
    SharedStore
  } from './interfaces';

  import DateDisplay from '../../components/date_display.vue';
  import Tabs from '../../components/tabs';
  import FriendsView from './friends.vue';
  import GuestbookView from './guestbook.vue';
  import ImagesView from './images.vue';
  import InfotagsView from './infotags.vue';
  import CharacterKinksView from './kinks.vue';
  import ReconView from './recon.vue';
  import Sidebar from './sidebar.vue';
  import core from '../../chat/core';
  import { Matcher, MatchReport } from '../../learn/matcher';
  import MatchReportView from './match-report.vue';
  import ProfileAnalysis from '../../learn/recommend/ProfileAnalysis.vue';
  import { CharacterImage, SimpleCharacter } from '../../interfaces';
  import l from '../../chat/localize';

  const CHARACTER_CACHE_EXPIRE = 7 * 24 * 60 * 60 * 1000; // 7 days (milliseconds)
  const CHARACTER_META_CACHE_EXPIRE = 7 * 24 * 60 * 60 * 1000; // 7 days (milliseconds)

  interface ShowableVueTab extends Vue {
    show?(): void;
  }

  const standardParser = new StandardBBCodeParser();

  export default Vue.extend({
    components: {
      sidebar: Sidebar,
      date: DateDisplay,
      tabs: Tabs,
      'character-friends': FriendsView,
      'character-guestbook': GuestbookView,
      'character-infotags': InfotagsView,
      'character-images': ImagesView,
      'character-kinks': CharacterKinksView,
      'character-recon': ReconView,
      'match-report': MatchReportView,
      'profile-analysis': ProfileAnalysis,
      bbcode: BBCodeView(standardParser)
    },
    props: {
      name: {},
      id: {},
      authenticated: { required: true as const },
      oldApi: {},
      imagePreview: {}
    },
    data() {
      return {
        shared: Store as SharedStore,
        character: undefined as any as Character | undefined,
        loading: true,
        refreshing: false,
        error: '',
        tab: '0',
        autoExpandCustoms: false,
        guestbook: null as Guestbook | null,
        friends: null as SimpleCharacter[] | null,
        groups: null as CharacterGroup[] | null,
        images: null as CharacterImage[] | null,
        l: l,
        selfCharacter: undefined as any as Character | undefined,
        characterMatch: undefined as any as MatchReport | undefined
      };
    },
    computed: {
      tabLabels(): { [key: string]: string } {
        const labels: { [key: string]: string } = {};

        // Overview tab - key '0'
        labels['0'] = this.l('profile.tab.overview');

        // Info tab - key '1'
        labels['1'] = this.l('profile.tab.info');

        // Images tab - key '2'
        const imageCount = (this as any).character?.character?.image_count || 0;
        labels['2'] = this.l('profile.tab.images') + ` (${imageCount})`;

        // Guestbook tab - key '3'
        if ((this as any).character?.settings?.guestbook) {
          const guestbookCount =
            this.guestbook !== null ? ` (${this.guestbook.posts.length})` : '';
          labels['3'] = this.l('profile.tab.guestbook') + guestbookCount;
        }

        // Friends tab - key '4'
        if (
          (this as any).character?.is_self ||
          (this as any).character?.settings?.show_friends
        ) {
          const friendsCount =
            this.friends !== null ? ` (${this.friends.length})` : '';
          labels['4'] = this.l('profile.tab.friends') + friendsCount;
        }

        // Recon tab - key '5'
        labels['5'] = this.l('profile.tab.recon');

        return labels;
      }
    },
    watch: {
      tab(): void {
        const target = <ShowableVueTab>(this.$refs as any)[`tab${this.tab}`];
        //tslint:disable-next-line:no-unbound-method
        if (typeof target.show === 'function') target.show();
      },
      async name(): Promise<void> {
        this.tab = '0';
        this.autoExpandCustoms =
          core.state.settings.risingAutoExpandCustomKinks;

        await this.load();

        // Kludge kluge
        this.$nextTick(() => {
          const el = document.querySelector(
            '.modal .profile-viewer .modal-body'
          );

          if (!el) {
            console.error('Could not find modal body for profile view');
            return;
          }

          el.scrollTo(0, 0);
        });
      }
    },
    beforeMount(): void {
      this.shared.authenticated = (this as any).authenticated;

      // console.log('Beforemount');
    },
    async mounted(): Promise<void> {
      await this.load(false);

      // console.log('mounted');
    },
    methods: {
      shouldShowMatch(): boolean {
        return core.state.settings.risingAdScore;
      },
      async reload(): Promise<void> {
        await this.load(true, true);

        const target = <ShowableVueTab>(this.$refs as any)[`tab${this.tab}`];

        //tslint:disable-next-line:no-unbound-method
        if (typeof target.show === 'function') target.show();
      },
      async load(
        mustLoad: boolean = true,
        skipCache: boolean = false
      ): Promise<void> {
        this.loading = true;
        this.refreshing = false;
        this.error = '';

        try {
          const due: Promise<void>[] = [];

          if (
            (this as any).name === undefined ||
            (this as any).name.length === 0
          )
            return;

          await methods.fieldsGet();

          if (
            (this.selfCharacter === undefined &&
              Utils.settings.defaultCharacter >= 0) ||
            _.get(this.selfCharacter, 'character.name') !==
              core.characters.ownCharacter.name
          ) {
            due.push(this.loadSelfCharacter());
          }

          if (mustLoad || this.character === undefined)
            due.push(this._getCharacter(skipCache));

          await Promise.all(due);
        } catch (e) {
          console.error(e);

          this.error = Utils.isJSONError(e)
            ? <string>e.response.data.error
            : (<Error>e).message;
          Utils.ajaxError(e, 'Failed to load character information.');
        }

        this.loading = false;
      },
      async updateGuestbook(): Promise<void> {
        try {
          if (!this.character || !_.get(this.character, 'settings.guestbook')) {
            this.guestbook = null;
            return;
          }

          this.guestbook = await methods.guestbookPageGet(
            this.character.character.id,
            1
          );
        } catch (err) {
          console.error(err);
          this.guestbook = null;
        }
      },
      async updateGroups(): Promise<void> {
        try {
          if (!this.character || (this as any).oldApi) {
            this.groups = null;
            return;
          }

          this.groups = await methods.groupsGet(this.character.character.id);
        } catch (err) {
          console.error('Update groups', err);
          this.groups = null;
        }
      },
      async updateFriends(): Promise<void> {
        try {
          if (
            !this.character ||
            (!this.character.is_self && !this.character.settings.show_friends)
          ) {
            this.friends = null;
            return;
          }

          this.friends = await methods.friendsGet(this.character.character.id);
        } catch (err) {
          console.error('Update friends', err);
          this.friends = null;
        }
      },
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
      },
      async updateMeta(name: string): Promise<void> {
        await Promise.all([
          this.updateImages(),
          this.updateGuestbook(),
          this.updateFriends(),
          this.updateGroups()
        ]);

        await core.cache.profileCache.registerMeta(name, {
          lastMetaFetched: new Date(),
          groups: this.groups,
          friends: this.friends,
          guestbook: this.guestbook,
          images: this.images
        });
      },
      memo(memo: { id: number; memo: string | null }): void {
        Vue.set(this.character!, 'memo', memo);

        void core.cache.profileCache.register(this.character!);
      },
      bookmarked(state: boolean): void {
        Vue.set(this.character!, 'bookmarked', state);

        void core.cache.profileCache.register(this.character!);
      },
      async loadSelfCharacter(): Promise<void> {
        // console.log('SELF');

        // const ownChar = core.characters.ownCharacter;

        // this.selfCharacter = await methods.characterData(ownChar.name, -1);
        this.selfCharacter = core.characters.ownProfile;

        // console.log('SELF LOADED');

        this.updateMatches();
      },
      async fetchCharacterCache(): Promise<CharacterCacheRecord | null> {
        if (!(this as any).name) {
          throw new Error('A man must have a name');
        }

        // tslint:disable-next-line: await-promise
        return (await core.cache.profileCache.get((this as any).name)) || null;
      },
      async _getCharacter(skipCache: boolean = false): Promise<void> {
        log.debug('profile.getCharacter', { name: (this as any).name });

        this.character = undefined;
        this.friends = null;
        this.groups = null;
        this.guestbook = null;
        this.images = null;

        if (!(this as any).name) {
          return;
        }

        const cache = await this.fetchCharacterCache();

        this.character =
          cache && !skipCache
            ? cache.character
            : await methods.characterData(
                (this as any).name,
                (this as any).id,
                false
              );

        standardParser.inlines = this.character!.character.inlines;

        this.parseTextToAscii(this.character!);

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
          Date.now() - cache.meta.lastMetaFetched.getTime() <
            CHARACTER_META_CACHE_EXPIRE
        ) {
          // do nothing
        } else {
          log.debug('profile.updateMeta', {
            timestamp: cache?.meta?.lastMetaFetched,
            diff: Date.now() - (cache?.meta?.lastMetaFetched?.getTime() || 0)
          });

          // No await on purpose:
          // tslint:disable-next-line no-floating-promises
          this.updateMeta((this as any).name).catch((err: any) =>
            console.error('profile.updateMeta', err)
          );
        }

        // console.log('LoadChar', this.name, this.character);
        this.updateMatches();

        // old profile cache, let's refresh
        if (cache && cache.lastFetched) {
          if (
            Date.now() - cache.lastFetched.getTime() >=
            CHARACTER_CACHE_EXPIRE
          ) {
            // No await on purpose:
            // tslint:disable-next-line no-floating-promises
            this.refreshCharacter();
          }
        }
      },
      async refreshCharacter(): Promise<void> {
        this.refreshing = true;

        try {
          const character = await methods.characterData(
            (this as any).name,
            (this as any).id,
            false
          );

          if (
            !this.refreshing ||
            (this as any).name !== character.character.name
          ) {
            return;
          }

          this.character = character;

          standardParser.inlines = this.character!.character.inlines;

          this.updateMatches();

          // No awaits on these on purpose:
          // tslint:disable-next-line no-floating-promises
          this.updateMeta((this as any).name);
        } finally {
          this.refreshing = false;
        }
      },
      parseTextToAscii(character: Character): void {
        if (
          core.state.generalSettings &&
          core.state.generalSettings.horizonForceAsciiProfiles
        ) {
          character.character.description = anyAscii(
            character.character.description
          );

          if (character.character.title) {
            character.character.title = anyAscii(character.character.title);
          }

          // We don't do customs and infotags here, so that they are at least sorted before parsing.
          //Check the character_page/kink.vue and infotag.vue components for that
        }
      },
      updateMatches(): void {
        if (!this.selfCharacter || !this.character) return;

        this.characterMatch = Matcher.identifyBestMatchReport(
          this.selfCharacter.character,
          this.character.character
        );

        // console.log('Match', this.selfCharacter.character.name, this.character.character.name, this.characterMatch);
      }
    }
  });
</script>

<style lang="scss">
  #pageBody {
    height: 100%;
  }
  .compare-highlight-block {
    margin-bottom: 3px;

    .quick-compare-block {
      & button {
        margin-left: 2px;
      }
      &.input-group {
        width: initial;
      }
    }
  }
  .characterpage-placeholder {
    height: 100%;
  }
  .kink-block .card-header {
    border-bottom-width: 3px !important;
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
        position: absolute;
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
    }
    &.profile-analysis-wrapper {
      display: block;
    }

    h3 {
      font-size: 1.25rem;
    }

    .minimize-btn {
      position: absolute;
      display: block;
      right: 0.5rem;
      padding: 0.4rem;
      padding-top: 0.2rem;
      padding-bottom: 0.2rem;
      border-radius: 4px;
      z-index: 1000;
    }

    .scores {
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
      text-align: center;
      font-size: 5rem;
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
    z-index: 1000;
    background: var(--headerBackgroundMaskColor) !important;
  }

  .card-header.character-card-header {
    border-bottom: 1px solid transparent;
  }
  .character-description .bbcode {
    white-space: pre-line !important;

    // [sub] and [sup] tags behave slightly differently on profiles and in chat
    sub {
      vertical-align: baseline;
    }

    sup {
      vertical-align: top;
    }

    sub,
    sup {
      line-height: 1.5;
    }

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

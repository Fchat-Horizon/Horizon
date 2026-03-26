<template>
  <div id="character-page-sidebar" class="card bg-light">
    <div class="card-body">
      <img
        :src="getAvatarUrl()"
        class="character-page-avatar character-avatar"
      />

      <div v-if="character.character.title" class="character-title">
        {{ character.character.title }}
      </div>
      <character-action-menu
        :character="character"
        @rename="showRename()"
        @block="showBlock()"
      ></character-action-menu>

      <div
        v-if="authenticated"
        class="row justify-content-between flex-wrap character-links-block"
      >
        <template v-if="character.is_self">
          <a
            :href="editUrl"
            :title="l('userProfile.edit')"
            class="edit-link btn btn-outline-secondary col-3"
            ><i class="fa fa-fw fa-pencil-alt"></i
          ></a>
          <button
            :title="l('userProfile.delete')"
            class="delete-link btn btn-outline-danger col-3"
            disabled
          >
            <i class="fa fa-fw fa-trash"></i>
          </button>
          <button
            :title="l('userProfile.duplicate')"
            class="duplicate-link btn btn-outline-secondary col-3"
            disabled
          >
            <i class="fa fa-fw fa-copy"></i>
          </button>
        </template>
        <template v-else>
          <template
            v-if="
              character.self_staff ||
              character.settings.block_bookmarks !== true
            "
          >
            <button
              @click.prevent="toggleBookmark()"
              href="#"
              class="btn col-3"
              :title="
                l(
                  character.bookmarked
                    ? 'userProfile.unbookmark'
                    : 'userProfile.bookmark'
                )
              "
              :class="{
                'btn-outline-success': character.bookmarked,
                'btn-outline-secondary': !character.bookmarked
              }"
            >
              <i
                class="fa fa-fw"
                :class="{
                  'fa-bookmark': character.bookmarked,
                  'far fa-bookmark': !character.bookmarked
                }"
              ></i>
            </button>

            <button
              href="#"
              class="btn col-3"
              disabled
              v-if="character.settings.block_bookmarks"
              :title="l('userProfile.unbookmarkable')"
            >
              <i class="fa-solid fa-exclamation"></i>
            </button>
          </template>
          <button
            href="#"
            @click.prevent="showFriends()"
            :title="l('userProfile.showFriends')"
            class="friend-link btn btn-outline-secondary col-3"
          >
            <i class="fa fa-fw fa-user-plus"></i>
          </button>
          <button
            href="#"
            v-if="!oldApi"
            @click.prevent="showReport()"
            :title="l('userProfile.report')"
            class="report-link btn btn-outline-warning col-3"
          >
            <i class="fa fa-fw fa-exclamation-triangle"></i>
          </button>
        </template>
        <button
          href="#"
          @click.prevent="showMemo()"
          :title="l('userProfile.memo')"
          class="memo-link btn btn-outline-secondary col-3"
        >
          <i class="far fa-sticky-note fa-fw"></i>
        </button>
        <a
          v-if="authenticated && !character.is_self"
          :href="noteUrl"
          :title="l('userProfile.sendNote')"
          class="character-page-note-link btn-outline-secondary col-3 btn"
          style="padding: 0 4px"
        >
          <i class="far fa-envelope fa-fw"></i
        ></a>
      </div>
      <div v-if="displayBadges.length > 0" class="badges-block">
        <div
          v-for="badge in displayBadges"
          class="character-badge px-2 py-1"
          :class="badgeClass(badge)"
        >
          <i class="fa-fw" :class="badgeIconClass(badge)"></i>
          {{ badgeTitle(badge) }}
        </div>
      </div>

      <div
        v-if="character.character.online_chat"
        @click="showInChat()"
        class="character-page-online-chat"
      >
        {{ l('user.onlineInChat') }}
      </div>

      <div class="quick-info-block">
        <!-- <infotag-item v-for="infotag in quickInfoItems" :infotag="infotag" :key="infotag.id" :characterMatch="characterMatch"></infotag-item> -->
        <template v-for="id in quickInfoIds">
          <infotag-item
            v-if="character.character.infotags[id]"
            :infotag="getInfotag(id)"
            :data="character.character.infotags[id]"
            :key="id"
            :characterMatch="characterMatch"
          ></infotag-item>
        </template>

        <div class="quick-info">
          <span class="quick-info-label">{{ l('userProfile.created') }}</span>
          <span class="quick-info-value"
            ><date :time="character.character.created_at"></date
          ></span>
        </div>
        <div class="quick-info">
          <span class="quick-info-label"
            >{{ l('userProfile.lastUpdated') }}
          </span>
          <span class="quick-info-value"
            ><date :time="character.character.updated_at"></date
          ></span>
        </div>
        <div class="quick-info" v-if="character.character.last_online_at">
          <span class="quick-info-label">{{
            l('userProfile.lastOnline')
          }}</span>
          <span class="quick-info-value"
            ><date :time="character.character.last_online_at"></date
          ></span>
        </div>
        <div class="quick-info">
          <span class="quick-info-label">{{ l('userProfile.views') }}</span>
          <span class="quick-info-value">{{ character.character.views }}</span>
        </div>
        <div class="quick-info" v-if="character.character.timezone != null">
          <span class="quick-info-label">{{ l('userProfile.timezone') }}</span>
          <span class="quick-info-value">
            UTC{{ character.character.timezone > 0 ? '+' : ''
            }}{{
              character.character.timezone != 0
                ? character.character.timezone
                : ''
            }}
          </span>
        </div>
      </div>

      <div class="character-list-block" v-if="character.character_list">
        <div
          class="row align-items-center"
          v-for="listCharacter in character.character_list"
        >
          <div class="col col-auto">
            <img
              :src="avatarUrl(listCharacter.name)"
              class="character-avatar icon"
            />
          </div>
          <div class="col">
            <character-link :character="listCharacter.name"></character-link>
          </div>
        </div>
      </div>
    </div>
    <template>
      <memo-dialog
        :character="character.character"
        :memo="character.memo"
        ref="memo-dialog"
        @memo="memo"
      ></memo-dialog>
      <rename-dialog :character="character" ref="rename-dialog"></rename-dialog>
      <report-dialog
        v-if="!oldApi && authenticated && !character.is_self"
        :character="character"
        ref="report-dialog"
      ></report-dialog>
      <friend-dialog :character="character" ref="friend-dialog"></friend-dialog>
      <block-dialog :character="character" ref="block-dialog"></block-dialog>
    </template>
  </div>
</template>

<script lang="ts">
  import l from '../../chat/localize';
  import Vue, {
    Component as VueComponent,
    ComponentOptions,
    CreateElement,
    VNode
  } from 'vue';
  import DateDisplay from '../../components/date_display.vue';
  import { Infotag } from '../../interfaces';
  import * as Utils from '../utils';
  import { methods, registeredComponents, Store } from './data_store';
  import FriendDialog from './friend_dialog.vue';
  import InfotagView from './infotag.vue';
  import { Character, CONTACT_GROUP_ID, SharedStore } from './interfaces';
  import { MatchReport } from '../../learn/matcher';
  import MemoDialog from './memo_dialog.vue';
  import ReportDialog from './report_dialog.vue';
  import core from '../../chat/core';
  import {
    getContributorAlias,
    getTranslatorAlias,
    getTranslatorLanguages,
    getSponsorAlias,
    getStaffAlias,
    getStaffRole,
    getSupporterAlias
  } from '../../chat/profile_api';

  interface ShowableVueDialog extends Vue {
    show(): void;
  }

  function resolveComponent(
    name: string
  ): () => Promise<VueComponent | ComponentOptions<Vue>> {
    return async (): Promise<VueComponent | ComponentOptions<Vue>> => {
      if (typeof registeredComponents[name] === 'undefined')
        return {
          render(createElement: CreateElement): VNode {
            return createElement('span');
          },
          name
        };
      return registeredComponents[name]!;
    };
  }

  Vue.component('block-dialog', resolveComponent('block-dialog'));
  Vue.component('rename-dialog', resolveComponent('rename-dialog'));
  Vue.component(
    'character-action-menu',
    resolveComponent('character-action-menu')
  );

  export default Vue.extend({
    components: {
      date: DateDisplay,
      'friend-dialog': FriendDialog,
      'infotag-item': InfotagView,
      'memo-dialog': MemoDialog,
      'report-dialog': ReportDialog
    },
    props: {
      character: { required: true as const },
      oldApi: {},
      characterMatch: { required: true as const }
    },
    data() {
      return {
        l: l,
        shared: Store as SharedStore,
        quickInfoIds: [1, 3, 2, 49, 9, 29, 15, 41, 25] as ReadonlyArray<number>,
        avatarUrl: Utils.avatarURL
      };
    },
    computed: {
      displayBadges(): string[] {
        const char = this.character as Character;
        if (!char.badges) return [];
        if (core.state.settings?.horizonShowDeveloperBadges) return char.badges;
        return char.badges.filter(
          (b: string) =>
            b !== 'maintainer' &&
            b !== 'developer' &&
            b !== 'contributor' &&
            b !== 'horizon-translator' &&
            b !== 'horizon-staff' &&
            b !== 'horizon-supporter' &&
            b !== 'horizon-sponsor'
        );
      },
      editUrl(): string {
        return `${Utils.siteDomain}character_edit.php?id=${(this.character as Character).character.id}`;
      },
      noteUrl(): string {
        return methods.sendNoteUrl((this.character as Character).character);
      },
      contactMethods(): { id: number; value?: string }[] {
        const char = this.character as Character;
        return Object.keys(Store.shared.infotags)
          .map(x => Store.shared.infotags[x])
          .filter(
            x =>
              x.infotag_group === CONTACT_GROUP_ID &&
              char.character.infotags[x.id] !== undefined
          )
          .sort((a, b) => (a.name < b.name ? -1 : 1));
      },
      authenticated(): boolean {
        return Store.authenticated;
      }
    },
    methods: {
      getAvatarUrl(): string {
        const char = this.character as Character;
        const onlineCharacter = core.characters.get(char.character.name);

        if (onlineCharacter && onlineCharacter.overrides.avatarUrl) {
          return onlineCharacter.overrides.avatarUrl;
        }

        return Utils.avatarURL(char.character.name);
      },
      badgeClass(badgeName: string): string {
        return `character-badge-${badgeName.replace('.', '-')}`;
      },
      badgeIconClass(badgeName: string): string {
        const classMap: { [key: string]: string } = {
          admin: 'fa fa-gem',
          global: 'far fa-gem',
          chatop: 'far fa-gem',
          chanop: 'fa fa-star',
          helpdesk: 'fa fa-user',
          developer: 'fa fa-terminal',
          maintainer: 'fa fa-wrench',
          contributor: 'fa fa-code',
          'horizon-translator': 'fa fa-language',
          'horizon-staff': 'fa fa-id-badge',
          'horizon-supporter': 'fa fa-handshake',
          'horizon-sponsor': 'fa fa-cookie',
          'subscription.lifetime': 'fa fa-certificate'
        };
        return badgeName in classMap ? classMap[badgeName] : '';
      },
      badgeTitle(badgeName: string): string {
        const char = this.character as Character;
        if (badgeName === 'contributor') {
          const alias = getContributorAlias(char.character.name);
          return alias
            ? `Horizon Contributor "${alias}"`
            : 'Horizon Contributor';
        }

        if (badgeName === 'horizon-translator') {
          const alias = getTranslatorAlias(char.character.name);
          const langs = getTranslatorLanguages(char.character.name);
          const langLabel = langs.length > 0 ? ` (${langs.join(', ')})` : '';
          if (alias) return `Horizon Translator${langLabel} "${alias}"`;
          return `Horizon Translator${langLabel}`;
        }

        if (badgeName === 'horizon-staff') {
          const alias = getStaffAlias(char.character.name);
          const role = getStaffRole(char.character.name);
          if (alias && role) return `Horizon Staff (${role}) "${alias}"`;
          if (alias) return `Horizon Staff "${alias}"`;
          return role ? `Horizon Staff (${role})` : 'Horizon Staff';
        }

        if (badgeName === 'horizon-supporter') {
          const alias = getSupporterAlias(char.character.name);
          return alias ? `Horizon Supporter "${alias}"` : 'Horizon Supporter';
        }

        if (badgeName === 'horizon-sponsor') {
          const alias = getSponsorAlias(char.character.name);
          return alias ? `Horizon Sponsor "${alias}"` : 'Horizon Sponsor';
        }

        const badgeMap: { [key: string]: string } = {
          admin: 'Administrator',
          global: 'Global Moderator',
          chatop: 'Chat Moderator',
          chanop: 'Channel Moderator',
          helpdesk: 'Helpdesk',
          developer: 'Developer',
          maintainer: 'Horizon Maintainer',
          'subscription.lifetime': 'Lifetime Subscriber',
          'subscription.other': 'Subscriber'
        };
        return badgeName in badgeMap ? badgeMap[badgeName] : badgeName;
      },
      showBlock(): void {
        (<ShowableVueDialog>this.$refs['block-dialog']).show();
      },
      showRename(): void {
        (<ShowableVueDialog>this.$refs['rename-dialog']).show();
      },
      showMemo(): void {
        (<ShowableVueDialog>this.$refs['memo-dialog']).show();
      },
      showReport(): void {
        (<ShowableVueDialog>this.$refs['report-dialog']).show();
      },
      showFriends(): void {
        (<ShowableVueDialog>this.$refs['friend-dialog']).show();
      },
      showInChat(): void {
        //TODO implement this
      },
      async toggleBookmark(): Promise<void> {
        const char = this.character as Character;
        try {
          await methods.bookmarkUpdate(char.character.id, !char.bookmarked);
          char.bookmarked = !char.bookmarked;
        } catch (e) {
          Utils.ajaxError(e, 'Unable to change bookmark state.');
        }
      },
      getInfotag(id: number): Infotag {
        return Store.shared.infotags[id];
      },
      memo(memo: object): void {
        this.$emit('memo', memo);
      }
    }
  });
</script>

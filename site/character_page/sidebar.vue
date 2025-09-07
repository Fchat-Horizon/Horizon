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
        @delete="showDelete()"
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
            @click="showDelete"
            :title="l('userProfile.delete')"
            class="delete-link btn btn-outline-danger col-3"
            disabled
          >
            <i class="fa fa-fw fa-trash"></i>
          </button>
          <button
            @click="showDuplicate()"
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

        <!--            <div class="contact-block">-->
        <!--                <contact-method v-for="method in contactMethods" :infotag="method" :key="method.id"-->
        <!--                    :data="character.character.infotags[method.id]"></contact-method>-->
        <!--            </div>-->

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
      <delete-dialog :character="character" ref="delete-dialog"></delete-dialog>
      <rename-dialog :character="character" ref="rename-dialog"></rename-dialog>
      <duplicate-dialog
        :character="character"
        ref="duplicate-dialog"
      ></duplicate-dialog>
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
  import { Component, Prop } from '@f-list/vue-ts';
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
  import ContactMethodView from './contact_method.vue';
  import { methods, registeredComponents, Store } from './data_store';
  import DeleteDialog from './delete_dialog.vue';
  import DuplicateDialog from './duplicate_dialog.vue';
  import FriendDialog from './friend_dialog.vue';
  import InfotagView from './infotag.vue';
  import { Character, CONTACT_GROUP_ID, SharedStore } from './interfaces';
  import { MatchReport } from '../../learn/matcher';
  import MemoDialog from './memo_dialog.vue';
  import ReportDialog from './report_dialog.vue';
  import core from '../../chat/core';

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

  @Component({
    components: {
      'contact-method': ContactMethodView,
      date: DateDisplay,
      'delete-dialog': DeleteDialog,
      'duplicate-dialog': DuplicateDialog,
      'friend-dialog': FriendDialog,
      'infotag-item': InfotagView,
      'memo-dialog': MemoDialog,
      'report-dialog': ReportDialog
    }
  })
  export default class Sidebar extends Vue {
    @Prop({ required: true })
    readonly character!: Character;
    @Prop
    readonly oldApi?: true;
    @Prop({ required: true })
    readonly characterMatch!: MatchReport;
    l = l;

    readonly shared: SharedStore = Store;
    readonly quickInfoIds: ReadonlyArray<number> = [
      1, 3, 2, 49, 9, 29, 15, 41, 25
    ]; // Do not sort these.
    readonly avatarUrl = Utils.avatarURL;

    getAvatarUrl(): string {
      const onlineCharacter = core.characters.get(
        this.character.character.name
      );

      if (onlineCharacter && onlineCharacter.overrides.avatarUrl) {
        return onlineCharacter.overrides.avatarUrl;
      }

      return Utils.avatarURL(this.character.character.name);
    }

    get displayBadges(): string[] {
      if (!this.character.badges) return [];
      if (core.state.settings?.horizonShowDeveloperBadges)
        return this.character.badges;
      // Filter out maintainer & developer badges if user disabled them.
      return this.character.badges.filter(
        b => b !== 'maintainer' && b !== 'developer'
      );
    }

    badgeClass(badgeName: string): string {
      return `character-badge-${badgeName.replace('.', '-')}`;
    }

    badgeIconClass(badgeName: string): string {
      const classMap: { [key: string]: string } = {
        admin: 'fa fa-gem',
        global: 'far fa-gem',
        chatop: 'far fa-gem',
        chanop: 'fa fa-star',
        helpdesk: 'fa fa-user',
        developer: 'fa fa-terminal',
        maintainer: 'fa fa-wrench',
        'subscription.lifetime': 'fa fa-certificate'
      };
      return badgeName in classMap ? classMap[badgeName] : '';
    }

    badgeTitle(badgeName: string): string {
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
    }

    showBlock(): void {
      (<ShowableVueDialog>this.$refs['block-dialog']).show();
    }

    showRename(): void {
      (<ShowableVueDialog>this.$refs['rename-dialog']).show();
    }

    showDelete(): void {
      (<ShowableVueDialog>this.$refs['delete-dialog']).show();
    }

    showDuplicate(): void {
      (<ShowableVueDialog>this.$refs['duplicate-dialog']).show();
    }

    showMemo(): void {
      (<ShowableVueDialog>this.$refs['memo-dialog']).show();
    }

    showReport(): void {
      (<ShowableVueDialog>this.$refs['report-dialog']).show();
    }

    showFriends(): void {
      (<ShowableVueDialog>this.$refs['friend-dialog']).show();
    }

    showInChat(): void {
      //TODO implement this
    }

    async toggleBookmark(): Promise<void> {
      try {
        await methods.bookmarkUpdate(
          this.character.character.id,
          !this.character.bookmarked
        );
        this.character.bookmarked = !this.character.bookmarked;
      } catch (e) {
        Utils.ajaxError(e, 'Unable to change bookmark state.');
      }
    }

    get editUrl(): string {
      return `${Utils.siteDomain}character_edit.php?id=${this.character.character.id}`;
    }

    get noteUrl(): string {
      return methods.sendNoteUrl(this.character.character);
    }

    get contactMethods(): { id: number; value?: string }[] {
      return Object.keys(Store.shared.infotags)
        .map(x => Store.shared.infotags[x])
        .filter(
          x =>
            x.infotag_group === CONTACT_GROUP_ID &&
            this.character.character.infotags[x.id] !== undefined
        )
        .sort((a, b) => (a.name < b.name ? -1 : 1));
    }

    getInfotag(id: number): Infotag {
      return Store.shared.infotags[id];
    }

    get authenticated(): boolean {
      return Store.authenticated;
    }

    memo(memo: object): void {
      this.$emit('memo', memo);
    }
  }
</script>

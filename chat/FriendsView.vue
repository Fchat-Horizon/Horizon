<template>
  <div
    id="friends-view"
    class="friends-view"
    :class="{ 'show-avatars': showAvatars }"
  >
    <modal
      ref="removeFriendDialog"
      dialog-class="modal-dialog-centered"
      :action="l('friends.remove.selectTitle', removeFriendTargetName)"
      :buttonText="l('friends.remove')"
      :disabled="removeFriendSelectedSources.length === 0"
      iconClass="fas fa-user-minus"
      @close="resetRemoveFriendDialog"
      @submit="confirmRemoveFriendSelection"
    >
      <p class="mb-2">
        {{ l('friends.remove.selectHelp', removeFriendTargetName) }}
      </p>
      <div class="filter-items">
        <label class="form-check mb-2 pb-2 border-bottom">
          <input
            ref="removeFriendAllToggle"
            class="form-check-input"
            type="checkbox"
            :checked="allRemoveFriendSourcesSelected"
            @change="toggleAllRemoveFriendSources"
          />
          <span class="form-check-label" style="margin-left: 6px">
            {{ l('action.selectAll') }}
          </span>
        </label>
        <label
          v-for="source in removeFriendAvailableSources"
          :key="'remove-source-' + source"
          class="form-check"
        >
          <input
            v-model="removeFriendSelectedSources"
            class="form-check-input"
            type="checkbox"
            :value="source"
            @change="updateRemoveFriendAllToggle"
          />
          <span class="form-check-label" style="margin-left: 6px">
            {{ source }}
          </span>
        </label>
      </div>
      <div
        v-if="removeFriendSelectedSources.length === 0"
        class="alert alert-warning mt-3 mb-0"
      >
        {{ l('friends.remove.selectEmpty') }}
      </div>
    </modal>

    <modal
      ref="removeBookmarkDialog"
      dialog-class="modal-dialog-centered"
      :action="l('friends.bookmark.title', removeBookmarkTargetName)"
      :buttonText="l('friends.remove')"
      iconClass="fas fa-bookmark"
      @close="resetRemoveBookmarkDialog"
      @submit="confirmRemoveBookmark"
    >
      <p class="mb-0">
        {{ l('friends.bookmark.help', removeBookmarkTargetName) }}
      </p>
    </modal>

    <div class="friends-header">
      <div class="friends-header-row">
        <h4>{{ l('users.friends') }}</h4>
      </div>
    </div>

    <tabs
      style="flex-shrink: 0"
      :fullWidth="true"
      :tabs="tabLabels"
      v-model="tab"
      @input="focusFriendsFilter()"
    ></tabs>

    <div class="friends-toolbar">
      <div class="friends-search input-group">
        <span class="input-group-text">
          <span class="fas fa-search"></span>
        </span>
        <input
          ref="friendsFilter"
          v-model="search"
          class="form-control"
          type="text"
          :placeholder="l('filter')"
          @keydown.esc="search = ''"
        />
        <button
          v-if="search"
          class="btn btn-outline-secondary"
          @click.prevent="search = ''"
          :aria-label="l('action.reset')"
          :title="l('action.reset')"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      <dropdown
        class="friends-filter-button"
        :keep-open="true"
        :title="''"
        link-style="''"
        :link-class="dropdownLinkClass"
        icon-class="fas fa-filter"
      >
        <div class="p-2" style="margin: 0 5px" @click.stop>
          <div style="margin-bottom: 8px">
            <div
              style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;
              "
            >
              <strong style="margin: 0">{{ l('users.filters.sortBy') }}</strong>
              <button
                class="btn btn-sm btn-outline-secondary"
                @click.prevent.stop="resetFilters"
              >
                {{ l('action.reset') }}
              </button>
            </div>
            <div>
              <label
                v-for="sort in availableSorts"
                :key="sort"
                class="form-check"
                style="display: block; margin: 0"
                @click.stop
              >
                <input
                  v-model="sortType"
                  class="form-check-input"
                  type="radio"
                  :value="sort"
                  @click.stop
                />
                <span class="form-check-label" style="margin-left: 6px">
                  {{ l('users.filters.sort.' + sort) }}
                </span>
              </label>
            </div>
          </div>

          <hr style="margin: 6px 0" />
          <div style="margin-bottom: 8px">
            <div
              style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;
              "
            >
              <strong>{{ l('users.filters.statuses') }}</strong>
            </div>
            <div class="filter-items">
              <label
                v-for="status in statusOptions"
                :key="status"
                class="form-check"
                style="margin: 0"
                @click.stop
              >
                <input
                  v-model="selectedStatuses"
                  class="form-check-input"
                  type="checkbox"
                  :value="status"
                  @click.stop
                />
                <span class="form-check-label" style="margin-left: 6px">
                  {{ l(`status.${status}`) }}
                </span>
              </label>
            </div>
          </div>

          <hr style="margin: 6px 0" />
          <div>
            <div
              style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;
              "
            >
              <strong>{{ l('users.filters.genders') }}</strong>
              <button
                class="btn btn-sm"
                :class="{
                  'btn-primary': autoGenderFilterEnabled,
                  'btn-outline-secondary': !autoGenderFilterEnabled
                }"
                @click.prevent.stop="toggleAutoGenderFilter"
                :title="
                  autoGenderFilterEnabled
                    ? l('users.filters.autoOn')
                    : l('users.filters.autoOff')
                "
                :aria-pressed="autoGenderFilterEnabled"
              >
                {{ l('users.filters.auto') }}
              </button>
            </div>
            <div class="filter-items">
              <label
                v-for="gender in genderOptions"
                :key="gender"
                class="form-check"
                style="margin: 0"
                @click.stop
              >
                <input
                  v-model="genderFilters"
                  class="form-check-input"
                  type="checkbox"
                  :value="gender"
                  @change="onManualGenderChange"
                  @click.stop
                />
                <span class="form-check-label" style="margin-left: 6px">
                  {{ gender }}
                </span>
              </label>
            </div>
          </div>
        </div>
      </dropdown>
    </div>

    <div class="friends-results hidden-scrollbar">
      <template v-if="tab === '2'">
        <div class="friends-columns">
          <div class="friends-column hidden-scrollbar">
            <h5>{{ l('settings.profile.ignoredList') }}</h5>
            <div v-if="filteredIgnored.length === 0" class="alert alert-info">
              {{ l('settings.profile.ignoredList.empty') }}
            </div>
            <div v-else class="friend-list">
              <div
                v-for="character in filteredIgnored"
                :key="'ignored-' + character.name"
                class="friend-result"
              >
                <div class="friend-main">
                  <div class="friend-primary">
                    <user
                      :character="character"
                      :showStatus="true"
                      :bookmark="false"
                      :avatar="showAvatars"
                      :isMarkerShown="shouldShowMarker"
                    ></user>
                    <bbcode
                      v-if="character.statusText"
                      :text="character.statusText"
                      class="status-text"
                    ></bbcode>
                  </div>
                </div>
                <button
                  class="btn btn-sm btn-outline-secondary friend-action"
                  @click.stop.prevent="unignore(character.name)"
                  :title="l('user.unignore')"
                  :aria-label="l('user.unignore')"
                  :disabled="isPending(actionKey('ignore', character.name))"
                >
                  <i class="fas fa-unlock"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="friends-column hidden-scrollbar">
            <h5>{{ l('settings.profile.hiddenList') }}</h5>
            <div v-if="filteredHidden.length === 0" class="alert alert-info">
              {{ l('settings.profile.hiddenList.empty') }}
            </div>
            <div v-else class="friend-list">
              <div
                v-for="character in filteredHidden"
                :key="'hidden-' + character.name"
                class="friend-result"
              >
                <div class="friend-main">
                  <div class="friend-primary">
                    <user
                      :character="character"
                      :showStatus="true"
                      :bookmark="false"
                      :avatar="showAvatars"
                      :isMarkerShown="shouldShowMarker"
                    ></user>
                    <bbcode
                      v-if="character.statusText"
                      :text="character.statusText"
                      class="status-text"
                    ></bbcode>
                  </div>
                </div>
                <button
                  class="btn btn-sm btn-outline-secondary friend-action"
                  @click.stop.prevent="unhide(character.name)"
                  :title="l('users.hidden.remove')"
                  :aria-label="l('users.hidden.remove')"
                >
                  <i class="fas fa-eye-slash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="friends-columns">
          <div class="friends-column hidden-scrollbar">
            <h5>{{ l('users.friends') }}</h5>
            <div v-if="!hasFriends" class="alert alert-info">
              {{ l('profile.friends.none') }}
            </div>
            <template v-else>
              <h6
                v-if="showPerCharacterFriends && currentCharacterFriends.length"
              >
                {{ l('users.characterFriends') }}
              </h6>
              <div
                v-if="showPerCharacterFriends && currentCharacterFriends.length"
                class="friend-list"
              >
                <div
                  v-for="character in currentCharacterFriends"
                  :key="'friend-char-' + character.name"
                  class="friend-result"
                >
                  <div class="friend-main">
                    <div class="friend-primary">
                      <user
                        :character="character"
                        :showStatus="true"
                        :bookmark="false"
                        :avatar="showAvatars"
                        :isMarkerShown="shouldShowMarker"
                      ></user>
                      <bbcode
                        v-if="character.statusText"
                        :text="character.statusText"
                        class="status-text"
                      ></bbcode>
                    </div>
                    <div
                      v-if="getFriendSources(character).length"
                      class="friend-sources"
                    >
                      <span class="friend-source-label">
                        <i class="fas fa-link"></i>
                        {{ l('users.friends.by') }}
                      </span>
                      <a
                        v-for="source in getFriendSources(character)"
                        :key="'friend-source-' + character.name + '-' + source"
                        :href="profileLink(source)"
                        target="_blank"
                        rel="noopener"
                        class="friend-pill"
                      >
                        {{ source }}
                      </a>
                    </div>
                  </div>
                  <button
                    class="btn btn-sm btn-outline-secondary friend-action"
                    @click.stop.prevent="removeFriend(character, $event)"
                    :title="l('friends.remove')"
                    :aria-label="l('friends.remove')"
                    :disabled="isPending(actionKey('friend', character.name))"
                  >
                    <i class="fas fa-user-minus"></i>
                  </button>
                </div>
              </div>

              <h6 v-if="currentFriends.length">
                {{ l('users.friends.nonCharacter') }}
              </h6>
              <div v-if="currentFriends.length" class="friend-list">
                <div
                  v-for="character in currentFriends"
                  :key="'friend-' + character.name"
                  class="friend-result"
                >
                  <div class="friend-main">
                    <div class="friend-primary">
                      <user
                        :character="character"
                        :showStatus="true"
                        :bookmark="false"
                        :avatar="showAvatars"
                        :isMarkerShown="shouldShowMarker"
                      ></user>
                      <bbcode
                        v-if="character.statusText"
                        :text="character.statusText"
                        class="status-text"
                      ></bbcode>
                    </div>
                    <div
                      v-if="getFriendSources(character).length"
                      class="friend-sources"
                    >
                      <span class="friend-source-label">
                        <i class="fas fa-link"></i>
                        {{ l('users.friends.by') }}
                      </span>
                      <a
                        v-for="source in getFriendSources(character)"
                        :key="'friend-source-' + character.name + '-' + source"
                        :href="profileLink(source)"
                        target="_blank"
                        rel="noopener"
                        class="friend-pill"
                      >
                        {{ source }}
                      </a>
                    </div>
                  </div>
                  <button
                    class="btn btn-sm btn-outline-secondary friend-action"
                    @click.stop.prevent="removeFriend(character, $event)"
                    :title="l('friends.remove')"
                    :aria-label="l('friends.remove')"
                    :disabled="isPending(actionKey('friend', character.name))"
                  >
                    <i class="fas fa-user-minus"></i>
                  </button>
                </div>
              </div>
            </template>
          </div>
          <div class="friends-column hidden-scrollbar">
            <h5 class="bookmark-heading">{{ l('users.bookmarks') }}</h5>
            <div v-if="currentBookmarks.length === 0" class="alert alert-info">
              {{ l('users.bookmarks.none') }}
            </div>
            <div v-else class="friend-list">
              <div
                v-for="character in currentBookmarks"
                :key="'bookmark-' + character.name"
                class="friend-result"
              >
                <div class="friend-main">
                  <div class="friend-primary">
                    <user
                      :character="character"
                      :showStatus="true"
                      :bookmark="false"
                      :avatar="showAvatars"
                      :isMarkerShown="shouldShowMarker"
                    ></user>
                    <bbcode
                      v-if="character.statusText"
                      :text="character.statusText"
                      class="status-text"
                    ></bbcode>
                  </div>
                </div>
                <button
                  class="btn btn-sm btn-outline-secondary friend-action"
                  @click.stop.prevent="removeBookmark(character, $event)"
                  :title="l('user.unbookmark')"
                  :aria-label="l('user.unbookmark')"
                  :disabled="isPending(actionKey('bookmark', character.name))"
                >
                  <i class="fas fa-bookmark"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';
  import Dropdown from '../components/Dropdown.vue';
  import Modal from '../components/Modal.vue';
  import Tabs from '../components/tabs';
  import core from './core';
  import { AvailableSort, Character } from './interfaces';
  import l from './localize';
  import UserView from './UserView.vue';
  import { BBCodeView } from '../bbcode/view';
  import { errorToString, profileLink } from './common';
  import { methods } from '../site/character_page/data_store';
  import { SimpleCharacter } from '../interfaces';
  import { Friend } from '../site/character_page/interfaces';
  import {
    computeGenderPreferenceBuckets,
    filterCharactersByGender,
    filterCharactersByName,
    filterCharactersByStatus,
    genderOptions as builtInGenderOptions,
    sortCharacters
  } from './memberFilters';

  const availableSorts: AvailableSort[] = ['normal', 'status', 'gender'];

  export default Vue.extend({
    components: {
      dropdown: Dropdown,
      modal: Modal,
      tabs: Tabs,
      user: UserView,
      bbcode: BBCodeView(core.bbCodeParser)
    },
    data() {
      return {
        l: l,
        tab: '0',
        search: '',
        pending: {} as { [key: string]: boolean },
        ownSimpleCharacter: null as SimpleCharacter | null,
        profileLink: profileLink,
        removeFriendTarget: null as Character | null,
        removeFriendAvailableSources: [] as string[],
        removeFriendSelectedSources: [] as string[],
        removeBookmarkTarget: null as Character | null,
        genderFilters:
          (core.state.settings as any).horizonPersistentMemberFilters &&
          Array.isArray((core.state.settings as any).horizonSavedGenderFilters)
            ? (core.state.settings as any).horizonSavedGenderFilters.slice()
            : ([] as string[]),
        genderOptions: builtInGenderOptions.slice(),
        autoGenderFilterEnabled:
          typeof (core.state.settings as any).horizonAutoGenderFilter ===
          'boolean'
            ? (core.state.settings as any).horizonAutoGenderFilter
            : true,
        statusOptions: [
          'looking',
          'online',
          'idle',
          'away',
          'busy',
          'dnd',
          'offline',
          'crown'
        ] as string[],
        selectedStatuses: [] as string[],
        sortType: (((core.state.settings as any)
          .horizonPersistentMemberFilters &&
          (core.state.settings as any).horizonSavedMembersSort) ||
          'normal') as AvailableSort,
        sorter: (x: Character, y: Character) =>
          x.name.toLocaleLowerCase().localeCompare(y.name.toLocaleLowerCase())
      };
    },
    computed: {
      showPerCharacterFriends(): boolean {
        return core.state.settings.showPerCharacterFriends;
      },
      hideNonCharacterFriends(): boolean {
        return core.state.settings.hideNonCharacterFriends;
      },
      onlineCharacterFriendsBase(): Character[] {
        if (!this.showPerCharacterFriends) {
          return [];
        }
        return core.characters.characterFriends.slice().sort(this.sorter);
      },
      onlineFriendsBase(): Character[] {
        let friendsList = core.characters.friends.slice();

        if (this.showPerCharacterFriends) {
          const characterFriendNames = new Set(
            core.characters.characterFriendList.map(name => name.toLowerCase())
          );
          friendsList = friendsList.filter(
            friend => !characterFriendNames.has(friend.name.toLowerCase())
          );

          if (this.hideNonCharacterFriends) {
            return [];
          }
        }

        return friendsList.sort(this.sorter);
      },
      onlineBookmarksBase(): Character[] {
        const friendNames = this.getFriendNamesForBookmarkFilter(
          this.onlineCharacterFriendsBase,
          this.onlineFriendsBase
        );
        let bookmarks = core.characters.bookmarks
          .slice()
          .filter(character => !friendNames.has(character.name.toLowerCase()));

        if (this.showPerCharacterFriends) {
          const characterFriendNames = new Set(
            core.characters.characterFriendList.map(name => name.toLowerCase())
          );
          bookmarks = bookmarks.filter(
            character => !characterFriendNames.has(character.name.toLowerCase())
          );
        }

        return bookmarks.sort(this.sorter);
      },
      allCharacterFriendsBase(): Character[] {
        if (!this.showPerCharacterFriends) {
          return [];
        }
        const characterFriendsList =
          core.characters.characterFriendList.slice();
        return characterFriendsList
          .map(name => core.characters.get(name))
          .sort(this.sorter);
      },
      allFriendsBase(): Character[] {
        let friendsList = core.characters.friendList.slice();

        const uniqueFriendNames = new Set<string>();
        friendsList = friendsList.filter(name => {
          const lowerName = name.toLowerCase();
          if (uniqueFriendNames.has(lowerName)) {
            return false;
          }
          uniqueFriendNames.add(lowerName);
          return true;
        });

        if (this.showPerCharacterFriends) {
          const characterFriendNames = new Set(
            core.characters.characterFriendList.map(name => name.toLowerCase())
          );
          friendsList = friendsList.filter(
            name => !characterFriendNames.has(name.toLowerCase())
          );

          if (this.hideNonCharacterFriends) {
            return [];
          }
        }

        return friendsList
          .map(name => core.characters.get(name))
          .sort(this.sorter);
      },
      allBookmarksBase(): Character[] {
        const bookmarkList = core.characters.bookmarkList.slice();
        const friendNames = this.getFriendNamesForBookmarkFilter(
          this.allCharacterFriendsBase,
          this.allFriendsBase
        );

        let characters = bookmarkList
          .map(name => core.characters.get(name))
          .filter(character => !friendNames.has(character.name.toLowerCase()));

        if (this.showPerCharacterFriends) {
          const characterFriendNames = new Set(
            core.characters.characterFriendList.map(name => name.toLowerCase())
          );
          characters = characters.filter(
            character => !characterFriendNames.has(character.name.toLowerCase())
          );
        }

        return characters.sort(this.sorter);
      },
      currentCharacterFriends(): Character[] {
        return this.filterCharacters(
          this.tab === '0'
            ? this.onlineCharacterFriendsBase
            : this.allCharacterFriendsBase
        );
      },
      currentFriends(): Character[] {
        return this.filterCharacters(
          this.tab === '0' ? this.onlineFriendsBase : this.allFriendsBase
        );
      },
      currentBookmarks(): Character[] {
        return this.filterCharacters(
          this.tab === '0' ? this.onlineBookmarksBase : this.allBookmarksBase
        );
      },
      hasFriends(): boolean {
        return (
          this.currentCharacterFriends.length + this.currentFriends.length > 0
        );
      },
      onlineCount(): number {
        return (
          this.onlineCharacterFriendsBase.length +
          this.onlineFriendsBase.length +
          this.onlineBookmarksBase.length
        );
      },
      allCount(): number {
        return (
          this.allCharacterFriendsBase.length +
          this.allFriendsBase.length +
          this.allBookmarksBase.length
        );
      },
      ignoredCount(): number {
        return (
          core.characters.ignoreList.length + core.state.hiddenUsers.length
        );
      },
      tabLabels(): { [key: string]: string } {
        return {
          0: `${this.l('status.online')} (${this.onlineCount})`,
          1: `${this.l('users.friends.all')} (${this.allCount})`,
          2: `${this.l('settings.profile.ignoredList')} (${this.ignoredCount})`
        };
      },
      showAvatars(): boolean {
        return core.state.settings.showAvatars;
      },
      shouldShowMarker(): boolean {
        return core.state.settings.horizonShowGenderMarker;
      },
      filteredIgnored(): Character[] {
        const ignored = core.characters.ignoreList.map(name =>
          core.characters.get(name)
        );
        return this.applyCharacterFilters(ignored);
      },
      filteredHidden(): Character[] {
        const hidden = core.state.hiddenUsers.map(name =>
          core.characters.get(name)
        );
        return this.applyCharacterFilters(hidden);
      },
      removeFriendTargetName(): string {
        return this.removeFriendTarget ? this.removeFriendTarget.name : '';
      },
      removeBookmarkTargetName(): string {
        return this.removeBookmarkTarget ? this.removeBookmarkTarget.name : '';
      },
      allRemoveFriendSourcesSelected(): boolean {
        return (
          this.removeFriendAvailableSources.length > 0 &&
          this.removeFriendSelectedSources.length ===
            this.removeFriendAvailableSources.length
        );
      },
      someRemoveFriendSourcesSelected(): boolean {
        return (
          this.removeFriendSelectedSources.length > 0 &&
          !this.allRemoveFriendSourcesSelected
        );
      },
      dropdownLinkClass(): string {
        return this.filterActive
          ? 'dropdown-toggle btn btn-primary'
          : 'dropdown-toggle btn btn-secondary';
      },
      filterActive(): boolean {
        return (
          this.genderFilters.length > 0 ||
          this.selectedStatuses.length > 0 ||
          this.sortType !== 'normal'
        );
      },
      availableSorts(): AvailableSort[] {
        return availableSorts;
      }
    },
    mounted(): void {
      this.applyOrientationAutoFilter();

      this.$watch(
        () => core.characters.ownProfile,
        (val: unknown) => {
          if (val) {
            this.applyOrientationAutoFilter();
          } else if (
            !(core.state.settings as any).horizonPersistentMemberFilters
          ) {
            this.genderFilters = [];
            this.selectedStatuses = [];
            this.sortType = 'normal';
          }
        },
        { immediate: true }
      );

      this.$watch(
        () => this.genderFilters.slice(),
        (val: string[]) => {
          if ((core.state.settings as any).horizonPersistentMemberFilters) {
            core.state.settings = {
              ...(core.state.settings as any),
              horizonSavedGenderFilters: val
            } as any;
          }
        },
        { deep: true }
      );

      this.$watch('sortType', (val: AvailableSort) => {
        if ((core.state.settings as any).horizonPersistentMemberFilters) {
          core.state.settings = {
            ...(core.state.settings as any),
            horizonSavedMembersSort: val
          } as any;
        }
      });
    },
    updated(): void {
      this.updateRemoveFriendAllToggle();
    },
    methods: {
      applyOrientationAutoFilter(): void {
        if (!this.autoGenderFilterEnabled) return;
        const profile = core.characters.ownProfile as any;
        if (!profile || !profile.character) return;

        const buckets = computeGenderPreferenceBuckets(profile);
        const genders = (buckets.match || []).concat(buckets.weakMatch || []);

        this.genderFilters = genders.length > 0 ? genders.slice() : [];
      },

      toggleAutoGenderFilter(): void {
        this.autoGenderFilterEnabled = !this.autoGenderFilterEnabled;
        core.state.settings = {
          ...(core.state.settings as any),
          horizonAutoGenderFilter: this.autoGenderFilterEnabled
        } as any;
        if (this.autoGenderFilterEnabled) {
          this.applyOrientationAutoFilter();
        }
      },

      onManualGenderChange(): void {
        if (!this.autoGenderFilterEnabled) return;
        this.autoGenderFilterEnabled = false;
        core.state.settings = {
          ...(core.state.settings as any),
          horizonAutoGenderFilter: false
        } as any;
      },

      filterCharacters(list: Character[]): Character[] {
        return this.applyCharacterFilters(list);
      },

      getFriendNamesForBookmarkFilter(
        characterFriends: Character[],
        friends: Character[]
      ): Set<string> {
        if (this.showPerCharacterFriends && this.hideNonCharacterFriends) {
          return new Set(
            characterFriends.map(character => character.name.toLowerCase())
          );
        }
        return new Set(friends.map(friend => friend.name.toLowerCase()));
      },

      actionKey(kind: 'friend' | 'bookmark' | 'ignore', name: string): string {
        return `${kind}:${name.toLowerCase()}`;
      },

      applyCharacterFilters(list: ReadonlyArray<Character>): Character[] {
        let visible = filterCharactersByName(list, this.search) as Character[];
        visible = filterCharactersByGender(
          visible,
          this.genderFilters
        ) as Character[];
        visible = filterCharactersByStatus(
          visible,
          this.selectedStatuses
        ) as Character[];
        return sortCharacters(visible, this.sortType) as Character[];
      },

      isPending(key: string): boolean {
        return !!this.pending[key];
      },

      setPending(key: string, value: boolean): void {
        if (value) {
          this.pending = { ...this.pending, [key]: true };
          return;
        }
        const pending = { ...this.pending };
        delete pending[key];
        this.pending = pending;
      },

      getCachedSimpleCharacter(name: string): SimpleCharacter | null {
        const cached = core.cache.profileCache.getSync(name);
        if (cached && cached.character && cached.character.character) {
          const target = cached.character.character;
          return {
            id: target.id,
            name: target.name,
            deleted: !!target.deleted
          };
        }
        return null;
      },

      async getSimpleCharacter(name: string): Promise<SimpleCharacter> {
        const cached = this.getCachedSimpleCharacter(name);
        if (cached) return cached;
        const data = await methods.characterData(name, -1, false);
        return {
          id: data.character.id,
          name: data.character.name,
          deleted: !!data.character.deleted
        };
      },

      async getOwnSimpleCharacter(): Promise<SimpleCharacter> {
        if (this.ownSimpleCharacter) return this.ownSimpleCharacter;
        const ownName = core.characters.ownCharacter.name;
        const cached = this.getCachedSimpleCharacter(ownName);
        if (cached) {
          this.ownSimpleCharacter = cached;
          return cached;
        }
        const data = await methods.characterData(ownName, -1, false);
        this.ownSimpleCharacter = {
          id: data.character.id,
          name: data.character.name,
          deleted: !!data.character.deleted
        };
        return this.ownSimpleCharacter;
      },

      openRemoveFriendDialog(
        character: Character,
        availableSources: string[]
      ): void {
        this.removeFriendTarget = character;
        this.removeFriendAvailableSources = availableSources.slice();
        this.removeFriendSelectedSources =
          availableSources.length === 1 ? availableSources.slice() : [];
        (this.$refs['removeFriendDialog'] as any).show();
      },

      resetRemoveFriendDialog(): void {
        this.removeFriendTarget = null;
        this.removeFriendAvailableSources = [];
        this.removeFriendSelectedSources = [];
      },

      openRemoveBookmarkDialog(character: Character): void {
        this.removeBookmarkTarget = character;
        (this.$refs['removeBookmarkDialog'] as any).show();
      },

      resetRemoveBookmarkDialog(): void {
        this.removeBookmarkTarget = null;
      },

      toggleAllRemoveFriendSources(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.removeFriendSelectedSources = input.checked
          ? this.removeFriendAvailableSources.slice()
          : [];
        this.updateRemoveFriendAllToggle();
      },

      updateRemoveFriendAllToggle(): void {
        this.$nextTick(() => {
          const input = this.$refs['removeFriendAllToggle'] as
            | HTMLInputElement
            | undefined;
          if (!input) return;
          input.indeterminate = this.someRemoveFriendSourcesSelected;
        });
      },

      async executeRemoveFriend(
        character: Character,
        selectedSources: string[]
      ): Promise<void> {
        const key = this.actionKey('friend', character.name);
        if (this.isPending(key)) return;

        this.setPending(key, true);
        try {
          const target = await this.getSimpleCharacter(character.name);
          for (const sourceName of selectedSources) {
            const source =
              sourceName === core.characters.ownCharacter.name
                ? await this.getOwnSimpleCharacter()
                : await this.getSimpleCharacter(sourceName);
            const friend: Friend = {
              id: 0,
              source,
              target,
              createdAt: Date.now() / 1000
            };
            await methods.friendDissolve(friend);
          }
        } catch (e) {
          alert(errorToString(e));
        } finally {
          this.setPending(key, false);
        }
      },

      executeRemoveBookmark(character: Character): void {
        const key = this.actionKey('bookmark', character.name);
        if (this.isPending(key)) return;

        this.setPending(key, true);
        core.connection
          .queryApi('bookmark-remove.php', { name: character.name })
          .catch((e: object) => alert(errorToString(e)))
          .finally(() => this.setPending(key, false));
      },

      confirmRemoveFriendSelection(): void {
        if (
          this.removeFriendTarget === null ||
          this.removeFriendSelectedSources.length === 0
        ) {
          return;
        }

        void this.executeRemoveFriend(
          this.removeFriendTarget,
          this.removeFriendSelectedSources.slice()
        );
      },

      confirmRemoveBookmark(): void {
        if (this.removeBookmarkTarget === null) return;
        this.executeRemoveBookmark(this.removeBookmarkTarget);
      },

      async removeFriend(
        character: Character,
        event?: MouseEvent
      ): Promise<void> {
        if (this.isPending(this.actionKey('friend', character.name))) return;

        const sourceNames = this.getFriendSources(character);
        const availableSources =
          sourceNames.length > 0
            ? sourceNames
            : [core.characters.ownCharacter.name];

        let selectedSources = availableSources.slice();
        if (!event || !event.shiftKey) {
          this.openRemoveFriendDialog(character, availableSources);
          return;
        }

        await this.executeRemoveFriend(character, selectedSources);
      },

      removeBookmark(character: Character, event?: MouseEvent): void {
        const key = this.actionKey('bookmark', character.name);
        if (this.isPending(key)) return;

        if (!event || !event.shiftKey) {
          this.openRemoveBookmarkDialog(character);
          return;
        }

        this.executeRemoveBookmark(character);
      },

      unignore(name: string): void {
        const key = this.actionKey('ignore', name);
        if (this.isPending(key)) return;
        this.setPending(key, true);
        core.connection.send('IGN', {
          action: 'delete',
          character: name
        });
        this.setPending(key, false);
      },

      unhide(name: string): void {
        const index = core.state.hiddenUsers.indexOf(name);
        if (index !== -1) {
          core.state.hiddenUsers.splice(index, 1);
        }
      },

      getFriendSources(character: Character): string[] {
        const map = core.characters.friendSourceMap || {};
        const sources = map[character.name.toLowerCase()] || [];
        if (!sources.length && character.isCharacterFriend) {
          return [core.characters.ownCharacter.name];
        }
        return sources
          .slice()
          .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      },

      resetFilters(): void {
        this.autoGenderFilterEnabled = false;
        core.state.settings = {
          ...(core.state.settings as any),
          horizonAutoGenderFilter: false
        } as any;

        this.genderFilters = [];
        this.selectedStatuses = [];
        this.sortType = 'normal';
        this.search = '';
      },

      focusFriendsFilter(): void {
        this.$nextTick(() => {
          const input = this.$refs['friendsFilter'] as
            | HTMLInputElement
            | undefined;
          if (input) input.focus();
        });
      }
    }
  });
</script>

<style lang="scss">
  .friends-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;

    .friends-header {
      padding: 8px 10px 2px;
      flex-shrink: 0;

      h4 {
        margin: 0;
        font-size: 17px;
      }
    }

    .friends-header-row {
      display: flex;
      align-items: baseline;
      gap: 10px;
      flex-wrap: wrap;
    }

    .friends-toolbar {
      padding: 10px;
      flex-shrink: 0;
      display: flex;
      gap: 8px;
      align-items: stretch;
    }

    .friends-search {
      width: 100%;
      flex: 1 1 auto;
    }

    .friends-filter-button {
      flex-shrink: 0;
    }

    .filter-items {
      display: block;
    }

    .filter-items label.form-check {
      display: block;
      width: auto;
      margin-bottom: 6px;
    }

    .friends-results {
      flex: 1;
      overflow: hidden;
      padding: 0 10px 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      min-height: 0;
    }

    .friends-columns {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 12px;
      align-items: stretch;
      height: 100%;
      min-height: 0;
    }

    .friends-column {
      min-width: 0;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      padding-right: 2px;
    }

    h5 {
      margin: 10px 0 4px;
      font-size: 15px;
    }

    h6 {
      margin: 8px 0 4px;
      font-size: 14px;
      opacity: 0.85;
    }

    .friend-list {
      margin-bottom: 8px;

      > .friend-result:nth-child(2n) {
        background-color: rgba(0, 0, 0, 0.15);
      }
    }

    .friend-result {
      overflow: hidden;
      width: 100%;
      min-height: 2em;
      max-height: 9em;
      padding: 6px 4px;
      display: flex;
      gap: 6px;
      align-items: flex-start;

      .friend-main {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-width: 0;
      }

      .friend-primary {
        display: flex;
        gap: 6px;
        align-items: flex-start;
        min-width: 0;
      }

      .user-avatar {
        max-width: 2em;
        max-height: 2em;
        min-width: 2em;
        min-height: 2em;
      }

      .user-view {
        flex-shrink: 0;
      }

      .status-text {
        opacity: 0.75;
        padding-left: 4px;
        max-height: 5.5em;
        height: 100%;
        display: inline-flex;
        overflow-y: auto;
        flex-grow: 1;
      }

      .friend-sources {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        font-size: 0.85em;
        opacity: 0.9;
        margin-top: 2px;
      }

      .friend-source-label {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 6px;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.2);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: 0.72em;
      }

      .friend-pill {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: inherit;
        font-weight: 600;
        text-decoration: none;
        transition:
          background-color 120ms ease,
          border-color 120ms ease;
      }

      .friend-pill:hover {
        background: rgba(0, 0, 0, 0.25);
        border-color: rgba(255, 255, 255, 0.18);
      }

      .friend-action {
        flex-shrink: 0;
      }
    }

    @media (max-width: 768px) {
      .friends-toolbar {
        flex-wrap: wrap;
      }

      .friends-columns {
        grid-template-columns: 1fr;
        height: auto;
      }

      .friends-search {
        margin-left: 0;
        min-width: 0;
      }

      .friends-results {
        overflow: auto;
      }

      .friends-column {
        overflow: visible;
        padding-right: 0;
      }

      .friend-sources {
        padding-left: 0;
      }
    }

    &.show-avatars {
      .friend-sources {
        padding-left: 2.4em;
      }
    }
  }
</style>

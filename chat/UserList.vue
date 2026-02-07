<template>
  <sidebar
    id="user-list"
    :label="l('users.title')"
    icon="fa-users"
    :right="true"
    :open="expanded"
  >
    <tabs
      style="flex-shrink: 0"
      :fullWidth="true"
      :tabs="
        //We label the 'all' tab as 2 so that it doesnt pop up when going
        //from a channel to the console. It's very annoying behaviour
        channel
          ? { 0: l('users.friends'), 1: l('users.members') }
          : !isConsoleTab
            ? { 0: l('users.friends'), 1: l('user.profile') }
            : { 0: l('users.friends'), 2: l('users.friends.all') }
      "
      v-model="tab"
    ></tabs>
    <div
      class="users hidden-scrollbar"
      style="padding-left: 10px"
      v-if="tab === '0'"
    >
      <h4 v-if="showPerCharacterFriends && characterFriends.length > 0">
        {{ l('users.characterFriends') }}
      </h4>
      <div
        v-if="showPerCharacterFriends"
        v-for="character in characterFriends"
        :key="'char-' + character.name"
        class="userlist-item"
      >
        <user
          :character="character"
          :showStatus="true"
          :bookmark="false"
          :isMarkerShown="shouldShowMarker"
        ></user>
      </div>
      <h4 v-if="friends.length > 0">
        {{
          l(
            `users.${showPerCharacterFriends && characterFriends.length > 0 ? 'friends.nonCharacter' : 'friends'}`
          )
        }}
      </h4>
      <div
        v-for="character in friends"
        :key="'friend-' + character.name"
        class="userlist-item"
      >
        <user
          :character="character"
          :showStatus="true"
          :bookmark="false"
          :isMarkerShown="shouldShowMarker"
        ></user>
      </div>
      <h4 v-if="bookmarks.length > 0">{{ l('users.bookmarks') }}</h4>
      <div
        v-for="character in bookmarks"
        :key="'bookmark-' + character.name"
        class="userlist-item"
      >
        <user
          :character="character"
          :showStatus="true"
          :bookmark="false"
          :isMarkerShown="shouldShowMarker"
        ></user>
      </div>
    </div>
    <div
      v-if="channel && tab !== '0'"
      style="padding-left: 5px; flex: 1; display: flex; flex-direction: column"
    >
      <div class="users hidden-scrollbar" style="flex: 1; padding-left: 5px">
        <h4>
          <span style="display: inline-block">{{ memberCountText }}</span>
        </h4>
        <div
          v-for="member in filteredMembers"
          :key="member.character.name"
          class="userlist-item"
        >
          <user
            :character="member.character"
            :channel="channel"
            :showStatus="true"
            :isMarkerShown="shouldShowMarker"
          ></user>
        </div>
      </div>

      <!--<span class="input-group-text">
          <span class="fas fa-search"></span>
        </span>-->

      <dropdown
        class="input-group"
        wrapClass="dropup"
        style="margin-top: 5px; flex-shrink: 0"
        :keep-open="true"
        :title="''"
        link-style="''"
        :link-class="dropdownLinkClass"
        icon-class="fas fa-filter"
        :dropup="true"
      >
        <div class="p-2" style="margin: 0px 5px" @click.stop>
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
                class="form-check"
                style="display: block; margin: 0 0 0 0"
                v-for="s in ['normal', 'status', 'gender']"
                :key="s"
                @click.stop
              >
                <input
                  class="form-check-input"
                  type="radio"
                  :value="s"
                  v-model="sortType"
                  @click.stop
                />
                <span class="form-check-label" style="margin-left: 6px">{{
                  l('users.filters.sort.' + s)
                }}</span>
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
                  class="form-check-input"
                  type="checkbox"
                  :value="status"
                  v-model="selectedStatuses"
                  @click.stop
                />
                <span class="form-check-label" style="margin-left: 6px">{{
                  l(`status.${status}`)
                }}</span>
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
                  class="form-check-input"
                  type="checkbox"
                  :value="gender"
                  v-model="genderFilters"
                  @change="onManualGenderChange"
                  @click.stop
                />
                <span class="form-check-label" style="margin-left: 6px">{{
                  gender
                }}</span>
              </label>
            </div>
          </div>
        </div>
        <template v-slot:split>
          <input
            class="form-control"
            v-model="filter"
            :placeholder="l('filter')"
            type="text"
          />
        </template>
      </dropdown>
    </div>
    <div
      v-if="!channel && !isConsoleTab && tab !== '0'"
      style="
        flex: 1;
        display: flex;
        flex-direction: column;
        padding-bottom: 10px;
      "
      class="profile hidden-scrollbar"
    >
      <a :href="profileUrl" target="_blank" class="btn profile-button">
        <span class="fa fa-fw fa-user"></span>
        {{ l('user.fullProfile') }}
      </a>

      <character-page
        :authenticated="true"
        :oldApi="true"
        :name="profileName"
        :image-preview="true"
        ref="characterPage"
      ></character-page>
    </div>
    <div
      v-if="isConsoleTab && tab === '2'"
      class="users hidden-scrollbar"
      style="padding-left: 10px"
    >
      <h4 v-if="showPerCharacterFriends && allCharacterFriends.length > 0">
        {{ l('users.characterFriends.all') }}
      </h4>
      <div
        v-if="showPerCharacterFriends"
        v-for="character in allCharacterFriends"
        :key="'char-friends-all-' + character.name"
        class="userlist-item"
      >
        <user
          :character="character"
          :showStatus="false"
          :bookmark="true"
          :isMarkerShown="shouldShowMarker"
          :loadColor="false"
        ></user>
      </div>
      <h4 v-if="allFriends.length > 0">
        {{
          l(
            `users.${showPerCharacterFriends && allCharacterFriends.length > 0 ? 'friends.nonCharacter.all' : 'friends'}`
          )
        }}
      </h4>
      <div
        v-for="character in allFriends"
        :key="'friend-all' + character.name"
        class="userlist-item"
      >
        <user
          :character="character"
          :showStatus="false"
          :bookmark="true"
          :isMarkerShown="shouldShowMarker"
          :loadColor="false"
        ></user>
      </div>

      <h4>{{ l('users.bookmarks.all') }}</h4>

      <div
        v-for="character in allBookmarks"
        :key="'bookmarks-all' + character.name"
        class="userlist-item"
      >
        <user
          :character="character"
          :showStatus="false"
          :bookmark="true"
          :isMarkerShown="false"
          :loadColor="false"
        ></user>
      </div>
    </div>
  </sidebar>
</template>

<script lang="ts">
  import { Component, Hook } from '@f-list/vue-ts';
  import Vue from 'vue';
  import Tabs from '../components/tabs';
  import core from './core';
  import { Channel, Character, Conversation } from './interfaces';
  import l from './localize';
  import Sidebar from './Sidebar.vue';
  import UserView from './UserView.vue';
  import characterPage from '../site/character_page/character_page.vue';
  import { profileLink } from './common';
  import {
    genderOptions as builtInGenderOptions,
    filterByName,
    filterByGender,
    filterByStatus,
    sortMembers
  } from './memberFilters';
  import { computeGenderPreferenceBuckets } from './memberFilters';
  import Dropdown from '../components/Dropdown.vue';

  const availableSorts = ['normal', 'status', 'gender'] as const;

  @Component({
    components: {
      characterPage,
      user: UserView,
      sidebar: Sidebar,
      tabs: Tabs,
      dropdown: Dropdown
    }
  })
  class UserList extends Vue {
    tab = '0';
    expanded = window.innerWidth >= 992;
    filter = '';

    genderFilters: string[] =
      core &&
      core.state &&
      (core.state.settings as any) &&
      (core.state.settings as any).horizonPersistentMemberFilters &&
      Array.isArray((core.state.settings as any).horizonSavedGenderFilters)
        ? (core.state.settings as any).horizonSavedGenderFilters.slice()
        : [];

    genderOptions: string[] = builtInGenderOptions.slice();

    autoGenderFilterEnabled: boolean =
      core &&
      (core.state as any) &&
      (core.state.settings as any) &&
      typeof (core.state.settings as any).horizonAutoGenderFilter === 'boolean'
        ? (core.state.settings as any).horizonAutoGenderFilter
        : true;

    statusOptions: string[] = ['looking', 'online', 'idle', 'away', 'busy'];
    selectedStatuses: string[] = [];
    l = l;
    sorter = (x: Character, y: Character) =>
      x.name.toLocaleLowerCase() < y.name.toLocaleLowerCase()
        ? -1
        : x.name.toLocaleLowerCase() > y.name.toLocaleLowerCase()
          ? 1
          : 0;

    sortType: (typeof availableSorts)[number] = ((core &&
      core.state &&
      (core.state.settings as any) &&
      (core.state.settings as any).horizonPersistentMemberFilters &&
      (core.state.settings as any).horizonSavedMembersSort) ||
      'normal') as (typeof availableSorts)[number];

    @Hook('mounted')
    mounted(): void {
      this.applyOrientationAutoFilter();

      this.$watch(
        () => core.characters.ownProfile,
        (val: any) => {
          if (val) {
            this.applyOrientationAutoFilter();
          } else {
            if (!(core.state.settings as any).horizonPersistentMemberFilters) {
              this.genderFilters = [];
              this.selectedStatuses = [];
              this.sortType = 'normal';
            }
          }
        },
        { immediate: true }
      );

      this.$watch('tab', (val: any) => {
        if (val === '1' && this.channel) this.applyOrientationAutoFilter();
      });

      this.$watch(
        () => this.genderFilters.slice(),
        (val: any) => {
          if ((core.state.settings as any).horizonPersistentMemberFilters) {
            core.state.settings = {
              ...(core.state.settings as any),
              horizonSavedGenderFilters: val
            } as any;
          }
        },
        { deep: true }
      );

      this.$watch('sortType', (val: any) => {
        if ((core.state.settings as any).horizonPersistentMemberFilters) {
          core.state.settings = {
            ...(core.state.settings as any),
            horizonSavedMembersSort: val
          } as any;
        }
      });
    }

    applyOrientationAutoFilter(): void {
      if (!this.autoGenderFilterEnabled) return;
      const prof = core.characters.ownProfile as any;
      if (!prof || !prof.character) return;

      const buckets = computeGenderPreferenceBuckets(prof as any);
      const genders = (buckets.match || []).concat(buckets.weakMatch || []);

      if (genders && genders.length > 0) {
        this.genderFilters = genders.slice();
      } else {
        this.genderFilters = [];
      }
    }

    toggleAutoGenderFilter(): void {
      this.autoGenderFilterEnabled = !this.autoGenderFilterEnabled;
      core.state.settings = {
        ...(core.state.settings as any),
        horizonAutoGenderFilter: this.autoGenderFilterEnabled
      } as any;
      if (this.autoGenderFilterEnabled) {
        this.applyOrientationAutoFilter();
      }
    }

    onManualGenderChange(): void {
      if (this.autoGenderFilterEnabled) {
        this.autoGenderFilterEnabled = false;
        core.state.settings = {
          ...(core.state.settings as any),
          horizonAutoGenderFilter: false
        } as any;
      }
    }

    //Making these settings a getter performs better with larger lists
    get showPerCharacterFriends(): boolean {
      return core.state.settings.showPerCharacterFriends;
    }

    get hideNonCharacterFriends(): boolean {
      return core.state.settings.hideNonCharacterFriends;
    }

    get characterFriends(): Character[] {
      if (!this.showPerCharacterFriends) {
        return [];
      }
      return core.characters.characterFriends.slice().sort(this.sorter);
    }

    get friends(): Character[] {
      let friendsList = core.characters.friends.slice();

      // If per-character friends are shown, filter them out to avoid duplicates
      if (this.showPerCharacterFriends) {
        const characterFriendNames = new Set(
          core.characters.characterFriendList.map(name => name.toLowerCase())
        );
        friendsList = friendsList.filter(
          f => !characterFriendNames.has(f.name.toLowerCase())
        );

        // If hideNonCharacterFriends is enabled, hide ALL remaining global friends
        if (core.state.settings.hideNonCharacterFriends) {
          return [];
        }
      }

      return friendsList.sort(this.sorter);
    }

    get allCharacterFriends(): Character[] {
      if (!this.showPerCharacterFriends) {
        return [];
      }
      const characterFriendsList = core.characters.characterFriendList.slice();

      let characters: Character[] = [];
      characterFriendsList.forEach((name: string) => {
        characters.push(core.characters.get(name));
      });
      return characters.sort(this.sorter);
    }

    get allFriends(): Character[] {
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

        if (core.state.settings.hideNonCharacterFriends) {
          return [];
        }
      }

      let characters: Character[] = [];
      friendsList.forEach((name: string) => {
        characters.push(core.characters.get(name));
      });
      return characters.sort(this.sorter);
    }

    get allBookmarks(): Character[] {
      const bookmarksList = core.characters.bookmarkList.slice();

      let characters: Character[] = [];
      bookmarksList.forEach((name: string) => {
        characters.push(core.characters.get(name));
      });
      return characters.sort(this.sorter);
    }

    get bookmarks(): Character[] {
      let friendNames =
        this.showPerCharacterFriends &&
        core.state.settings.hideNonCharacterFriends
          ? new Set(
              core.characters.characterFriends.map(characterFriend =>
                characterFriend.name.toLowerCase()
              )
            )
          : new Set(
              core.characters.friends.map(friend => friend.name.toLowerCase())
            );
      let bookmarks = core.characters.bookmarks
        .slice()
        .filter(x => !friendNames.has(x.name.toLowerCase()));

      if (this.showPerCharacterFriends) {
        const characterFriendNames = new Set(
          core.characters.characterFriendList.map(name => name.toLowerCase())
        );
        bookmarks = bookmarks.filter(
          x => !characterFriendNames.has(x.name.toLowerCase())
        );
      }

      return bookmarks.sort(this.sorter);
    }

    get channel(): Channel {
      return (<Conversation.ChannelConversation>(
        core.conversations.selectedConversation
      )).channel;
    }

    get isConsoleTab(): boolean {
      return (
        core.conversations.selectedConversation ===
        core.conversations.consoleTab
      );
    }
    get profileName(): string | undefined {
      return this.channel
        ? undefined
        : core.conversations.selectedConversation.name;
    }

    get profileUrl(): string | undefined {
      if (!this.profileName) {
        return;
      }

      return profileLink(this.profileName);
    }

    get filteredMembers(): ReadonlyArray<Channel.Member> {
      const members = this.getFilteredMembers();
      return sortMembers(members, this.sortType);
    }

    get memberCountText(): string {
      const total = this.channel ? this.channel.sortedMembers.length : 0;
      const shown = this.filteredMembers ? this.filteredMembers.length : 0;
      if (shown !== total) {
        return `${shown}/${total} ${this.l('users.members')}`;
      }
      return this.l('users.memberCount', total);
    }

    get dropdownWrapClass(): string {
      return !this.filterActive
        ? 'input-group-text dropup btn btn-sm p-0 btn btn-sm p-0 btn-outline-secondary'
        : 'input-group-text dropup btn btn-sm p-0 btn btn-sm p-0 btn-primary';
    }

    get dropdownLinkClass(): string {
      return !this.filterActive
        ? 'dropdown-toggle btn btn-secondary'
        : 'dropdown-toggle btn btn-primary';
    }

    getFilteredMembers() {
      let visible = filterByName(this.channel.sortedMembers, this.filter);

      if (core.state.settings.risingFilter.hideChannelMembers) {
        visible = visible.filter(m => {
          const p = core.cache.profileCache.getSync(m.character.name);
          return !p || !p.match.isFiltered;
        });
      }

      visible = filterByGender(visible, this.genderFilters);
      visible = filterByStatus(visible, this.selectedStatuses);

      return visible;
    }

    resetFilters(): void {
      this.autoGenderFilterEnabled = false;
      core.state.settings = {
        ...(core.state.settings as any),
        horizonAutoGenderFilter: false
      } as any;

      this.genderFilters = [];
      this.selectedStatuses = [];
      this.sortType = 'normal';
      this.filter = '';
    }

    get shouldShowMarker(): boolean {
      return core.state.settings.horizonShowGenderMarker;
    }

    get filterActive(): boolean {
      return (
        (this.genderFilters && this.genderFilters.length > 0) ||
        (this.selectedStatuses && this.selectedStatuses.length > 0) ||
        this.sortType !== 'normal'
      );
    }
  }

  export default UserList;
</script>

<style lang="scss">
  @import '~bootstrap/scss/functions';
  @import '~bootstrap/scss/variables';
  @import '~bootstrap/scss/mixins/breakpoints';

  #user-list {
    flex-direction: column;
    h4 {
      margin: 5px 0 0 -5px;
      font-size: 17px;
    }

    .users {
      height: 100%;
    }

    /* Ensure filter containers stack items vertically (one per line) */
    .filter-items {
      display: block;
    }

    .filter-items label.form-check {
      display: block;
      width: auto;
      margin-bottom: 6px;
    }

    .nav li:first-child a {
      border-left: 0;
      border-top-left-radius: 0;
    }

    .sidebar {
      .body {
        overflow-x: hidden;
      }
    }

    .userlist-item {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    @media (min-width: breakpoint-min(md)) {
      .sidebar {
        position: static;
        margin: 0;
        height: 100%;
      }

      .modal-backdrop {
        display: none;
      }
    }

    &.open .body {
      display: flex;
    }

    .profile {
      .profile-button {
        border: 1px var(--bs-secondary) solid;
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
        min-height: 2rem;
        margin-left: 0.3rem;
        margin-right: 0.3rem;
        margin-top: 0.6rem;
        display: block;
      }

      h4 {
        margin: 0.5rem 0 0.5rem 0 !important;
        padding-left: 0.25rem;
        padding-right: 0.2rem;
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
        color: var(--characterKinkCustomColor);
      }

      .match-report {
        display: none;
      }

      .tab-content #overview > div {
        margin-bottom: 0.4rem !important;
        margin-left: 5px;
        margin-right: 5px;

        &.character-kinks-block {
          margin-left: 0;
          margin-right: 0;
        }
      }

      .row.character-page {
        display: flex;
        margin-right: 0;
        margin-left: 0;

        > div {
          max-width: 100% !important;
          margin: 0;
          padding: 0;
          border: 0;
          flex: 0 0 100%;
        }
      }

      #character-page-sidebar {
        border: none;
        background-color: transparent !important;
      }

      .card-body {
        padding: 0;
      }

      .character-page {
        .character-links-block,
        .character-avatar,
        .character-page-note-link,
        .character-card-header,
        .compare-highlight-block {
          display: none !important;
        }

        .character-avatar.icon {
          display: initial !important;
        }

        #characterView {
          .card {
            border: none !important;
            background-color: transparent !important;
          }
          .indentText {
            padding-left: 0px;
          }

          .character-kinks-block {
            .kink-block-no {
              .card {
                background-color: var(--scoreMismatchBgFaint) !important;
              }
            }

            .kink-block-maybe {
              .card {
                background-color: var(--scoreWeakMismatchBgFaint) !important;
              }
            }

            .kink-block-yes {
              .card {
                background-color: var(--scoreWeakMatchBgFaint) !important;
              }
            }

            .kink-block-favorite {
              .card {
                background-color: var(--scoreMatchBgFaint) !important;
              }
            }
          }
        }

        .infotag {
          margin: 0;
          padding: 0;
          margin-bottom: 0.3rem;

          .infotag-value {
            margin: 0;
          }
        }

        .character-list-block {
          display: none !important;
        }

        .quick-info-block {
          margin-left: 5px;
          margin-right: 5px;
        }

        .quick-info {
          display: none !important;
        }

        #headerCharacterMemo {
          margin-left: 5px;
          margin-right: 5px;
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .character-kinks-block {
          > div {
            flex-direction: column !important;
            margin: 0 !important;

            > div {
              min-width: 100% !important;
              padding: 0 !important;
              margin-top: 0.5rem;

              .card {
                border: none !important;

                .card-header {
                  margin: 0;
                  padding: 0;
                }

                div.stock-kink + div.custom-kink {
                  border-top: 1px var(--characterKinkCustomBorderColor) solid !important;
                  padding-top: 0.25rem !important;
                  margin-top: 0.25rem !important;
                }

                .character-kink {
                  margin: 0;
                  padding: 0;

                  &.stock-kink {
                    padding-left: 0.2rem !important;
                    margin-right: 0.3rem !important;
                    margin-left: 0.1rem !important;
                  }

                  &.custom-kink {
                    margin-bottom: 0.3rem;
                    border: none;
                    margin-left: auto;
                    max-width: 95%;
                    margin-right: auto;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px var(--characterKinkCustomBorderColor)
                      solid;
                  }

                  .popover {
                    min-width: 180px;
                    max-width: 180px;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
</style>

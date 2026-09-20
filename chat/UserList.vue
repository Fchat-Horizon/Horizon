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
    <virtual-list
      ref="friendList"
      class="hidden-scrollbar"
      style="overflow: auto; flex: 1 1 auto; padding-left: 10px"
      v-if="tab === '0'"
      :items="friendRows"
      :itemHeight="rowHeight"
      :overscan="overscan"
      :keyFunc="rowKey"
    >
      <template slot-scope="{ item: row }">
        <h4 v-if="row.kind === 'header'">{{ row.label }}</h4>
        <div
          v-else
          class="userlist-item"
          :class="{ dimmed: row.character.isIgnored }"
        >
          <user
            :character="row.character"
            :showStatus="true"
            :bookmark="row.bookmark"
            :isMarkerShown="row.isMarkerShown"
          ></user>
        </div>
      </template>
    </virtual-list>
    <div
      v-if="channel && tab !== '0'"
      style="padding-left: 5px; flex: 1; display: flex; flex-direction: column"
    >
      <div style="padding-left: 5px; flex-shrink: 0">
        <h4>
          <span style="display: inline-block">{{ memberCountText }}</span>
        </h4>
      </div>
      <!-- virtualized members list, because channels with thousands of members shouldn't try to render 
       every custom-colored name at once. the trade-off is that custom colors can sometimes take a bit to 
       load for the rendered area if you scroll really fast, but the pros outweigh the cons imo. -->
      <virtual-list
        ref="memberList"
        class="hidden-scrollbar"
        style="overflow: auto; flex: 1 1 auto; padding-left: 5px"
        :items="filteredMembers"
        :itemHeight="rowHeight"
        :overscan="overscan"
        :keyFunc="memberKey"
      >
        <template slot-scope="{ item: member }">
          <div
            class="userlist-item"
            :class="{ dimmed: member.character.isIgnored }"
          >
            <user
              :character="member.character"
              :channel="channel"
              :showStatus="true"
              :isMarkerShown="shouldShowMarker"
            ></user>
          </div>
        </template>
      </virtual-list>

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
    <virtual-list
      ref="allList"
      class="hidden-scrollbar"
      style="overflow: auto; flex: 1 1 auto; padding-left: 10px"
      v-if="isConsoleTab && tab === '2'"
      :items="allFriendRows"
      :itemHeight="rowHeight"
      :overscan="overscan"
      :keyFunc="rowKey"
    >
      <template slot-scope="{ item: row }">
        <h4 v-if="row.kind === 'header'">{{ row.label }}</h4>
        <div
          v-else
          class="userlist-item"
          :class="{ dimmed: row.character.isIgnored }"
        >
          <user
            :character="row.character"
            :showStatus="false"
            :bookmark="row.bookmark"
            :isMarkerShown="row.isMarkerShown"
            :loadColor="false"
          ></user>
        </div>
      </template>
    </virtual-list>
  </sidebar>
</template>

<script lang="ts">
  import Vue from 'vue';
  import Tabs from '../components/tabs';
  import core from './core';
  import { Channel, Character, Conversation } from './interfaces';
  import l, { lp } from './localize';
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
  import VirtualList from '../components/VirtualList.vue';
  import { isFilteredByChatGender } from '../learn/filter/smart-filter';
  import { EventBus } from './preview/event-bus';

  // the friends and "all" views are three sections with headers between them,
  // and VirtualList takes one flat array, so headers become rows of their own
  interface CharacterListRow {
    kind: 'header' | 'user';
    key: string;
    label?: string;
    character?: Character;
    bookmark?: boolean;
    isMarkerShown?: boolean;
  }

  interface CharacterListSection {
    key: string;
    label: string | null;
    characters: Character[];
    bookmark: boolean;
    isMarkerShown: boolean;
  }

  const availableSorts = ['normal', 'status', 'gender'] as const;

  export default Vue.extend({
    components: {
      characterPage,
      user: UserView,
      sidebar: Sidebar,
      tabs: Tabs,
      dropdown: Dropdown,
      'virtual-list': VirtualList
    },
    data() {
      return {
        tab: '0',
        expanded: window.innerWidth >= 992,
        filter: '',
        rowHeight: 22,
        rowHeightMeasured: false,
        overscan: 8,
        filteredNames: {} as Record<string, boolean>,
        filterScanToken: 0,
        filterScanning: false,
        scoreListener: (() => {}) as (e: any) => void,
        genderFilters: (core &&
        core.state &&
        (core.state.settings as any) &&
        (core.state.settings as any).horizonPersistentMemberFilters &&
        Array.isArray((core.state.settings as any).horizonSavedGenderFilters)
          ? (core.state.settings as any).horizonSavedGenderFilters.slice()
          : []) as string[],
        genderOptions: builtInGenderOptions.slice() as string[],
        autoGenderFilterEnabled: (core &&
        (core.state as any) &&
        (core.state.settings as any) &&
        typeof (core.state.settings as any).horizonAutoGenderFilter ===
          'boolean'
          ? (core.state.settings as any).horizonAutoGenderFilter
          : true) as boolean,
        statusOptions: [
          'looking',
          'online',
          'idle',
          'away',
          'busy'
        ] as string[],
        selectedStatuses: [] as string[],
        l: l,
        sorter: (x: Character, y: Character) =>
          x.name.toLocaleLowerCase() < y.name.toLocaleLowerCase()
            ? -1
            : x.name.toLocaleLowerCase() > y.name.toLocaleLowerCase()
              ? 1
              : 0,
        sortType: ((core &&
          core.state &&
          (core.state.settings as any) &&
          (core.state.settings as any).horizonPersistentMemberFilters &&
          (core.state.settings as any).horizonSavedMembersSort) ||
          'normal') as (typeof availableSorts)[number]
      };
    },
    computed: {
      //Making these settings a getter performs better with larger lists
      showPerCharacterFriends(): boolean {
        return core.state.settings.showPerCharacterFriends;
      },
      hideNonCharacterFriends(): boolean {
        return core.state.settings.hideNonCharacterFriends;
      },
      characterFriends(): Character[] {
        if (!this.showPerCharacterFriends) {
          return [];
        }
        return core.characters.characterFriends.slice().sort(this.sorter);
      },
      friends(): Character[] {
        const seenNames = new Set<string>();
        let friendsList = core.characters.friends.filter(f => {
          const key = f.name.toLowerCase();
          if (seenNames.has(key)) return false;
          seenNames.add(key);
          return true;
        });

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
      },
      allCharacterFriends(): Character[] {
        if (!this.showPerCharacterFriends) {
          return [];
        }
        const characterFriendsList =
          core.characters.characterFriendList.slice();

        let characters: Character[] = [];
        characterFriendsList.forEach((name: string) => {
          characters.push(core.characters.get(name));
        });
        return characters.sort(this.sorter);
      },
      allFriends(): Character[] {
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
      },
      allBookmarks(): Character[] {
        const bookmarksList = core.characters.bookmarkList.slice();

        let characters: Character[] = [];
        bookmarksList.forEach((name: string) => {
          characters.push(core.characters.get(name));
        });
        return characters.sort(this.sorter);
      },
      friendRows(): CharacterListRow[] {
        const showChars =
          this.showPerCharacterFriends && this.characterFriends.length > 0;

        return this.buildCharacterRows([
          {
            key: 'char',
            label: showChars ? this.l('users.characterFriends') : null,
            characters: this.showPerCharacterFriends
              ? this.characterFriends
              : [],
            bookmark: false,
            isMarkerShown: this.shouldShowMarker
          },
          {
            key: 'friend',
            label:
              this.friends.length > 0
                ? this.l(
                    showChars ? 'users.friends.nonCharacter' : 'users.friends'
                  )
                : null,
            characters: this.friends,
            bookmark: false,
            isMarkerShown: this.shouldShowMarker
          },
          {
            key: 'bookmark',
            label: this.bookmarks.length > 0 ? this.l('users.bookmarks') : null,
            characters: this.bookmarks,
            bookmark: false,
            isMarkerShown: this.shouldShowMarker
          }
        ]);
      },
      allFriendRows(): CharacterListRow[] {
        const showChars =
          this.showPerCharacterFriends && this.allCharacterFriends.length > 0;

        return this.buildCharacterRows([
          {
            key: 'char-friends-all',
            label: showChars ? this.l('users.characterFriends.all') : null,
            characters: this.showPerCharacterFriends
              ? this.allCharacterFriends
              : [],
            bookmark: false,
            isMarkerShown: this.shouldShowMarker
          },
          {
            key: 'friend-all',
            label:
              this.allFriends.length > 0
                ? this.l(
                    showChars
                      ? 'users.friends.nonCharacter.all'
                      : 'users.friends'
                  )
                : null,
            characters: this.allFriends,
            bookmark: false,
            isMarkerShown: this.shouldShowMarker
          },
          {
            key: 'bookmarks-all',
            // this header shows even when the list is empty
            label: this.l('users.bookmarks.all'),
            characters: this.allBookmarks,
            bookmark: true,
            isMarkerShown: false
          }
        ]);
      },
      bookmarks(): Character[] {
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
      },
      channel(): Channel {
        return (<Conversation.ChannelConversation>(
          core.conversations.selectedConversation
        )).channel;
      },
      isConsoleTab(): boolean {
        return (
          core.conversations.selectedConversation ===
          core.conversations.consoleTab
        );
      },
      profileName(): string | undefined {
        return this.channel
          ? undefined
          : core.conversations.selectedConversation.name;
      },
      profileUrl(): string | undefined {
        if (!this.profileName) {
          return;
        }

        return profileLink(this.profileName);
      },
      filteredMembers(): ReadonlyArray<Channel.Member> {
        const members = this.getFilteredMembers();
        return sortMembers(members, this.sortType);
      },
      memberResetKey(): string {
        return [
          this.channel?.id,
          this.filter,
          this.sortType,
          this.genderFilters.join(','),
          this.selectedStatuses.join(',')
        ].join('|');
      },
      memberCountText(): string {
        const total = this.channel ? this.channel.sortedMembers.length : 0;
        const shown = this.filteredMembers ? this.filteredMembers.length : 0;
        if (shown !== total) {
          return `${shown}/${total} ${this.l('users.members')}`;
        }
        return lp('users.memberCount', total);
      },
      dropdownWrapClass(): string {
        return !this.filterActive
          ? 'input-group-text dropup btn btn-sm p-0 btn btn-sm p-0 btn-outline-secondary'
          : 'input-group-text dropup btn btn-sm p-0 btn btn-sm p-0 btn-primary';
      },
      dropdownLinkClass(): string {
        return !this.filterActive
          ? 'dropdown-toggle btn btn-secondary'
          : 'dropdown-toggle btn btn-primary';
      },
      shouldShowMarker(): boolean {
        return core.state.settings.horizonShowGenderMarker;
      },
      filterActive(): boolean {
        return (
          (this.genderFilters && this.genderFilters.length > 0) ||
          (this.selectedStatuses && this.selectedStatuses.length > 0) ||
          this.sortType !== 'normal'
        );
      }
    },
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
        void this.scanSmartFilterHiding();
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

      // only the scroll position is stale when the list is rebuilt. the measured
      // row heights are keyed by character and stay valid, so don't use resetKey
      this.$watch('memberResetKey', () => {
        const list = this.$refs['memberList'] as
          | { resetScroll(): void }
          | undefined;
        if (list) list.resetScroll();
      });

      // font size is applied via injected css, so it never re-renders. re-measure on
      // nextTick, after ChatView's watcher has actually applied the new size
      this.$watch(
        () => core.state.settings.fontSize,
        () => {
          this.rowHeightMeasured = false;
          this.$nextTick(() => this.syncRowHeight());
        }
      );

      // verdicts are per character, so they outlive a channel switch. only an
      // in-flight scan is stale. changing the filters invalidates all of them
      this.$watch(
        () => this.channel?.id,
        () => {
          this.filterScanToken++;
          void this.scanSmartFilterHiding();
        }
      );

      this.$watch(
        () => this.channel?.sortedMembers.length,
        () => void this.scanSmartFilterHiding()
      );

      this.$watch(
        () => core.state.settings.risingFilter,
        () => {
          this.filteredNames = {};
          this.filterScanToken++;
          void this.scanSmartFilterHiding();
        },
        { deep: true }
      );

      // a profile arriving from the fetch queue is the only other way we learn a
      // verdict. without this the list only catches up when someone joins or leaves
      this.scoreListener = (e: any) => {
        const name = e?.character?.character?.name;

        if (!name || !core.state.settings.risingFilter.hideChannelMembers)
          return;
        if (this.filteredNames[name] === e.isFiltered) return;

        this.filteredNames = { ...this.filteredNames, [name]: e.isFiltered };
      };

      EventBus.$on('character-score', this.scoreListener);

      void this.scanSmartFilterHiding();

      this.$nextTick(() => this.syncRowHeight());
    },
    updated(): void {
      if (!this.rowHeightMeasured) this.syncRowHeight();
    },
    beforeDestroy(): void {
      EventBus.$off('character-score', this.scoreListener);
    },
    methods: {
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
        if (this.autoGenderFilterEnabled) {
          this.autoGenderFilterEnabled = false;
          core.state.settings = {
            ...(core.state.settings as any),
            horizonAutoGenderFilter: false
          } as any;
        }
      },

      buildCharacterRows(sections: CharacterListSection[]): CharacterListRow[] {
        const rows: CharacterListRow[] = [];

        for (const section of sections) {
          if (section.label !== null) {
            rows.push({
              kind: 'header',
              key: section.key + '-header',
              label: section.label
            });
          }

          for (const character of section.characters) {
            rows.push({
              kind: 'user',
              key: section.key + '-' + character.name,
              character,
              bookmark: section.bookmark,
              isMarkerShown: section.isMarkerShown
            });
          }
        }

        return rows;
      },

      rowKey(row: CharacterListRow): string {
        return row.key;
      },

      memberKey(member: Channel.Member): string {
        return member.character.name;
      },

      // rows are always the same height for a user, so we can measure it once and
      // call it a day. the font size watcher in mounted() re-arms this if it changes
      syncRowHeight(): void {
        let row: Element | null = null;

        for (const name of ['memberList', 'friendList', 'allList']) {
          const list = this.$refs[name] as Vue | undefined;
          // .userlist-item so a section header is never what we measure
          row =
            list?.$el.querySelector('.virtual-list-row .userlist-item') ?? null;
          if (row) break;
        }

        if (!row) return;

        const height = row.getBoundingClientRect().height;
        if (height <= 0) return;

        this.rowHeight = height;
        this.rowHeightMeasured = true;
      },

      // hideChannelMembers needs a verdict for every member, but only rendered rows
      // load profiles now, so anyone you never scrolled past was never hidden. walk
      // the roster in the background instead and remember the answers. members we
      // still know nothing about stay visible
      async scanSmartFilterHiding(): Promise<void> {
        if (this.filterScanning || this.tab === '0' || !this.channel) return;
        if (!core.state.settings.risingFilter.hideChannelMembers) return;

        const token = this.filterScanToken;
        const pending: string[] = [];

        for (const member of this.channel.sortedMembers) {
          const name = member.character.name;
          if (!(name in this.filteredNames)) pending.push(name);
        }

        if (pending.length === 0) return;

        this.filterScanning = true;

        try {
          for (let i = 0; i < pending.length; i += 50) {
            const batch: Record<string, boolean> = {};

            for (const name of pending.slice(i, i + 50)) {
              const verdict =
                await core.cache.profileCache.isFilteredFromStore(name);

              if (verdict !== null) batch[name] = verdict;
            }

            if (token !== this.filterScanToken) return;

            if (Object.keys(batch).length > 0) {
              this.filteredNames = { ...this.filteredNames, ...batch };
            }

            await new Promise(resolve => setTimeout(resolve));
          }
        } finally {
          this.filterScanning = false;
        }
      },

      getFilteredMembers() {
        let visible = filterByName(this.channel.sortedMembers, this.filter);

        const filters = core.state.settings.risingFilter;

        if (filters.hideChannelMembers) {
          visible = visible.filter(
            m =>
              this.filteredNames[m.character.name] !== true &&
              !isFilteredByChatGender(m.character, filters)
          );
        }

        visible = filterByGender(visible, this.genderFilters);
        visible = filterByStatus(visible, this.selectedStatuses);

        return visible;
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
        this.filter = '';
      }
    }
  });
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

    .userlist-item.dimmed {
      opacity: 0.5;
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

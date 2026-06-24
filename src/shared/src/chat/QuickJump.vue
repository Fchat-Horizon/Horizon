<template>
  <div v-show="visible">
    <div class="quick-jump-overlay" @click="hide">
      <div class="quick-jump-container bg-light" @click.stop>
        <div class="quick-jump-header">
          <span class="fas fa-shuffle"></span>
          <span>{{ l('quickJump.title') }}</span>
        </div>
        <input
          ref="searchInput"
          v-model="searchQuery"
          :placeholder="l('quickJump.placeholder')"
          class="quick-jump-input form-control"
          @keydown="onKeyDown"
          @input="onInput"
        />
        <div class="quick-jump-results" v-show="filteredResults.length > 0">
          <div
            v-for="(result, index) in filteredResults"
            :key="result.key"
            :class="[
              'quick-jump-result',
              { 'selected border-left': index === selectedIndex }
            ]"
            @click="selectResult(result)"
            @mouseenter="selectedIndex = index"
          >
            <span class="result-icon">
              <span :class="getResultIcon(result)"></span>
            </span>

            <span class="result-name">{{ result.name }} </span>
            <span v-if="hasMentions(result)" class="badge text-bg-warning">
              <span v-if="showUnreadAmount()">
                {{ result.conversation?.unreadCount }}
              </span>

              <i v-else class="fa-fw fa-solid fa-exclamation"></i
            ></span>
            <span v-else-if="isUnread(result)" class="badge text-bg-danger"
              ><i class="fa-fw fa-solid fa-ellipsis"></i
            ></span>
            <span class="result-description" v-if="result.description">
              {{
                isMostRecent(result)
                  ? l('quickJump.lastConversation')
                  : result.description
              }}
            </span>
          </div>
        </div>
        <div
          class="quick-jump-footer"
          v-show="filteredResults.length === 0 && searchQuery.length > 0"
        >
          <span>{{ l('quickJump.noResults') }}</span>
          <div
            class="quick-jump-new-conversation border"
            :class="{ selected: selectedIndex === -1 }"
            @click="openNewConversation"
            @mouseenter="selectedIndex = -1"
          >
            <span class="result-icon">
              <span class="fas fa-plus"></span>
            </span>
            <span class="result-name">{{
              l('quickJump.openNewConversation', searchQuery)
            }}</span>
          </div>
        </div>
      </div>
    </div>
    <div @click="hide" class="show modal-backdrop"></div>
  </div>
</template>

<script lang="ts">
  import { defineComponent } from 'vue';
  import { getKey } from './common';
  import core from './core';
  import { Conversation } from './interfaces';
  import { Keys } from '@/keys';
  import l from './localize';

  interface SearchResult {
    key: string;
    name: string;
    type: 'channel' | 'private' | 'friend' | 'bookmark' | 'recent' | 'console';
    conversation?: Conversation;
    description?: string;
  }

  export default defineComponent({
    data() {
      return {
        l,
        visible: false,
        searchQuery: '',
        selectedIndex: 0,
        allResults: [] as SearchResult[]
      };
    },
    computed: {
      filteredResults(): SearchResult[] {
        // Vue's UnwrapNestedRefs recursively rewrites the nested Conversation
        // interface on `this.allResults`, yielding a structurally distinct
        // element type. No refs actually live inside SearchResult, so the
        // unwrapped value is the same shape at runtime - cast back to the
        // declared type rather than weaken the public computed signature.
        const all = this.allResults as SearchResult[];

        if (this.searchQuery.length === 0) {
          return all.slice(0, 10);
        }

        const query = this.searchQuery.toLowerCase();
        return all
          .filter(result => result.name.toLowerCase().includes(query))
          .slice(0, 10);
      }
    },
    watch: {
      visible(newValue: boolean): void {
        if (newValue) {
          this.updateResults();
        }
      }
    },
    methods: {
      show(): void {
        this.visible = true;
        this.updateResults();
        this.searchQuery = '';
        this.selectedIndex = 0;
        this.$nextTick(() => {
          const input = this.$refs.searchInput as HTMLInputElement;
          if (input) {
            input.focus();
          }
        });
      },
      hide(): void {
        this.visible = false;
        this.searchQuery = '';
        this.selectedIndex = 0;
      },
      updateResults(): void {
        const results: SearchResult[] = [];

        results.push({
          key: 'console',
          name: core.conversations.consoleTab.name,
          type: 'console',
          conversation: core.conversations.consoleTab,
          description: l('quickJump.consoleDescription')
        });

        for (const conversation of core.conversations.privateConversations) {
          results.push({
            key: conversation.key,
            name: conversation.name,
            type: 'private',
            conversation,
            description: l('quickJump.privateConversation')
          });
        }

        for (const conversation of core.conversations.channelConversations) {
          results.push({
            key: conversation.key,
            name: conversation.name,
            type: 'channel',
            conversation,
            description: l(
              'quickJump.members',
              conversation.channel.sortedMembers.length
            )
          });
        }

        //skip friends that already have an active conversation
        for (const friend of core.characters.friends
          .slice()
          .filter(x => core.conversations.getPrivate(x, true) === undefined)) {
          results.push({
            key: friend.name,
            name: friend.name,
            type: 'friend',
            description: l('user.friend')
          });
        }

        //skip bookmarks already covered by friends or an active conversation
        for (const bookmark of core.characters.bookmarks
          .slice()
          .filter(x => core.characters.friends.indexOf(x) === -1)
          .filter(x => core.conversations.getPrivate(x, true) === undefined)) {
          results.push({
            key: bookmark.name,
            name: bookmark.name,
            type: 'bookmark',
            description: l('user.bookmark')
          });
        }

        //skip recents already covered by bookmarks, friends or an active conversation
        for (const recent of core.conversations.recent
          .slice()
          .filter(
            x =>
              !core.characters.bookmarks.some(
                bookmark => bookmark.name === x.character
              )
          )
          .filter(
            x =>
              !core.characters.friends.some(
                friend => friend.name === x.character
              )
          )
          .filter(
            x =>
              core.conversations.getPrivate(
                core.characters.get(x.character),
                true
              ) === undefined
          )) {
          results.push({
            key: recent.character,
            name: recent.character,
            type: 'recent',
            description: l('quickJump.recent')
          });
        }
        results.sort((a, b) => {
          if (!a.conversation || !b.conversation) return 0;

          //mentions rank first
          if (
            a.conversation.unread === Conversation.UnreadState.Mention &&
            b.conversation.unread !== Conversation.UnreadState.Mention
          ) {
            return -1;
          }
          if (
            b.conversation.unread === Conversation.UnreadState.Mention &&
            a.conversation.unread !== Conversation.UnreadState.Mention
          ) {
            return 1;
          }

          if (
            a.conversation === core.conversations.lastConversation &&
            b.conversation !== core.conversations.lastConversation
          ) {
            return -1;
          }
          if (
            b.conversation === core.conversations.lastConversation &&
            a.conversation !== core.conversations.lastConversation
          ) {
            return 1;
          }

          //remaining unread states rank after mentions and the last conversation
          if (
            a.conversation.unread !== Conversation.UnreadState.None &&
            b.conversation.unread === Conversation.UnreadState.None
          ) {
            return -1;
          }
          if (
            b.conversation.unread !== Conversation.UnreadState.None &&
            a.conversation.unread === Conversation.UnreadState.None
          ) {
            return 1;
          }

          const aLastMessage =
            a.conversation.messages[a.conversation.messages.length - 1];
          const bLastMessage =
            b.conversation.messages[b.conversation.messages.length - 1];

          if (aLastMessage && bLastMessage) {
            return bLastMessage.time.getTime() - aLastMessage.time.getTime();
          }
          if (aLastMessage && !bLastMessage) return -1;
          if (!aLastMessage && bLastMessage) return 1;

          return a.name.localeCompare(b.name);
        });

        this.allResults = results;
      },
      onInput(): void {
        this.selectedIndex = 0;
        this.$nextTick(() => {
          if (
            this.filteredResults.length === 0 &&
            this.searchQuery.length > 0
          ) {
            this.selectedIndex = -1;
          }
        });
      },
      onKeyDown(e: KeyboardEvent): void {
        const key = getKey(e);

        switch (key) {
          case Keys.Escape:
            e.preventDefault();
            this.hide();
            break;

          case Keys.ArrowUp:
            e.preventDefault();
            if (
              this.filteredResults.length === 0 &&
              this.searchQuery.length > 0
            ) {
              this.selectedIndex = -1;
            } else if (this.selectedIndex === -1) {
              this.selectedIndex = this.filteredResults.length - 1;
            } else if (this.selectedIndex > 0) {
              this.selectedIndex--;
            } else {
              if (this.searchQuery.length > 0) {
                this.selectedIndex = -1;
              } else {
                this.selectedIndex = this.filteredResults.length - 1;
              }
            }
            break;

          case Keys.ArrowDown:
            e.preventDefault();
            if (
              this.filteredResults.length === 0 &&
              this.searchQuery.length > 0
            ) {
              this.selectedIndex = -1;
            } else if (this.selectedIndex === -1) {
              this.selectedIndex = 0;
            } else if (this.selectedIndex < this.filteredResults.length - 1) {
              this.selectedIndex++;
            } else {
              if (this.searchQuery.length > 0) {
                this.selectedIndex = -1;
              } else {
                this.selectedIndex = 0;
              }
            }
            break;

          case Keys.Enter:
            e.preventDefault();
            if (
              this.selectedIndex === -1 &&
              this.filteredResults.length === 0 &&
              this.searchQuery.length > 0
            ) {
              this.openNewConversation();
            } else if (this.filteredResults.length > 0) {
              this.selectResult(this.filteredResults[this.selectedIndex]);
            }
            break;
        }
      },
      selectResult(result: SearchResult): void {
        if (result.conversation) {
          result.conversation.show();
        } else {
          const character = core.characters.get(result.name);
          const conversation = core.conversations.getPrivate(character);
          conversation.show();
        }
        this.hide();
      },
      hasMentions(result: SearchResult): boolean {
        return (
          result.conversation !== undefined &&
          result.conversation.unread === Conversation.UnreadState.Mention
        );
      },
      showUnreadAmount(): boolean {
        return (
          core.state.generalSettings
            ?.horizonShowWindowAndChatNotificationBadge === true
        );
      },
      isUnread(result: SearchResult): boolean {
        return (
          result.conversation !== undefined &&
          result.conversation.unread !== Conversation.UnreadState.None
        );
      },
      isMostRecent(result: SearchResult): boolean {
        return (
          result.conversation !== undefined &&
          result.conversation === core.conversations.lastConversation
        );
      },
      openNewConversation(): void {
        if (this.searchQuery.trim().length === 0) return;

        const character = core.characters.get(this.searchQuery.trim());

        const conversation = core.conversations.getPrivate(character);
        conversation.show();

        this.hide();
      },
      getResultIcon(result: SearchResult) {
        switch (result.type) {
          case 'console':
            return 'fas fa-home';
          case 'private':
            return 'fas fa-comment';
          case 'channel':
            return 'fas fa-hashtag';
          case 'friend':
            return 'fas fa-user-group';
          case 'bookmark':
            return 'fas fa-bookmark';
          case 'recent':
            return 'fas fa-clock-rotate-left';
          default:
            return 'fas fa-comment';
        }
      }
    }
  });
</script>

<style lang="scss" scoped>
  .quick-jump-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    //1 above the bootstrap 5 modal z-index (which used to be 1040)
    z-index: 1051;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;

    .quick-jump-container {
      width: 90%;
      max-width: 600px;
      overflow: hidden;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);

      .quick-jump-header {
        padding: 12px 16px;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .quick-jump-input {
        width: 100%;
        border: none;
        padding: 16px;
        font-size: 16px;
        outline: none;

        &::placeholder {
          opacity: 0.8;
        }
      }

      .quick-jump-results {
        overflow-y: auto;
        @media (prefers-reduced-motion: reduce) {
          .quick-jump-result {
            transition: none !important;
          }
        }

        .quick-jump-result {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;

          &:hover {
            background-color: var(--bs-primary);
          }

          &.selected {
            background-color: var(--bs-primary);
            padding-left: 12px;
            font-weight: 600;
          }

          .result-icon {
            width: 20px;
            text-align: center;
            flex-shrink: 0;
          }

          .result-name {
            font-weight: bold;
            flex-shrink: 0;
          }

          .result-description {
            opacity: 0.8;
            font-size: 0.9em;
            margin-left: auto;
            text-align: right;
            flex-shrink: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          &:hover .result-description,
          &.selected .result-description {
            opacity: 0.8;
          }
        }
      }

      .quick-jump-footer {
        padding: 16px;
        text-align: center;

        opacity: 0.8;
        @media (prefers-reduced-motion: reduce) {
          .quick-jump-new-conversation {
            transition: none !important;
          }
        }

        .quick-jump-new-conversation {
          margin-top: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          border-radius: 4px;
          background-color: var(--bs-primary);
          transition: all 0.2s ease;
          position: relative;

          &:hover {
            opacity: 0.9;
          }

          &.selected {
            padding-left: 12px;
            font-weight: 600;
            background-color: var(--bs-primary);
            opacity: 1;
          }

          .result-icon {
            width: 20px;
            text-align: center;
            flex-shrink: 0;
          }

          .result-name {
            font-weight: bold;
            flex-shrink: 0;
          }
        }
      }
    }
  }
</style>

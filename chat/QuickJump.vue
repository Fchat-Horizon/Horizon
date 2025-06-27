<template>
  <div class="quick-jump-overlay" v-show="visible" @click="hide">
    <div class="quick-jump-container" @click.stop>
      <div class="quick-jump-header">
        <span class="fas fa-search"></span>
        <span>{{ l('quickJump.title') }}</span>
      </div>
      <input
        ref="searchInput"
        v-model="searchQuery"
        :placeholder="l('quickJump.placeholder')"
        class="quick-jump-input"
        @keydown="onKeyDown"
        @input="onInput"
      />
      <div class="quick-jump-results" v-show="filteredResults.length > 0">
        <div
          v-for="(result, index) in filteredResults"
          :key="result.key"
          :class="['quick-jump-result', { selected: index === selectedIndex }]"
          @click="selectResult(result)"
          @mouseenter="selectedIndex = index"
        >
          <span class="result-icon">
            <span
              v-if="result.type === 'channel'"
              class="fas fa-hashtag"
            ></span>
            <span
              v-else-if="result.type === 'private'"
              class="far fa-user-circle"
            ></span>
            <span v-else class="fas fa-home"></span>
          </span>
          <span class="result-name">{{ result.name }}</span>
          <span class="result-description" v-if="result.description">
            {{ result.description }}
          </span>
        </div>
      </div>
      <div
        class="quick-jump-footer"
        v-show="filteredResults.length === 0 && searchQuery.length > 0"
      >
        <span>{{ l('quickJump.noResults') }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Watch } from '@f-list/vue-ts';
  import Vue from 'vue';
  import { getKey } from './common';
  import core from './core';
  import { Conversation } from './interfaces';
  import { Keys } from '../keys';
  import l from './localize';

  interface SearchResult {
    key: string;
    name: string;
    type: 'channel' | 'private' | 'console';
    conversation?: Conversation;
    description?: string;
  }

  @Component({})
  export default class QuickJump extends Vue {
    l = l;
    visible = false;
    searchQuery = '';
    selectedIndex = 0;
    allResults: SearchResult[] = [];

    get filteredResults(): SearchResult[] {
      if (this.searchQuery.length === 0) {
        return this.allResults.slice(0, 10); // Show recent results when no query
      }

      const query = this.searchQuery.toLowerCase();
      return this.allResults
        .filter(
          result =>
            result.name.toLowerCase().includes(query) ||
            (result.description &&
              result.description.toLowerCase().includes(query))
        )
        .slice(0, 10); // Limit to 10 results
    }

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
    }

    hide(): void {
      this.visible = false;
      this.searchQuery = '';
      this.selectedIndex = 0;
    }

    updateResults(): void {
      const results: SearchResult[] = [];

      // Add console tab
      results.push({
        key: 'console',
        name: core.conversations.consoleTab.name,
        type: 'console',
        conversation: core.conversations.consoleTab,
        description: l('quickJump.consoleDescription')
      });

      // Add private conversations
      for (const conversation of core.conversations.privateConversations) {
        results.push({
          key: conversation.key,
          name: conversation.name,
          type: 'private',
          conversation,
          description: `${l('quickJump.privateWith')} ${conversation.character.name}`
        });
      }

      // Add channel conversations
      for (const conversation of core.conversations.channelConversations) {
        results.push({
          key: conversation.key,
          name: conversation.name,
          type: 'channel',
          conversation,
          description: `${l('quickJump.channel')} - ${conversation.channel.sortedMembers.length} ${l('quickJump.members')}`
        });
      }

      // Sort by recent activity (unread first, then by last message time)
      results.sort((a, b) => {
        if (!a.conversation || !b.conversation) return 0;

        // Prioritize conversations with unread messages
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

        // Then sort by last message time (most recent first)
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
    }

    onInput(): void {
      this.selectedIndex = 0;
    }

    onKeyDown(e: KeyboardEvent): void {
      const key = getKey(e);

      switch (key) {
        case Keys.Escape:
          e.preventDefault();
          this.hide();
          break;

        case Keys.ArrowUp:
          e.preventDefault();
          if (this.selectedIndex > 0) {
            this.selectedIndex--;
          } else {
            this.selectedIndex = this.filteredResults.length - 1;
          }
          break;

        case Keys.ArrowDown:
          e.preventDefault();
          if (this.selectedIndex < this.filteredResults.length - 1) {
            this.selectedIndex++;
          } else {
            this.selectedIndex = 0;
          }
          break;

        case Keys.Enter:
          e.preventDefault();
          if (this.filteredResults.length > 0) {
            this.selectResult(this.filteredResults[this.selectedIndex]);
          }
          break;
      }
    }

    selectResult(result: SearchResult): void {
      if (result.conversation) {
        result.conversation.show();
      }
      this.hide();
    }

    @Watch('visible')
    onVisibilityChange(newValue: boolean): void {
      if (newValue) {
        // Update results when showing
        this.updateResults();
      }
    }
  }
</script>

<style lang="scss" scoped>
  .quick-jump-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 9999;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;

    .quick-jump-container {
      background-color: var(--backgroundColor);
      border: 1px solid var(--borderColor);
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      width: 90%;
      max-width: 600px;
      overflow: hidden;

      .quick-jump-header {
        background-color: var(--primaryColor);
        color: var(--primaryTextColor);
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
        background-color: var(--backgroundColor);
        color: var(--textColor);
        outline: none;

        &::placeholder {
          color: var(--gray);
        }
      }

      .quick-jump-results {
        max-height: 400px;
        overflow-y: auto;
        border-top: 1px solid var(--borderColor);

        .quick-jump-result {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);

          &:hover,
          &.selected {
            background-color: var(--primaryColor);
            color: var(--primaryTextColor);
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
            color: var(--gray);
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
            color: var(--primaryTextColor);
            opacity: 0.8;
          }
        }
      }

      .quick-jump-footer {
        padding: 16px;
        text-align: center;
        color: var(--gray);
        border-top: 1px solid var(--borderColor);
      }
    }
  }
</style>

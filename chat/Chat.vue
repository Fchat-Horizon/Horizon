<template>
  <div
    style="
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: center;
    "
  >
    <div
      class="card bg-light"
      id="connect-character-select"
      style="width: 1100px; max-width: 100%; margin: 0 auto"
      v-if="!connected"
    >
      <div class="alert alert-danger" v-show="error">
        {{ error }}
      </div>
      <h3
        class="card-header"
        style="margin-top: 0; display: flex; align-items: center"
      >
        {{ l('title') }}
        <div
          style="
            margin-left: auto;
            display: flex;
            gap: 4px;
            align-items: center;
          "
        >
          <a
            href="https://discord.gg/JYuxqNVNtP"
            target="_blank"
            rel="noopener"
            class="btn"
            title="Join our Discord"
          >
            <span class="fab fa-discord"></span>
          </a>

          <a
            href="#"
            @click.prevent="showLogs()"
            class="btn"
            style="text-align: right"
          >
            <span class="fa fa-file-alt"></span>
            <span class="btn-text">{{ l('logs.title') }}</span>
          </a>
        </div>
      </h3>
      <div class="card-body">
        <h4 class="card-title">{{ l('login.selectCharacter') }}</h4>
        <div
          class="selector-top"
          style="display: flex; justify-content: center; margin-bottom: 8px"
        >
          <div style="width: 60%; max-width: 520px">
            <input
              ref="filterInput"
              type="text"
              class="form-control"
              :placeholder="l('login.filterCharacters')"
              v-on:keyup.enter="connect"
              v-model="filterText"
              autofocus
            />
          </div>
        </div>
        <div class="character-grid">
          <button
            v-for="character in filteredCharacters"
            :key="character.id"
            class="character-tile"
            :class="{
              selected:
                selectedCharacter && selectedCharacter.id === character.id
            }"
            @click="selectCharacter(character)"
            @dblclick="handleCharacterDoubleClick(character)"
            @focus="selectCharacter(character)"
            v-on:keyup.enter="handleCharacterDoubleClick(character)"
            v-on:keydown="charTileKeyDown"
            :title="character.name"
            :disabled="connecting"
          >
            <!-- Pin toggle (stop click propagation so clicking pin doesn't select)
                 pinned characters appear before non-pinned in ordering
                 hide the pin for the default character (star is sufficient) -->
            <span
              v-if="character.id !== defaultCharacter"
              class="char-icon pin-icon"
              :class="{ pinned: isPinned(character.id) }"
              @click.stop="togglePin(character)"
              :title="isPinned(character.id) ? 'Unpin' : 'Pin'"
            >
              <i class="fas fa-thumbtack"></i>
            </span>

            <span
              v-if="character.id === defaultCharacter"
              class="char-icon default-star"
              title="Default character"
            >
              <i class="fas fa-star"></i>
            </span>

            <div class="avatar-wrap">
              <img
                :src="characterImage(character.name)"
                alt="avatar"
                class="avatar"
              />
              <div class="avatar-bg"></div>
            </div>
            <div class="char-name">{{ character.name }}</div>
          </button>
        </div>
        <div style="text-align: right; margin-top: 10px">
          <button
            class="btn btn-primary"
            @click="connect"
            :disabled="connecting"
          >
            <div
              v-if="connecting"
              class="spinner-border spinner-border-sm"
              role="status"
            ></div>
            {{ l(connecting ? 'login.connecting' : 'login.connect') }}
          </button>
        </div>
      </div>
    </div>
    <chat ref="chatview" v-else></chat>
    <modal
      :action="l('chat.disconnected.title')"
      :buttonText="l('action.cancel')"
      ref="reconnecting"
      @submit="cancelReconnect"
      :showCancel="false"
      buttonClass="btn-danger"
    >
      <div class="alert alert-danger" v-show="error">{{ error }}</div>
      {{ l('chat.disconnected') }}
    </modal>
    <logs ref="logsDialog"></logs>
    <div
      v-if="version && !connected"
      style="position: absolute; bottom: 0; right: 0"
    >
      {{ version }}
    </div>
  </div>
</template>

<script lang="ts">
  import log from 'electron-log'; //tslint:disable-line:match-default-export-name
  import { Component, Hook, Prop } from '@f-list/vue-ts';
  import Vue from 'vue';
  import { getKey } from './common';
  import Modal from '../components/Modal.vue';
  import { InlineDisplayMode, SimpleCharacter } from '../interfaces';
  import { Keys } from '../keys';
  import ChatView from './ChatView.vue';
  import { errorToString, getKey, characterImage } from './common';
  import core from './core';
  import l from './localize';
  import Logs from './Logs.vue';
  import { init as profileApiInit } from './profile_api';
  import { AdManager } from './ads/ad-manager';
  import { EventBus } from './preview/event-bus';

  type BBCodeNode = Node & { bbcodeTag?: string; bbcodeParam?: string };

  function copyNode(
    str: string,
    node: BBCodeNode,
    end: Node,
    range: Range,
    flags: { endFound?: true }
  ): string {
    if (node === end) flags.endFound = true;
    if (node.bbcodeTag !== undefined)
      str = `[${node.bbcodeTag}${node.bbcodeParam !== undefined ? `=${node.bbcodeParam}` : ''}]${str}[/${node.bbcodeTag}]`;
    if (node.nextSibling !== null && !flags.endFound) {
      if (
        node instanceof HTMLElement &&
        getComputedStyle(node).display === 'block'
      )
        str += '\r\n';
      str += scanNode(node.nextSibling!, end, range, flags);
    }
    if (node.parentElement === null) return str;
    return copyNode(str, node.parentNode!, end, range, flags);
  }

  function scanNode(
    node: BBCodeNode,
    end: Node,
    range: Range,
    flags: { endFound?: true },
    hide?: boolean
  ): string {
    let str = '';
    hide =
      hide ||
      (node instanceof HTMLElement && node.classList.contains('bbcode-pseudo'));

    const component = (node as any)?.__vue__;

    if (component?.$el?.bbcodeTag || component?.$el?.bbcodeParam) {
      // nothing?
    }

    if (node === end) flags.endFound = true;
    if (node.bbcodeTag !== undefined)
      str += `[${node.bbcodeTag}${node.bbcodeParam !== undefined ? `=${node.bbcodeParam}` : ''}]`;
    // if(component?.$el?.bbcodeTag !== undefined) str += `[${component?.$el?.bbcodeTag}${component?.$el?.bbcodeParam !== undefined ? `=${component?.$el?.bbcodeParam}` : ''}]`;
    if (node instanceof Text)
      str +=
        node === range.endContainer
          ? node.nodeValue!.substr(0, range.endOffset)
          : node.nodeValue;
    else if (node instanceof HTMLImageElement) str += node.alt;
    // else if ((node as any)?.__vue__ && (node as any)?.__vue__ instanceof UrlTagView) {
    //   console.log('URLTAGVIEWNODE', node);
    // }
    if (node.firstChild !== null && !flags.endFound)
      str += scanNode(node.firstChild, end, range, flags, hide);
    if (node.bbcodeTag !== undefined) str += `[/${node.bbcodeTag}]`;
    // if(component?.$el?.bbcodeTag !== undefined) str += `[/${component?.$el?.bbcodeTag}]`;
    if (
      node instanceof HTMLElement &&
      getComputedStyle(node).display === 'block' &&
      !flags.endFound
    )
      str += '\r\n';
    if (node.nextSibling !== null && !flags.endFound)
      str += scanNode(node.nextSibling, end, range, flags, hide);
    return hide ? '' : str;
  }

  @Component({
    components: { chat: ChatView, modal: Modal, logs: Logs }
  })
  export default class Chat extends Vue {
    @Prop({ required: true })
    readonly ownCharacters!: SimpleCharacter[];
    @Prop({ required: true })
    readonly defaultCharacter!: number;
    //tslint:disable-next-line:strict-boolean-expressions
    selectedCharacter =
      this.ownCharacters.find(x => x.id === this.defaultCharacter) ||
      this.ownCharacters[0];
    characterImage = characterImage;
    // pins persisted in localStorage as array of ids
    pinnedIds: number[] = [];
    @Prop
    readonly version?: string;
    error = '';
    connecting = false;
    connected = false;
    l = l;
    copyPlain = false;

    @Hook('mounted')
    mounted(): void {
      // load pinned ids from localStorage (gracefully)
      try {
        const v = JSON.parse(localStorage.getItem('characterPins') || '[]');
        this.pinnedIds = Array.isArray(v) ? v : [];
      } catch (e) {
        // if parsing fails, leave pinnedIds empty
        log.debug('characterPins.parseFailed', { error: e });
        this.pinnedIds = [];
      }

      document.title = l('title', core.connection.character);
      document.addEventListener('copy', ((e: ClipboardEvent) => {
        if (this.copyPlain) {
          this.copyPlain = false;
          return;
        }
        const selection = document.getSelection();
        if (selection === null || selection.isCollapsed) return;
        const range = selection.getRangeAt(0);
        let start = range.startContainer,
          end = range.endContainer;
        let startValue = '';
        if (start instanceof HTMLElement) {
          start = start.childNodes[range.startOffset];
          if (<Node | undefined>start === undefined)
            start = range.startContainer;
          else
            startValue =
              start instanceof HTMLImageElement
                ? start.alt
                : scanNode(start.firstChild!, end, range, {});
        } else
          startValue = start.nodeValue!.substring(
            range.startOffset,
            start === range.endContainer ? range.endOffset : undefined
          );
        if (end instanceof HTMLElement && range.endOffset > 0)
          end = end.childNodes[range.endOffset - 1];
        e.clipboardData!.setData(
          'text/plain',
          copyNode(startValue, start, end, range, {})
        );
        e.preventDefault();
      }) as EventListener);
      window.addEventListener('keydown', e => {
        if (
          getKey(e) === Keys.KeyC &&
          e.shiftKey &&
          (e.ctrlKey || e.metaKey) &&
          !e.altKey
        ) {
          this.copyPlain = true;
          document.execCommand('copy');
          e.preventDefault();
        }
      });
      core.connection.onEvent('closed', isReconnect => {
        log.debug('connection.closed', {
          character: core.characters.ownCharacter?.name,
          error: this.error,
          isReconnect
        });

        if (isReconnect) (<Modal>this.$refs['reconnecting']).show(true);
        if (this.connected) core.notifications.playSound('logout');
        this.connected = false;
        this.connecting = false;

        AdManager.onConnectionClosed();
        core.adCoordinator.clear();
        EventBus.clear();

        // tslint:disable-next-line:no-floating-promises
        core.siteSession.onConnectionClosed();
        core.cache.stop();

        document.title = l('title');
      });
      core.connection.onEvent('connecting', async () => {
        this.connecting = true;

        log.debug('connection.connecting', {
          character: core.characters.ownCharacter?.name
        });

        profileApiInit(
          {
            defaultCharacter: this.defaultCharacter,
            animateEicons: core.state.settings.animatedEicons,
            smoothMosaics: core.state.settings.smoothMosaics,
            fuzzyDates: true,
            inlineDisplayMode: InlineDisplayMode.DISPLAY_ALL
          },
          this.ownCharacters
        );
        if (core.state.settings.notifications)
          await core.notifications.requestPermission();
      });
      core.connection.onEvent('connected', () => {
        log.debug('connection.connected', {
          character: core.characters.ownCharacter?.name
        });

        (<Modal>this.$refs['reconnecting']).hide();
        this.error = '';
        this.connecting = false;
        this.connected = true;
        core.notifications.playSound('login');
        document.title = l('title.connected', core.connection.character);

        // tslint:disable-next-line:no-floating-promises
        core.siteSession.onConnectionEstablished();
        core.cache.start((core.state as any).generalSettings, true);
      });
      core.watch(
        () => core.conversations.hasNew,
        hasNew => {
          document.title =
            (hasNew ? '💬 ' : '') +
            l(
              core.connection.isOpen ? 'title.connected' : 'title',
              core.connection.character
            );
        }
      );
      core.connection.onError(e => {
        log.debug('connection.error', {
          error: errorToString(e),
          character: core.characters.ownCharacter?.name
        });

        if ((<Error & { request?: object }>e).request !== undefined) {
          //catch axios network errors
          this.error = l('login.connectError', errorToString(e));
          this.connecting = false;
        } else throw e;
      });
    }

    cancelReconnect(): void {
      core.connection.close();
      (<Modal>this.$refs['reconnecting']).hide();
    }

    selectCharacter(character: SimpleCharacter): void {
      this.selectedCharacter = character;
    }

    handleCharacterDoubleClick(character: SimpleCharacter): void {
      this.selectCharacter(character);
      //better safe than sorry :^)
      if (!this.connecting && !this.connected) {
        this.connect();
      }
    }

    isPinned(id: number): boolean {
      return this.pinnedIds.indexOf(id) !== -1;
    }

    focusFilter() {
      this.$refs['filterInput'].focus();
    }

    charTileKeyDown(e: KeyboardEvent): void {
      const key = getKey(e);
      console.log(key);
      switch (key) {
        case Keys.ForwardSlash: {
          e.preventDefault();
          this.focusFilter();
        }
      }
    }

    togglePin(character: SimpleCharacter): void {
      // don't allow pinning the default character
      if (character.id === this.defaultCharacter) return;
      const exists = this.pinnedIds.includes(character.id);
      this.pinnedIds = exists
        ? this.pinnedIds.filter(id => id !== character.id)
        : [...this.pinnedIds, character.id];
      try {
        localStorage.setItem('characterPins', JSON.stringify(this.pinnedIds));
      } catch (e) {
        log.debug('characterPins.saveFailed', { error: e });
      }
    }

    filterText: string = '';

    get filteredCharacters(): SimpleCharacter[] {
      const q = this.filterText.trim().toLowerCase();
      let list = this.ownCharacters.slice();
      if (q) {
        list = list.filter(c => c.name.toLowerCase().includes(q));
      }

      // ensure defaultCharacter appears first
      const defaultIdx = list.findIndex(x => x.id === this.defaultCharacter);
      if (defaultIdx !== -1) {
        const def = list.splice(defaultIdx, 1)[0];
        list.unshift(def);
      }

      // move pinned characters (except default which is already first) to the top after default
      const pinned: SimpleCharacter[] = [];
      const others: SimpleCharacter[] = [];
      for (let i = 0; i < list.length; i++) {
        const c = list[i];
        if (c.id === this.defaultCharacter) continue; // skip default
        if (this.isPinned(c.id)) pinned.push(c);
        else others.push(c);
      }

      // keep relative order among pinned and others
      const result: SimpleCharacter[] = [];
      if (list.length > 0 && list[0].id === this.defaultCharacter)
        result.push(list[0]);
      result.push(...pinned, ...others);
      this.selectedCharacter = result[0];
      return result;
    }

    // The top input is a simple filter; selecting a tile is done by clicking it.

    showLogs(): void {
      (<Logs>this.$refs['logsDialog']).show();
    }

    async connect(): Promise<void> {
      if (!this.selectedCharacter) {
        return;
      }
      this.connecting = true;

      // skipping await
      // tslint:disable-next-line: no-floating-promises
      core.notifications.initSounds([
        'attention',
        'login',
        'logout',
        'modalert',
        'newnote',
        'silence'
      ]);

      core.connection.connect(this.selectedCharacter.name);
    }

    getChatView(): ChatView | undefined {
      return this.$refs['chatview'] as ChatView;
    }
  }
</script>

<style lang="scss">
  .modal-footer {
    min-height: initial;
  }

  #connect-character-select {
    .alert {
      border-top-right-radius: var(--bs-card-border-radius);
      border-top-left-radius: var(--bs-card-border-radius);
      margin-bottom: 0px;
    }
  }

  .character-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    max-height: 45vh;
    overflow-y: auto;
    padding: 6px 2px 26px 2px;
    position: relative;

    .character-tile {
      width: 96px;
      min-width: 96px;
      height: 110px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      background: rgba(var(--bs-black-rgb), 0.02);
      border: none;
      border-radius: 8px;
      padding: 8px;
      cursor: pointer;
      transition:
        box-shadow 0.08s,
        transform 0.08s;
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
      text-align: center;
      position: relative;

      &:not(:disabled):hover {
        border: none;
        transform: translateY(-4px);
        &:not(.selected) {
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
        }

        .char-icon.pin-icon {
          opacity: 1;
          pointer-events: auto;
        }
      }
      &:disabled {
        color: var(--bs-secondary-color);
        cursor: initial;
      }

      &.selected {
        outline: 2px solid var(--bs-primary);
        box-shadow:
          0 8px 22px rgba(var(--bs-primary-rgb), 0.25),
          0 0 8px rgba(var(--bs-primary-rgb), 0.18);
      }

      // note: the following is from hell.
      //       and i am so sorry, fatcat.
      .char-icon {
        position: absolute;
        top: 6px;
        z-index: 10;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;

        .fas {
          pointer-events: none;
        }

        &.default-star {
          right: 6px;
          color: var(--bs-warning);
          font-size: 14px;
          background: transparent;
          padding: 0;
          border-radius: 0;
        }

        &.pin-icon {
          right: 6px;
          cursor: pointer;
          padding: 0;
          background: transparent;
          border: none;
          opacity: 0;
          pointer-events: none;
          color: transparent;
          -webkit-text-stroke: 1px var(--input-color);
          -webkit-text-fill-color: transparent;
          transition:
            color 0.12s,
            -webkit-text-stroke 0.12s,
            opacity 0.12s,
            transform 0.12s;
          @media (prefers-reduced-motion: reduce) {
            transition: none;
          }
          font-size: 14px;
          transform: scale(1);

          &.pinned {
            opacity: 1;
            pointer-events: auto;
            color: var(--bs-success);
            -webkit-text-stroke: 0;
            -webkit-text-fill-color: var(--bs-success);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);

            &:hover {
              color: color-mix(in srgb, var(--bs-success) 85%, black 15%);
              -webkit-text-fill-color: color-mix(
                in srgb,
                var(--bs-success) 85%,
                black 15%
              );
              transform: scale(1.08);
            }
          }

          &:not(.pinned):hover {
            color: var(--bs-primary);
            -webkit-text-stroke: 0;
            -webkit-text-fill-color: var(--bs-primary);
            transform: scale(1.12);
          }
        }
      }
    }
  }

  .avatar-wrap {
    width: 64px;
    height: 64px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    .avatar-bg {
      position: absolute;
      bottom: 0;
      height: 100%;
      width: 100%;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.08);
    }

    .avatar {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
  }

  .char-name {
    margin-top: 6px;
    font-size: 12px;
    width: 100%;
    line-height: 1.2;
    min-height: 2.4em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    word-break: break-word;
  }
</style>

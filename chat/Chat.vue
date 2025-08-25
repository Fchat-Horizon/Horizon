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
      style="width: 1100px; max-width: 100%; margin: 0 auto"
      v-if="!connected"
    >
      <div class="alert alert-danger" v-show="error">{{ error }}</div>
      <h3 class="card-header" style="margin-top: 0; display: flex">
        {{ l('title') }}
        <a
          href="#"
          @click.prevent="showLogs()"
          class="btn"
          style="flex: 1; text-align: right"
        >
          <span class="fa fa-file-alt"></span>
          <span class="btn-text">{{ l('logs.title') }}</span>
        </a>
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
              placeholder="Filter characters..."
              v-model="filterText"
              autofocus
            />
          </div>
        </div>
        <div class="character-grid">
          <div
            v-for="character in filteredCharacters"
            :key="character.id"
            class="character-tile"
            :class="{
              selected:
                selectedCharacter && selectedCharacter.id === character.id
            }"
            @click="selectCharacter(character)"
            :title="character.name"
          >
            <div class="avatar-wrap">
              <img
                :src="characterImage(character.name)"
                alt="avatar"
                class="avatar"
              />
            </div>
            <div class="char-name">{{ character.name }}</div>
          </div>
        </div>
        <div style="text-align: right; margin-top: 10px">
          <button
            class="btn btn-primary"
            @click="connect"
            :disabled="connecting"
          >
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
    @Prop
    readonly version?: string;
    error = '';
    connecting = false;
    connected = false;
    l = l;
    copyPlain = false;

    @Hook('mounted')
    mounted(): void {
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

    filterText: string = '';

    get filteredCharacters(): SimpleCharacter[] {
      const q = this.filterText.trim().toLowerCase();
      if (!q) return this.ownCharacters;
      return this.ownCharacters.filter(c => c.name.toLowerCase().includes(q));
    }

    // The top input is a simple filter; selecting a tile is done by clicking it.

    showLogs(): void {
      (<Logs>this.$refs['logsDialog']).show();
    }

    async connect(): Promise<void> {
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

  .character-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    max-height: 320px;
    overflow: auto;
    padding: 6px 2px;
  }

  .character-tile {
    width: 96px;
    min-width: 96px;
    height: 110px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
    padding: 8px;
    cursor: pointer;
    transition:
      box-shadow 0.08s ease,
      transform 0.08s ease;
    text-align: center;
  }

  .character-tile:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
  }

  .character-tile.selected {
    outline: 2px solid rgba(100, 150, 255, 0.9);
    box-shadow: 0 8px 22px rgba(50, 80, 200, 0.25);
  }

  .avatar-wrap {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.08);
  }

  .avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .char-name {
    margin-top: 6px;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }
</style>

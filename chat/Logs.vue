<template>
  <modal
    :buttons="false"
    iconClass="fa-solid fa-book"
    ref="dialog"
    @open="onOpen"
    @close="onClose"
    style="width: 98%"
    dialogClass="logs-dialog"
  >
    <template slot="title">
      {{ l('logs.title') }}
      <div
        class="logs-fab btn btn-secondary"
        slot="title"
        @click="showFilters = !showFilters"
      >
        <span
          class="fas"
          :class="'fa-chevron-' + (showFilters ? 'up' : 'down')"
        ></span>
      </div>
    </template>
    <div class="mb-3 row" style="flex-shrink: 0" v-show="showFilters">
      <label for="character" class="col-sm-2 col-form-label">{{
        l('logs.character')
      }}</label>
      <div :class="canZip ? 'col-sm-8 col-10 col-xl-9' : 'col-sm-10'">
        <select
          class="form-select"
          v-model="selectedCharacter"
          id="character"
          @change="loadCharacter"
        >
          <option value="">{{ l('logs.selectCharacter') }}</option>
          <option v-for="character in characters">{{ character }}</option>
        </select>
      </div>
      <div class="col-2 col-xl-1" v-if="canZip">
        <button
          @click="downloadCharacter"
          class="btn btn-secondary form-control"
          :disabled="!selectedCharacter"
        >
          <span class="fa fa-download"></span>
        </button>
      </div>
    </div>
    <div class="mb-3 row" style="flex-shrink: 0" v-show="showFilters">
      <label class="col-sm-2 col-form-label">{{
        l('logs.conversation')
      }}</label>
      <div :class="canZip ? 'col-sm-8 col-10 col-xl-9' : 'col-sm-10'">
        <filterable-select
          v-model="selectedConversation"
          :options="conversations"
          :filterFunc="filterConversation"
          :placeholder="l('filter')"
        >
          <template slot-scope="s">
            {{
              (s.option &&
                (s.option.key[0] == '#' ? '#' : '') + s.option.name) ||
              l('logs.selectConversation')
            }}
          </template>
        </filterable-select>
      </div>
      <div class="col-2 col-xl-1" v-if="canZip">
        <button
          @click="downloadConversation"
          class="btn btn-secondary form-control"
          :disabled="!selectedConversation"
        >
          <span class="fa fa-download"></span>
        </button>
      </div>
    </div>
    <div class="mb-3 row" style="flex-shrink: 0" v-show="showFilters">
      <label for="date" class="col-sm-2 col-form-label">{{
        l('logs.date')
      }}</label>
      <div class="col-sm-8 col-10 col-xl-9">
        <select
          class="form-select"
          v-model="selectedDate"
          id="date"
          @change="loadMessages"
        >
          <option :value="undefined">{{ l('logs.allDates') }}</option>
          <option v-for="date in dates" :value="date.getTime()">
            {{ formatDate(date) }}
          </option>
        </select>
      </div>
      <div class="col-2 col-xl-1">
        <button
          @click="downloadDay"
          class="btn btn-secondary form-control"
          :disabled="!selectedDate"
        >
          <span class="fa fa-download"></span>
        </button>
      </div>
    </div>
    <div
      class="messages messages-both hidden-scrollbar"
      :class="layoutClasses"
      style="overflow: auto; overscroll-behavior: none"
      ref="messages"
      tabindex="-1"
      @scroll="onMessagesScroll"
    >
      <message-view
        v-for="(message, i) in displayedMessages"
        :message="message"
        :key="message.id"
        :logs="true"
        :previous="displayedMessages[i - 1]"
      ></message-view>
    </div>
    <div class="input-group" style="flex-shrink: 0">
      <span class="input-group-text">
        <span class="fas fa-search"></span>
      </span>
      <input
        class="form-control"
        v-model="filter"
        ref="messageFilter"
        :placeholder="l('filter')"
        v-show="messages"
        type="text"
      />
    </div>
  </modal>
</template>

<script lang="ts">
  import { Component, Hook, Prop, Watch } from '@f-list/vue-ts';
  import { format } from 'date-fns';
  import CustomDialog from '../components/custom_dialog';
  import FilterableSelect from '../components/FilterableSelect.vue';
  import Modal from '../components/Modal.vue';
  import { Keys } from '../keys';
  import { formatTime, getKey, messageToString } from './common';
  import core from './core';
  import { Conversation, Logs as LogInterface } from './interfaces';
  import l from './localize';
  import MessageView from './message_view';
  import AdmZip from 'adm-zip';
  import { Dialog } from '../helpers/dialog';

  function formatDate(this: void, date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }

  function getLogs(
    messages: ReadonlyArray<Conversation.Message>,
    html: boolean
  ): string {
    const start = html
      ? `<meta charset="utf-8"><style>body { padding: 10px; }${document.getElementById('themeStyle')!.innerText}</style>`
      : '';
    return (
      '<div class="messages bbcode">' +
      messages.reduce(
        (acc, x) =>
          acc +
          messageToString(
            x,
            date => formatTime(date, true),
            html
              ? c => {
                  const gender = core.characters.get(c).gender;
                  return `<span class="user-view gender-${gender ? gender.toLowerCase() : 'none'}">${c}</span>`;
                }
              : undefined,
            html
              ? t => {
                  const parsedElement = core.bbCodeParser.parseEverything(t);
                  const result = parsedElement.innerHTML;
                  parsedElement.cleanup?.();
                  return `${result}`;
                }
              : undefined
          ),
        start
      ) +
      '</div>'
    );
  }

  function getMessageWrapperClasses(): any {
    const classes: any = {};
    let layout: 'classic' | 'modern' = 'classic';
    try {
      layout = (core.state as any)._settings?.chatLayoutMode || 'classic';
    } catch (_) {
      layout = 'classic';
    }
    classes['layout-' + layout] = true;
    return classes;
  }

  @Component({
    components: {
      modal: Modal,
      'message-view': MessageView,
      'filterable-select': FilterableSelect
    }
  })
  export default class Logs extends CustomDialog {
    @Prop
    readonly conversation?: Conversation;
    core = core;
    conversations: LogInterface.Conversation[] = [];
    selectedConversation: LogInterface.Conversation | undefined;
    dates: ReadonlyArray<Date> = [];
    selectedDate: string | undefined;
    l = l;
    filter = '';
    messages: ReadonlyArray<Conversation.Message> = [];
    formatDate = formatDate;
    keyDownListener?: (e: KeyboardEvent) => void;
    characters: ReadonlyArray<string> = [];
    selectedCharacter = core.connection.character;
    showFilters = true;
    canZip = core.logs.canZip;
    dateOffset = -1;
    windowStart = 0;
    windowEnd = 0;
    resizeListener = async () => this.onMessagesScroll();
    get layoutClasses(): any {
      return getMessageWrapperClasses();
    }

    get displayedMessages(): ReadonlyArray<Conversation.Message> {
      if (this.selectedDate !== undefined) return this.filteredMessages;
      return this.filteredMessages.slice(this.windowStart, this.windowEnd);
    }

    get filteredMessages(): ReadonlyArray<Conversation.Message> {
      if (this.filter.length === 0) return this.messages;
      const filter = new RegExp(this.filter.replace(/[^\w]/gi, '\\$&'), 'i');
      return this.messages.filter(
        x =>
          filter.test(x.text) ||
          (x.type !== Conversation.Message.Type.Event &&
            filter.test(x.sender.name))
      );
    }

    @Hook('mounted')
    async mounted(): Promise<void> {
      this.characters = await core.logs.getAvailableCharacters();
      //On Windows, sort is case-sensitive by default, so we need to force case-insensitive sorting for Linux and macOS.
      this.characters = this.characters
        .slice()
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      window.addEventListener('resize', this.resizeListener);
    }

    @Hook('beforeDestroy')
    beforeDestroy(): void {
      window.removeEventListener('resize', this.resizeListener);
    }

    async loadCharacter(): Promise<void> {
      this.selectedConversation = undefined;
      return this.loadConversations();
    }

    async loadConversations(): Promise<void> {
      if (this.selectedCharacter === '') return;
      this.conversations = (
        await core.logs.getConversations(this.selectedCharacter)
      ).slice();
      this.conversations.sort((x, y) => {
        const xName = x.name.replace(/^#/, '').toLowerCase();
        const yName = y.name.replace(/^#/, '').toLowerCase();
        return xName < yName ? -1 : xName > yName ? 1 : 0;
      });
    }

    async loadDates(): Promise<void> {
      this.dates =
        this.selectedConversation === undefined
          ? []
          : (
              await core.logs.getLogDates(
                this.selectedCharacter,
                this.selectedConversation.key
              )
            )
              .slice()
              .reverse();
    }

    filterConversation(
      filter: RegExp,
      conversation: LogInterface.Conversation
    ): boolean {
      return filter.test(conversation.name);
    }

    @Watch('selectedConversation')
    async conversationSelected(
      oldValue: Conversation | undefined,
      newValue: Conversation | undefined
    ): Promise<void> {
      if (
        oldValue !== undefined &&
        newValue !== undefined &&
        oldValue.key === newValue.key
      )
        return;
      await this.loadDates();
      this.selectedDate = undefined;
      this.dateOffset = -1;
      this.filter = '';
      await this.loadMessages();
    }

    @Watch('filter')
    onFilterChanged(): void {
      if (this.selectedDate === undefined) {
        this.windowEnd = this.filteredMessages.length;
        this.windowStart = this.windowEnd - 50;
      }
      this.$nextTick(async () => this.onMessagesScroll());
    }

    @Watch('showFilters')
    async onFilterToggle(): Promise<void> {
      return this.onMessagesScroll();
    }

    download(file: string, logs: string): void {
      const a = document.createElement('a');
      a.href = logs;
      a.setAttribute('download', file);
      a.style.display = 'none';
      document.body.appendChild(a);
      setTimeout(() => {
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(logs);
      });
    }

    sanitizeConversationName(name: string): string {
      /*
       * Replace characters that are forbidden in paths with an underscore.
       * This list should cover Unix, Windows and macOS.
       * Files and folders also may not end with spaces.
       */
      let sanitizedName = name.replace(/[\/<>:"\\|?*.]/g, '_').trimRight();

      /*
       * For Windows, certain names are forbidden, too.
       */
      if (
        [
          'CON',
          'PRN',
          'AUX',
          'NUL',
          'COM1',
          'COM2',
          'COM3',
          'COM4',
          'COM5',
          'COM6',
          'COM7',
          'COM8',
          'COM9',
          'LPT1',
          'LPT2',
          'LPT3',
          'LPT4',
          'LPT5',
          'LPT6',
          'LPT7',
          'LPT8',
          'LPT9'
        ].includes(sanitizedName)
      ) {
        sanitizedName += '_';
      }

      return sanitizedName;
    }

    downloadDay(): void {
      if (
        this.selectedConversation === undefined ||
        this.selectedDate === undefined ||
        this.messages.length === 0
      )
        return;
      const html = Dialog.confirmDialog(l('logs.html'));
      const name = `${this.sanitizeConversationName(this.selectedConversation.name)}-${formatDate(new Date(this.selectedDate))}.${html ? 'html' : 'txt'}`;
      this.download(
        name,
        `data:${encodeURIComponent(name)},${encodeURIComponent(getLogs(this.messages, html))}`
      );
    }

    async downloadConversation(): Promise<void> {
      if (this.selectedConversation === undefined) return;
      const zip = new AdmZip();
      const html = Dialog.confirmDialog(l('logs.html'));
      for (const date of this.dates) {
        const messages = await core.logs.getLogs(
          this.selectedCharacter,
          this.selectedConversation.key,
          date
        );
        zip.addFile(
          `${formatDate(date)}.${html ? 'html' : 'txt'}`,
          Buffer.from(getLogs(messages, html), 'utf-8')
        );
      }
      this.download(
        `${this.sanitizeConversationName(this.selectedConversation.name)}.zip`,
        URL.createObjectURL(new Blob([zip.toBuffer()]))
      );
    }

    async downloadCharacter(): Promise<void> {
      if (
        this.selectedCharacter === '' ||
        !Dialog.confirmDialog(l('logs.confirmExport', this.selectedCharacter))
      )
        return;
      const zip = new AdmZip();
      const html = Dialog.confirmDialog(l('logs.html'));
      const existingConversationNames = new Array<string>();
      for (const conv of this.conversations) {
        const dates = await core.logs.getLogDates(
          this.selectedCharacter,
          conv.key
        );
        let sanitizedConvName = this.sanitizeConversationName(conv.name);
        while (existingConversationNames.includes(sanitizedConvName)) {
          sanitizedConvName += '_';
        }
        existingConversationNames.push(sanitizedConvName);
        for (const date of dates) {
          const messages = await core.logs.getLogs(
            this.selectedCharacter,
            conv.key,
            date
          );
          zip.addFile(
            `${sanitizedConvName}/${formatDate(date)}.${html ? 'html' : 'txt'}`,
            Buffer.from(getLogs(messages, html), 'utf-8')
          );
        }
      }
      this.download(
        `${this.selectedCharacter}.zip`,
        URL.createObjectURL(new Blob([zip.toBuffer()]))
      );
    }

    async onOpen(): Promise<void> {
      if (this.selectedCharacter !== '') {
        await this.loadConversations();
        if (this.conversation !== undefined) {
          this.selectedConversation = this.conversations.filter(
            x => x.key === this.conversation!.key
          )[0];
          (this.$refs['messageFilter'] as HTMLInputElement).focus();
        } else {
          await this.loadDates();
          await this.loadMessages();
        }
      }
      this.keyDownListener = e => {
        if (
          getKey(e) === Keys.KeyA &&
          (e.ctrlKey || e.metaKey) &&
          !e.altKey &&
          !e.shiftKey
        ) {
          if ((<HTMLElement>e.target).tagName.toLowerCase() === 'input') return;
          e.preventDefault();
          const selection = document.getSelection();
          if (selection === null) return;
          selection.removeAllRanges();
          if (this.messages.length > 0) {
            const range = document.createRange();
            const messages = this.$refs['messages'] as Node;
            range.setStartBefore(messages.firstChild!);
            range.setEndAfter(messages.lastChild!);
            selection.addRange(range);
          }
        }
      };
      window.addEventListener('keydown', this.keyDownListener);
    }

    onClose(): void {
      window.removeEventListener('keydown', this.keyDownListener!);
    }

    async loadMessages(): Promise<void> {
      if (this.selectedConversation === undefined) this.messages = [];
      else if (this.selectedDate !== undefined) {
        this.dateOffset = -1;
        this.messages = await core.logs.getLogs(
          this.selectedCharacter,
          this.selectedConversation.key,
          new Date(this.selectedDate)
        );
      } else if (this.dateOffset === -1) {
        this.messages = [];
        this.dateOffset = 0;
        this.windowStart = 0;
        this.windowEnd = 0;
        this.lastScroll = -1;
        this.lockScroll = false;
        this.$nextTick(async () => this.onMessagesScroll());
      } else return this.onMessagesScroll();
    }

    lockScroll = false;
    lastScroll = -1;

    async onMessagesScroll(ev?: Event): Promise<void> {
      const list = <HTMLElement | undefined>this.$refs['messages'];
      if (this.lockScroll) return;
      if (
        list === undefined ||
        (ev !== undefined && Math.abs(list.scrollTop - this.lastScroll) < 50)
      )
        return;
      this.lockScroll = true;

      function getTop(index: number): number {
        return (<HTMLElement>list!.children[index]).offsetTop;
      }

      while (
        this.selectedConversation !== undefined &&
        this.selectedDate === undefined &&
        this.dialog.isShown
      ) {
        const oldHeight = list.scrollHeight,
          oldTop = list.scrollTop;
        const oldFirst = this.displayedMessages[0];
        const oldEnd = this.windowEnd;
        const length = this.displayedMessages.length;
        const oldTotal = this.filteredMessages.length;
        let loaded = false;
        if (length <= 20 || getTop(20) > list.scrollTop) this.windowStart -= 50;
        else if (length > 100 && getTop(100) < list.scrollTop)
          this.windowStart += 50;
        else if (
          length >= 100 &&
          getTop(length - 100) > list.scrollTop + list.offsetHeight
        )
          this.windowEnd -= 50;
        else if (getTop(length - 20) < list.scrollTop + list.offsetHeight)
          this.windowEnd += 50;
        if (this.windowStart <= 0 && this.dateOffset < this.dates.length) {
          const messages = await core.logs.getLogs(
            this.selectedCharacter,
            this.selectedConversation.key,
            this.dates[this.dateOffset++]
          );
          this.messages = messages.concat(this.messages);
          const addedTotal = this.filteredMessages.length - oldTotal;
          this.windowStart += addedTotal;
          this.windowEnd += addedTotal;
          loaded = true;
        }
        this.windowStart = Math.max(this.windowStart, 0);
        this.windowEnd = Math.min(this.windowEnd, this.filteredMessages.length);
        if (this.displayedMessages[0] !== oldFirst) {
          list.style.overflow = 'hidden';
          await this.$nextTick();
          list.scrollTop = oldTop + list.scrollHeight - oldHeight;
          list.style.overflow = 'auto';
        } else if (this.windowEnd === oldEnd && !loaded) break;
        else await this.$nextTick();
      }
      this.lastScroll = list.scrollTop;
      this.lockScroll = false;
    }
  }
</script>

<style>
  .logs-dialog {
    max-width: 98% !important;
    width: 98% !important;
  }

  .logs-dialog .modal-body {
    display: flex;
    flex-direction: column;
  }
</style>

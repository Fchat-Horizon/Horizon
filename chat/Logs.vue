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
    <virtual-list
      class="messages messages-both hidden-scrollbar"
      :class="layoutClasses"
      style="overscroll-behavior: none"
      ref="messages"
      tabindex="-1"
      :items="filteredMessages"
      :itemHeight="itemHeight"
      :keyFunc="messageKeyFunc"
      :resetKey="resetKey"
      @near-top="onNearTop"
      @keydown.native.page-up="onPageUp"
    >
      <template slot-scope="{ item, index, isScrolling }">
        <div v-if="!isScrolling" class="message-container">
          <span
            v-if="filter.length > 0"
            class="message-jump-icon"
            @click="jumpToMessage(item.id)"
            title="Jump to this message"
          >
            <i class="fa-solid fa-arrow-up-right-from-square fa-fw"></i>
          </span>
          <message-view
            :message="item"
            :logs="true"
            :previous="index > 0 ? filteredMessages[index - 1] : undefined"
            :selectable="selectionMode"
            :selected="selectedMessages.has(item.id)"
            @toggle-select="onToggleSelect(item, index, $event)"
          ></message-view>
        </div>
        <div v-else class="message-skeleton" :class="layoutClasses">
          <div
            v-if="itemHeight > 40"
            class="message-skeleton-avatar throbber"
          ></div>
          <div class="message-skeleton-content">
            <div class="message-skeleton-header">
              <div class="skeleton-bone throbber" style="width: 28%"></div>
              <div class="skeleton-bone throbber" style="width: 14%"></div>
            </div>
            <div class="message-skeleton-body">
              <div
                class="skeleton-bone throbber"
                :style="{ width: 50 + ((index * 37) % 45) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </template>
    </virtual-list>
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
      <span v-if="searching" class="input-group-text">
        <span class="fas fa-spinner fa-spin"></span>
      </span>
      <template v-if="selectionMode">
        <span class="input-group-text text-muted">
          {{ l('logs.selectedCount', selectedMessages.size) }}
        </span>
        <button
          class="btn btn-primary"
          :disabled="selectedMessages.size === 0"
          @click="shareSelected"
        >
          <span class="fas fa-share"></span> {{ l('logs.share') }}
        </button>
        <button
          class="btn btn-outline-secondary"
          @click="setSelectionMode(false)"
        >
          {{ l('logs.cancelSelect') }}
        </button>
      </template>
      <button
        v-else-if="isDmConversation && core.connection.isOpen"
        class="btn btn-outline-secondary"
        @click="setSelectionMode(true)"
      >
        <span class="fas fa-check-square"></span> {{ l('logs.select') }}
      </button>
    </div>
  </modal>
</template>

<script lang="ts">
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
  import VirtualList from '../components/VirtualList.vue';
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
                  //TODO: If we want to instead use a custom BBCode parser (so we can also have a different kind of Spoiler tag for logs
                  //Then we would need to remove this
                  parsedElement
                    .querySelectorAll('.character-avatar.eicon')
                    .forEach(el => {
                      el.classList.remove('loading');
                    });
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

  function getLayoutMode(): 'classic' | 'modern' {
    try {
      return (core.state as any)._settings?.chatLayoutMode || 'classic';
    } catch (_) {
      return 'classic';
    }
  }

  export default CustomDialog.extend({
    components: {
      modal: Modal,
      'message-view': MessageView,
      'filterable-select': FilterableSelect,
      'virtual-list': VirtualList
    },
    props: {
      conversation: {}
    },
    data() {
      return {
        core: core,
        conversations: [] as LogInterface.Conversation[],
        selectedConversation: undefined as
          | LogInterface.Conversation
          | undefined,
        dates: [] as ReadonlyArray<Date>,
        selectedDate: undefined as string | undefined,
        l: l,
        filter: '',
        messages: [] as ReadonlyArray<Conversation.Message>,
        formatDate: formatDate,
        keyDownListener: undefined as ((e: KeyboardEvent) => void) | undefined,
        characters: [] as ReadonlyArray<string>,
        selectedCharacter: core.connection.character,
        showFilters: true,
        canZip: core.logs.canZip,
        selectionMode: false,
        selectedMessages: new Set<number>(),
        lastSelectedIndex: -1,
        dateOffset: -1,
        loadingDates: false,
        resetKey: 0,
        filterDebounce: undefined as ReturnType<typeof setTimeout> | undefined,
        nearTopDebounce: undefined as ReturnType<typeof setTimeout> | undefined,
        pendingFilter: '',
        searching: false
      };
    },
    computed: {
      layoutClasses(): Record<string, boolean> {
        return { ['layout-' + getLayoutMode()]: true };
      },
      isDmConversation(): boolean {
        return (
          this.selectedConversation !== undefined &&
          !this.selectedConversation.key.startsWith('#') &&
          this.selectedConversation.key !== '_'
        );
      },
      itemHeight(): number {
        return getLayoutMode() === 'modern' ? 52 : 40;
      },
      filteredMessages(): ReadonlyArray<Conversation.Message> {
        if (this.pendingFilter.length === 0) return this.messages;
        const filter = new RegExp(
          this.pendingFilter.replace(/[^\w]/gi, '\\$&'),
          'i'
        );
        return this.messages.filter(
          x =>
            filter.test(x.text) ||
            (x.type !== Conversation.Message.Type.Event &&
              filter.test(x.sender.name))
        );
      }
    },
    watch: {
      conversation: {
        async handler(this: any): Promise<void> {
          if (!this.dialog.isShown || this.conversation === undefined) return;
          let match = this.conversations.find(
            (x: any) => x.key === this.conversation!.key
          );
          if (!match) {
            await this.loadConversations();
            match = this.conversations.find(
              (x: any) => x.key === this.conversation!.key
            );
          }
          if (match && match !== this.selectedConversation) {
            this.selectedConversation = match;
          }
        }
      },
      selectedConversation: {
        handler: 'conversationSelected'
      },
      filter: {
        handler: 'onFilterChanged'
      }
    },
    async mounted(): Promise<void> {
      this.characters = await core.logs.getAvailableCharacters();
      //On Windows, sort is case-sensitive by default, so we need to force case-insensitive sorting for Linux and macOS.
      this.characters = this.characters
        .slice()
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    },
    beforeDestroy(): void {
      if (this.filterDebounce !== undefined) clearTimeout(this.filterDebounce);
      if (this.nearTopDebounce !== undefined)
        clearTimeout(this.nearTopDebounce);
    },
    methods: {
      async loadCharacter(): Promise<void> {
        this.selectedConversation = undefined;
        return this.loadConversations();
      },

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
      },

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
      },

      filterConversation(
        filter: RegExp,
        conversation: LogInterface.Conversation
      ): boolean {
        return filter.test(conversation.name);
      },

      messageKeyFunc(item: Conversation.Message): string | number {
        return item.id;
      },

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
        this.messages = [];
        await this.loadDates();
        this.selectedDate = undefined;
        this.dateOffset = -1;
        this.filter = '';
        this.setSelectionMode(false);
        this.pendingFilter = '';
        await this.loadMessages();
      },

      onFilterChanged(): void {
        if (this.filterDebounce !== undefined)
          clearTimeout(this.filterDebounce);
        this.filterDebounce = setTimeout(() => {
          const wasFiltered = this.pendingFilter.length > 0;
          this.pendingFilter = this.filter;
          const vl = this.$refs['messages'] as InstanceType<
            typeof VirtualList
          > | void;
          if (vl) vl.invalidate();
          if (this.filter) {
            this.searchMore();
          } else if (wasFiltered) {
            this.$nextTick().then(() => vl?.scrollToBottom());
          }
        }, 200);
      },

      async searchMore(): Promise<void> {
        if (!this.pendingFilter || this.selectedDate !== undefined) return;
        if (this.dateOffset >= this.dates.length) return;

        const MIN_RESULTS = 50;
        if (this.filteredMessages.length >= MIN_RESULTS) return;

        this.searching = true;
        const snapshot = this.pendingFilter;

        while (
          this.dateOffset < this.dates.length &&
          this.filteredMessages.length < MIN_RESULTS
        ) {
          const msgs = await this.fetchDate();
          if (msgs.length > 0) {
            this.messages = (msgs as Conversation.Message[]).concat(
              this.messages
            );
          }
          if (this.pendingFilter !== snapshot) break;
        }

        const vl = this.$refs['messages'] as InstanceType<
          typeof VirtualList
        > | void;
        if (vl) vl.invalidate();
        this.searching = false;
      },

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
      },

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
      },

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
      },

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
      },

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
      },

      async onOpen(): Promise<void> {
        if (this.selectedCharacter !== '') {
          await this.loadConversations();
          if (this.conversation !== undefined) {
            this.selectedConversation = this.conversations.filter(
              x => x.key === (this as any).conversation!.key
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
            if ((<HTMLElement>e.target).tagName.toLowerCase() === 'input')
              return;
            e.preventDefault();
            const selection = document.getSelection();
            if (selection === null) return;
            selection.removeAllRanges();
            if (this.messages.length > 0) {
              const el = (this.$refs['messages'] as Vue | undefined)?.$el;
              if (el?.firstChild && el.lastChild) {
                const range = document.createRange();
                range.setStartBefore(el.firstChild);
                range.setEndAfter(el.lastChild);
                selection.addRange(range);
              }
            }
          }
        };
        window.addEventListener('keydown', this.keyDownListener);
      },

      onClose(): void {
        window.removeEventListener('keydown', this.keyDownListener!);
      },

      async loadMessages(): Promise<void> {
        if (this.selectedConversation === undefined) {
          this.messages = [];
        } else if (this.selectedDate !== undefined) {
          this.dateOffset = -1;
          this.messages = (
            await core.logs.getLogs(
              this.selectedCharacter,
              this.selectedConversation.key,
              new Date(this.selectedDate)
            )
          ).map(m => Object.freeze(m));
          this.resetKey++;
          await this.$nextTick();
          const vl = this.$refs['messages'] as InstanceType<
            typeof VirtualList
          > | void;
          if (vl) {
            vl.invalidate();
            vl.scrollToBottom();
          }
        } else if (this.dateOffset === -1) {
          this.dateOffset = 0;
          this.messages = [];
          await this.bulkLoadDates(500);
          await this.$nextTick();
          const vl = this.$refs['messages'] as InstanceType<
            typeof VirtualList
          > | void;
          if (vl) {
            vl.invalidate();
            vl.scrollToBottom();
          }
        }
      },

      setSelectionMode(active: boolean): void {
        this.selectionMode = active;
        this.selectedMessages = new Set<number>();
        this.lastSelectedIndex = -1;
      },

      onToggleSelect(
        message: Conversation.Message,
        displayIndex: number,
        event: MouseEvent
      ): void {
        const newSet = new Set(this.selectedMessages);
        if (event.shiftKey && this.lastSelectedIndex >= 0) {
          const start = Math.min(this.lastSelectedIndex, displayIndex);
          const end = Math.max(this.lastSelectedIndex, displayIndex);
          for (let i = start; i <= end; i++) {
            newSet.add(this.filteredMessages[i].id);
          }
        } else {
          if (newSet.has(message.id)) newSet.delete(message.id);
          else newSet.add(message.id);
        }
        this.selectedMessages = newSet;
        this.lastSelectedIndex = displayIndex;
      },

      async shareSelected(): Promise<void> {
        if (
          !this.selectedConversation ||
          this.selectedMessages.size === 0 ||
          !this.isDmConversation
        )
          return;

        const targetName = this.selectedConversation.name;
        const targetChar = core.characters.get(targetName);

        if (targetChar.status === 'offline') {
          core.notifications.alert(l('logs.shareOffline', targetName));
          return;
        }

        if (
          !Dialog.confirmDialog(
            l('logs.selectConfirm', this.selectedMessages.size, targetName)
          )
        )
          return;

        const selected = this.messages.filter(m =>
          this.selectedMessages.has(m.id)
        );

        const formatted = selected
          .map(msg => {
            const time = `[color=gray][${formatTime(msg.time, true)}][/color] `;
            if (msg.type === Conversation.Message.Type.Event)
              return `${time}${msg.text}\r\n`;
            const name = `[user]${msg.sender.name}[/user]`;
            if (msg.type === Conversation.Message.Type.Action)
              return `${time}*${name} ${msg.text}\r\n`;
            return `${time}${name}: ${msg.text}\r\n`;
          })
          .join('');

        if (formatted.length > core.connection.vars.priv_max) {
          core.notifications.alert(l('logs.shareTooLong'));
          return;
        }

        const conv = core.conversations.getPrivate(targetChar);
        await conv.sendMessageEx(formatted);
        core.notifications.alert(l('logs.shareSuccess'));
        this.setSelectionMode(false);
      },

      jumpToMessage(messageId: number): void {
        // Clear filter immediately, bypassing the debounce
        this.filter = '';
        this.pendingFilter = '';
        this.$nextTick(() => {
          // Clear debounce AFTER the filter watcher has fired and set a new one
          if (this.filterDebounce !== undefined) {
            clearTimeout(this.filterDebounce);
            this.filterDebounce = undefined;
          }
          setTimeout(() => {
            const index = this.filteredMessages.findIndex(
              msg => msg.id === messageId
            );
            if (index === -1) return;
            const vl = this.$refs['messages'] as InstanceType<
              typeof VirtualList
            > | void;
            if (!vl) return;
            vl.invalidate();
            vl.scrollToIndex(index, 'center');
          }, 0);
        });
      },

      async fetchDate(): Promise<ReadonlyArray<Conversation.Message>> {
        if (!this.selectedConversation || this.dateOffset >= this.dates.length)
          return [];
        return (
          await core.logs.getLogs(
            this.selectedCharacter,
            this.selectedConversation.key,
            this.dates[this.dateOffset++]
          )
        ).map(m => Object.freeze(m));
      },

      async bulkLoadDates(minMessages: number): Promise<void> {
        let all: Conversation.Message[] = [];
        while (
          all.length < minMessages &&
          this.dateOffset < this.dates.length
        ) {
          const msgs = await this.fetchDate();
          all = (msgs as Conversation.Message[]).concat(all);
        }
        this.messages = all.concat(this.messages);
      },

      async loadNextDate(): Promise<void> {
        if (this.loadingDates) return;
        this.loadingDates = true;
        const oldLen = this.filteredMessages.length;
        const msgs = await this.fetchDate();
        if (msgs.length > 0) {
          this.messages = (msgs as Conversation.Message[]).concat(
            this.messages
          );
          await this.$nextTick();
          const added = this.filteredMessages.length - oldLen;
          const vl = this.$refs['messages'] as InstanceType<
            typeof VirtualList
          > | void;
          if (vl && added > 0) vl.adjustScrollForPrepend(added);
        }
        this.loadingDates = false;
      },

      onPageUp(e: KeyboardEvent): void {
        e.preventDefault();
        const vl = this.$refs['messages'] as InstanceType<
          typeof VirtualList
        > | void;
        if (!vl) return;
        const el = vl.$refs['scroller'] as HTMLElement | undefined;
        if (!el) return;
        // Scroll by 1/3 of viewport instead of full page
        el.scrollTop -= el.clientHeight / 3;
      },

      onNearTop(): void {
        if (this.selectedDate !== undefined) return;
        if (this.nearTopDebounce !== undefined)
          clearTimeout(this.nearTopDebounce);
        this.nearTopDebounce = setTimeout(() => {
          this.nearTopDebounce = undefined;
          this.loadNextDate();
        }, 250);
      }
    }
  });
</script>

<style lang="scss">
  .logs-dialog {
    max-width: 98% !important;
    width: 98% !important;
    .input-group-text {
      font-size: 1em;
    }
  }

  .logs-dialog .modal-body {
    display: flex;
    flex-direction: column;
  }

  .message-container {
    position: relative;
  }

  .message-jump-icon {
    position: absolute;
    right: 4px;
    top: 4px;
    cursor: pointer;
    opacity: 0;
    z-index: 10;
    padding: 2px 4px;
    background-color: var(--bs-danger-bg-subtle);
    border-radius: 3px;
    font-size: 1rem;
    line-height: 1;
  }

  .message-container:hover .message-jump-icon {
    opacity: 1;
  }

  .message-jump-icon:hover {
    background-color: var(--bs-danger-bg-subtle);
  }

  .message-selectable {
    cursor: pointer;
  }

  .message-select-checkbox {
    flex-shrink: 0;
    margin-right: 0.5em;
    cursor: pointer;
    align-self: center;
  }

  .message-skeleton {
    display: flex;
    align-items: flex-start;
    padding: 4px 10px;
    gap: 10px;
  }

  .message-skeleton-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .message-skeleton-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .message-skeleton-header {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .message-skeleton-body {
    display: flex;
    gap: 6px;
  }

  .skeleton-bone {
    height: 12px;
    border-radius: 6px;
  }
</style>

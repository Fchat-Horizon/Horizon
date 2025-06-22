<template>
  <modal
    :buttons="false"
    ref="dialog"
    @open="onOpen"
    @close="onClose"
    style="width: 98%"
    dialogClass="logs-dialog"
  >
    <template #title>
      {{ l('logs.title') }}
      <div
        class="logs-fab btn btn-secondary"
        @click="showFilters = !showFilters"
      >
        <span
          class="fas"
          :class="'fa-chevron-' + (showFilters ? 'up' : 'down')"
        ></span>
      </div>
    </template>
    <div class="form-group row" style="flex-shrink: 0" v-show="showFilters">
      <label for="character" class="col-sm-2 col-form-label">{{
        l('logs.character')
      }}</label>
      <div :class="canZip ? 'col-sm-8 col-10 col-xl-9' : 'col-sm-10'">
        <select
          class="form-control"
          v-model="selectedCharacter"
          id="character"
          @change="loadCharacter"
        >
          <option value="">{{ l('logs.selectCharacter') }}</option>
          <option v-for="character in characters" :key="character">
            {{ character }}
          </option>
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
    <div class="form-group row" style="flex-shrink: 0" v-show="showFilters">
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
          <template #default="{ option }">
            {{
              (option && (option.key[0] == '#' ? '#' : '') + option.name) ||
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
    <div class="form-group row" style="flex-shrink: 0" v-show="showFilters">
      <label for="date" class="col-sm-2 col-form-label">{{
        l('logs.date')
      }}</label>
      <div class="col-sm-8 col-10 col-xl-9">
        <select
          class="form-control"
          v-model="selectedDate"
          id="date"
          @change="loadMessages"
        >
          <option :value="undefined">{{ l('logs.allDates') }}</option>
          <option
            v-for="date in dates"
            :key="date.getTime()"
            :value="date.getTime()"
          >
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
      class="messages messages-both"
      style="overflow: auto; overscroll-behavior: none"
      ref="messagesRef"
      tabindex="-1"
      @scroll="onMessagesScroll"
    >
      <message-view
        v-for="message in displayedMessages"
        :message="message"
        :key="message.id"
        :logs="true"
      ></message-view>
    </div>
    <div class="input-group" style="flex-shrink: 0">
      <div class="input-group-prepend">
        <div class="input-group-text"><span class="fas fa-search"></span></div>
      </div>
      <input
        class="form-control"
        v-model="filter"
        :placeholder="l('filter')"
        v-show="messages"
        type="text"
      />
    </div>
  </modal>
</template>

<script lang="ts">
  import {
    defineComponent,
    ref,
    computed,
    watch,
    onMounted,
    onBeforeUnmount,
    nextTick,
    defineExpose
  } from 'vue';
  import { useCustomDialog } from '../components/useCustomDialog';
  import { format } from 'date-fns';
  import FilterableSelect from '../components/FilterableSelect.vue';
  import Modal from '../components/Modal.vue';
  import { Keys } from '../keys';
  import { formatTime, getKey, messageToString } from './common';
  import core from './core';
  import { Conversation, Logs as LogInterface } from './interfaces';
  import l from './localize';
  import MessageView from './message_view';
  import Zip from './zip';
  import { Dialog } from '../helpers/dialog';
  import log from 'electron-log';

  function formatDate(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }

  function getLogs(
    messages: ReadonlyArray<Conversation.Message>,
    html: boolean
  ): string {
    const start = html
      ? `<meta charset="utf-8"><style>body { padding: 10px; }${document.getElementById('themeStyle')?.innerText ?? ''}</style>`
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
              ? t => `${core.bbCodeParser.parseEverything(t).innerHTML}`
              : undefined
          ),
        start
      ) +
      '</div>'
    );
  }

  export default defineComponent({
    name: 'Logs',
    components: {
      modal: Modal,
      'message-view': MessageView,
      'filterable-select': FilterableSelect
    },
    props: {
      conversation: Object
    },
    setup(props) {
      // Use the composable for dialog logic. We can't inherit this like we used to in Vue 2.
      const { dialog, show, hide } = useCustomDialog();

      const messagesRef = ref<HTMLElement | null>(null);

      const conversations = ref<LogInterface.Conversation[]>([]);
      const selectedConversation = ref<LogInterface.Conversation | undefined>(
        undefined
      );
      const dates = ref<ReadonlyArray<Date>>([]);
      const selectedDate = ref<string | undefined>(undefined);
      const filter = ref('');
      const messages = ref<ReadonlyArray<Conversation.Message>>([]);
      const characters = ref<ReadonlyArray<string>>([]);
      const selectedCharacter = ref(core.connection.character);
      const showFilters = ref(true);
      const canZip = ref(core.logs.canZip);
      const dateOffset = ref(-1);
      const windowStart = ref(0);
      const windowEnd = ref(0);
      const lockScroll = ref(false);
      const lastScroll = ref(-1);

      const lFunc = l;

      // Computed
      const filteredMessages = computed(() => {
        if (filter.value.length === 0) return messages.value;
        const filterRegex = new RegExp(
          filter.value.replace(/[^\w]/gi, '\\$&'),
          'i'
        );
        return messages.value.filter(
          x =>
            filterRegex.test(x.text) ||
            (x.type !== Conversation.Message.Type.Event &&
              filterRegex.test(x.sender.name))
        );
      });

      const displayedMessages = computed(() => {
        if (selectedDate.value !== undefined) return filteredMessages.value;
        return filteredMessages.value.slice(windowStart.value, windowEnd.value);
      });

      // Watchers
      watch(selectedConversation, async (newValue, oldValue) => {
        if (
          oldValue !== undefined &&
          newValue !== undefined &&
          oldValue.key === newValue.key
        )
          return;
        await loadDates();
        selectedDate.value = undefined;
        dateOffset.value = -1;
        filter.value = '';
        await loadMessages();
      });

      watch(filter, () => {
        if (selectedDate.value === undefined) {
          windowEnd.value = filteredMessages.value.length;
          windowStart.value = windowEnd.value - 50;
        }
        nextTick(() => onMessagesScroll());
      });

      watch(showFilters, () => {
        onMessagesScroll();
      });

      // Lifecycle
      onMounted(async () => {
        characters.value = await core.logs.getAvailableCharacters();
        window.addEventListener('resize', resizeListener);
      });

      onBeforeUnmount(() => {
        window.removeEventListener('resize', resizeListener);
      });

      // Methods
      async function loadCharacter() {
        selectedConversation.value = undefined;
        await loadConversations();
      }

      async function loadConversations() {
        if (selectedCharacter.value === '') return;
        const convs = await core.logs.getConversations(selectedCharacter.value);
        conversations.value = convs
          .slice()
          .sort((x, y) => (x.name < y.name ? -1 : x.name > y.name ? 1 : 0));
      }

      async function loadDates() {
        if (selectedConversation.value === undefined) {
          dates.value = [];
        } else {
          const dts = await core.logs.getLogDates(
            selectedCharacter.value,
            selectedConversation.value.key
          );
          dates.value = dts.slice().reverse();
        }
      }

      function filterConversation(
        filter: RegExp,
        conversation: LogInterface.Conversation
      ): boolean {
        return filter.test(conversation.name);
      }

      async function loadMessages() {
        if (selectedConversation.value === undefined) messages.value = [];
        else if (selectedDate.value !== undefined) {
          dateOffset.value = -1;
          messages.value = await core.logs.getLogs(
            selectedCharacter.value,
            selectedConversation.value.key,
            new Date(Number(selectedDate.value))
          );
        } else if (dateOffset.value === -1) {
          messages.value = [];
          dateOffset.value = 0;
          windowStart.value = 0;
          windowEnd.value = 0;
          lastScroll.value = -1;
          lockScroll.value = false;
          nextTick(() => onMessagesScroll());
        } else return onMessagesScroll();
      }

      function download(file: string, logs: string) {
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

      function downloadDay() {
        if (
          selectedConversation.value === undefined ||
          selectedDate.value === undefined ||
          messages.value.length === 0
        )
          return;
        const html = Dialog.confirmDialog(l('logs.html'));
        const name = `${selectedConversation.value.name}-${formatDate(new Date(Number(selectedDate.value)))}.${html ? 'html' : 'txt'}`;
        download(
          name,
          `data:${encodeURIComponent(name)},${encodeURIComponent(getLogs(messages.value, html))}`
        );
      }

      async function downloadConversation() {
        if (selectedConversation.value === undefined) return;
        const zip = new Zip();
        const html = Dialog.confirmDialog(l('logs.html'));
        for (const date of dates.value) {
          const msgs = await core.logs.getLogs(
            selectedCharacter.value,
            selectedConversation.value.key,
            date
          );
          zip.addFile(
            `${formatDate(date)}.${html ? 'html' : 'txt'}`,
            getLogs(msgs, html)
          );
        }
        download(
          `${selectedConversation.value.name}.zip`,
          URL.createObjectURL(zip.build())
        );
      }

      async function downloadCharacter() {
        if (
          selectedCharacter.value === '' ||
          !Dialog.confirmDialog(
            l('logs.confirmExport', selectedCharacter.value)
          )
        )
          return;
        const zip = new Zip();
        const html = Dialog.confirmDialog(l('logs.html'));
        for (const conv of conversations.value) {
          zip.addFile(`${conv.name}/`, '');
          const dts = await core.logs.getLogDates(
            selectedCharacter.value,
            conv.key
          );
          for (const date of dts) {
            const msgs = await core.logs.getLogs(
              selectedCharacter.value,
              conv.key,
              date
            );
            zip.addFile(
              `${conv.name}/${formatDate(date)}.${html ? 'html' : 'txt'}`,
              getLogs(msgs, html)
            );
          }
        }
        download(
          `${selectedCharacter.value}.zip`,
          URL.createObjectURL(zip.build())
        );
      }

      let keyDownListener: ((e: KeyboardEvent) => void) | undefined;

      async function onOpen() {
        if (selectedCharacter.value !== '') {
          await loadConversations();
          if (props.conversation !== undefined)
            selectedConversation.value = conversations.value.filter(
              x => x.key === props.conversation.key
            )[0];
          else {
            await loadDates();
            await loadMessages();
          }
        }
        keyDownListener = e => {
          if (
            getKey(e) === Keys.KeyA &&
            (e.ctrlKey || e.metaKey) &&
            !e.altKey &&
            !e.shiftKey
          ) {
            if ((e.target as HTMLElement).tagName.toLowerCase() === 'input')
              return;
            e.preventDefault();
            const selection = document.getSelection();
            if (selection === null) return;
            selection.removeAllRanges();
            if (messages.value.length > 0 && messagesRef.value) {
              const range = document.createRange();
              range.setStartBefore(messagesRef.value.firstChild!);
              range.setEndAfter(messagesRef.value.lastChild!);
              selection.addRange(range);
            }
          }
        };
        window.addEventListener('keydown', keyDownListener);
      }

      function onClose() {
        if (keyDownListener)
          window.removeEventListener('keydown', keyDownListener);
      }

      async function onMessagesScroll(ev?: Event) {
        const list = messagesRef.value;
        if (lockScroll.value) return;
        if (
          !list ||
          (ev !== undefined && Math.abs(list.scrollTop - lastScroll.value) < 50)
        )
          return;
        lockScroll.value = true;

        function getTop(index: number): number {
          return (list!.children[index] as HTMLElement).offsetTop;
        }

        while (
          selectedConversation.value !== undefined &&
          selectedDate.value === undefined &&
          dialog.value?.isShown
        ) {
          const oldHeight = list.scrollHeight,
            oldTop = list.scrollTop;
          const oldFirst = displayedMessages.value[0];
          const oldEnd = windowEnd.value;
          const length = displayedMessages.value.length;
          const oldTotal = filteredMessages.value.length;
          let loaded = false;
          if (length <= 20 || getTop(20) > list.scrollTop)
            windowStart.value -= 50;
          else if (length > 100 && getTop(100) < list.scrollTop)
            windowStart.value += 50;
          else if (
            length >= 100 &&
            getTop(length - 100) > list.scrollTop + list.offsetHeight
          )
            windowEnd.value -= 50;
          else if (getTop(length - 20) < list.scrollTop + list.offsetHeight)
            windowEnd.value += 50;
          if (windowStart.value <= 0 && dateOffset.value < dates.value.length) {
            const msgs = await core.logs.getLogs(
              selectedCharacter.value,
              selectedConversation.value.key,
              dates.value[dateOffset.value++]
            );
            messages.value = msgs.concat(messages.value);
            const addedTotal = filteredMessages.value.length - oldTotal;
            windowStart.value += addedTotal;
            windowEnd.value += addedTotal;
            loaded = true;
          }
          windowStart.value = Math.max(windowStart.value, 0);
          windowEnd.value = Math.min(
            windowEnd.value,
            filteredMessages.value.length
          );
          if (displayedMessages.value[0] !== oldFirst) {
            list.style.overflow = 'hidden';
            await nextTick();
            list.scrollTop = oldTop + list.scrollHeight - oldHeight;
            list.style.overflow = 'auto';
          } else if (windowEnd.value === oldEnd && !loaded) break;
          else await nextTick();
        }
        lastScroll.value = list.scrollTop;
        lockScroll.value = false;
      }

      function resizeListener() {
        onMessagesScroll();
      }

      // Expose show/hide for parent access via ref
      defineExpose({ show, hide });

      return {
        dialog,
        show,
        hide,
        messagesRef,
        conversations,
        selectedConversation,
        dates,
        selectedDate,
        filter,
        messages,
        characters,
        selectedCharacter,
        showFilters,
        canZip,
        l: lFunc,
        formatDate,
        displayedMessages,
        filterConversation,
        loadCharacter,
        loadMessages,
        downloadDay,
        downloadConversation,
        downloadCharacter,
        onOpen,
        onClose,
        onMessagesScroll
      };
    }
  });
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

<template>
  <modal
    ref="dialog"
    :action="l('statusHistory.title')"
    :buttonText="l('action.select')"
    :disabled="selectedText === null"
    @open="onMounted()"
    @submit="selectStatus"
    dialogClass="w-100 modal-70"
    iconClass="fa-solid fa-clock-rotate-left"
  >
    <div v-if="entries.length > 0" class="status-picker">
      <div
        v-for="(entry, index) in entries"
        :key="entry.text"
        class="status-row"
        :class="{
          selected: isSelected(entry),
          'group-break': index > 0 && index === firstUnpinnedIndex
        }"
        @click="select(entry)"
        @dblclick="submit"
      >
        <span class="status-check">
          <i class="fas" :class="{ 'fa-check-circle': isSelected(entry) }" />
        </span>

        <span class="status-text">
          <bbcode :text="entry.text"></bbcode>
        </span>

        <button
          type="button"
          class="status-action"
          :class="{ pinned: entry.pinned }"
          :title="pinTitle(entry)"
          :aria-label="pinTitle(entry)"
          @click.stop="togglePin(entry)"
        >
          <i class="fas fa-thumbtack" />
        </button>

        <button
          type="button"
          class="status-action"
          :title="l('statusHistory.action.remove')"
          :aria-label="l('statusHistory.action.remove')"
          @click.stop="removeEntry(entry)"
        >
          <i class="fas fa-times-circle" />
        </button>
      </div>
    </div>
    <div v-else class="status-picker-empty">
      <i>{{ l('statusHistory.empty') }}</i>
    </div>
  </modal>
</template>

<script lang="ts">
  import Modal from '../components/Modal.vue';
  import CustomDialog from '../components/custom_dialog';
  import core from './core';
  import { BBCodeView } from '../bbcode/view';
  import { Dialog } from '../helpers/dialog';
  import l from './localize';

  interface StatusEntry {
    text: string;
    pinned: boolean;
  }

  // updateHistory dedupes history but never pins, so the two stores can hold
  // the same message in different cases. compare loosely or it renders twice
  function normalize(status: string): string {
    return status.toString().trim().toLowerCase();
  }

  export default CustomDialog.extend({
    components: { modal: Modal, bbcode: BBCodeView(core.bbCodeParser) },
    props: {
      callback: { required: true as const },
      curStatus: { required: true as const }
    },
    data() {
      return {
        l,
        history: [] as string[],
        pinned: [] as string[],
        selectedText: null as string | null
      };
    },
    mounted(): void {
      this.onMounted();
    },
    computed: {
      // storage stays split across statusPins/statusHistory, only the view is unified
      entries(): StatusEntry[] {
        const seen: string[] = [];
        const result: StatusEntry[] = [];

        const add = (text: string, pinned: boolean) => {
          const key = normalize(text);
          if (seen.indexOf(key) >= 0) return;
          seen.push(key);
          result.push({ text, pinned });
        };

        this.pinned.forEach(text => add(text, true));
        this.history.forEach(text => add(text, false));

        return result;
      },
      firstUnpinnedIndex(): number {
        return this.entries.findIndex(entry => !entry.pinned);
      }
    },
    methods: {
      async onMounted(): Promise<void> {
        this.history = (await core.settingsStore.get('statusHistory')) || [];
        this.pinned = (await core.settingsStore.get('statusPins')) || [];
        this.selectedText = null;

        if (this.curStatus && (this.curStatus as string).trim() !== '') {
          const key = normalize(this.curStatus as string);
          const match = this.entries.find(
            entry => normalize(entry.text) === key
          );

          if (match !== undefined) this.selectedText = match.text;
        }
      },
      submit(e: Event): void {
        (this.$refs.dialog as InstanceType<typeof Modal>).submit(e);
      },
      selectStatus(): void {
        if (this.selectedText !== null)
          (this.callback as (statusMessage: string) => void)(this.selectedText);
      },
      isSelected(entry: StatusEntry): boolean {
        return entry.text === this.selectedText;
      },
      select(entry: StatusEntry): void {
        this.selectedText = entry.text;
      },
      pinTitle(entry: StatusEntry): string {
        return l(
          entry.pinned
            ? 'statusHistory.action.unpin'
            : 'statusHistory.action.pin'
        );
      },
      async togglePin(entry: StatusEntry): Promise<void> {
        if (entry.pinned) return this.unpin(entry);

        const key = normalize(entry.text);
        if (this.pinned.some(text => normalize(text) === key)) return;

        this.pinned.push(entry.text);
        await core.settingsStore.set('statusPins', this.pinned);
      },
      async unpin(entry: StatusEntry): Promise<void> {
        // confirmation bc unpinning a status that's not in history removes it entirely
        if (!Dialog.confirmDialog(l('statusHistory.confirmRemove.pinned')))
          return;

        const key = normalize(entry.text);
        const index = this.pinned.findIndex(text => normalize(text) === key);
        if (index < 0) return;

        this.pinned.splice(index, 1);
        await core.settingsStore.set('statusPins', this.pinned);
        this.clearSelectionIfGone();
      },
      async removeEntry(entry: StatusEntry): Promise<void> {
        if (!Dialog.confirmDialog(l('statusHistory.confirmRemove'))) return;

        const key = normalize(entry.text);
        const pinIndex = this.pinned.findIndex(text => normalize(text) === key);
        const historyIndex = this.history.findIndex(
          text => normalize(text) === key
        );

        if (pinIndex >= 0) {
          this.pinned.splice(pinIndex, 1);
          await core.settingsStore.set('statusPins', this.pinned);
        }

        if (historyIndex >= 0) {
          this.history.splice(historyIndex, 1);
          await core.settingsStore.set('statusHistory', this.history);
        }

        this.clearSelectionIfGone();
      },
      clearSelectionIfGone(): void {
        if (!this.entries.some(entry => entry.text === this.selectedText))
          this.selectedText = null;
      }
    }
  });
</script>

<style lang="scss">
  .status-picker {
    max-height: min(55vh, 420px);
    overflow-y: auto;

    .status-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;

      &.group-break {
        margin-top: 0.4rem;
        border-top: 1px solid var(--bs-border-color);
        padding-top: 0.6rem;
      }

      &:hover {
        background: color-mix(in srgb, var(--bs-body-color) 8%, transparent);
      }

      &.selected,
      &.selected:hover {
        background: color-mix(in srgb, var(--bs-body-color) 18%, transparent);
      }

      .status-check {
        width: 1.3rem;
        flex-shrink: 0;
        color: currentColor;
      }

      .status-text {
        flex: 1;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .status-action {
        flex-shrink: 0;
        padding: 0.25rem 0.4rem;
        border: 0;
        background: none;
        border-radius: 4px;
        color: inherit;
        opacity: 0.5;

        &:hover {
          opacity: 1;
          background: color-mix(in srgb, var(--bs-body-color) 12%, transparent);
        }

        &:focus-visible {
          outline: 2px solid var(--bs-primary);
          outline-offset: -2px;
          opacity: 1;
        }

        &.pinned {
          opacity: 1;
          color: var(--bs-success);
        }
      }
    }
  }

  .status-picker-empty {
    padding: 0.5rem;
    color: var(--bs-secondary-color);
  }
</style>

<template>
  <modal
    ref="dialog"
    :action="l('statusHistory.title')"
    :buttonText="l('action.select')"
    @open="onMounted()"
    @submit="selectStatus"
    dialogClass="w-100 modal-70"
    iconClass="fa-solid fa-clock-rotate-left"
  >
    <form class="status-picker" v-if="pinned.length > 0">
      <p class="text-sm-end">
        {{ l('statusHistory.pinned') }}
      </p>
      <div
        class="row"
        v-for="(pinnedStatus, index) in pinned"
        :class="{ 'selected-row': index === selectedPin }"
      >
        <div class="form-col radio-col">
          <input
            type="radio"
            :id="'pinned_status_' + index"
            :name="'pinned_status_' + index"
            v-model="selectedPin"
            v-bind:value="index"
          />
        </div>
        <div
          class="form-col content-col"
          @click="selectPin(index)"
          @dblclick="submit"
        >
          <span class="before-content"
            ><i
              class="fas"
              :class="{ 'fa-check-circle': index === selectedPin }"
          /></span>

          <span class="form-check-label" :for="'pinned_status_' + index">
            <bbcode :text="pinnedStatus"></bbcode>
          </span>

          <span class="content-action" role="button" @click="unpinStatus(index)"
            ><i class="fas fa-thumbtack text-success"
          /></span>
        </div>
      </div>
    </form>

    <form class="status-picker" v-if="history.length > 0">
      <p class="text-sm-end">
        {{ l('statusHistory.count', history.length, 15) }}
      </p>
      <div
        class="row"
        v-for="(historicStatus, index) in history"
        :class="{ 'selected-row': index === selectedStatus }"
      >
        <div class="form-col radio-col">
          <input
            type="radio"
            :id="'history_status_' + index"
            :name="'history_status_' + index"
            v-model="selectedStatus"
            v-bind:value="index"
          />
        </div>
        <div
          class="form-col content-col"
          @click="select(index)"
          @dblclick="submit"
        >
          <span class="before-content"
            ><i
              class="fas"
              :class="{ 'fa-check-circle': index === selectedStatus }"
          /></span>
          <span class="form-check-label" :for="'history_status_' + index">
            <bbcode :text="historicStatus"></bbcode>
          </span>

          <span
            class="content-action"
            role="button"
            @click="pinStatusFromHistory(index)"
            ><i class="fas fa-thumbtack"
          /></span>

          <span
            class="content-action"
            role="button"
            @click="removeStatusHistoryEntry(index)"
            ><i class="fas fa-times-circle"
          /></span>
        </div>
      </div>
    </form>
    <div v-else>
      <i>{{ l('statusHistory.empty') }}</i>
    </div>
  </modal>
</template>

<script lang="ts">
  import Modal from '../components/Modal.vue';
  import CustomDialog from '../components/custom_dialog';
  import core from './core';
  import { BBCodeView } from '../bbcode/view';
  import * as _ from 'lodash';
  import { Dialog } from '../helpers/dialog';
  import l from './localize';

  const MAX_PINNED_STATUSES: number = 5;

  export default CustomDialog.extend({
    components: { modal: Modal, bbcode: BBCodeView(core.bbCodeParser) },
    props: {
      callback: { required: true as const },
      curStatus: { required: true as const }
    },
    data() {
      return {
        maxPinnedStatuses: MAX_PINNED_STATUSES,
        l,
        history: [] as string[],
        pinned: [] as string[],
        selectedStatus: null as number | null,
        selectedPin: null as number | null
      };
    },
    mounted(): void {
      this.onMounted();
    },
    methods: {
      async onMounted(): Promise<void> {
        this.history = (await core.settingsStore.get('statusHistory')) || [];
        this.pinned = (await core.settingsStore.get('statusPins')) || [];
        this.selectedStatus = null;
        this.selectedPin = null;

        if (this.curStatus && (this.curStatus as string).trim() !== '') {
          const cleanedStatus = (this.curStatus as string).toLowerCase().trim();

          const index = _.findIndex(
            this.history,
            (c: string) => c.toString().toLowerCase().trim() === cleanedStatus
          );

          if (index >= 0) {
            this.selectedStatus = index;
          }
        }
      },
      submit(e: Event): void {
        (<Modal>this.$refs.dialog).submit(e);
      },
      selectStatus(): void {
        if (this.selectedStatus !== null) {
          (this.callback as (statusMessage: string) => void)(
            this.history[this.selectedStatus]
          );
        } else if (this.selectedPin !== null) {
          (this.callback as (statusMessage: string) => void)(
            this.pinned[this.selectedPin]
          );
        }
      },
      async pinStatusFromHistory(pinHistoryIndex: number): Promise<void> {
        const status = this.history[pinHistoryIndex];
        console.log(this.pinned.indexOf(status));
        if (this.pinned.indexOf(status) > -1) return;
        this.pinned.push(status);

        await core.settingsStore.set('statusPins', this.pinned);
      },
      async unpinStatus(index: number): Promise<void> {
        if (Dialog.confirmDialog(l('statusHistory.confirmRemove.pinned'))) {
          this.pinned.splice(index, 1);

          await core.settingsStore.set('statusPins', this.pinned);
        }
      },
      async removeStatusHistoryEntry(index: number): Promise<void> {
        if (Dialog.confirmDialog(l('statusHistory.confirmRemove'))) {
          this.history.splice(index, 1);

          await core.settingsStore.set('statusHistory', this.history);
        }
      },
      select(index: number): void {
        this.selectedPin = null;
        this.selectedStatus = index;
      },
      selectPin(index: number): void {
        this.selectedStatus = null;
        this.selectedPin = index;
      }
    }
  });
</script>

<style lang="scss">
  .status-picker {
    .radio-col {
      display: none;
    }

    .form-check-label::before {
      display: none !important;
    }

    .content-col {
      min-width: 100%;
      display: flex;

      .form-check-label {
        flex: 1;
        display: inline-block;
        margin-bottom: 0.5rem;
      }

      .before-content {
        width: 1.3rem;
        margin-bottom: auto;
        margin-top: auto;
      }

      .content-action {
        float: right;
        opacity: 0.5;
        margin-bottom: auto;
        margin-top: auto;
        margin-left: 1rem;

        &:hover {
          opacity: 0.8;
        }
      }
    }

    .form-row {
      margin-bottom: 10px;
      padding: 3px;

      border: 1px solid rgba(0, 0, 0, 0);
      border-radius: 2px;
    }

    .row:hover {
      /*background-color: #20203e;*/
      /*border: 1px solid #2d2d6b;*/
      backdrop-filter: invert(30%);
      border-radius: 2px;
    }

    .selected-row,
    .row.selected-row:hover {
      /*background-color: #343461;*/
      /*border: 1px solid #6565b2;*/
      backdrop-filter: invert(20%);
      border-radius: 2px;
    }
  }
</style>

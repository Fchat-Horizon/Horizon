<template>
  <modal
    :action="l('chat.setStatus')"
    @submit="setStatus"
    @close="reset"
    dialogClass="w-100 modal-70 statusEditor"
    :iconClass="getStatusIcon(status)"
  >
    <div class="mb-3" id="statusSelector">
      <label class="control-label">{{ l('chat.setStatus.status') }}</label>
      <dropdown linkClass="form-select">
        <span slot="title"
          ><span class="fa fa-fw" :class="getStatusIcon(status)"></span
          >{{ l('status.' + status) }}</span
        >
        <a
          href="#"
          class="dropdown-item"
          v-for="item in statuses"
          @click.prevent="status = item"
        >
          <span class="fa fa-fw" :class="getStatusIcon(item)"></span
          >{{ l('status.' + item) }}
        </a>
      </dropdown>
    </div>
    <div class="mb-3">
      <label class="control-label">{{ l('chat.setStatus.message') }}</label>
      <editor id="text" v-model="text" classes="form-control" maxlength="255">
        <div class="bbcode-editor-controls">
          {{ getByteLength(text) }} / 255
        </div>
      </editor>
    </div>
    <div class="mb-3">
      <button
        type="button"
        @click="showStatusPicker"
        class="btn btn-outline-secondary"
      >
        History
      </button>
    </div>

    <status-picker
      ref="statusPicker"
      :callback="insertStatusMessage"
      :curStatus="enteredText"
    ></status-picker>
  </modal>
</template>

<script lang="ts">
  import CustomDialog from '../components/custom_dialog';
  import Dropdown from '../components/Dropdown.vue';
  import Modal from '../components/Modal.vue';
  import { Editor } from './bbcode';
  import { getByteLength } from './common';
  import core from './core';
  import { Character, userStatuses } from './interfaces';
  import l from './localize';
  import { getStatusIcon } from './UserView.vue';
  import StatusPicker from './StatusPicker.vue';
  import * as _ from 'lodash';

  const MAX_STATUS_COUNT: number = 15;

  export default CustomDialog.extend({
    components: {
      modal: Modal,
      editor: Editor,
      dropdown: Dropdown,
      'status-picker': StatusPicker
    },
    data() {
      return {
        //Yes, you also need to update this in StatusPicker.vue, because I really cannot
        //be assed to write a system for shared constants right now.
        //That component only uses it to display the string that shows how many statuses you have saved though.
        selectedStatus: undefined as Character.Status | undefined,
        enteredText: undefined as string | undefined,
        statuses: userStatuses,
        l,
        getByteLength,
        getStatusIcon
      };
    },
    computed: {
      status: {
        get(): Character.Status {
          return this.selectedStatus !== undefined
            ? this.selectedStatus
            : this.character.status;
        },
        set(status: Character.Status) {
          this.selectedStatus = status;
        }
      },
      text: {
        get(): string {
          return this.enteredText !== undefined
            ? this.enteredText
            : this.character.statusText;
        },
        set(text: string) {
          this.enteredText = text;
        }
      },
      character(): Character {
        return core.characters.ownCharacter;
      }
    },
    methods: {
      setStatus(): void {
        core.connection.send('STA', {
          status: this.status,
          statusmsg: this.text
        });

        // tslint:disable-next-line
        this.updateHistory(this.text);
      },
      reset(): void {
        this.selectedStatus = undefined;
        this.enteredText = undefined;
      },
      insertStatusMessage(statusMessage: string): void {
        this.text = statusMessage;
      },
      async updateHistory(statusMessage: string): Promise<void> {
        if (!statusMessage || statusMessage.trim() === '') {
          return;
        }

        const curHistory: string[] =
          (await core.settingsStore.get('statusHistory')) || [];
        const statusMessageClean = statusMessage
          .toString()
          .trim()
          .toLowerCase();
        const filteredHistory: string[] = _.reject(
          curHistory,
          (c: string) =>
            c.toString().trim().toLowerCase() === statusMessageClean
        );
        const newHistory: string[] = _.take(
          _.concat([statusMessage], filteredHistory),
          MAX_STATUS_COUNT
        );

        await core.settingsStore.set('statusHistory', newHistory);
      },
      showStatusPicker(): void {
        (<StatusPicker>this.$refs['statusPicker']).show();
      }
    }
  });
</script>

<style lang="scss">
  .statusEditor .bbcode-toolbar .color-selector {
  }

  .statusEditor .bbcode-toolbar .eicon-selector {
    top: 30px !important;
  }
</style>

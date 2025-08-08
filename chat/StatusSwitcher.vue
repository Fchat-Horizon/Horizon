<template>
  <modal
    :action="l('chat.setStatus')"
    @submit="setStatus"
    @close="reset"
    dialogClass="w-100 modal-70 statusEditor"
    :iconClass="getStatusIcon(status)"
  >
    <div class="form-group" id="statusSelector">
      <label class="control-label">{{ l('chat.setStatus.status') }}</label>
      <dropdown linkClass="custom-select">
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
    <div class="form-group" id="statusTimeoutSelector">
      <label class="control-label">{{ l('chat.setStatus.timeout') }}</label>
      <dropdown linkClass="custom-select">
        <span slot="title">
          <span>{{ this.timeoutSelectionStr }}</span>
        </span>
        <a
          href="#"
          class="dropdown-item"
          v-for="item in statusTimeouts"
          @click.prevent="timeoutSelection = item"
        >
          {{
            l(`chat.setStatus.timeoutLabel.${item.label}`) +
            ` ${calculateTimeUntil(item.duration)}`
          }}
        </a>
      </dropdown>
    </div>
    <div class="form-group">
      <label class="control-label">{{ l('chat.setStatus.message') }}</label>
      <editor id="text" v-model="text" classes="form-control" maxlength="255">
        <div class="bbcode-editor-controls">
          {{ getByteLength(text) }} / 255
        </div>
      </editor>
    </div>
    <div class="form-group">
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
  import { Component } from '@f-list/vue-ts';
  import CustomDialog from '../components/custom_dialog';
  import Dropdown from '../components/Dropdown.vue';
  import Modal from '../components/Modal.vue';
  import { Editor } from './bbcode';
  import { getByteLength } from './common';
  import core from './core';
  import {
    Character,
    StatusPersistence,
    StatusTimeout,
    userStatuses
  } from './interfaces';
  import l from './localize';
  import { getStatusIcon } from './UserView.vue';
  import StatusPicker from './StatusPicker.vue';
  import * as _ from 'lodash';
  import Raven from 'raven-js';

  @Component({
    components: {
      modal: Modal,
      editor: Editor,
      dropdown: Dropdown,
      'status-picker': StatusPicker
    }
  })
  export default class StatusSwitcher extends CustomDialog {
    readonly statusTimeouts = [
      { label: '30-min', duration: 30 },
      { label: '1-hour', duration: 60 },
      { label: '3-hour', duration: 180 },
      { label: '12-hour', duration: 720 },
      { label: '24-hour', duration: 1440 },
      { label: 'none', duration: -1 }
    ];
    readonly defaultTimeout = { label: 'none', duration: -1 };
    selectedStatus: Character.Status | undefined;
    enteredText: string | undefined;
    persistedStatus: StatusPersistence | undefined;
    selectedTimeout: StatusTimeout | undefined;
    statusResetJob: NodeJS.Timeout | undefined;
    statuses = userStatuses;
    l = l;
    getByteLength = getByteLength;
    getStatusIcon = getStatusIcon;

    get status(): Character.Status {
      return this.selectedStatus !== undefined
        ? this.selectedStatus
        : this.character.status;
    }

    set status(status: Character.Status) {
      this.selectedStatus = status;
    }

    get text(): string {
      return this.enteredText !== undefined
        ? this.enteredText
        : this.character.statusText;
    }

    set text(text: string) {
      this.enteredText = text;
    }

    get timeoutSelectionStr(): string {
      return this.selectedTimeout !== undefined
        ? l('chat.setStatus.timeoutLabel.' + this.selectedTimeout.label)
        : l('chat.setStatus.timeoutLabel.none');
    }

    get timeoutSelection(): StatusTimeout {
      return this.selectedTimeout !== undefined
        ? this.selectedTimeout!
        : this.defaultTimeout;
    }

    set timeoutSelection(timeoutSelection: StatusTimeout) {
      this.selectedTimeout = timeoutSelection;
    }

    get character(): Character {
      return core.characters.ownCharacter;
    }

    setStatus(_: PointerEvent | undefined, reset = false): void {
      core.connection.send('STA', {
        status: this.status,
        statusmsg: this.text
      });

      if (this.timeoutSelection.duration > -1 && !reset) {
        this.persistedStatus = {
          status: this.character.status,
          text: this.character.statusText,
          character: this.character.name
        };

        if (this.statusResetJob) {
          clearTimeout(this.statusResetJob);
        }

        this.statusResetJob = setTimeout(
          this.resetStatus.bind(this),
          this.timeoutSelection.duration * 60 * 1000
        );
      } else {
        if (this.statusResetJob) {
          clearTimeout(this.statusResetJob);
          this.statusResetJob = undefined;
        }
      }

      // tslint:disable-next-line
      this.updateHistory(this.text);
    }

    resetStatus() {
      this.timeoutSelection = this.defaultTimeout;
      this.status = this.persistedStatus?.status || 'online';
      this.text = this.persistedStatus?.text || '';

      if (
        // @ts-ignore
        Raven.getContext().user.username === this.persistedStatus?.character
      ) {
        this.setStatus(undefined, true);
      }
    }

    reset(): void {
      this.selectedStatus = undefined;
      this.enteredText = undefined;
    }

    insertStatusMessage(statusMessage: string): void {
      this.text = statusMessage;
    }

    async updateHistory(statusMessage: string): Promise<void> {
      if (!statusMessage || statusMessage.trim() === '') {
        return;
      }

      const curHistory: string[] =
        (await core.settingsStore.get('statusHistory')) || [];
      const statusMessageClean = statusMessage.toString().trim().toLowerCase();
      const filteredHistory: string[] = _.reject(
        curHistory,
        (c: string) => c.toString().trim().toLowerCase() === statusMessageClean
      );
      const newHistory: string[] = _.take(
        _.concat([statusMessage], filteredHistory),
        10
      );

      await core.settingsStore.set('statusHistory', newHistory);
    }

    showStatusPicker(): void {
      (<StatusPicker>this.$refs['statusPicker']).show();
    }

    calculateTimeUntil(duration: number): string {
      if (duration < 0) {
        return '';
      }
      const msToAdd = duration * 60 * 1000;
      const newTs = new Date(Date.now() + msToAdd);
      return `(${String(newTs.getHours()).padStart(2, '0')}:${String(newTs.getMinutes()).padStart(2, '0')})`;
    }
  }
</script>

<style lang="scss">
  .statusEditor .bbcode-toolbar .color-selector {
    left: 58px !important;
  }

  .statusEditor .bbcode-toolbar .eicon-selector {
    top: 30px !important;
  }
</style>

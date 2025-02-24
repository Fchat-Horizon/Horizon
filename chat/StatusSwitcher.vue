<template>
  <modal :action="l('chat.setStatus')" @submit="setStatus" @close="reset" dialogClass="w-100 modal-lg statusEditor">
    <div class="form-group" id="statusSelector">
      <label class="control-label">{{ l('chat.setStatus.status') }}</label>
      <dropdown linkClass="custom-select">
        <span slot="title"><span class="fa fa-fw" :class="getStatusIcon(status)"></span>{{ l('status.' + status) }}</span>
        <a href="#" class="dropdown-item" v-for="item in statuses" @click.prevent="status = item">
          <span class="fa fa-fw" :class="getStatusIcon(item)"></span>{{ l('status.' + item) }}
        </a>
      </dropdown>
    </div>
    <div class="form-group">
      <label class="control-label">{{ l('chat.setStatus.message') }}</label>
      <editor id="text" v-model="text" classes="form-control" maxlength="255">
        <div class="bbcode-editor-controls">{{ getByteLength(text) }} / 255</div>
      </editor>
    </div>
    <div class="form-group">
      <button type="button" @click="showStatusPicker" class="btn btn-outline-secondary">History</button>
    </div>

    <status-picker ref="statusPicker" :callback="insertStatusMessage" :curStatus="enteredText"></status-picker>
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
  import { Character, userStatuses } from './interfaces';
  import l from './localize';
  import { getStatusIcon } from './UserView.vue';
  import StatusPicker from './StatusPicker.vue';
  import * as _ from 'lodash';

  @Component({
    components: { modal: Modal, editor: Editor, dropdown: Dropdown, 'status-picker': StatusPicker }
  })
  export default class StatusSwitcher extends CustomDialog {
    selectedStatus: Character.Status | undefined;
    enteredText: string | undefined;
    statuses = userStatuses;
    l = l;
    getByteLength = getByteLength;
    getStatusIcon = getStatusIcon;

    get status(): Character.Status {
      return this.selectedStatus !== undefined ? this.selectedStatus : this.character.status;
    }

    set status(status: Character.Status) {
      this.selectedStatus = status;
    }

    get text(): string {
      return this.enteredText !== undefined ? this.enteredText : this.character.statusText;
    }

    set text(text: string) {
      this.enteredText = text;
    }

    get character(): Character {
      return core.characters.ownCharacter;
    }

    setStatus(): void {
      core.connection.send('STA', { status: this.status, statusmsg: this.text });

      // tslint:disable-next-line
      this.updateHistory(this.text);
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

      const curHistory: string[] = (await core.settingsStore.get('statusHistory')) || [];
      const statusMessageClean = statusMessage.toString().trim().toLowerCase();
      const filteredHistory: string[] = _.reject(curHistory, (c: string) => c.toString().trim().toLowerCase() === statusMessageClean);
      const newHistory: string[] = _.take(_.concat([statusMessage], filteredHistory), 10);

      await core.settingsStore.set('statusHistory', newHistory);
    }

    showStatusPicker(): void {
      (<StatusPicker>this.$refs['statusPicker']).show();
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

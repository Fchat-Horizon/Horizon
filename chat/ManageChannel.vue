<template>
  <modal
    ref="dialog"
    :action="l('manageChannel.action', channel.name)"
    :buttonText="l('manageChannel.submit')"
    @submit="submit"
    dialogClass="w-100 modal-lg"
    @open="onOpen"
  >
    <div class="form-group" v-show="isChannelOwner && channel.id.substr(0, 4) === 'adh-'">
      <label class="control-label" for="isPublic">
        <input type="checkbox" id="isPublic" v-model="isPublic" />
        {{ l('manageChannel.isPublic') }}
      </label>
    </div>
    <div class="form-group" v-show="isChannelOwner">
      <label class="control-label" for="mode">{{ l('manageChannel.mode') }}</label>
      <select v-model="mode" class="form-control" id="mode">
        <option v-for="mode in modes" :value="mode">{{ l('channel.mode.' + mode) }}</option>
      </select>
    </div>
    <div class="form-group">
      <label>{{ l('manageChannel.description') }}</label>
      <bbcode-editor classes="form-control" id="description" v-model="description" style="position: relative" :maxlength="50000">
        <div class="bbcode-editor-controls">{{ getByteLength(description) }} / {{ maxLength }}</div>
      </bbcode-editor>
    </div>
    <template v-if="isChannelOwner">
      <h4>{{ l('manageChannel.mods') }}</h4>
      <div v-for="(mod, index) in opList">
        <a href="#" @click.prevent="opList.splice(index, 1)" class="btn" style="padding: 0; vertical-align: baseline">
          <i class="fas fa-times"></i>
        </a>
        {{ mod }}
      </div>
      <div style="display: flex; margin-top: 5px">
        <input :placeholder="l('manageChannel.modAddName')" v-model="modAddName" class="form-control" style="margin-right: 5px" />
        <button class="btn btn-secondary" @click="modAdd" :disabled="!modAddName">{{ l('manageChannel.modAdd') }}</button>
      </div>
    </template>
  </modal>
</template>

<script lang="ts">
  import { Component, Prop } from '@f-list/vue-ts';
  import CustomDialog from '../components/custom_dialog';
  import Modal from '../components/Modal.vue';
  import { Editor } from './bbcode';
  import { getByteLength } from './common';
  import core from './core';
  import { Channel, channelModes } from './interfaces';
  import l from './localize';

  @Component({
    components: { modal: Modal, 'bbcode-editor': Editor }
  })
  export default class ManageChannel extends CustomDialog {
    @Prop({ required: true })
    readonly channel!: Channel;
    modes = channelModes;
    isPublic = this.channelIsPublic;
    mode = this.channel.mode;
    description = this.channel.description;
    l = l;
    getByteLength = getByteLength;
    modAddName = '';
    opList = this.channel.opList.slice();
    maxLength = core.connection.vars.cds_max;

    onOpen(): void {
      this.mode = this.channel.mode;
      this.isPublic = this.channelIsPublic;
      this.description = this.channel.description;
      this.opList = this.channel.opList.slice();
    }

    get channelIsPublic(): boolean {
      return core.channels.openRooms[this.channel.id] !== undefined;
    }

    get isChannelOwner(): boolean {
      return this.channel.owner === core.connection.character || core.characters.ownCharacter.isChatOp;
    }

    modAdd(): void {
      this.opList.push(this.modAddName);
      this.modAddName = '';
    }

    submit(): void {
      if (this.description !== this.channel.description)
        core.connection.send('CDS', { channel: this.channel.id, description: this.description });
      if (!this.isChannelOwner) return;
      if (this.isPublic !== this.channelIsPublic)
        core.connection.send('RST', { channel: this.channel.id, status: this.isPublic ? 'public' : 'private' });
      if (this.mode !== this.channel.mode) core.connection.send('RMO', { channel: this.channel.id, mode: this.mode });
      for (const op of this.channel.opList) {
        const index = this.opList.indexOf(op);
        if (index !== -1) this.opList.splice(index, 1);
        else core.connection.send('COR', { channel: this.channel.id, character: op });
      }
      for (const op of this.opList) core.connection.send('COA', { channel: this.channel.id, character: op });
    }
  }
</script>

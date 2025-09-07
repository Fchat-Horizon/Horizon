<template>
  <modal
    id="deleteDialog"
    :action="l('deleteDialog.actionFor', name)"
    :disabled="true"
    @submit.prevent="deleteCharacter()"
    buttonClass="btn-danger"
    iconClass="fas fa-user-slash"
  >
    {{ l('deleteDialog.confirm1', name) }}<br />
    {{ l('deleteDialog.confirm2') }}
  </modal>
</template>

<script lang="ts">
  import { Component, Prop } from '@f-list/vue-ts';
  import CustomDialog from '../../components/custom_dialog';
  import Modal from '../../components/Modal.vue';
  import * as Utils from '../utils';
  import { methods } from './data_store';
  import { Character } from './interfaces';
  import l from './../../chat/localize';

  @Component({
    components: { modal: Modal }
  })
  export default class DeleteDialog extends CustomDialog {
    l = l;
    @Prop({ required: true })
    private readonly character!: Character;

    deleting = false;

    get name(): string {
      return this.character.character.name;
    }

    async deleteCharacter(): Promise<void> {
      try {
        this.deleting = true;
        await methods.characterDelete(this.character.character.id);
        this.hide();
        window.location.assign('/');
      } catch (e) {
        Utils.ajaxError(e, 'Unable to delete character');
      }
      this.deleting = false;
    }
  }
</script>

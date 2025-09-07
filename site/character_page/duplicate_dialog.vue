<template>
  <modal
    id="duplicateDialog"
    :action="l('duplicateDialog.actionFor', name)"
    :disabled="true"
    @submit.prevent="duplicate()"
    iconClass="fas fa-clone"
  >
    <p>
      {{ l('duplicateDialog.info') }}
    </p>
    <div class="row mb-2">
      <form-group-inputgroup
        class="col-12"
        :errors="errors"
        field="name"
        id="characterName"
        :label="l('common.name')"
      >
        <template v-slot="slotProps">
          <input
            class="form-control"
            type="text"
            id="characterName"
            v-model="newName"
            :class="slotProps.cls"
          />
          <div slot="button">
            <button
              type="button"
              class="btn btn-secondary"
              @click="checkName"
              :disabled="newName.length < 2 || checking"
            >
              {{ l('duplicateDialog.checkName') }}
            </button>
          </div>
          <div slot="valid" class="valid-feedback">
            {{ l('duplicateDialog.nameValid') }}
          </div>
        </template>
      </form-group-inputgroup>
    </div>
  </modal>
</template>

<script lang="ts">
  import { Component, Prop } from '@f-list/vue-ts';
  import CustomDialog from '../../components/custom_dialog';
  import FormGroupInputgroup from '../../components/form_group_inputgroup.vue';
  import Modal from '../../components/Modal.vue';
  import * as Utils from '../utils';
  import { methods } from './data_store';
  import { Character } from './interfaces';
  import l from './../../chat/localize';

  @Component({
    components: { 'form-group-inputgroup': FormGroupInputgroup, modal: Modal }
  })
  export default class DuplicateDialog extends CustomDialog {
    l = l;
    @Prop({ required: true })
    readonly character!: Character;

    errors: { [key: string]: string } = {};
    newName = '';
    valid = false;

    checking = false;
    duplicating = false;

    get name(): string {
      return this.character.character.name;
    }

    async checkName(): Promise<boolean> {
      try {
        this.checking = true;
        await methods.characterNameCheck(this.newName);
        this.valid = true;
        this.errors = {};
        return true;
      } catch (e) {
        this.valid = false;
        this.errors = {};
        if (Utils.isJSONError(e))
          this.errors['name]'] = <string>e.response.data.error;
        return false;
      } finally {
        this.checking = false;
      }
    }

    async duplicate(): Promise<void> {
      try {
        this.duplicating = true;
        await methods.characterDuplicate(
          this.character.character.id,
          this.newName
        );
        this.hide();
      } catch (e) {
        Utils.ajaxError(e, 'Unable to duplicate character');
        this.valid = false;
        if (Utils.isJSONError(e))
          this.errors['name'] = <string>e.response.data.error;
      }
      this.duplicating = false;
    }
  }
</script>

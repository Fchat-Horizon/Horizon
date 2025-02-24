<template>
  <modal id="copyCustomDialog" action="Copy Custom Kink" :disabled="!valid || submitting" @submit.prevent="copyCustom()">
    <form-group field="name" :errors="formErrors" label="Name" id="copyCustomName">
      <input
        type="text"
        class="form-control"
        maxlength="30"
        required
        v-model="name"
        slot-scope="props"
        id="copyCustomName"
        :class="props.cls"
      />
    </form-group>
    <form-group field="description" :errors="formErrors" label="Description" id="copyCustomDescription">
      <input
        type="text"
        class="form-control"
        max-length="250"
        v-model="description"
        required
        id="copyCustomDescription"
        slot-scope="props"
        :class="props.cls"
      />
    </form-group>
    <form-group field="choice" :errors="formErrors" label="Choice" id="copyCustomChoice">
      <select v-model="choice" class="form-control" slot-scope="props" :class="props.cls" id="copyCustomChoice">
        <option value="favorite">Favorite</option>
        <option value="yes">Yes</option>
        <option value="maybe">Maybe</option>
        <option value="no">No</option>
      </select>
    </form-group>
    <form-group field="target" :errors="formErrors" label="Target Character" id="copyCustomTarget">
      <character-select v-model="target" slot-scope="props" :class="props.cls" id="copyCustomTarget"></character-select>
    </form-group>
  </modal>
</template>

<script lang="ts">
  import { Component } from '@f-list/vue-ts';
  import CustomDialog from '../../components/custom_dialog';
  import FormGroup from '../../components/form_group.vue';
  import Modal from '../../components/Modal.vue';
  import { KinkChoice } from '../../interfaces';
  import * as Utils from '../utils';
  import { methods } from './data_store';

  @Component({
    components: { 'form-group': FormGroup, modal: Modal }
  })
  export default class CopyCustomDialog extends CustomDialog {
    name = '';
    description = '';
    choice: KinkChoice = 'favorite';
    target = Utils.settings.defaultCharacter;
    formErrors = {};
    submitting = false;

    showDialog(name: string, description: string): void {
      this.name = name;
      this.description = description;
      this.show();
    }

    async copyCustom(): Promise<void> {
      try {
        this.formErrors = {};
        this.submitting = true;
        await methods.characterCustomKinkAdd(this.target, this.name, this.description, this.choice);
        this.submitting = false;
        this.hide();
      } catch (e) {
        this.submitting = false;
        if (Utils.isJSONError(e)) this.formErrors = e.response.data;
        else Utils.ajaxError(e, 'Unable to copy custom kink');
      }
    }

    get valid(): boolean {
      return this.name.length > 0 && this.description.length > 0;
    }
  }
</script>

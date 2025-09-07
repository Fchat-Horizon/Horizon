<template>
  <modal
    id="copyCustomDialog"
    :action="l('copyCustom.action')"
    :disabled="!valid || submitting"
    @submit.prevent="copyCustom()"
  >
    <form-group
      field="name"
      :errors="formErrors"
      :label="l('common.name')"
      id="copyCustomName"
    >
      <template v-slot="slotProps">
        <input
          type="text"
          class="form-control"
          maxlength="30"
          required
          v-model="name"
          id="copyCustomName"
          :class="slotProps.cls"
        />
      </template>
    </form-group>
    <form-group
      field="description"
      :errors="formErrors"
      :label="l('common.description')"
      id="copyCustomDescription"
    >
      <template v-slot="slotProps">
        <input
          type="text"
          class="form-control"
          max-length="250"
          v-model="description"
          required
          id="copyCustomDescription"
          :class="slotProps.cls"
        />
      </template>
    </form-group>
    <form-group
      field="choice"
      :errors="formErrors"
      :label="l('common.choice')"
      id="copyCustomChoice"
    >
      <template v-slot="slotProps">
        <select
          v-model="choice"
          class="form-select"
          :class="slotProps.cls"
          id="copyCustomChoice"
        >
          <option value="favorite">{{ l('profile.favorite') }}</option>
          <option value="yes">{{ l('profile.yes') }}</option>
          <option value="maybe">{{ l('profile.maybe') }}</option>
          <option value="no">{{ l('profile.no') }}</option>
        </select>
      </template>
    </form-group>
    <form-group
      field="target"
      :errors="formErrors"
      :label="l('common.targetCharacter')"
      id="copyCustomTarget"
    >
      <template v-slot="slotProps">
        <character-select
          v-model="target"
          :class="slotProps.cls"
          id="copyCustomTarget"
        ></character-select>
      </template>
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
  import l from './../../chat/localize';

  @Component({
    components: { 'form-group': FormGroup, modal: Modal }
  })
  export default class CopyCustomDialog extends CustomDialog {
    l = l;
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
        await methods.characterCustomKinkAdd(
          this.target,
          this.name,
          this.description,
          this.choice
        );
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

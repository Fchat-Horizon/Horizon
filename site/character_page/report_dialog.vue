<template>
  <modal
    id="reportDialog"
    :action="l('reportDialog.actionFor', name)"
    :disabled="!dataValid || submitting"
    @submit.prevent="submitReport()"
  >
    <div class="mb-3">
      <label>{{ l('reportDialog.type') }}</label>
      <select v-model="type" class="form-select">
        <option>{{ l('reportDialog.none') }}</option>
        <option value="profile">
          {{ l('reportDialog.profileViolation') }}
        </option>
        <option value="name_request">
          {{ l('reportDialog.nameRequest') }}
        </option>
        <option value="takedown">{{ l('reportDialog.takedown') }}</option>
        <option value="other">{{ l('reportDialog.other') }}</option>
      </select>
    </div>
    <div v-if="type !== 'takedown'">
      <div class="mb-3" v-if="type === 'profile'">
        <label>{{ l('reportDialog.violationType') }}</label>
        <select v-model="violation" class="form-select">
          <option>Real life images on underage character</option>
          <option>Real life animal images on sexual character</option>
          <option>Amateur/farmed real life images</option>
          <option>Defamation</option>
          <option>OOC Kinks</option>
          <option>Real life contact information</option>
          <option>Solicitation for real life contact</option>
          <option>Other</option>
        </select>
      </div>
      <div class="mb-3">
        <label>{{ l('reportDialog.yourCharacter') }}</label>
        <character-select v-model="ourCharacter"></character-select>
      </div>
      <div class="mb-3">
        <label>{{ l('reportDialog.reasonMessage') }}</label>
        <bbcode-editor
          v-model="message"
          :maxlength="45000"
          :classes="'form-control'"
        ></bbcode-editor>
      </div>
    </div>
    <div v-show="type === 'takedown'" class="alert alert-info">
      {{ l('reportDialog.takedownInfo') }}
      <a :href="ticketUrl">{{ l('reportDialog.ticketsPage') }}</a>
    </div>
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
  export default class ReportDialog extends CustomDialog {
    l = l;
    @Prop({ required: true })
    readonly character!: Character;
    ourCharacter = Utils.settings.defaultCharacter;
    type = '';
    violation = '';
    message = '';
    submitting = false;
    ticketUrl = `${Utils.siteDomain}tickets/new`;

    get name(): string {
      return this.character.character.name;
    }

    get dataValid(): boolean {
      if (this.type === '' || this.type === 'takedown') return false;
      if (this.message === '') return false;
      if (this.type === 'profile' && this.violation === '') return false;
      return true;
    }

    async submitReport(): Promise<void> {
      try {
        this.submitting = true;
        const message =
          (this.type === 'profile'
            ? `Reporting character for violation: ${this.violation}\n\n`
            : '') + this.message;
        await methods.characterReport({
          subject:
            (this.type === 'name_request'
              ? 'Requesting name: '
              : 'Reporting character: ') + this.name,
          message,
          character: this.ourCharacter,
          type: this.type,
          url: Utils.characterURL(this.name),
          reported_character: this.character.character.id
        });
        this.submitting = false;
        this.hide();
        Utils.flashSuccess('Character reported.');
      } catch (e) {
        this.submitting = false;
        Utils.ajaxError(e, 'Unable to report character');
      }
    }
  }
</script>

<template>
  <modal :action="l('chat.report')" @submit.prevent="submit()" :disabled="submitting" dialogClass="modal-lg">
    <div class="alert alert-danger" v-show="error">{{ error }}</div>
    <div ref="caption"></div>
    <br />
    <div class="form-group">
      <h6>{{ l('chat.report.conversation') }}</h6>
      <p>{{ conversation }}</p>
      <h6>{{ l('chat.report.reporting') }}</h6>
      <p>{{ character ? character.name : l('chat.report.general') }}</p>
      <h6>{{ l('chat.report.text') }}</h6>
      <textarea class="form-control" v-model="text"></textarea>
    </div>
  </modal>
</template>

<script lang="ts">
  import { Component, Hook } from '@f-list/vue-ts';
  import { BBCodeElement } from '../bbcode/core';
  import CustomDialog from '../components/custom_dialog';
  import Modal from '../components/Modal.vue';
  import BBCodeParser from './bbcode';
  import { errorToString, messageToString } from './common';
  import core from './core';
  import { Character, Conversation } from './interfaces';
  import l from './localize';

  @Component({
    components: { modal: Modal }
  })
  export default class ReportDialog extends CustomDialog {
    character: Character | undefined;
    text = '';
    l = l;
    error = '';
    submitting = false;

    @Hook('mounted')
    mounted(): void {
      (<Element>this.$refs['caption']).appendChild(new BBCodeParser().parseEverything(l('chat.report.description')));
    }

    @Hook('beforeDestroy')
    beforeDestroy(): void {
      (<BBCodeElement>(<Element>this.$refs['caption']).firstChild).cleanup!();
    }

    get conversation(): string {
      return core.conversations.selectedConversation.name;
    }

    report(character?: Character): void {
      this.error = '';
      this.text = '';
      const current = core.conversations.selectedConversation;
      this.character = character !== undefined ? character : Conversation.isPrivate(current) ? current.character : undefined;
      this.show();
    }

    async submit(): Promise<void> {
      const conversation = core.conversations.selectedConversation;
      /*tslint:disable-next-line:no-unnecessary-callback-wrapper*/ //https://github.com/palantir/tslint/issues/2430
      const log = conversation.reportMessages.map(x => messageToString(x));
      const tab = Conversation.isChannel(conversation)
        ? `${conversation.name} (${conversation.channel.id})`
        : Conversation.isPrivate(conversation)
          ? `Conversation with ${conversation.name}`
          : 'Console';
      const text = (this.character !== undefined ? `Reporting user: [user]${this.character.name}[/user] | ` : '') + this.text;
      const data = {
        character: core.connection.character,
        reportText: this.text,
        log: JSON.stringify(log),
        channel: tab,
        text: true,
        reportUser: <string | undefined>undefined
      };
      if (this.character !== undefined) data.reportUser = this.character.name;
      try {
        this.submitting = true;
        const report = await core.connection.queryApi<{ log_id?: number }>('report-submit.php', data);
        //tslint:disable-next-line:strict-boolean-expressions
        if (!report.log_id) return;
        core.connection.send('SFC', { action: 'report', logid: report.log_id, report: text, tab: conversation.name });
        this.hide();
      } catch (e) {
        this.error = errorToString(e);
      } finally {
        this.submitting = false;
      }
    }
  }
</script>

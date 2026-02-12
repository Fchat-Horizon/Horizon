<template>
  <modal
    :action="l('chat.report')"
    @submit.prevent="submit()"
    :disabled="submitting"
    dialogClass="modal-lg"
    iconClass="fas fa-triangle-exclamation"
  >
    <div class="alert alert-danger" v-show="error">{{ error }}</div>
    <div ref="caption"></div>
    <br />
    <div class="mb-3">
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
  import { BBCodeElement } from '../bbcode/core';
  import CustomDialog from '../components/custom_dialog';
  import Modal from '../components/Modal.vue';
  import BBCodeParser from './bbcode';
  import { errorToString, messageToString } from './common';
  import core from './core';
  import { Character, Conversation } from './interfaces';
  import l from './localize';

  export default CustomDialog.extend({
    components: { modal: Modal },
    data() {
      return {
        character: undefined as Character | undefined,
        text: '',
        l,
        error: '',
        submitting: false
      };
    },
    computed: {
      conversation(): string {
        return core.conversations.selectedConversation.name;
      }
    },
    mounted(): void {
      (<Element>this.$refs['caption']).appendChild(
        new BBCodeParser().parseEverything(l('chat.report.description'))
      );
    },
    beforeDestroy(): void {
      (<BBCodeElement>(<Element>this.$refs['caption']).firstChild).cleanup!();
    },
    methods: {
      report(character?: Character): void {
        this.error = '';
        this.text = '';
        const current = core.conversations.selectedConversation;
        this.character =
          character !== undefined
            ? character
            : Conversation.isPrivate(current)
              ? current.character
              : undefined;
        this.show();
      },
      async submit(): Promise<void> {
        const conversation = core.conversations.selectedConversation;
        /*tslint:disable-next-line:no-unnecessary-callback-wrapper*/ //https://github.com/palantir/tslint/issues/2430
        const log = conversation.reportMessages.map(x => messageToString(x));
        const tab = Conversation.isChannel(conversation)
          ? `${conversation.name} (${conversation.channel.id})`
          : Conversation.isPrivate(conversation)
            ? `Conversation with ${conversation.name}`
            : 'Console';
        const text =
          (this.character !== undefined
            ? `Reporting user: [user]${this.character.name}[/user] | `
            : '') + this.text;
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
          const report = await core.connection.queryApi<{ log_id?: number }>(
            'report-submit.php',
            data
          );
          //tslint:disable-next-line:strict-boolean-expressions
          if (!report.log_id) return;
          core.connection.send('SFC', {
            action: 'report',
            logid: report.log_id,
            report: text,
            tab: conversation.name
          });
          this.hide();
        } catch (e) {
          this.error = errorToString(e);
        } finally {
          this.submitting = false;
        }
      }
    }
  });
</script>

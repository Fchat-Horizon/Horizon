<template>
  <modal
    action="Open Conversation"
    ref="dialog"
    @submit="submit"
    style="width: 98%"
    dialogClass="ads-dialog"
    buttonText="Open"
  >
    <div>
      <input
        type="text"
        id="name"
        v-model="name"
        placeholder="Name"
        ref="name"
      />
      <div class="error" v-if="error">{{ error }}</div>
    </div>
  </modal>
</template>

<script lang="ts">
  import { Component, Hook } from '@f-list/vue-ts';
  import CustomDialog from '../components/custom_dialog';
  import Modal from '../components/Modal.vue';
  import core from './core';

  @Component({
    components: { modal: Modal }
  })
  export default class PmPartnerAdder extends CustomDialog {
    name = '';
    error: string | null = null;

    @Hook('activated')
    async onMounted(): Promise<void> {
      (this.$refs.name as HTMLInputElement).focus();
    }

    submit(): void {
      if (!this.name) return;

      const c = core.characters.get(this.name);

      if (c) {
        const conversation = core.conversations.getPrivate(c);

        conversation.show();

        this.name = '';
        this.error = '';
      } else {
        this.error = `Unknown character '${this.name}'`;
      }
    }
  }
</script>

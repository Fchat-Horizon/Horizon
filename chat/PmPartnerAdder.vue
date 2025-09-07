<template>
  <modal
    :action="l('user.message')"
    ref="dialog"
    @submit="submit"
    dialogClass="ads-dialog"
    :buttonText="l('action.open')"
    iconClass="fas fa-user-plus"
  >
    <div>
      <input
        type="text"
        id="name"
        class="form-control"
        v-model="name"
        :placeholder="l('common.name')"
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
  import l from './localize';

  @Component({
    components: { modal: Modal }
  })
  export default class PmPartnerAdder extends CustomDialog {
    name = '';
    error: string | null = null;
    l = l;

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
        this.error = l('user.unknownCharacter', this.name);
      }
    }
  }
</script>

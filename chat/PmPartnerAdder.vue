<template>
  <modal
    :action="l('user.message')"
    ref="dialog"
    @submit="submit"
    @open="open"
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
        ref="nameRef"
        v-on:keyup.enter="onEnter"
      />
      <div class="error" v-if="error">{{ error }}</div>
    </div>
  </modal>
</template>

<script lang="ts">
  import CustomDialog from '../components/custom_dialog';
  import Modal from '../components/Modal.vue';
  import core from './core';
  import l from './localize';

  export default CustomDialog.extend({
    components: { modal: Modal },
    data() {
      return {
        name: '',
        error: null as string | null,
        l
      };
    },
    methods: {
      open(): void {
        this.$nextTick(() => {
          (this.$refs['nameRef'] as HTMLInputElement).focus();
        });
      },
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
      },
      onEnter(): void {
        this.submit();
        (this.$refs['dialog'] as any).hide();
      }
    }
  });
</script>

<template>
  <Modal
    :action="l('user.memo.action')"
    :buttonText="l('action.saveAndClose')"
    @close="onClose"
    @submit="save"
    dialog-class="w-100 modal-dialog-centered"
    iconClass="fas fa-note-sticky"
  >
    <div class="mb-3">
      <textarea
        v-model="message"
        maxlength="1000"
        class="form-control"
      ></textarea>
    </div>
  </Modal>
</template>

<script lang="ts">
  import CustomDialog from '../../components/custom_dialog';
  import Modal from '../../components/Modal.vue';
  import { SimpleCharacter } from '../../interfaces';
  import * as Utils from '../utils';
  import l from './../../chat/localize';
  // import {methods} from './data_store';
  import { MemoManager } from '../../chat/character/memo';

  export interface Memo {
    id: number;
    memo: string;
    character: SimpleCharacter;
    created_at: number;
    updated_at: number;
  }

  export default CustomDialog.extend({
    components: { Modal },
    props: {
      character: { required: true as const },
      memo: {}
    },
    data() {
      return {
        message: '',
        l: l,
        editing: false,
        saving: false
      };
    },
    computed: {
      name(): string {
        return (this.character as { id: number; name: string }).name;
      }
    },
    watch: {
      memo(): void {
        this.setMemo();
      }
    },
    methods: {
      show(): void {
        CustomDialog.options.methods!.show.call(this);
        this.setMemo();
        this.editing = true;
      },
      setMemo(): void {
        if (this.memo !== undefined) this.message = (this.memo as Memo).memo;
      },
      onClose(): void {
        this.editing = false;
      },
      async save(): Promise<void> {
        if (!this.editing) return;
        try {
          this.saving = true;

          const messageToSave: string | null =
            this.message === '' ? null : this.message;

          const char = this.character as { id: number; name: string };
          const memoManager = new MemoManager(char.name);
          await memoManager.set(messageToSave);

          this.$emit('memo', memoManager.get());
          this.hide();
        } catch (e) {
          Utils.ajaxError(e, 'Unable to set memo.');
        }
        this.saving = false;
      }
    }
  });
</script>

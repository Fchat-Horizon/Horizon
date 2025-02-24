import { Component } from '@f-list/vue-ts';
import Vue from 'vue';
import Modal from './Modal.vue';

@Component({
  components: { Modal }
})
export default class CustomDialog extends Vue {
  protected get dialog(): Modal {
    return <Modal>this.$children[0];
  }

  show(keepOpen?: boolean): void {
    this.dialog.show(keepOpen);
  }

  hide(): void {
    this.dialog.hide();
  }
}

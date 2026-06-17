import Vue from 'vue';
import Modal from './Modal.vue';

export default Vue.extend({
  components: { Modal },
  computed: {
    dialog(): Modal {
      return <Modal>this.$children[0];
    }
  },
  methods: {
    show(keepOpen?: boolean): void {
      this.dialog.show(keepOpen);
    },
    hide(): void {
      this.dialog.hide();
    }
  }
});

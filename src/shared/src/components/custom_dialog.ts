import { defineComponent } from 'vue';
import Modal from './Modal.vue';

export default defineComponent({
  components: { Modal },
  computed: {
    dialog(): Modal {
      // Vue 3 dropped $children; every dialog renders <modal> as its single
      // root, so reach its instance through the rendered subtree.
      return (this.$ as any).subTree?.component?.proxy as Modal;
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

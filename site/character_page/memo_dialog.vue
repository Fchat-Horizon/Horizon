<template>
  <Modal
    ref="dialogRef"
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

<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import Modal from '../../components/Modal.vue';
  import { SimpleCharacter } from '../../interfaces';
  import * as Utils from '../utils';
  import l from './../../chat/localize';
  import { MemoManager } from '../../chat/character/memo';

  export interface Memo {
    id: number;
    memo: string;
    character: SimpleCharacter;
    created_at: number;
    updated_at: number;
  }

  const props = defineProps<{
    character: { id: number; name: string };
    memo?: Memo;
  }>();

  const emit = defineEmits<{
    (e: 'memo', memo: Memo | null): void;
  }>();

  const dialogRef = ref<InstanceType<typeof Modal>>();
  const message = ref('');
  const editing = ref(false);
  const saving = ref(false);

  const name = computed(() => props.character.name);

  const setMemo = () => {
    if (props.memo !== undefined) message.value = props.memo.memo;
  };

  watch(
    () => props.memo,
    () => {
      setMemo();
    }
  );

  const show = (keepOpen?: boolean) => {
    dialogRef.value?.show(keepOpen);
    setMemo();
    editing.value = true;
  };

  const hide = () => {
    dialogRef.value?.hide();
  };

  const onClose = () => {
    editing.value = false;
  };

  const save = async (): Promise<void> => {
    if (!editing.value) return;
    try {
      saving.value = true;

      const messageToSave: string | null =
        message.value === '' ? null : message.value;

      const memoManager = new MemoManager(name.value);
      await memoManager.set(messageToSave);

      emit('memo', memoManager.get());
      hide();
    } catch (e) {
      Utils.ajaxError(e, 'Unable to set memo.');
    }
    saving.value = false;
  };

  defineExpose({
    show,
    hide
  });
</script>

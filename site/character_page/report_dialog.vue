<template>
  <modal
    ref="dialogRef"
    id="reportDialog"
    :action="l('reportDialog.actionFor', name)"
    :disabled="!dataValid || submitting"
    @submit.prevent="submitReport()"
  >
    <div class="mb-3">
      <label>{{ l('reportDialog.type') }}</label>
      <select v-model="type" class="form-select">
        <option>{{ l('reportDialog.none') }}</option>
        <option value="profile">
          {{ l('reportDialog.profileViolation') }}
        </option>
        <option value="name_request">
          {{ l('reportDialog.nameRequest') }}
        </option>
        <option value="takedown">{{ l('reportDialog.takedown') }}</option>
        <option value="other">{{ l('reportDialog.other') }}</option>
      </select>
    </div>
    <div v-if="type !== 'takedown'">
      <div class="mb-3" v-if="type === 'profile'">
        <label
          >{{ l('reportDialog.violationType') }}
          <select v-model="violation" class="form-select">
            <option>Real life images on underage character</option>
            <option>Real life animal images on sexual character</option>
            <option>Amateur/farmed real life images</option>
            <option>Defamation</option>
            <option>OOC Kinks</option>
            <option>Real life contact information</option>
            <option>Solicitation for real life contact</option>
            <option>Other</option>
          </select>
        </label>
      </div>
      <div class="mb-3">
        <label
          >{{ l('reportDialog.yourCharacter') }}
          <character-select v-model="ourCharacter"></character-select>
        </label>
      </div>
      <div class="mb-3">
        <label
          >{{ l('reportDialog.reasonMessage') }}
          <bbcode-editor
            v-model="message"
            :maxlength="45000"
            :classes="'form-control'"
          ></bbcode-editor>
        </label>
      </div>
    </div>
    <div v-show="type === 'takedown'" class="alert alert-info">
      {{ l('reportDialog.takedownInfo') }}
      <a :href="ticketUrl">{{ l('reportDialog.ticketsPage') }}</a>
    </div>
  </modal>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import Modal from '../../components/Modal.vue';
  import * as Utils from '../utils';
  import { methods } from './data_store';
  import { Character } from './interfaces';
  import l from './../../chat/localize';

  const props = defineProps<{
    character: Character;
  }>();

  const dialogRef = ref<InstanceType<typeof Modal>>();
  const ourCharacter = ref(Utils.settings.defaultCharacter);
  const type = ref('');
  const violation = ref('');
  const message = ref('');
  const submitting = ref(false);
  const ticketUrl = `${Utils.siteDomain}tickets/new`;

  const name = computed(() => props.character.character.name);

  const dataValid = computed(() => {
    if (type.value === '' || type.value === 'takedown') return false;
    if (message.value === '') return false;
    if (type.value === 'profile' && violation.value === '') return false;
    return true;
  });

  const show = (keepOpen?: boolean) => {
    dialogRef.value?.show(keepOpen);
  };

  const hide = () => {
    dialogRef.value?.hide();
  };

  const submitReport = async (): Promise<void> => {
    try {
      submitting.value = true;
      const reportMessage =
        (type.value === 'profile'
          ? `Reporting character for violation: ${violation.value}\n\n`
          : '') + message.value;
      await methods.characterReport({
        subject:
          (type.value === 'name_request'
            ? 'Requesting name: '
            : 'Reporting character: ') + name.value,
        message: reportMessage,
        character: ourCharacter.value,
        type: type.value,
        url: Utils.characterURL(name.value),
        reported_character: props.character.character.id
      });
      submitting.value = false;
      hide();
      Utils.flashSuccess('Character reported.');
    } catch (e) {
      submitting.value = false;
      Utils.ajaxError(e, 'Unable to report character');
    }
  };

  defineExpose({
    show,
    hide
  });
</script>

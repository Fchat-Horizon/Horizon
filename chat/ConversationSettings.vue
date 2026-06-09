<template>
  <modal
    :action="l('conversationSettings.action', conversation.name)"
    @submit="submit"
    ref="dialog"
    @open="load()"
    dialogClass="w-100"
    :buttonText="l('conversationSettings.save')"
    iconClass="fas fa-gear"
  >
    <div class="mb-3">
      <div class="d-flex p-2 justify-content-between align-items-start">
        <div class="w-50">
          <label class="control-label" :for="'notify' + conversation.key">{{
            l('conversationSettings.notify')
          }}</label>
          <div class="text-muted">
            {{ l('conversationSettings.notify.description') }}
          </div>
        </div>
        <settings-radio
          :value="notify"
          @input="notify = $event"
          :name="'notify' + conversation.key"
          :id="'notify' + conversation.key"
        ></settings-radio>
      </div>
      <div class="d-flex p-2 justify-content-between align-items-start">
        <div class="w-50">
          <label class="control-label" :for="'highlight' + conversation.key">{{
            l('settings.highlight')
          }}</label>
        </div>
        <settings-radio
          :value="highlight"
          @input="highlight = $event"
          :name="'highlight' + conversation.key"
        ></settings-radio>
      </div>
    </div>
    <div class="mb-3">
      <div class="d-flex p-2 justify-content-between align-items-start">
        <div class="w-50">
          <label
            class="control-label"
            :for="'defaultHighlights' + conversation.key"
          >
            {{ l('settings.defaultHighlights') }}
          </label>
          <!--
          <div class="text-muted">
            {{ l('conversationSettings.defaultHighlights.description') }}
          </div>
          -->
        </div>
        <settings-checkbox
          v-model="defaultHighlights"
          :name="'defaultHighlights' + conversation.key"
        ></settings-checkbox>
      </div>
    </div>
    <div class="mb-3 p-2">
      <label class="control-label" :for="'highlightWords' + conversation.key">{{
        l('settings.highlightWords')
      }}</label>
      <input
        :id="'highlightWords' + conversation.key"
        class="form-control"
        v-model="highlightWords"
      />
    </div>
    <div class="mb-3 p-2">
      <label class="control-label" :for="'highlightUsers' + conversation.key">{{
        l('settings.highlightUsers.conversation')
      }}</label>
      <input
        :id="'highlightUsers' + conversation.key"
        class="form-control"
        v-model="horizonHighlightUsers"
      />
    </div>

    <div class="mb-3">
      <div class="d-flex p-2 justify-content-between align-items-start">
        <div class="w-50">
          <label class="control-label" :for="'muted' + conversation.key">
            {{ l('conversationSettings.muted') }}
          </label>

          <div class="text-muted">
            {{ l('conversationSettings.muted.description') }}
          </div>
        </div>
        <settings-checkbox
          v-model="muted"
          :name="'muted' + conversation.key"
        ></settings-checkbox>
      </div>
      <div class="d-flex p-2 justify-content-between align-items-start">
        <div class="w-50">
          <label
            class="control-label"
            :for="'joinMessages' + conversation.key"
            >{{ l('settings.joinMessages') }}</label
          >
        </div>
        <settings-radio
          :value="joinMessages"
          @input="joinMessages = $event"
          :name="'joinMessages' + conversation.key"
        ></settings-radio>
      </div>
      <div class="d-flex p-2 justify-content-between align-items-start">
        <div class="w-50">
          <label
            class="control-label"
            :for="'logMessages' + conversation.key"
            >{{ l('conversationSettings.logMessages') }}</label
          >
        </div>
        <settings-radio
          :value="logMessages"
          @input="logMessages = $event"
          :name="'logMessages' + conversation.key"
        ></settings-radio>
      </div>
    </div>
  </modal>
</template>

<script lang="ts">
  import CustomDialog from '../components/custom_dialog';
  import SettingsRadio from '../components/SettingsRadio.vue';
  import SettingsCheckbox from '../components/SettingsCheckbox.vue';
  import Modal from '../components/Modal.vue';
  import { Conversation } from './interfaces';
  import l from './localize';

  export default CustomDialog.extend({
    components: {
      modal: Modal,
      'settings-radio': SettingsRadio,
      'settings-checkbox': SettingsCheckbox
    },
    props: {
      conversation: { type: Object as () => Conversation, required: true }
    },
    data() {
      return {
        l: l,
        setting: Conversation.Setting,
        notify: Conversation.Setting.Default,
        highlight: Conversation.Setting.Default,
        highlightWords: '',
        horizonHighlightUsers: '',
        joinMessages: Conversation.Setting.Default,
        defaultHighlights: true,
        logMessages: Conversation.Setting.Default,
        muted: false
      };
    },
    methods: {
      load(): void {
        const settings = this.conversation.settings;
        this.notify = settings.notify;
        this.highlight = settings.highlight;
        this.highlightWords = settings.highlightWords.join(',');
        this.joinMessages = settings.joinMessages;
        this.defaultHighlights = settings.defaultHighlights;
        this.horizonHighlightUsers = settings.horizonHighlightUsers.join(',');
        this.logMessages = settings.logMessages;
        this.muted = settings.muted;
      },
      submit(): void {
        this.conversation.settings = {
          notify: this.notify,
          highlight: this.highlight,
          highlightWords: this.highlightWords
            .split(',')
            .map(x => x.trim())
            .filter(x => x.length > 0),
          horizonHighlightUsers: this.horizonHighlightUsers
            .split(',')
            .map(x => x.trim())
            .filter(x => x.length > 0),

          joinMessages: this.joinMessages,
          defaultHighlights: this.defaultHighlights,
          adSettings: this.conversation.settings.adSettings,
          logMessages: this.logMessages,
          muted: this.muted
        };
      }
    }
  });
</script>

<template>
  <modal
    :action="'Ad Editor'"
    @submit="submit"
    ref="dialog"
    @open="load"
    dialogClass="modal-70"
    :buttonText="'Save'"
    iconClass="fas fa-file-pen"
  >
    <div class="mb-3 ad-list" v-for="(ad, index) in ads">
      <label :for="'adm-content-' + index" class="control-label"
        >Ad #{{ index + 1 }}
        <a v-if="index > 0" @click="moveAdUp(index)" title="Move Up"
          ><i class="fa fa-arrow-up"></i
        ></a>
        <a
          v-if="index < ads.length - 1"
          @click="moveAdDown(index)"
          title="Move Down"
          ><i class="fa fa-arrow-down"></i
        ></a>
        <a @click="removeAd(index)" title="Remove Ad"
          ><i class="fas fa-times-circle"></i
        ></a>
      </label>

      <editor
        :id="'adm-content-' + index"
        v-model="ad.content"
        :hasToolbar="true"
        :classes="'form-control'"
        :maxlength="core.connection.vars.lfrp_max"
        :disabled="ad.disabled"
      >
      </editor>

      <tagEditor
        :id="'adm-tags-' + index"
        v-model="ad.tags"
        placeholder="Enter one or more tags, e.g. 'romantic'"
        :add-tag-on-keys="[13, 188, 9, 32]"
        class="form-control form-tag"
        :disabled="ad.disabled"
        :add-tag-on-blur="true"
      ></tagEditor>

      <label class="control-label disable" :for="'adm-disabled-' + index">
        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            :id="'adm-disabled-' + index"
            v-model="ad.disabled"
          />
          <label class="form-check-label" :for="'adm-disabled-' + index">
            Disable
          </label>
        </div>
      </label>
    </div>

    <button class="btn btn-outline-secondary" @click="addAd()">
      Add Another
    </button>
  </modal>
</template>

<script lang="ts">
  import { Component } from '@f-list/vue-ts';
  import CustomDialog from '../../components/custom_dialog';
  import Modal from '../../components/Modal.vue';
  import AdLauncherDialog from './AdLauncher.vue';
  import { Conversation } from '../interfaces';
  import l from '../localize';
  import { Editor } from '../bbcode';
  import core from '../core';
  import { Dialog } from '../../helpers/dialog';
  import InputTag from 'vue-input-tag';
  import { Ad } from './ad-center';
  import _ from 'lodash';

  @Component({
    components: { modal: Modal, editor: Editor, tagEditor: InputTag }
  })
  export default class AdCenterDialog extends CustomDialog {
    l = l;
    setting = Conversation.Setting;
    ads!: Ad[];
    core = core;

    load(): void {
      this.ads = _.cloneDeep(core.adCenter.get());

      if (this.ads.length === 0) {
        this.addAd();
      }
    }

    async submit(): Promise<void> {
      await core.adCenter.set(this.ads);
      (<AdLauncherDialog>this.$parent.$refs['adLauncher'])!.show();
    }

    addAd(): void {
      this.ads.push({
        content: '',
        disabled: false,
        tags: []
      });
    }

    removeAd(index: number): void {
      // if (confirm('Are you sure you wish to remove this ad?')) {
      if (Dialog.confirmDialog('Are you sure you wish to remove this ad?')) {
        this.ads.splice(index, 1);
      }
    }

    moveAdUp(index: number): void {
      const ad = this.ads.splice(index, 1);

      this.ads.splice(index - 1, 0, ad[0]);
    }

    moveAdDown(index: number): void {
      const ad = this.ads.splice(index, 1);

      this.ads.splice(index + 1, 0, ad[0]);
    }
  }
</script>

<style lang="scss">
  .ad-list .bbcode-toolbar .color-selector {
    left: 58px !important;
    top: 30px !important;
    border: none;
  }

  .ad-list .bbcode-toolbar .eicon-selector {
    top: 30px !important;
  }

  .ad-list .form-control.form-tag {
    .input-tag {
      padding: 4px 3px;
      span,
      a.remove {
        line-height: 100%;
        vertical-align: middle;
      }
    }
    padding-bottom: 0px;
    display: flex;
  }

  .form-group.ad-list {
    label {
      font-size: 140%;

      a {
        padding-right: 0.3rem;
        opacity: 0.3;
        font-size: 70%;

        &:hover {
          opacity: 0.6;
        }
      }
    }

    .bbcode-preview {
      margin-top: 0;
      border: 1px solid;
      padding: 5px;
      border-radius: 0 5px 5px 5px;
      background: var(--input-bg);
      border-color: var(--bs-secondary);
    }

    .bbcode-editor {
      border: none;
      background: none;
      height: auto;

      textarea {
        width: 100%;
        color: var(--input-color);
        background-color: var(--input-bg);
        border-radius: 0 5px 5px 5px;
      }
    }

    .vue-input-tag-wrapper[disabled='disabled'],
    textarea[disabled='disabled'],
    div.bbcode-toolbar[disabled='disabled'] {
      opacity: 0.5;
      pointer-events: none;
    }

    .vue-input-tag-wrapper {
      width: auto;
      height: auto;
      padding-bottom: 0;

      input {
        width: 260px;
        color: var(--gray-dark);
      }
    }

    label.disable {
      color: var(--gray-dark);
      margin: 0.375rem 0.75rem;
      font-size: 100%;
    }
  }
</style>

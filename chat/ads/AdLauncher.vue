<template>
  <modal
    :action="l('ads.post')"
    @submit="submit"
    ref="dialog"
    @reopen="load"
    @open="load"
    dialogClass="w-100"
    class="adLauncher"
    :buttonText="l('admgr.setup')"
    iconClass="fas fa-rectangle-ad"
  >
    <div v-if="hasAds()" style="position: relative">
      <button
        class="btn btn-primary position-absolute top-0 end-0"
        @click="openAdEditor()"
      >
        <i class="fa-solid fa-pencil"></i> {{ l('admgr.setup') }}
      </button>
      <h5>{{ l('admgr.tags') }}</h5>

      <div style="padding-bottom: 1em">
        <div class="mb-3">
          <p>{{ l('admgr.tags.help') }}</p>

          <div class="form-check" v-for="(tag, index) in tags">
            <input
              class="form-check-input"
              type="checkbox"
              v-model="tag.value"
              :id="`adr-tag-${index}`"
            />
            <label class="form-check-label" :for="`adr-tag-${index}`">
              {{ tag.title }}
            </label>
          </div>
        </div>
      </div>

      <h5>{{ l('admgr.channels') }}</h5>
      <div class="mb-3">
        <p>{{ l('admgr.channels.help') }}</p>

        <p v-if="channels.length === 0">
          {{ l('admgr.channels.none') }}
        </p>

        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            id="ard-all-channels"
            @change="selectAllChannels($event)"
          />
          <label class="form-check-label" for="ard-all-channels">
            <i>{{ l('admgr.channels.selectAll') }}</i>
          </label>
        </div>

        <div class="form-check" v-for="(channel, index) in channels">
          <input
            class="form-check-input"
            type="checkbox"
            v-model="channel.value"
            :id="`adr-channel-${index}`"
          />
          <label class="form-check-label" :for="`adr-channel-${index}`">
            {{ channel.title }}
          </label>
        </div>
      </div>

      <h5>{{ l('admgr.order') }}</h5>
      <div class="mb-3">
        <div class="form-check">
          <input
            class="form-check-input"
            type="radio"
            v-model="adOrder"
            value="random"
            id="adOrderRandom"
          />
          <label class="form-check-label" for="adOrderRandom">
            {{ l('admgr.order.random') }}
          </label>
        </div>
        <div class="form-check">
          <input
            class="form-check-input"
            type="radio"
            v-model="adOrder"
            value="ad-center"
            id="adOrderAdCenter"
          />
          <label class="form-check-label" for="adOrderAdCenter">
            {{ l('admgr.order.adCenter') }}
          </label>
        </div>
      </div>

      <h5>{{ l('admgr.campaign') }}</h5>
      <div class="mb-3">
        <label class="control-label" for="timeoutMinutes">
          {{ l('admgr.timeout') }}
        </label>

        <select
          class="form-select"
          v-model="timeoutMinutes"
          id="timeoutMinutes"
        >
          <option v-for="timeout in timeoutOptions" :value="timeout.value">
            {{ timeout.title }}
          </option>
        </select>

        <label class="control-label" for="timeoutMinutes"> Delay </label>

        <select class="form-select" v-model="delayMinutes" id="delayMinutes">
          <option v-for="delay in delayOptions" :value="delay.value">
            {{ delay.title }}
          </option>
        </select>
      </div>

      <p class="matches">
        <b>{{ matchCount }}</b> {{ l('admgr.matches') }}
      </p>
    </div>
    <div v-else>
      <h5>{{ l('admgr.noAdsToPost') }}</h5>

      <p>
        {{ l('admgr.useEditorPrefix') }}
        <button class="btn btn-outline-secondary" @click="openAdEditor()">
          <i class="fa-solid fa-pencil"></i> {{ l('admgr.editor') }}
        </button>
        {{ l('admgr.useEditorSuffix') }}
      </p>
    </div>
  </modal>
</template>

<script lang="ts">
  import { Component, Watch } from '@f-list/vue-ts';
  import CustomDialog from '../../components/custom_dialog';
  import Modal from '../../components/Modal.vue';
  import core from '../core';
  import _ from 'lodash';
  import AdCenterDialog from './AdCenter.vue';
  import l from '../localize';

  @Component({
    components: { modal: Modal }
  })
  export default class AdLauncherDialog extends CustomDialog {
    l = l;
    adOrder: 'random' | 'ad-center' = 'random';

    matchCount = 0;

    timeoutMinutes = 180;

    delayMinutes = 10;

    tags: { value: boolean; title: string }[] = [];

    channels: { value: boolean; title: string; id: string }[] = [];

    timeoutOptions = [
      { value: 30, title: '30 minutes' },
      { value: 60, title: '1 hour' },
      { value: 120, title: '2 hours' },
      { value: 180, title: '3 hours' }
    ];

    delayOptions = [
      { value: 10, title: '10 minutes' },
      { value: 15, title: '15 minutes' },
      { value: 20, title: '20 minutes' },
      { value: 30, title: '30 minutes' },
      { value: 45, title: '45 minutes' },
      { value: 60, title: '1 hour' }
    ];

    load() {
      this.channels = _.map(
        _.filter(
          core.channels.joinedChannels,
          c => c.mode === 'ads' || c.mode === 'both'
        ),
        c => ({ value: false, title: c.name, id: c.id })
      );

      this.tags = _.map(core.adCenter.getActiveTags(), t => ({
        value: false,
        title: t
      }));

      this.checkCanSubmit();
    }

    hasAds(): boolean {
      return core.adCenter.getActiveAds().length > 0;
    }

    @Watch('tags', { deep: true })
    updateTags(): void {
      this.matchCount = core.adCenter.getMatchingAds(
        this.getWantedTags()
      ).length;
      this.checkCanSubmit();
    }

    @Watch('channels', { deep: true })
    updateChannels(): void {
      this.checkCanSubmit();
    }

    checkCanSubmit() {
      const channelCount = _.filter(
        this.channels,
        channel => channel.value
      ).length;
      const tagCount = _.filter(this.tags, tag => tag.value).length;

      this.dialog.forceDisabled(tagCount === 0 || channelCount === 0);
    }

    getWantedTags(): string[] {
      return _.map(
        _.filter(this.tags, t => t.value),
        t => t.title
      );
    }

    getWantedChannels(): string[] {
      return _.map(
        _.filter(this.channels, t => t.value),
        t => t.id
      );
    }

    openAdEditor(): void {
      this.hide();
      const ref =
        this.$parent && this.$parent.$refs
          ? (this.$parent.$refs['adCenter'] as AdCenterDialog | undefined)
          : undefined;
      if (ref) ref.show();
    }

    selectAllChannels(e: any): void {
      const newValue = e.target.checked;

      e.preventDefault();
      e.stopPropagation();

      _.each(this.channels, c => {
        c.value = newValue;
      });
    }

    submit(e: Event) {
      const tags = this.getWantedTags();
      const channelIds = this.getWantedChannels();

      if (tags.length === 0) {
        e.preventDefault();
        alert(l('ads.selectTagRequired'));
        return;
      }

      if (channelIds.length === 0) {
        e.preventDefault();
        alert(l('ads.selectChannelRequired'));
        return;
      }

      if (
        !_.every(channelIds, channelId => {
          if (core.adCenter.isSafeToOverride(channelId)) {
            return true;
          }

          const chan = core.channels.getChannel(channelId);

          if (!chan) {
            return true;
          }

          return confirm(l('admgr.overwriteWarning', chan.name));
        })
      ) {
        e.preventDefault();
        return;
      }

      core.adCenter.schedule(
        tags,
        channelIds,
        this.adOrder,
        this.timeoutMinutes,
        this.delayMinutes * 60
      );

      this.hide();
    }
  }
</script>

<style lang="scss">
  .adLauncher {
    label.control-label {
      display: block;
      margin-left: 0.75rem;
      color: var(--gray-dark);
    }

    select {
      margin-left: 0.75rem;
      width: auto;
      padding-right: 1.5rem;
    }

    .matches {
      margin: 0;
      margin-top: 2rem;
      color: var(--gray);
    }
  }
</style>

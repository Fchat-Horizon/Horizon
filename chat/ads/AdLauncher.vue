<template>
  <modal
    action="Post Ads"
    @submit="submit"
    ref="dialog"
    @reopen="load"
    @open="load"
    dialogClass="w-100"
    class="adLauncher"
    :buttonText="'Start Posting Ads'"
  >
    <div v-if="hasAds()">
      <h4>Ad Tags</h4>
      <div class="form-group">
        <p>Serve ads that match any one of these tags:</p>

        <label class="control-label" :for="`adr-tag-${index}`" v-for="(tag, index) in tags">
          <input type="checkbox" v-model="tag.value" :id="`adr-tag-${index}`" />
          {{ tag.title }}
        </label>
      </div>

      <h4>Target Channels</h4>
      <div class="form-group">
        <p>Serve ads on these channels:</p>

        <p v-if="channels.length === 0">You have no channels open that support ad posting. Open some channels first.</p>

        <label class="control-label">
          <input type="checkbox" id="ard-all-channels" @change="selectAllChannels($event)" />
          <i>Select/unselect all</i>
        </label>

        <label class="control-label" :for="`adr-channel-${index}`" v-for="(channel, index) in channels">
          <input type="checkbox" v-model="channel.value" :id="`adr-channel-${index}`" />
          {{ channel.title }}
        </label>
      </div>

      <h4>Post Order</h4>
      <div class="form-group">
        <label class="control-label" for="adOrderRandom">
          <input type="radio" v-model="adOrder" value="random" id="adOrderRandom" />
          Random order
        </label>
        <label class="control-label" for="adOrderAdCenter">
          <input type="radio" v-model="adOrder" value="ad-center" id="adOrderAdCenter" />
          Follow order in Ad Center
        </label>
      </div>

      <h4>Campaign</h4>
      <div class="form-group">
        <label class="control-label" for="timeoutMinutes"> Timeout </label>

        <select class="form-control" v-model="timeoutMinutes" id="timeoutMinutes">
          <option v-for="timeout in timeoutOptions" :value="timeout.value">{{ timeout.title }}</option>
        </select>
      </div>

      <p class="matches">
        <b>{{ matchCount }}</b> ads will be used.
      </p>
    </div>
    <div v-else>
      <h4>No Ads to Post!</h4>

      <p>
        Use the <button class="btn btn-outline-secondary" @click="openAdEditor()">Ad Editor</button> to create some ads first, then return
        here to post them.
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

  @Component({
    components: { modal: Modal }
  })
  export default class AdLauncherDialog extends CustomDialog {
    adOrder: 'random' | 'ad-center' = 'random';

    matchCount = 0;

    timeoutMinutes = 180;

    tags: { value: boolean; title: string }[] = [];

    channels: { value: boolean; title: string; id: string }[] = [];

    timeoutOptions = [
      { value: 30, title: '30 minutes' },
      { value: 60, title: '1 hour' },
      { value: 120, title: '2 hours' },
      { value: 180, title: '3 hours' }
    ];

    load() {
      this.channels = _.map(
        _.filter(core.channels.joinedChannels, c => c.mode === 'ads' || c.mode === 'both'),
        c => ({ value: false, title: c.name, id: c.id })
      );

      this.tags = _.map(core.adCenter.getActiveTags(), t => ({ value: false, title: t }));

      this.checkCanSubmit();
    }

    hasAds(): boolean {
      return core.adCenter.getActiveAds().length > 0;
    }

    @Watch('tags', { deep: true })
    updateTags(): void {
      this.matchCount = core.adCenter.getMatchingAds(this.getWantedTags()).length;
      this.checkCanSubmit();
    }

    @Watch('channels', { deep: true })
    updateChannels(): void {
      this.checkCanSubmit();
    }

    checkCanSubmit() {
      const channelCount = _.filter(this.channels, channel => channel.value).length;
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
      (<AdCenterDialog>this.$parent.$refs['adCenter'])!.show();
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
        alert('Select at least one tag to post');
        return;
      }

      if (channelIds.length === 0) {
        e.preventDefault();
        alert('Select at least one channel to post in');
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

          return confirm(
            `Warning: This action will overwrite ads on channel ${chan.name}. Ads that are not stored in the Ad Center will be lost. Are you sure you wish to continue?`
          );
        })
      ) {
        e.preventDefault();
        return;
      }

      core.adCenter.schedule(tags, channelIds, this.adOrder, this.timeoutMinutes);

      this.hide();
    }
  }
</script>

<style lang="scss">
  .adLauncher {
    label {
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

<template>
  <modal
    :buttons="false"
    :action="l('chat.channels')"
    @open="opened"
    @close="closed"
    dialog-class="w-100 channel-list"
    iconClass="fas fa-hashtag"
  >
    <div style="display: flex; flex-direction: column">
      <tabs
        style="flex-shrink: 0"
        :tabs="[l('channelList.public'), l('channelList.private')]"
        :fullWidth="true"
        v-model="tab"
      ></tabs>
      <div style="display: flex; flex-direction: column">
        <div class="input-group" style="padding: 10px 0; flex-shrink: 0">
          <span class="input-group-text">
            <span class="fas fa-search"></span>
          </span>
          <input
            class="form-control"
            style="flex: 1"
            v-model="filter"
            :placeholder="l('filter')"
          />
          <a
            href="#"
            @click.prevent="sortCount = !sortCount"
            class="btn btn-outline-secondary"
            style="align-self: center"
          >
            <span
              class="fa fa-2x"
              :class="{
                'fa-sort-amount-down': sortCount,
                'fa-sort-alpha-down': !sortCount
              }"
            ></span>
          </a>
        </div>
        <div
          class="hidden-scrollbar"
          style="overflow: auto"
          v-show="tab === '0'"
        >
          <div v-for="channel in officialChannels" :key="channel.id">
            <div class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                :checked="channel.isJoined"
                :id="channel.id"
                @click.prevent="setJoined(channel)"
              />
              <label class="form-check-label" :for="channel.id">
                {{ channel.name }} ({{ channel.memberCount }})
              </label>
            </div>
          </div>
        </div>
        <div
          class="hidden-scrollbar"
          style="overflow: auto"
          v-show="tab === '1'"
        >
          <div v-for="channel in openRooms" :key="channel.id">
            <div class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                :checked="channel.isJoined"
                :id="channel.id"
                @click.prevent="setJoined(channel)"
              />
              <label class="form-check-label" :for="channel.id">
                {{ channel.name }} ({{ channel.memberCount }})
              </label>
            </div>
          </div>
        </div>
        <div class="input-group" style="padding: 10px 0; flex-shrink: 0">
          <span class="input-group-text">
            <span class="fas fa-plus"></span>
          </span>
          <input
            class="form-control"
            style="flex: 1"
            v-model="createName"
            :placeholder="l('channelList.createName')"
          />
          <button class="btn btn-primary" @click="create">
            {{ l('channelList.create') }}
          </button>
        </div>
      </div>
    </div>
  </modal>
</template>

<script lang="ts">
  import { Component } from '@f-list/vue-ts';
  import CustomDialog from '../components/custom_dialog';
  import Modal from '../components/Modal.vue';
  import Tabs from '../components/tabs';
  import { Channel } from '../fchat';
  import core from './core';
  import l from './localize';

  @Component({
    components: { modal: Modal, tabs: Tabs }
  })
  export default class ChannelList extends CustomDialog {
    privateTabShown = false;
    l = l;
    sortCount = true;
    filter = '';
    createName = '';
    tab = '0';

    get openRooms(): ReadonlyArray<Channel.ListItem> {
      return this.applyFilter(core.channels.openRooms);
    }

    get officialChannels(): ReadonlyArray<Channel.ListItem> {
      return this.applyFilter(core.channels.officialChannels);
    }

    applyFilter(list: {
      [key: string]: Channel.ListItem | undefined;
    }): ReadonlyArray<Channel.ListItem> {
      const channels: Channel.ListItem[] = [];
      if (this.filter.length > 0) {
        const search = new RegExp(this.filter.replace(/[^\w]/gi, '\\$&'), 'i');
        for (const key in list) {
          const item = list[key]!;
          if (search.test(item.name)) channels.push(item);
        }
      } else for (const key in list) channels.push(list[key]!);
      channels.sort(
        this.sortCount
          ? (x, y) => y.memberCount - x.memberCount
          : (x, y) => x.name.localeCompare(y.name)
      );
      return channels;
    }

    create(): void {
      core.connection.send('CCR', { channel: this.createName });
      this.hide();
    }

    opened(): void {
      core.channels.requestChannelsIfNeeded(30000);
    }

    closed(): void {
      this.createName = '';
    }

    setJoined(channel: Channel.ListItem): void {
      channel.isJoined
        ? core.channels.leave(channel.id)
        : core.channels.join(channel.id);
    }
  }
</script>

<style>
  .channel-list .modal-body {
    display: flex;
    flex-direction: column;
  }
</style>

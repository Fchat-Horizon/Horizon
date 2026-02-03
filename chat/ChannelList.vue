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
        @input="focusChannelFilter()"
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
            ref="channelFilter"
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
        <virtual-list
          class="hidden-scrollbar channel-scroll"
          style="overflow: auto; flex: 1 1 auto"
          v-if="tab === '0'"
          :items="officialChannels"
          :itemHeight="rowHeight"
          :overscan="overscan"
          keyField="id"
          rowClass="channel-row"
          :resetKey="filterApplied"
        >
          <template slot-scope="{ item: channel }">
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
          </template>
        </virtual-list>
        <virtual-list
          class="hidden-scrollbar channel-scroll"
          style="overflow: auto; flex: 1 1 auto"
          v-else
          :items="openRooms"
          :itemHeight="rowHeight"
          :overscan="overscan"
          keyField="id"
          rowClass="channel-row"
          :resetKey="filterApplied"
        >
          <template slot-scope="{ item: channel }">
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
          </template>
        </virtual-list>
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
  import { Component, Hook, Watch } from '@f-list/vue-ts';
  import CustomDialog from '../components/custom_dialog';
  import Modal from '../components/Modal.vue';
  import Tabs from '../components/tabs';
  import VirtualList from '../components/VirtualList.vue';
  import { Channel } from '../fchat';
  import core from './core';
  import l from './localize';

  @Component({
    components: { modal: Modal, tabs: Tabs, 'virtual-list': VirtualList }
  })
  export default class ChannelList extends CustomDialog {
    privateTabShown = false;
    l = l;
    sortCount = true;
    filter = '';
    createName = '';
    tab = '0';
    filterApplied = 0;
    rowHeight = 28;
    overscan = 8;
    filteredOpenRooms: ReadonlyArray<Channel.ListItem> = [];
    filteredOfficialChannels: ReadonlyArray<Channel.ListItem> = [];
    private sortedOpenRooms: ReadonlyArray<Channel.ListItem> = [];
    private sortedOfficialChannels: ReadonlyArray<Channel.ListItem> = [];
    private filterTimer: number | undefined;
    private sortRaf: number | undefined;

    get openRooms(): ReadonlyArray<Channel.ListItem> {
      return this.filteredOpenRooms;
    }

    get officialChannels(): ReadonlyArray<Channel.ListItem> {
      return this.filteredOfficialChannels;
    }

    get officialChannelsSource(): {
      [key: string]: Channel.ListItem | undefined;
    } {
      return core.channels.officialChannels;
    }

    get openRoomsSource(): {
      [key: string]: Channel.ListItem | undefined;
    } {
      return core.channels.openRooms;
    }

    applyFilter(
      list: ReadonlyArray<Channel.ListItem>,
      filter: string
    ): ReadonlyArray<Channel.ListItem> {
      const search = filter.trim().toLowerCase();
      if (search.length === 0) return list;
      const channels: Channel.ListItem[] = [];
      for (const item of list) {
        if (item.lowerName.includes(search)) channels.push(item);
      }
      return channels;
    }

    buildSortedList(list: {
      [key: string]: Channel.ListItem | undefined;
    }): ReadonlyArray<Channel.ListItem> {
      const channels: Channel.ListItem[] = [];
      for (const key in list) channels.push(list[key]!);
      channels.sort(
        this.sortCount
          ? (x, y) => y.memberCount - x.memberCount
          : (x, y) => x.lowerName.localeCompare(y.lowerName)
      );
      return channels;
    }

    rebuildSortedLists(): void {
      this.sortedOfficialChannels = this.buildSortedList(
        core.channels.officialChannels
      );
      this.sortedOpenRooms = this.buildSortedList(core.channels.openRooms);
      this.rebuildFilteredLists();
    }

    rebuildFilteredLists(): void {
      this.filteredOfficialChannels = this.applyFilter(
        this.sortedOfficialChannels,
        this.filter
      );
      this.filteredOpenRooms = this.applyFilter(
        this.sortedOpenRooms,
        this.filter
      );
    }

    scheduleSortedRebuild(): void {
      if (this.sortRaf !== undefined) return;
      this.sortRaf = window.requestAnimationFrame(() => {
        this.sortRaf = undefined;
        this.rebuildSortedLists();
      });
    }

    scheduleFilterUpdate(): void {
      if (this.filterTimer !== undefined) {
        window.clearTimeout(this.filterTimer);
      }
      this.filterTimer = window.setTimeout(() => {
        this.rebuildFilteredLists();
        this.filterApplied += 1;
      }, 150);
    }

    create(): void {
      core.connection.send('CCR', { channel: this.createName });
      this.hide();
    }

    opened(): void {
      core.channels.requestChannelsIfNeeded(30000);
      this.rebuildSortedLists();
      this.$nextTick(() => {
        this.focusChannelFilter();
      });
    }

    focusChannelFilter(): void {
      (this.$refs['channelFilter'] as HTMLInputElement).focus();
    }

    closed(): void {
      this.createName = '';
    }

    @Hook('beforeDestroy')
    beforeDestroy(): void {
      if (this.filterTimer !== undefined) {
        window.clearTimeout(this.filterTimer);
      }
      if (this.sortRaf !== undefined) {
        window.cancelAnimationFrame(this.sortRaf);
      }
    }

    @Watch('filter')
    onFilterChange(): void {
      this.scheduleFilterUpdate();
    }

    @Watch('sortCount')
    onSortChange(): void {
      this.scheduleSortedRebuild();
    }

    @Watch('officialChannelsSource', { deep: true })
    onOfficialChannelsChange(): void {
      this.scheduleSortedRebuild();
    }

    @Watch('openRoomsSource', { deep: true })
    onOpenRoomsChange(): void {
      this.scheduleSortedRebuild();
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

  .channel-list .channel-scroll {
    position: relative;
    padding-top: 10px;
  }

  .channel-list .channel-row {
    display: flex;
    align-items: center;
  }

  .channel-list .channel-row .form-check-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>

<template>
  <div class="userInfo-buttons-container">
    <template v-for="(report, index) in reports">
      <a
        class="userInfo-button-item userInfo-pager-button"
        :href="report.url"
        :key="`report-${index}`"
        @click="dismissReport(report)"
        :title="
          report.count + ' ' + report.count !== 1
            ? report.title
            : report.title.substr(0, report.title.length - 1)
        "
        :class="`status-report ${report.type} ${report.count > 0 && report.count !== report.dismissedCount ? 'active' : ''}`"
      >
        <i :class="getIconClass(report)"></i>
        <span class="badge text-bg-primary rounded-pill">{{
          report.count
        }}</span
        ><a
          :class="`status-report ${report.type} ${report.count > 0 && report.count !== report.dismissedCount ? 'active' : ''}`"
          class="dismiss"
          role="button"
          :title="l('action.dismiss')"
          ><i
            @click.prevent="dismissReport(report)"
            class="fas fa-times-circle"
          ></i
        ></a>
      </a>

      <!--This was part of the original design, where the NoteStatus component floated on the bottom left
          But in this new design, where it's part of the lefthand sidebar it's just too visually busy to have dismissal buttons too."
-->
    </template>
  </div>
</template>
<script lang="ts">
  import _ from 'lodash';
  import { Component, Hook } from '@f-list/vue-ts';
  import Vue from 'vue';
  import core from '../chat/core';
  import { EventBus } from '../chat/preview/event-bus';
  import l from '../chat/localize';

  interface ReportState {
    type: string;
    title: string;
    count: number;
    dismissedCount: number;
    url: string;
  }

  @Component
  export default class NoteStatus extends Vue {
    reports: ReportState[] = [
      {
        type: 'message',
        title: l('pager.messages'),
        count: 0,
        dismissedCount: 0,
        url: 'https://www.f-list.net/messages.php'
      },
      {
        type: 'note',
        title: l('pager.notes'),
        count: 0,
        dismissedCount: 0,
        url: 'https://www.f-list.net/read_notes.php'
      }
    ];
    l = l;

    callback?: () => void;

    @Hook('mounted')
    mounted(): void {
      this.updateCounts();

      this.callback = () => this.updateCounts();

      EventBus.$on('note-counts-update', this.callback);
    }

    @Hook('beforeDestroy')
    destroying(): void {
      if (this.callback) {
        EventBus.$off('note-counts-update', this.callback);
      }
    }

    dismissReport(report: ReportState): void {
      report.dismissedCount = report.count;
    }

    hasReports(): boolean {
      return !!_.find(
        this.reports,
        r => r.count > 0 && r.dismissedCount !== r.count
      );
    }

    updateCounts(): void {
      const v = core.siteSession.interfaces.notes.getCounts();

      const mapper = {
        message: 'unreadMessages',
        note: 'unreadNotes'
      };

      _.each(mapper, (field, type) => {
        const report = _.find(this.reports, r => r.type === type);

        if (!report) {
          throw new Error(`Did not find report ${type}`);
        }

        const count = (v as any)[field] as number;

        if (count !== report.dismissedCount) {
          report.dismissedCount = 0;
        }

        report.count = count;
      });
    }

    getIconClass(report: ReportState) {
      switch (report.type) {
        case 'note':
          return 'fas fa-envelope fa-fw';
        case 'message':
          return 'fas fa-bell fa-fw';
        default:
          return 'fa-solid fa-circle-exclamation';
      }
    }
  }
</script>
<style lang="scss">
  #note-status {
    position: absolute;
    right: 3em;
    bottom: 0;
    z-index: 1000;
    opacity: 0;
    transition: all 0.25s;

    border: 1px solid var(--input-color);
    background-color: var(--input-bg);
    padding: 0;
    border-radius: 3px;

    &.active {
      opacity: 1;
      right: 0;
    }
  }
  .userInfo-buttons-container {
    .userInfo-button-item.userInfo-pager-button {
      display: inline-block;
      .badge {
        display: none;
        margin-left: 4px;
        vertical-align: text-top;
      }
      &:hover .dismiss {
        opacity: 0.6;
      }
      & .dismiss {
        display: none;
        position: absolute;
        opacity: 0;
        //color: var(--bs-danger);
        z-index: 12;
        top: 0px;
        right: 0px;

        &:hover {
          opacity: 1;
        }
        &.active {
          display: block;
        }
      }

      &.active .badge {
        display: initial;
      }
    }
  }
</style>

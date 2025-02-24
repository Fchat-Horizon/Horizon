<template>
  <div id="note-status" :class="{ active: hasReports() }">
    <div
      v-for="(report, index) in reports"
      :key="`report-${index}`"
      :class="`status-report ${report.type} ${report.count > 0 && report.count !== report.dismissedCount ? 'active' : ''}`"
    >
      <a :href="report.url" @click="dismissReport(report)">
        <span class="count">{{ report.count }}</span>
        {{ `${report.count !== 1 ? report.title : report.title.substr(0, report.title.length - 1)}` }}
      </a>
      <a @click="dismissReport(report)" class="dismiss"><i class="fas fa-times-circle"></i></a>
    </div>
  </div>
</template>
<script lang="ts">
  import _ from 'lodash';
  import { Component, Hook } from '@f-list/vue-ts';
  import Vue from 'vue';
  import core from '../chat/core';
  import { EventBus } from '../chat/preview/event-bus';

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
        title: 'Messages',
        count: 0,
        dismissedCount: 0,
        url: 'https://www.f-list.net/messages.php'
      },
      {
        type: 'note',
        title: 'Notes',
        count: 0,
        dismissedCount: 0,
        url: 'https://www.f-list.net/read_notes.php'
      }
    ];

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
      return !!_.find(this.reports, r => r.count > 0 && r.dismissedCount !== r.count);
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

    .status-report {
      display: none;
      text-align: center;
      text-transform: uppercase;
      font-size: 10pt;
      padding: 0;

      &.active {
        display: block;
      }

      a {
        padding: 5px;
        padding-bottom: 3px;
        display: block;
      }

      a:hover {
        text-decoration: none;
        background-color: var(--secondary);
      }

      .count {
        font-size: 30pt;
        display: block;
        line-height: 80%;
        padding: 0;
        margin: 0;
      }

      .dismiss {
        position: absolute;
        top: -0.4rem;
        right: -0.4rem;
        background-color: var(--input-bg);
        border-radius: 8px;
        margin: 0;
        padding: 0;
        line-height: 0;
      }
    }
  }
</style>

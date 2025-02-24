<template>
  <div
    id="match-report"
    :class="{ 'match-report': true, minimized: isMinimized }"
    v-if="haveScores(characterMatch.you) || haveScores(characterMatch.them)"
  >
    <a class="minimize-btn" @click.prevent="toggleMinimize()"
      ><i :class="{ fa: true, 'fa-plus': isMinimized, 'fa-minus': !isMinimized }"></i
    ></a>

    <div class="scores you">
      <h3>
        <img :src="getAvatarUrl(characterMatch.you.you.name)" class="thumbnail" />
        {{ characterMatch.you.you.name }}
        <small v-if="characterMatch.youMultiSpecies" class="species">as {{ getSpeciesStr(characterMatch.you) }}</small>
      </h3>

      <ul>
        <li
          v-for="score in getScores(characterMatch.you)"
          v-if="shouldShowScore(score)"
          :class="getScoreClass(score)"
          v-html="score.description"
        ></li>
      </ul>
    </div>

    <div class="vs">vs.</div>

    <div class="scores them">
      <h3>
        <img :src="getAvatarUrl(characterMatch.them.you.name)" class="thumbnail" />
        {{ characterMatch.them.you.name }}
        <small v-if="characterMatch.themMultiSpecies" class="species">as {{ getSpeciesStr(characterMatch.them) }}</small>
      </h3>

      <ul>
        <li
          v-for="score in getScores(characterMatch.them)"
          v-if="shouldShowScore(score)"
          :class="getScoreClass(score)"
          v-html="score.description"
        ></li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Hook, Prop } from '@f-list/vue-ts';
  import * as _ from 'lodash';
  import Vue from 'vue';
  import * as Utils from '../utils';
  import { Matcher, MatchReport, MatchResult, Score } from '../../learn/matcher';
  import core from '../../chat/core';
  import { Scoring, TagId } from '../../learn/matcher-types';

  export interface CssClassMap {
    [key: string]: boolean;
  }

  @Component
  export default class MatchReportView extends Vue {
    @Prop({ required: true })
    readonly characterMatch!: MatchReport;

    // @Prop({required: true})
    // readonly minimized = false;

    isMinimized = false;

    @Hook('beforeMount')
    async beforeMount(): Promise<void> {
      this.isMinimized = !!(await core.settingsStore.get('hideProfileComparisonSummary'));
    }

    // @Watch('minimized')
    // onMinimizedChange(): void {
    //     this.isMinimized = this.minimized;
    // }

    getAvatarUrl(name: string) {
      const c = core.characters.get(name);

      if (c.overrides.avatarUrl) {
        return c.overrides.avatarUrl;
      }

      return Utils.avatarURL(name);
    }

    getScoreClass(score: Score): CssClassMap {
      const classes: CssClassMap = {};

      classes[score.getRecommendedClass()] = true;
      classes['match-score'] = true;

      return classes;
    }

    haveScores(result: MatchResult): boolean {
      return !_.every(result.scores, (s: Score) => s.score === Scoring.NEUTRAL);
    }

    shouldShowScore(score: Score): boolean {
      return score.score !== Scoring.NEUTRAL;
    }

    getScores(result: MatchResult): Score[] {
      return _.map(result.scores, (s: Score) => s);
    }

    getSpeciesStr(m: MatchResult): string {
      const t = Matcher.getTagValue(TagId.Species, m.you);

      return _.get(t, 'string', 'unknown');
    }

    async toggleMinimize(): Promise<void> {
      this.isMinimized = !this.isMinimized;

      await core.settingsStore.set('hideProfileComparisonSummary', this.isMinimized);
    }
  }
</script>

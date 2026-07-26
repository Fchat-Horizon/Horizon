<template>
  <div
    id="match-report"
    :class="{ 'match-report': true, minimized: isMinimized }"
    v-if="haveScores(characterMatch.you) || haveScores(characterMatch.them)"
  >
    <a
      class="minimize-btn btn"
      :class="isMinimized ? 'btn-outline-secondary' : 'btn-secondary'"
      @click.prevent="toggleMinimize()"
      ><i
        :class="{ fa: true, 'fa-plus': isMinimized, 'fa-minus': !isMinimized }"
      ></i
    ></a>

    <div class="row">
      <div class="scores you col-12 col-lg-5">
        <h3>
          <img
            :src="getAvatarUrl(characterMatch.you.you.name)"
            class="thumbnail"
          />
          {{ characterMatch.you.you.name }}
          <small v-if="characterMatch.youMultiSpecies" class="species"
            >as {{ getSpeciesStr(characterMatch.you) }}</small
          >
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

      <div class="vs col-12 col-lg-2 text-dark-emphasis">vs</div>

      <div class="scores them col-12 col-lg-5">
        <h3>
          <img
            :src="getAvatarUrl(characterMatch.them.you.name)"
            class="thumbnail"
          />
          {{ characterMatch.them.you.name }}
          <small v-if="characterMatch.themMultiSpecies" class="species"
            >as {{ getSpeciesStr(characterMatch.them) }}</small
          >
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
  </div>
</template>

<script setup lang="ts">
  import { ref, onBeforeMount } from 'vue';
  import * as _ from 'lodash';
  import * as Utils from '../utils';
  import {
    Matcher,
    MatchReport,
    MatchResult,
    Score
  } from '../../learn/matcher';
  import core from '../../chat/core';
  import { Scoring, TagId } from '../../learn/matcher-types';

  export interface CssClassMap {
    [key: string]: boolean;
  }

  const props = defineProps<{
    characterMatch: MatchReport;
  }>();

  const isMinimized = ref(false);

  onBeforeMount(async () => {
    isMinimized.value = !!(await core.settingsStore.get(
      'hideProfileComparisonSummary'
    ));
  });

  const getAvatarUrl = (name: string) => {
    const c = core.characters.get(name);

    if (
      c.overrides.avatarUrl &&
      core.state.settings.risingShowHighQualityPortraits
    ) {
      return c.overrides.avatarUrl;
    }

    return Utils.avatarURL(name);
  };

  const getScoreClass = (score: Score): CssClassMap => {
    const classes: CssClassMap = {};

    classes[score.getRecommendedClass()] = true;
    classes['match-score'] = true;

    return classes;
  };

  const haveScores = (result: MatchResult): boolean => {
    return !_.every(result.scores, (s: Score) => s.score === Scoring.NEUTRAL);
  };

  const shouldShowScore = (score: Score): boolean => {
    return score.score !== Scoring.NEUTRAL;
  };

  const getScores = (result: MatchResult): Score[] => {
    return _.map(result.scores, (s: Score) => s);
  };

  const getSpeciesStr = (m: MatchResult): string => {
    const t = Matcher.getTagValue(TagId.Species, m.you);

    return _.get(t, 'string', 'unknown');
  };

  const toggleMinimize = async (): Promise<void> => {
    isMinimized.value = !isMinimized.value;

    await core.settingsStore.set(
      'hideProfileComparisonSummary',
      isMinimized.value
    );
  };
</script>

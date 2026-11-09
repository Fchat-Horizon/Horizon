<template>
  <div class="matched-tags">
    <span v-for="(score, key) in merged" :class="score.getRecommendedClass()"
      ><i :class="score.getRecommendedIcon()"></i> {{ getTagDesc(key) }}</span
    >
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';
  import { MatchReport, MatchResultScores } from '../../learn/matcher';
  import { TagId } from '../../learn/matcher-types';

  export default Vue.extend({
    components: {},
    props: {
      match: { required: true as const }
    },
    data() {
      return {
        merged: undefined as any as MatchResultScores
      };
    },
    mounted(): void {
      this.merged = this.match.merged;
    },
    methods: {
      getTagDesc(key: any): any {
        return TagId[key]
          .toString()
          .replace(/([A-Z])/g, ' $1')
          .trim();
      }
    }
  });
</script>

<style lang="scss">
  .matched-tags {
    span {
      padding-left: 3px;
      padding-right: 3px;
      margin-bottom: 3px;
      margin-right: 3px;
      display: inline-block;
      border: 1px solid;
      border-radius: 3px;

      &.match {
        color: var(--scoreMatchFg);
        background-color: var(--scoreMatchBg);
        border: solid 1px var(--scoreMatchBorder);
      }

      &.weak-match {
        color: var(--scoreWeakMatchFg);
        background-color: var(--scoreWeakMatchBg);
        border: 1px solid var(--scoreWeakMatchBorder);
      }

      &.weak-mismatch {
        color: var(--scoreWeakMismatchFg);
        background-color: var(--scoreWeakMismatchBg);
        border: 1px solid var(--scoreWeakMismatchBorder);
      }

      &.mismatch {
        color: var(--scoreMismatchFg);
        background-color: var(--scoreMismatchBg);
        border: 1px solid var(--scoreMismatchBorder);
      }
    }
  }
</style>

<template>
  <div class="matched-tags">
    <span
      v-for="(score, key) in merged"
      :key="key"
      :class="score.getRecommendedClass()"
      ><i :class="score.getRecommendedIcon()"></i> {{ getTagDesc(key) }}</span
    >
  </div>
</template>

<script lang="ts">
  import { defineComponent } from 'vue';
  import type { PropType } from 'vue';
  import type { MatchReport, MatchResultScores } from '@/learn/matcher';
  import { TagId } from '@/learn/matcher-types';

  export default defineComponent({
    components: {},
    props: {
      match: {
        type: Object as PropType<MatchReport>,
        required: true as const
      }
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
        background-color: var(--scoreMatchBg);
        border: solid 1px var(--scoreMatchFg);
      }

      &.weak-match {
        background-color: var(--scoreWeakMatchBg);
        border: 1px solid var(--scoreWeakMatchFg);
      }

      &.weak-mismatch {
        background-color: var(--scoreWeakMismatchBg);
        border: 1px solid var(--scoreWeakMismatchFg);
      }

      &.mismatch {
        background-color: var(--scoreMismatchBg);
        border: 1px solid var(--scoreMismatchFg);
      }
    }
  }
</style>

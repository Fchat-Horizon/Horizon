<template>
  <div class="matched-tags">
    <span
      v-for="(score, key) in merged"
      class="badge"
      :class="[score.getRecommendedClass(), score.getRecommendedBadgeClass()]"
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
    .badge {
      margin-bottom: 3px;
      margin-right: 3px;
    }
  }
</style>

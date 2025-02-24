<template>
  <div class="matched-tags">
    <span v-for="(score, key) in merged" :class="score.getRecommendedClass()"
      ><i :class="score.getRecommendedIcon()"></i> {{ getTagDesc(key) }}</span
    >
  </div>
</template>

<script lang="ts">
  import { Component, Hook, Prop } from '@f-list/vue-ts';
  import Vue from 'vue';
  import { MatchReport, MatchResultScores } from '../../learn/matcher';
  import { TagId } from '../../learn/matcher-types';

  @Component({
    components: {}
  })
  export default class MatchTags extends Vue {
    @Prop({ required: true })
    readonly match!: MatchReport;

    merged!: MatchResultScores;

    // protected humanized: boolean = false;
    //
    // protected furryPreferenceId: string = '';

    @Hook('mounted')
    onMounted(): void {
      this.merged = this.match.merged;
      // this.humanized = false;
      // this.furryPreferenceId = TagId.FurryPreference.toString();
      //
      // const furryPreference = Matcher.getTagValueList(TagId.FurryPreference, this.match.you.you);
      //
      // if (this.match.you.info.species === Species.Human && furryPreference === FurryPreference.HumansOnly) {
      //   this.humanized = true;
      // }
    }

    // @Watch('match', { deep: true })
    // onMatchUpdate(match: MatchReport): void {
    //   // console.log('ON UPDATED ETA', match);
    //   this.merged = match.merged;
    // }

    getTagDesc(key: any): any {
      // if (key === this.furryPreferenceId) {
      //   return this.humanized ? 'Humans' : 'Anthros';
      // }

      return TagId[key]
        .toString()
        .replace(/([A-Z])/g, ' $1')
        .trim();
    }
  }
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

      i {
        color: white;
      }

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

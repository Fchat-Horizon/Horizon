<template>
  <div
    id="match-report"
    :class="{ 'match-report': true, minimized: isMinimized }"
    class="profile-analysis-wrapper"
    ref="profileAnalysisWrapper"
  >
    <a
      class="minimize-btn btn"
      :class="isMinimized ? 'btn-outline-secondary' : 'btn-secondary'"
      @click.prevent="toggleMinimize()"
      ><i
        :class="{ fa: true, 'fa-plus': isMinimized, 'fa-minus': !isMinimized }"
      ></i
    ></a>
    <div class="alert alert-info" role="alert">
      <h4 class="alert-heading">Feedback requested.</h4>
      <p>
        This reworked version of the analyser— now visible on your profile, is
        intended to give you a better idea of how the matcher sees your
        character. Are the results inaccurate, or do you otherwise feel there's
        improvements for the matcher?
        <br />

        We know there are a lot of issues with that feature as is, but can't
        seem to get a proper consensus on where it's failing people. If you can,
        please
        <a
          href="https://horizn.moe/contact.html"
          style="text-decoration: underline"
          >reach out to us
          <i class="fa-solid fa-arrow-up-right-from-square"></i>.
        </a>
      </p>
      <hr />
      <p>
        For now, if this thing gets in the way, you can click the
        <i class="fa fa-minus"></i> button on the top right to close it.
      </p>
    </div>
    <div v-if="!analyzing && !recommendations.length">
      <h3>Looking good!</h3>
      <p>
        The profile analyzer could not find any improvement recommendations for
        your profile.
      </p>
    </div>

    <div v-else-if="analyzing && !recommendations.length">
      <p>Having problems with finding good matches?</p>
      <p>&nbsp;</p>
      <p>
        The profile analyzer will identify if your profile could benefit from
        adjustments.
      </p>
      <p>&nbsp;</p>
      <h3>Analyzing...</h3>
    </div>

    <div v-else>
      <p>Having problems with finding good matches?</p>
      <p>&nbsp;</p>
      <p>
        The profile analyzer recommends the following adjustments to your
        profile:
      </p>

      <div class="row">
        <div
          v-for="r in recommendations"
          class="recommendation-wrapper col-12 col-md-6 col-xl-4"
        >
          <div class="recommendation" :class="r.level">
            <h5 v-if="r.helpUrl">
              <a :href="r.helpUrl"
                >{{ r.title }}
                <i class="fa-solid fa-arrow-up-right-from-square"></i
              ></a>
            </h5>
            <h5 v-else>{{ r.title }}</h5>
            <p>{{ r.desc }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
  import Vue from 'vue';
  import core from '../../chat/core';
  import {
    ProfileRecommendation,
    ProfileRecommendationAnalyzer
  } from './profile-recommendation';
  import { CharacterAnalysis } from '../matcher';
  import { methods } from '../../site/character_page/data_store';

  export default Vue.extend({
    props: {
      characterName: { required: true as const },
      characterId: { required: true as const }
    },
    data() {
      return {
        recommendations: [] as ProfileRecommendation[],
        analyzing: false,
        isMinimized: true
      };
    },
    async beforeMount(): Promise<void> {
      this.isMinimized = !!(await core.settingsStore.get(
        'hideProfileAnalysis'
      ));
    },
    async mounted(): Promise<void> {
      this.analyze();
    },
    methods: {
      async analyze() {
        this.analyzing = true;
        this.recommendations = [];

        const char = await methods.characterData(
          this.characterName as string,
          this.characterId as number,
          true
        );
        const profile = new CharacterAnalysis(char.character);
        const analyzer = new ProfileRecommendationAnalyzer(profile);

        this.recommendations = await analyzer.analyze();

        this.analyzing = false;
      },
      async toggleMinimize(): Promise<void> {
        this.isMinimized = !this.isMinimized;

        await core.settingsStore.set('hideProfileAnalysis', this.isMinimized);
      }
    }
  });
</script>
<style lang="scss">
  .profile-analysis-wrapper {
    h3 {
      font-size: 130%;
      margin-bottom: 0;
    }

    p {
      font-size: 95%;
      margin: 0;
    }

    ul {
      list-style-type: none;
      margin: 0;
      padding: 0;
    }

    .recommendation {
      line-height: 120%;
      border-radius: 3px;
      padding: 5px;

      &.critical {
        background-color: var(--scoreMismatchBg);
      }

      &.note {
        background-color: var(--scoreWeakMismatchBg);
      }
    }

    .more-info {
      margin-top: 1em;

      a {
        color: var(--linkForcedColor) !important;
        font-weight: bold;
      }
    }
  }
</style>

<template>
  <modal
    :action="l('characterSearch.action')"
    @submit.prevent="submit()"
    dialogClass="modal-70"
    :buttonText="state === 'results' ? l('characterSearch.again') : undefined"
    class="character-search"
    iconClass="fas fa-magnifying-glass"
  >
    <div v-if="options && state === 'search'">
      <div v-show="error" class="alert alert-danger">{{ error }}</div>
      <filterable-select
        v-model="data.kinks"
        :multiple="true"
        :placeholder="l('filter')"
        :title="l('characterSearch.kinks')"
        :filterFunc="filterKink"
        :options="options.kinks"
      >
        <template slot-scope="s">{{ s.option.name }}</template>
      </filterable-select>
      <filterable-select
        v-for="item in listItems"
        :multiple="true"
        v-model="data[item]"
        :placeholder="l('filter')"
        :title="l('characterSearch.' + item)"
        :options="options[item]"
        :key="item"
      >
      </filterable-select>

      <filterable-select
        class="species-filter"
        v-model="data.species"
        :filterFunc="filterSpecies"
        :multiple="true"
        :placeholder="l('filter')"
        :title="l('characterSearch.species')"
        :options="options.species"
      >
        <template slot-scope="s"
          >{{ s.option.shortName }}
          <small>{{ s.option.details }}</small></template
        >
      </filterable-select>

      <div v-if="searchString" class="search-string">
        Searching for <span>{{ searchString }}</span>
      </div>

      <div class="btn-group">
        <button
          class="btn btn-outline-secondary"
          @click.prevent="showHistory()"
        >
          History
        </button>
        <button class="btn btn-outline-secondary" @click.prevent="reset()">
          Reset
        </button>
      </div>

      <search-history
        ref="searchHistory"
        :callback="updateSearch"
        :curSearch="data"
      ></search-history>
    </div>
    <div v-else-if="state === 'results'" class="results">
      <div class="debug" v-show="false">
        <textarea v-model="debugSearchJson"></textarea>
        <button class="btn" @click.prevent="debugUpdateResults()">
          Update
        </button>
      </div>

      <h4 v-if="hasReceivedResults">
        {{ results.length }} {{ l('characterSearch.results') }}

        <span v-if="resultsPending > 0" class="pending"
          >Scoring {{ resultsPending }}...
          <i class="fas fa-circle-notch fa-spin search-spinner"></i
        ></span>
      </h4>
      <h4 v-else>Searching...</h4>

      <div
        v-for="record in results"
        :key="record.character.name"
        class="search-result"
        :class="'status-' + record.character.status"
      >
        <template v-if="record.character.status === 'looking'" v-once>
          <img
            :src="characterImage(record.character.name)"
            class="character-avatar user"
            v-if="showAvatars"
          />
          <user
            :character="record.character"
            :showStatus="true"
            :match="shouldShowMatch"
            :avatar="false"
            :isMarkerShown="shouldShowMarker"
          ></user>
          <bbcode
            :text="record.character.statusText"
            class="status-text"
          ></bbcode>
        </template>
        <template v-else v-once>
          <user
            :character="record.character"
            :showStatus="true"
            :match="shouldShowMatch"
            :avatar="shouldShowAvatar"
            :isMarkerShown="shouldShowMarker"
          ></user>
          <bbcode
            :text="record.character.statusText"
            v-if="!!record.character.statusText"
            class="status-text"
          ></bbcode>
        </template>
      </div>
    </div>
  </modal>
</template>

<script lang="ts">
  import { Component, Hook, Watch } from '@f-list/vue-ts';
  import Axios from 'axios';
  import { BBCodeView } from '../bbcode/view';
  import CustomDialog from '../components/custom_dialog';
  import FilterableSelect from '../components/FilterableSelect.vue';
  import Modal from '../components/Modal.vue';
  import { characterImage } from './common';
  import core from './core';
  import {
    Character,
    Connection,
    ExtendedSearchData,
    SearchData,
    SearchKink,
    SearchSpecies
  } from './interfaces';
  import l from './localize';
  import UserView from './UserView.vue';
  import * as _ from 'lodash';
  import { EventBus } from './preview/event-bus';
  import CharacterSearchHistory from './CharacterSearchHistory.vue';
  import { Matcher } from '../learn/matcher';
  import {
    Gender,
    kinkMatchScoreMap,
    kinkMatchWeights,
    nonAnthroSpecies,
    Orientation,
    Species,
    speciesMapping,
    speciesNames,
    TagId
  } from '../learn/matcher-types';
  import { CharacterCacheRecord } from '../learn/profile-cache';
  import Bluebird from 'bluebird';

  type Options = {
    kinks: SearchKink[];
    listitems: { id: string; name: string; value: string }[];
  };

  let options: Options | undefined;

  interface SearchResult {
    character: Character;
    profile: CharacterCacheRecord | null;
  }

  function sort(resultX: SearchResult, resultY: SearchResult): number {
    const x = resultX.character;
    const y = resultY.character;

    if (x.status === 'looking' && y.status !== 'looking') return -1;
    if (x.status !== 'looking' && y.status === 'looking') return 1;

    const xc = core.cache.profileCache.getSync(x.name);
    const yc = core.cache.profileCache.getSync(y.name);

    if (xc && !yc) {
      return -1;
    }

    if (!xc && yc) {
      return 1;
    }

    if (xc && yc) {
      if (xc.match.matchScore > yc.match.matchScore) return -1;

      if (xc.match.matchScore < yc.match.matchScore) return 1;

      if (xc.match.searchScore > yc.match.searchScore) return -1;

      if (xc.match.searchScore < yc.match.searchScore) return 1;
    }

    if (x.name < y.name) return -1;

    if (x.name > y.name) return 1;

    return 0;
  }

  @Component({
    components: {
      modal: Modal,
      user: UserView,
      'filterable-select': FilterableSelect,
      bbcode: BBCodeView(core.bbCodeParser),
      'search-history': CharacterSearchHistory
    }
  })
  export default class CharacterSearch extends CustomDialog {
    l = l;
    kinksFilter = '';
    error = '';
    results: SearchResult[] = [];
    resultsPending = 0;
    characterImage = characterImage;
    options!: ExtendedSearchData;
    shouldShowMatch = true;
    state = 'search';
    hasReceivedResults = false;
    shouldShowAvatar = false;
    shouldShowMarker = false;

    debugSearchJson = JSON.stringify(
      {
        scoreMap: kinkMatchScoreMap,
        weights: kinkMatchWeights
      },
      null,
      2
    );

    private countUpdater?: ResultCountUpdater;

    data: ExtendedSearchData = {
      kinks: [],
      genders: [],
      orientations: [],
      languages: [],
      furryprefs: [],
      roles: [],
      positions: [],
      species: [],
      bodytypes: []
    };

    listItems: ReadonlyArray<keyof SearchData> = [
      'genders',
      'orientations',
      'languages',
      'furryprefs',
      'roles',
      'positions',
      'bodytypes'
    ]; // SearchData is correct

    searchString = '';

    // tslint:disable-next-line no-any
    scoreWatcher: ((event: any) => void) | null = null;

    @Hook('created')
    async created(): Promise<void> {
      if (options === undefined)
        options = <Options | undefined>(
          (await Axios.get('https://www.f-list.net/json/api/mapping-list.php'))
            .data
        );
      if (options === undefined) return;
      this.options = Object.freeze({
        kinks: options.kinks.sort((x, y) =>
          x.name < y.name ? -1 : x.name > y.name ? 1 : 0
        ),
        genders: options.listitems
          .filter(x => x.name === 'gender')
          .map(x => x.value),
        orientations: options.listitems
          .filter(x => x.name === 'orientation')
          .map(x => x.value),
        languages: options.listitems
          .filter(x => x.name === 'languagepreference')
          .map(x => x.value),
        furryprefs: options.listitems
          .filter(x => x.name === 'furrypref')
          .map(x => x.value),
        roles: options.listitems
          .filter(x => x.name === 'subdom')
          .map(x => x.value),
        positions: options.listitems
          .filter(x => x.name === 'position')
          .map(x => x.value),
        species: this.getSpeciesOptions(),
        bodytypes: options.listitems
          .filter(x => x.name === 'bodytype')
          .map(x => x.value)
      });

      this.countUpdater = new ResultCountUpdater((names: string[]) => {
        this.resultsPending = this.countPendingResults(names);

        if (this.resultsPending === 0) {
          this.countUpdater?.stop();
        }

        this.resort();
      });
    }

    async debugUpdateResults(): Promise<void> {
      if (this.state !== 'results') {
        return;
      }

      const data = JSON.parse(this.debugSearchJson);

      _.assign(kinkMatchScoreMap, data.scoreMap);
      _.assign(kinkMatchWeights, data.weights);

      core.cache.profileCache.clear();

      const results = this.results;

      this.results = [];

      await Bluebird.delay(10);

      // pre-warm cache
      await Bluebird.mapSeries(results, c =>
        core.cache.profileCache.get(c.character.name)
      );

      this.resultsPending = this.countPendingResults(undefined, results);

      this.countUpdater?.start();
      this.resort(results);

      console.log('Done!');
    }

    @Hook('mounted')
    mounted(): void {
      core.connection.onMessage('ERR', data => {
        this.state = 'search';

        switch (data.number) {
          case 18:
            this.error = l('characterSearch.error.noResults');
            break;
          case 50:
            this.error = l('characterSearch.error.throttle');
            break;
          case 72:
            this.error = l('characterSearch.error.tooManyResults');
        }
      });

      core.connection.onMessage('FKS', async data => {
        const results = data.characters
          .map(x => ({ character: core.characters.get(x), profile: null }))
          .filter(
            x =>
              core.state.hiddenUsers.indexOf(x.character.name) === -1 &&
              !x.character.isIgnored
          )
          .filter(
            x =>
              this.isSpeciesMatch(x) &&
              this.isBodyTypeMatch(x) &&
              !this.isSmartFiltered(x)
          )
          .sort(sort);

        // pre-warm cache
        await Bluebird.mapSeries(results, c =>
          core.cache.profileCache.get(c.character.name)
        );

        this.resultsPending = this.countPendingResults(undefined, results);

        this.countUpdater?.start();

        // this is done LAST to force Vue to wait with rendering
        this.hasReceivedResults = true;
        this.results = results;

        this.resort(results);
      });

      if (this.scoreWatcher) {
        EventBus.$off('character-score', this.scoreWatcher);
      }

      // tslint:disable-next-line no-unsafe-any no-any
      this.scoreWatcher = (event: any): void => {
        // console.log('scoreWatcher', event);

        if (
          this.state === 'results' &&
          // tslint:disable-next-line no-unsafe-any no-any
          event.character &&
          // tslint:disable-next-line no-unsafe-any no-any
          _.find(
            this.results,
            (s: SearchResult) =>
              s.character.name === event.character.character.name
          )
        ) {
          this.countUpdater?.requestUpdate(event.character.character.name);
        }
      };

      EventBus.$on('character-score', this.scoreWatcher);
    }

    @Hook('beforeDestroy')
    beforeDestroy(): void {
      if (this.scoreWatcher) {
        EventBus.$off('character-score', this.scoreWatcher);

        this.scoreWatcher = null;
      }

      this.countUpdater?.stop();
    }

    @Watch('data', { deep: true })
    onDataChange(): void {
      this.searchString = _.join(
        _.map(
          // tslint:disable-next-line no-unsafe-any no-any
          _.flatten(_.map(this.data as any)),
          // tslint:disable-next-line no-unsafe-any no-any
          v => _.get(v, 'name', v)
        ),
        ', '
      );
    }

    private resort(results = this.results) {
      this.results = (
        _.filter(
          results,
          x =>
            this.isSpeciesMatch(x) &&
            this.isBodyTypeMatch(x) &&
            !this.isSmartFiltered(x)
        ) as SearchResult[]
      ).sort(sort);
    }

    isSpeciesMatch(result: SearchResult): boolean {
      if (this.data.species.length === 0) {
        return true;
      }

      const knownCharacter = core.cache.profileCache.getSync(
        result.character.name
      );

      if (!knownCharacter) {
        return true;
      }

      // optimization
      result.profile = knownCharacter;

      const isSearchingForAnthro = !!_.find(
        this.data.species,
        s => s.id === Species.Anthro
      );
      const isSearchingForHuman = !!_.find(
        this.data.species,
        s => s.id === Species.Human
      );

      const species = Matcher.species(knownCharacter.character.character);

      if (!species) {
        // returns TRUE if we're only searching for humans -- we suck at identifying humans
        return isSearchingForHuman && this.data.species.length === 1;
      }

      return (
        (isSearchingForAnthro && _.indexOf(nonAnthroSpecies, species) < 0) ||
        // || ((isSearchingForMammal) && (_.indexOf(mammalSpecies, s.id) >= 0))
        !!_.find(this.data.species, (s: SearchSpecies) => s.id === species)
      );
    }

    isBodyTypeMatch(result: SearchResult) {
      if (this.data.bodytypes.length === 0) return true;

      const knownCharacter = core.cache.profileCache.getSync(
        result.character.name
      );
      if (!knownCharacter) return false;

      result.profile = knownCharacter;

      const bodytypeId = result.profile.character.character.infotags[51]?.list;
      if (bodytypeId === undefined) return false;

      const bodytype = options!.listitems
        .filter(x => x.name === 'bodytype')
        .find(x => +x.id === bodytypeId);
      return this.data.bodytypes.indexOf(bodytype!.value) > -1;
    }

    isSmartFiltered(result: SearchResult) {
      if (!core.state.settings.risingFilter.hideSearchResults) {
        return false;
      }

      return !!result.profile?.match.isFiltered;
    }

    getSpeciesOptions(): SearchSpecies[] {
      const species = _.map(
        speciesMapping,
        (keywords: string[], speciesIdStr: Species): SearchSpecies => {
          // const speciesId: number = Species[speciesName];
          const keywordsStr = `${keywords.join(', ')}`;
          const details = `${keywordsStr.substr(0, 24)}...`;
          const speciesId = parseInt(speciesIdStr as any, 10);

          if (speciesId in speciesNames) {
            const name = `${speciesNames[speciesId].substr(0, 1).toUpperCase()}${speciesNames[speciesId].substr(1)}`;

            return {
              details,
              keywords: `${name}: ${keywordsStr}`,
              name: `${name} (species)`,
              shortName: name,
              id: speciesId
            };
          }

          const speciesName = Species[speciesId];

          return {
            details,
            keywords: `${speciesName}s: ${keywordsStr}`,
            name: `${speciesName}s (species)`,
            shortName: `${speciesName}s`,
            id: speciesId
          };
        }
      ) as unknown[] as SearchSpecies[];

      // console.log('SPECIES', species);

      return _.sortBy(species, 'name');
    }

    countPendingResults(names?: string[], results = this.results): number {
      // console.log('COUNTPENDINGRESULTS', names);

      return _.reduce(
        results,
        (accum: number, result: SearchResult) => {
          if (!!result.profile) {
            return accum;
          }

          if (
            _.isUndefined(names) ||
            _.indexOf(names, result.character.name) >= 0
          ) {
            result.profile = core.cache.profileCache.getSync(
              result.character.name
            );
          }

          return !!result.profile ? accum : accum + 1;
        },
        0
      );
    }

    filterKink(filter: RegExp, kink: SearchKink): boolean {
      if (this.data.kinks.length >= 5)
        return this.data.kinks.indexOf(kink) !== -1;
      return filter.test(kink.name);
    }

    filterSpecies(filter: RegExp, species: SearchSpecies): boolean {
      return filter.test(species.keywords);
    }

    get showAvatars(): boolean {
      return core.state.settings.showAvatars;
    }

    reset(): void {
      this.data = {
        kinks: [],
        genders: [],
        orientations: [],
        languages: [],
        furryprefs: [],
        roles: [],
        positions: [],
        species: [],
        bodytypes: []
      };
    }

    updateSearch(data?: ExtendedSearchData): void {
      if (data) {
        // this.data = {kinks: [], genders: [], orientations: [], languages: [], furryprefs: [], roles: [], positions: []};
        // this.data = data;

        this.data = _.mapValues(data, (category, categoryName) =>
          _.map(category, selection => {
            const jsonSelection = JSON.stringify(selection);
            const v = _.find(
              (this.options as any)[categoryName],
              op => JSON.stringify(op) === jsonSelection
            );

            return v || selection;
          })
        ) as ExtendedSearchData;
      }
    }

    submit(): void {
      if (this.state === 'results') {
        this.results = [];
        this.hasReceivedResults = false;
        this.countUpdater?.stop();
        this.state = 'search';
        return;
      }

      this.shouldShowMatch = core.state.settings.risingComparisonInSearch;
      this.shouldShowAvatar = core.state.settings.risingShowPortraitInMessage;
      this.shouldShowMarker = core.state.settings.horizonShowGenderMarker;

      this.results = [];

      this.state = 'results';

      this.error = '';

      const data: Connection.ClientCommands['FKS'] & {
        [key: string]: (string | number)[];
      } = { kinks: [] };

      for (const key in this.data) {
        const item = this.data[<keyof SearchData>key]; // SearchData is correct
        if (item.length > 0 && key !== 'bodytypes')
          data[key] =
            key === 'kinks'
              ? (<SearchKink[]>item).map(x => x.id)
              : <string[]>item;
      }

      core.connection.send('FKS', data);

      // tslint:disable-next-line
      this.updateSearchHistory(this.data);
    }

    showHistory(): void {
      (<CharacterSearchHistory>this.$refs.searchHistory).show();
    }

    async updateSearchHistory(data: ExtendedSearchData): Promise<void> {
      const history = (await core.settingsStore.get('searchHistory')) || [];
      const dataStr = JSON.stringify(data, null, 0);

      const filteredHistory = _.map(
        _.reject(
          history,
          (h: SearchData) => JSON.stringify(h, null, 0) === dataStr
        ),
        h => _.merge({ species: [], bodytypes: [] }, h)
      ) as ExtendedSearchData[];

      const newHistory: ExtendedSearchData[] = _.take(
        _.concat([data], filteredHistory),
        15
      );

      await core.settingsStore.set('searchHistory', newHistory);
    }
  }

  class ResultCountUpdater {
    // @ts-ignore
    private _isVue = true;

    private updatedNames: string[] = [];

    private timerId?: NodeJS.Timeout;

    constructor(private callback: (names: string[]) => void) {}

    requestUpdate(name: string): void {
      this.updatedNames.push(name);
    }

    start() {
      const schedule = () => {
        this.timerId = setTimeout(() => {
          if (this.updatedNames.length > 0) {
            this.callback(this.updatedNames);
            this.updatedNames = [];
          }

          schedule();
        }, 250);
      };

      schedule();
    }

    stop() {
      if (this.timerId) {
        clearTimeout(this.timerId);
        delete this.timerId;
      }
    }
  }
</script>

<style lang="scss">
  .character-search {
    .species-filter {
      small {
        color: var(--tabSecondaryFgColor);
      }
    }

    .dropdown {
      margin-bottom: 10px;
    }

    .results {
      .user-view {
        // display: block;
      }
      & > .search-result {
        clear: both;
      }
      & > .status-looking {
        margin-bottom: 5px;
        min-height: 50px;

        .status-text {
          display: block;
        }
      }

      & > .status-offline,
      & > .status-online,
      & > .status-away,
      & > .status-idle,
      & > .status-busy,
      & > .status-dnd,
      & > .status-crown {
        overflow: hidden;
        width: 100%;
        min-height: 2em;
        max-height: 7em;
        padding-top: 5px;
        display: flex;

        .user-avatar {
          max-width: 2em;
          max-height: 2em;
          min-width: 2em;
          min-height: 2em;
          margin-top: -5px;
        }

        .user-view {
          flex-shrink: 0;
        }

        .status-text {
          opacity: 0.75;
          padding-left: 4px;
          max-height: 5.5em;
          height: 100%;
          display: inline-flex;
          overflow-y: auto;
          flex-grow: 1;
        }
      }

      .character-avatar.user {
        float: left;
        margin-right: 5px;
        width: 50px;
        height: auto;
      }

      .search-result:nth-child(2n) {
        background-color: rgba(0, 0, 0, 0.15);
      }
    }

    .search-string {
      margin-bottom: 1rem;
      margin-top: 1rem;
      margin-left: 0.5rem;
      font-size: 80%;
    }

    .search-string span {
      font-weight: bold;
    }

    .pending {
      float: right;
      color: var(--gray);
      font-size: 80%;
    }

    .search-spinner {
      // float: right;
    }

    .search-yiffbot-suggestion .btn {
      padding-left: 5px;
      padding-right: 5px;
      margin-top: 1em;
      margin-bottom: 0;
      padding-top: 0;
      padding-bottom: 0;
      background-color: var(--bs-secondary);

      &:hover {
        background-color: var(--blue);
      }

      span {
        color: var(--yellow);
        font-weight: bold;
      }
    }
  }
</style>

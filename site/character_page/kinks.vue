<template>
  <div
    class="character-kinks-block"
    @contextmenu="contextMenu"
    @touchstart="contextMenu"
    @touchend="contextMenu"
  >
    <div class="compare-highlight-block row justify-content-between">
      <div class="expand-custom-kinks-block col-12 col-lg-3 col-xl-2">
        <button
          class="btn btn-primary form-control"
          @click="toggleExpandedCustomKinks"
          :disabled="loading"
        >
          <i
            class="fa-solid"
            :class="expandedCustoms ? 'fa-chevron-up' : 'fa-chevron-down'"
          ></i>
          {{ expandedCustoms ? l('profile.collapse') : l('profile.expand') }}
        </button>
      </div>

      <div
        v-if="shared.authenticated"
        class="input-group quick-compare-block col-12 col-lg-3 col-xl-3 w-md-100"
      >
        <character-select v-model="characterToCompare"></character-select>
        <button
          class="btn btn-outline-secondary"
          @click="compareKinks()"
          :disabled="loading || !characterToCompare"
        >
          {{ compareButtonText }}
        </button>
      </div>

      <div class="col-12 col-lg-3 col-xl-2">
        <select v-model="highlightGroup" class="form-select">
          <option :value="undefined">{{ l('profile.none') }}</option>
          <option
            v-for="group in kinkGroups"
            v-if="group"
            :value="group.id"
            :key="group.id"
          >
            {{ group.name }}
          </option>
        </select>
      </div>
    </div>
    <div class="row mt-3" :class="{ highlighting: !!highlightGroup }">
      <div class="col-sm-6 col-lg-3 kink-block-favorite kink-block">
        <div class="card bg-light">
          <div class="card-header border-bottom border-info">
            <h5>{{ l('profile.favorites') }}</h5>
          </div>
          <div class="card-body">
            <kink
              v-for="kink in groupedKinks['favorite']"
              :kink="kink"
              :key="kink.key"
              :highlights="highlighting"
              :expandedCustom="expandedCustoms"
              :comparisons="comparison"
            ></kink>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-lg-3 kink-block-yes kink-block">
        <div class="card bg-light">
          <div class="card-header border-bottom border-success">
            <h5>{{ l('profile.yes') }}</h5>
          </div>
          <div class="card-body">
            <kink
              v-for="kink in groupedKinks['yes']"
              :kink="kink"
              :key="kink.key"
              :highlights="highlighting"
              :expandedCustom="expandedCustoms"
              :comparisons="comparison"
            ></kink>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-lg-3 kink-block-maybe kink-block">
        <div class="card bg-light">
          <div class="card-header border-bottom border-warning">
            <h5>{{ l('profile.maybe') }}</h5>
          </div>
          <div class="card-body">
            <kink
              v-for="kink in groupedKinks['maybe']"
              :kink="kink"
              :key="kink.key"
              :highlights="highlighting"
              :expandedCustom="expandedCustoms"
              :comparisons="comparison"
            ></kink>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-lg-3 kink-block-no kink-block">
        <div class="card bg-light">
          <div class="card-header border-bottom border-danger">
            <h5>{{ l('profile.no') }}</h5>
          </div>
          <div class="card-body">
            <kink
              v-for="kink in groupedKinks['no']"
              :kink="kink"
              :key="kink.key"
              :highlights="highlighting"
              :expandedCustom="expandedCustoms"
              :comparisons="comparison"
            ></kink>
          </div>
        </div>
      </div>
    </div>
    <context-menu
      v-if="shared.authenticated && !oldApi"
      prop-name="custom"
      ref="context-menu"
    ></context-menu>
  </div>
</template>

<script lang="ts">
  import * as _ from 'lodash';
  import { Component, Prop, Watch, Hook } from '@f-list/vue-ts';
  import Vue from 'vue';
  import core from '../../chat/core';
  import { Kink, KinkChoice, KinkGroup } from '../../interfaces';
  import * as Utils from '../utils';
  import CopyCustomMenu from './copy_custom_menu.vue';
  import { methods, Store } from './data_store';
  import { Character, CharacterKink, DisplayKink } from './interfaces';
  import KinkView from './kink.vue';
  import l from '../../chat/localize';

  @Component({
    components: { 'context-menu': CopyCustomMenu, kink: KinkView }
  })
  export default class CharacterKinksView extends Vue {
    @Prop({ required: true })
    readonly character!: Character;
    @Prop
    readonly oldApi?: true;
    @Prop({ required: true })
    readonly autoExpandCustoms!: boolean;

    shared = Store;
    characterToCompare = Utils.settings.defaultCharacter;
    highlightGroup: number | undefined;

    loading = false;
    comparing = false;
    highlighting: { [key: string]: boolean } = {};
    comparison: { [key: string]: KinkChoice } = {};

    _ = _;

    expandedCustoms = false;
    l = l;

    toggleExpandedCustomKinks(): void {
      this.expandedCustoms = !this.expandedCustoms;
    }

    // iterateThroughAllKinks(c: Character, cb: (

    resolveKinkChoice(
      c: Character,
      kinkValue: string | number | undefined
    ): string | null {
      if (typeof kinkValue === 'string') {
        return kinkValue;
      }

      if (typeof kinkValue === 'number') {
        const custom = c.character.customs[kinkValue];

        if (custom) {
          return custom.choice;
        }
      }

      return null;
    }

    convertCharacterKinks(c: Character): CharacterKink[] {
      return _.filter(
        _.map(
          c.character.kinks,
          (kinkValue: string | number | undefined, kinkId: string) => {
            const resolvedChoice = this.resolveKinkChoice(c, kinkValue);

            if (!resolvedChoice) return null;

            return {
              id: parseInt(kinkId, 10),
              choice: resolvedChoice as KinkChoice
            };
          }
        ),
        v => v !== null
      ) as CharacterKink[];
    }

    async compareKinks(
      overridingCharacter?: Character,
      forced: boolean = false
    ): Promise<void> {
      if (this.comparing && !forced) {
        this.comparison = {};
        this.comparing = false;
        this.loading = false;
        return;
      }

      try {
        this.loading = true;
        this.comparing = true;

        const kinks = overridingCharacter
          ? this.convertCharacterKinks(overridingCharacter)
          : await methods.kinksGet(this.characterToCompare);

        const toAssign: { [key: number]: KinkChoice } = {};
        for (const kink of kinks) toAssign[kink.id] = kink.choice;
        this.comparison = toAssign;
      } catch (e) {
        this.comparing = false;
        this.comparison = {};
        Utils.ajaxError(e, l('profile.compareError'));
      }
      this.loading = false;
    }

    @Watch('highlightGroup')
    highlightKinks(group: number | null): void {
      this.highlighting = {};
      if (group === null) return;
      const toAssign: { [key: string]: boolean } = {};
      for (const kinkId in Store.shared.kinks) {
        const kink = Store.shared.kinks[kinkId];
        if (kink.kink_group === group) toAssign[kinkId] = true;
      }
      this.highlighting = toAssign;
    }

    @Hook('mounted')
    async mounted(): Promise<void> {
      this.expandedCustoms = this.autoExpandCustoms;
      if (this.character && this.character.is_self) return;

      if (core.state.settings.risingAutoCompareKinks) {
        await this.compareKinks(core.characters.ownProfile, true);
      }
    }

    @Watch('character')
    async characterChanged(): Promise<void> {
      if (this.character && this.character.is_self) return;

      this.expandedCustoms = this.autoExpandCustoms;

      if (core.state.settings.risingAutoCompareKinks) {
        await this.compareKinks(core.characters.ownProfile, true);
      }
    }

    get kinkGroups(): KinkGroup[] {
      const groups = Store.shared.kinkGroups;

      return _.sortBy(
        _.filter(groups, g => !_.isUndefined(g)),
        'name'
      ) as KinkGroup[];
    }

    get compareButtonText(): string {
      if (this.loading) return l('common.loading');
      return this.comparing ? l('common.clear') : l('common.compare');
    }

    get groupedKinks(): { [key in KinkChoice]: DisplayKink[] } {
      const kinks = Store.shared.kinks;
      const characterKinks = this.character.character.kinks;
      const characterCustoms = this.character.character.customs;
      const displayCustoms: { [key: string]: DisplayKink | undefined } = {};
      const outputKinks: { [key: string]: DisplayKink[] } = {
        favorite: [],
        yes: [],
        maybe: [],
        no: []
      };
      const makeKink = (kink: Kink): DisplayKink => ({
        id: kink.id,
        name: kink.name,
        description: kink.description,
        group: kink.kink_group,
        isCustom: false,
        hasSubkinks: false,
        ignore: false,
        subkinks: [],
        key: kink.id.toString()
      });
      const kinkSorter = (a: DisplayKink, b: DisplayKink) => {
        if (this.character.settings.customs_first && a.isCustom !== b.isCustom)
          return a.isCustom < b.isCustom ? 1 : -1;

        if (a.name === b.name) return 0;
        return a.name < b.name ? -1 : 1;
      };

      for (const id in characterCustoms) {
        const custom = characterCustoms[id]!;
        displayCustoms[id] = {
          id: custom.id,
          name: custom.name,
          description: custom.description,
          choice: custom.choice,
          group: -1,
          isCustom: true,
          hasSubkinks: false,
          ignore: false,
          subkinks: [],
          key: `c${custom.id}`
        };
      }

      for (const kinkId in characterKinks) {
        const kinkChoice = characterKinks[kinkId]!;
        const kink = <Kink | undefined>kinks[kinkId];
        if (kink === undefined) continue;
        const newKink = makeKink(kink);
        if (
          typeof kinkChoice === 'number' &&
          typeof displayCustoms[kinkChoice] !== 'undefined'
        ) {
          const custom = displayCustoms[kinkChoice]!;
          newKink.ignore = true;
          custom.hasSubkinks = true;
          custom.subkinks.push(newKink);
        }
        if (!newKink.ignore) outputKinks[kinkChoice].push(newKink);
      }

      for (const customId in displayCustoms) {
        const custom = displayCustoms[customId]!;
        if (custom.hasSubkinks) custom.subkinks.sort(kinkSorter);
        outputKinks[<string>custom.choice].push(custom);
      }

      for (const choice in outputKinks) outputKinks[choice].sort(kinkSorter);

      return <{ [key in KinkChoice]: DisplayKink[] }>outputKinks;
    }

    contextMenu(event: MouseEvent | TouchEvent): void {
      if (this.shared.authenticated && !this.oldApi)
        (<CopyCustomMenu>this.$refs['context-menu']).outerClick(event);
    }
  }
</script>

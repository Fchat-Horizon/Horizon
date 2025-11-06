<template>
  <div class="character-kinks-block">
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
      <div class="col-12 col-lg-3 col-xl-2 mt-2 mt-lg-0">
        <button
          type="button"
          @click="sortByViewerPriorities = !sortByViewerPriorities"
          :class="[
            sortByViewerPriorities
              ? 'btn btn-primary form-control active'
              : 'btn btn-outline-secondary form-control'
          ]"
          :aria-pressed="!!sortByViewerPriorities"
          title="Sort by my priorities"
        >
          <i class="fa-solid fa-filter" style="margin-right: 8px"></i>
          {{ l('profile.sortByMyPriorities') || 'Sort by my priorities' }}
        </button>
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
  </div>
</template>

<script lang="ts">
  import * as _ from 'lodash';
  import {
    defineComponent,
    ref,
    computed,
    watch,
    onMounted,
    PropType
  } from 'vue';
  import core from '../../chat/core';
  import { kinkComparisonSwaps } from '../../learn/matcher-types';
  import { Kink, KinkChoice, KinkGroup } from '../../interfaces';
  import * as Utils from '../utils';
  import { methods, Store } from './data_store';
  import { Character, CharacterKink, DisplayKink } from './interfaces';
  import KinkView from './kink.vue';
  import l from '../../chat/localize';

  export default defineComponent({
    name: 'CharacterKinksView',
    components: { kink: KinkView },
    props: {
      character: {
        type: Object as PropType<Character>,
        required: true
      },
      oldApi: {
        type: Boolean as PropType<true | undefined>,
        default: undefined
      },
      autoExpandCustoms: {
        type: Boolean,
        required: true
      }
    },
    setup(props) {
      const shared = Store;
      const characterToCompare = ref(Utils.settings.defaultCharacter);
      const highlightGroup = ref<number | undefined>(undefined);
      const sortByViewerPriorities = ref(false);
      const loading = ref(false);
      const comparing = ref(false);
      const highlighting = ref<{ [key: string]: boolean }>({});
      const comparison = ref<{ [key: string]: KinkChoice }>({});
      const expandedCustoms = ref(false);

      const toggleExpandedCustomKinks = () => {
        expandedCustoms.value = !expandedCustoms.value;
      };

      const resolveKinkChoice = (
        c: Character,
        kinkValue: string | number | undefined
      ): string | null => {
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
      };

      const convertCharacterKinks = (c: Character): CharacterKink[] => {
        return _.filter(
          _.map(
            c.character.kinks,
            (kinkValue: string | number | undefined, kinkId: string) => {
              const resolvedChoice = resolveKinkChoice(c, kinkValue);

              if (!resolvedChoice) return null;

              return {
                id: parseInt(kinkId, 10),
                choice: resolvedChoice as KinkChoice
              };
            }
          ),
          v => v !== null
        ) as CharacterKink[];
      };

      const compareKinks = async (
        overridingCharacter?: Character,
        forced: boolean = false
      ): Promise<void> => {
        if (comparing.value && !forced) {
          comparison.value = {};
          comparing.value = false;
          loading.value = false;
          return;
        }

        try {
          loading.value = true;
          comparing.value = true;

          const kinks = overridingCharacter
            ? convertCharacterKinks(overridingCharacter)
            : await methods.kinksGet(characterToCompare.value);

          const toAssign: { [key: number]: KinkChoice } = {};
          for (const kink of kinks) toAssign[kink.id] = kink.choice;
          comparison.value = toAssign;
        } catch (e) {
          comparing.value = false;
          comparison.value = {};
          Utils.ajaxError(e, l('profile.compareError'));
        }
        loading.value = false;
      };

      const highlightKinks = (group: number | null): void => {
        highlighting.value = {};
        if (group === null) return;
        const toAssign: { [key: string]: boolean } = {};
        for (const kinkId in Store.shared.kinks) {
          const kink = Store.shared.kinks[kinkId];
          if (kink.kink_group === group) toAssign[kinkId] = true;
        }
        highlighting.value = toAssign;
      };

      const kinkGroups = computed((): KinkGroup[] => {
        const groups = Store.shared.kinkGroups;

        return _.sortBy(
          _.filter(groups, g => !_.isUndefined(g)),
          'name'
        ) as KinkGroup[];
      });

      const compareButtonText = computed((): string => {
        if (loading.value) return l('common.loading');
        return comparing.value ? l('common.clear') : l('common.compare');
      });

      const groupedKinks = computed(
        (): { [key in KinkChoice]: DisplayKink[] } => {
          const kinks = Store.shared.kinks;
          const characterKinks = props.character.character.kinks;
          const characterCustoms = props.character.character.customs;
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
            // viewerChoiceWeight is used when sorting by the viewer's priorities
            viewerChoiceWeight: 0,
            subkinks: [],
            key: kink.id.toString()
          });

          const kinkSorter = (a: DisplayKink, b: DisplayKink) => {
            if (
              props.character.settings.customs_first &&
              a.isCustom !== b.isCustom
            )
              return a.isCustom < b.isCustom ? 1 : -1;

            // If sorting by viewer priorities, prefer higher viewerChoiceWeight
            if (sortByViewerPriorities.value) {
              const wa = (a as any).viewerChoiceWeight || 0;
              const wb = (b as any).viewerChoiceWeight || 0;
              if (wa !== wb) return wb - wa; // descending
            }

            if (a.name === b.name) return 0;
            return a.name < b.name ? -1 : 1;
          };

          // helper to compute viewer choice weight for a display kink (0..3)
          const computeViewerWeight = (d: DisplayKink) => {
            try {
              const own = core.characters.ownProfile;
              if (!own || !own.character) return 0;

              // For stock kinks, own.character.kinks contains the viewer's choice.
              // If this kink has a swapped counterpart (giving/receiving), also
              // check that mapped kink so the viewer's receiving/giving choice
              // influences ordering for the counterpart.
              let kinkIdToCheck = d.id;
              const swap = (kinkComparisonSwaps as any)[d.id];
              if (typeof swap === 'number') kinkIdToCheck = swap;

              const ownKinkValue =
                own.character.kinks[kinkIdToCheck as any] ??
                own.character.kinks[d.id as any];
              const resolved = resolveKinkChoice(own, ownKinkValue);
              switch (resolved) {
                case 'favorite':
                  return 3;
                case 'yes':
                  return 2;
                case 'maybe':
                  return 1;
                default:
                  return 0;
              }
            } catch (e) {
              return 0;
            }
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
            // attach viewer weight for stock kinks
            (newKink as any).viewerChoiceWeight = computeViewerWeight(newKink);
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
            if (custom.hasSubkinks) {
              // compute viewer weights for subkinks then sort
              for (const sk of custom.subkinks)
                (sk as any).viewerChoiceWeight = computeViewerWeight(sk);
              custom.subkinks.sort(kinkSorter);
            }
            outputKinks[<string>custom.choice].push(custom);
          }

          for (const choice in outputKinks) {
            // compute viewer weights for stock items in this bucket
            for (const dk of outputKinks[choice])
              (dk as any).viewerChoiceWeight =
                (dk as any).viewerChoiceWeight || computeViewerWeight(dk);
            outputKinks[choice].sort(kinkSorter);
          }

          return <{ [key in KinkChoice]: DisplayKink[] }>outputKinks;
        }
      );

      watch(
        () => props.character,
        async () => {
          if (props.character && props.character.is_self) return;

          expandedCustoms.value = props.autoExpandCustoms;

          if (core.state.settings.risingAutoCompareKinks) {
            await compareKinks(core.characters.ownProfile, true);
          }
        }
      );

      watch(highlightGroup, (group: number | undefined) => {
        highlightKinks(group ?? null);
      });

      onMounted(async () => {
        expandedCustoms.value = props.autoExpandCustoms;
        if (props.character && props.character.is_self) return;

        if (core.state.settings.risingAutoCompareKinks) {
          await compareKinks(core.characters.ownProfile, true);
        }
      });

      return {
        shared,
        characterToCompare,
        highlightGroup,
        sortByViewerPriorities,
        loading,
        comparing,
        highlighting,
        comparison,
        expandedCustoms,
        l,
        _,
        toggleExpandedCustomKinks,
        compareKinks,
        kinkGroups,
        compareButtonText,
        groupedKinks
      };
    }
  });
</script>

<template>
  <div class="character-kinks-block">
    <div
      class="compare-highlight-block row justify-content-between align-items-stretch"
    >
      <div class="expand-custom-kinks-block col-12 col-lg-2 col-xl-2 d-flex">
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

        <!-- Character avatar: prefer cached override, fall back to static avatar URL -->
        <img
          v-if="characterToCompare !== null && characterToCompare !== undefined"
          :src="getCompareAvatarUrl()"
          class="character-avatar icon compare-avatar"
          alt="avatar"
        />

        <!-- small filter icon merged into compare area; highlighted when active -->
        <button
          type="button"
          class="btn"
          :class="
            sortByViewerPriorities ? 'btn-primary' : 'btn-outline-secondary'
          "
          @click.stop="toggleSort"
          :aria-pressed="sortByViewerPriorities"
          :title="l('profile.sortByMyPriorities')"
        >
          <i class="fa-solid fa-filter"></i>
        </button>

        <!-- Compare / Refresh button (highlights when comparison is active) -->
        <button
          :class="comparing ? 'btn btn-primary' : 'btn btn-outline-secondary'"
          @click="onCompareClick"
          :disabled="loading || !characterToCompare"
        >
          {{ compareButtonText }}
        </button>
      </div>

      <div class="col-12 col-lg-2 col-xl-2 d-flex">
        <select v-model="highlightGroup" class="form-select">
          <option :value="undefined">{{ l('profile.none') }}</option>
          <option v-for="group in kinkGroups" :value="group.id" :key="group.id">
            {{ group.name }}
          </option>
        </select>
      </div>

      <div class="col-12 col-lg-2 col-xl-2 d-flex">
        <div class="input-group w-100">
          <span class="input-group-text"
            ><span class="fas fa-search"></span
          ></span>
          <input
            class="form-control"
            v-model="search"
            :placeholder="l('filter')"
            type="text"
          />
        </div>
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
      const search = ref('');
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
        overridingCharacter?: Character
      ): Promise<void> => {
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
        } finally {
          loading.value = false;
        }
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
        return l('common.compare');
      });

      const toggleSort = () => {
        sortByViewerPriorities.value = !sortByViewerPriorities.value;
      };

      const clearComparison = () => {
        comparison.value = {};
        comparing.value = false;
        loading.value = false;
      };

      const onCompareClick = async () => {
        if (loading.value) return;
        if (comparing.value) {
          clearComparison();
          return;
        }

        await compareKinks();
      };

      const getCompareAvatarUrl = (): string => {
        try {
          const id = characterToCompare.value;
          if (id === undefined || id === null) return '';

          // Try to find the character name from the site characters list
          const scs = Utils.characters || [];
          const found = scs.find((c: any) => c.id === id);
          const name = found ? found.name : undefined;

          if (name) {
            const c = core.characters.get(name);
            if (c && c.overrides && c.overrides.avatarUrl)
              return c.overrides.avatarUrl;
            return Utils.avatarURL(name);
          }

          return '';
        } catch (e) {
          return '';
        }
      };

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
            viewerChoiceWeight: 0,
            subkinks: [],
            key: kink.id.toString()
          });

          const kinkSorter = (a: DisplayKink, b: DisplayKink) => {
            if (a.isCustom !== b.isCustom) return a.isCustom ? -1 : 1;

            if (sortByViewerPriorities.value) {
              const wa = a.viewerChoiceWeight || 0;
              const wb = b.viewerChoiceWeight || 0;
              if (wa !== wb) return wb - wa;
            }

            if (a.name === b.name) return 0;
            return a.name < b.name ? -1 : 1;
          };

          const computeViewerWeight = (d: DisplayKink) => {
            try {
              let kinkIdToCheck = d.id;
              const swap = kinkComparisonSwaps[d.id];
              if (typeof swap === 'number') kinkIdToCheck = swap;

              // Prefer the currently selected comparison mapping if available
              const cmp = comparison.value;
              let resolved: string | null = null;

              if (cmp && Object.keys(cmp).length > 0) {
                const val = cmp[kinkIdToCheck] ?? cmp[d.id];
                if (typeof val === 'string') resolved = val;
                else if (typeof val === 'number') {
                  // numeric values may reference custom kinks; try to resolve via props.character customs
                  // attempt to resolve as a custom id mapping if possible
                  const custom = props.character.character.customs[val];
                  if (custom) resolved = custom.choice;
                }
              } else {
                const own = core.characters.ownProfile;
                if (!own || !own.character) return 0;
                const ownKinkValue =
                  own.character.kinks[kinkIdToCheck] ??
                  own.character.kinks[d.id];
                resolved = resolveKinkChoice(own, ownKinkValue);
              }

              switch (resolved) {
                case 'favorite':
                  return 4;
                case 'yes':
                  return 3;
                case 'maybe':
                  return 2;
                case 'no':
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
            newKink.viewerChoiceWeight = computeViewerWeight(newKink);
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
              for (const sk of custom.subkinks)
                sk.viewerChoiceWeight = computeViewerWeight(sk);
              custom.subkinks.sort(kinkSorter);
            }
            outputKinks[<string>custom.choice].push(custom);
          }

          const filter = search.value.trim().toLowerCase();

          for (const choice in outputKinks) {
            for (const dk of outputKinks[choice])
              dk.viewerChoiceWeight =
                dk.viewerChoiceWeight ?? computeViewerWeight(dk);

            if (filter.length > 0) {
              outputKinks[choice] = outputKinks[choice].filter(d => {
                const name = (d.name || '').toLowerCase();
                if (d.isCustom) {
                  const custom = d;
                  if (name.indexOf(filter) !== -1) return true;
                  if (
                    Array.isArray(custom.subkinks) &&
                    custom.subkinks.length
                  ) {
                    const matched = custom.subkinks.filter(
                      sk => (sk.name || '').toLowerCase().indexOf(filter) !== -1
                    );
                    custom.subkinks = matched;
                    return matched.length > 0;
                  }
                  return false;
                }

                return name.indexOf(filter) !== -1;
              });
            }

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
            await compareKinks(core.characters.ownProfile);
          }
        }
      );

      watch(highlightGroup, (group: number | undefined) => {
        highlightKinks(group ?? null);
      });

      // Auto-compare when user selects a character to compare
      watch(characterToCompare, async (val: any) => {
        if (!val) {
          clearComparison();
          return;
        }

        // run an immediate compare (refresh)
        await compareKinks();
      });

      onMounted(async () => {
        expandedCustoms.value = props.autoExpandCustoms;
        if (props.character && props.character.is_self) return;

        if (core.state.settings.risingAutoCompareKinks) {
          await compareKinks(core.characters.ownProfile);
        }
      });

      return {
        shared,
        characterToCompare,
        getCompareAvatarUrl,
        highlightGroup,
        search,
        sortByViewerPriorities,
        loading,
        comparing,
        highlighting,
        comparison,
        expandedCustoms,
        l,
        _,
        toggleExpandedCustomKinks,
        toggleSort,
        clearComparison,
        onCompareClick,
        compareKinks,
        kinkGroups,
        compareButtonText,
        groupedKinks
      };
    }
  });
</script>

<style scoped>
  .compare-highlight-block > .col-12.d-flex,
  .compare-highlight-block > .col-12 {
    display: flex;
    align-items: stretch;
  }

  .compare-highlight-block .d-flex > .btn,
  .compare-highlight-block .d-flex > .form-select,
  .compare-highlight-block .input-group > .form-control,
  .compare-highlight-block .input-group > .input-group-text,
  .compare-highlight-block .quick-compare-block > character-select,
  .compare-highlight-block .quick-compare-block > button {
    height: 100%;
  }

  .compare-highlight-block .input-group .input-group-text {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .quick-compare-block {
    display: flex;
    width: 100%;
    align-items: center; /* center children so avatar doesn't stretch the row */
  }
  .quick-compare-block > character-select {
    flex: 1 1 auto;
    min-width: 0;
  }
  .quick-compare-block > button {
    flex: 0 0 auto;
  }

  .compare-avatar {
    flex: 0 0 auto;
    width: 36px;
    height: 36px;
    max-height: 36px;
    max-width: 36px;
    object-fit: cover;
    border-radius: 4px;
    align-self: center;
  }
</style>

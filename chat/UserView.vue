<!-- Linebreaks inside this template will break BBCode views -->
<template>
  <span
    :class="userClass"
    v-bind:bbcodeTag.prop="'user'"
    v-bind:character.prop="character"
    v-bind:channel.prop="channel"
    @mouseover.prevent="show()"
    @mouseenter.prevent="show()"
    @mouseleave.prevent="dismiss()"
    @click.middle.prevent.stop="toggleStickyness()"
    @click.right.passive="dismiss(true)"
    @click.left.passive="dismiss(true)"
    ><img v-if="!!avatar" :src="safeAvatarUrl" class="user-avatar" /><span
      v-if="isMarkerShown"
      :class="genderClass"
    ></span
    ><span v-if="!!statusClass" :class="statusClass"></span
    ><span v-if="!!rankIcon" :class="rankIcon"></span
    ><span v-if="!!devIcon" :class="devIcon"></span
    ><span v-if="!!contributorIcon" :class="contributorIcon"></span>
    <span v-if="!!smartFilterIcon" :class="smartFilterIcon"></span
    >{{ character.name
    }}<span v-if="!!matchClass" :class="matchClass">{{
      getMatchScoreTitle(matchScore)
    }}</span></span
  >
</template>

<script lang="ts">
  import {
    computed,
    defineComponent,
    onBeforeUnmount,
    onDeactivated,
    onMounted,
    PropType,
    ref,
    toRefs,
    watch
  } from 'vue';
  import { Channel, Character } from '../fchat';
  import { Score } from '../learn/matcher';
  import core from './core';
  import { EventBus } from './preview/event-bus';
  import { kinkMatchWeights, Scoring } from '../learn/matcher-types';
  import { characterImage } from './common';
  import { isHorizonDev, isHorizonContributor } from './profile_api';
  import { CharacterColor } from './../fchat/characters';

  export function getStatusIcon(status: Character.Status): string {
    switch (status) {
      case 'online':
        return 'far fa-user';
      case 'looking':
        return 'fa fa-eye';
      case 'dnd':
        return 'fa fa-minus-circle';
      case 'offline':
        return 'fa fa-ban';
      case 'away':
        return 'far fa-circle';
      case 'busy':
        return 'fa fa-cog';
      case 'idle':
        return 'far fa-clock';
      case 'crown':
        return 'fa fa-birthday-cake';
    }
  }

  export function getGenderIcon(
    gender: Character.Gender,
    status: Character.Status
  ): string {
    if (status !== 'offline') {
      switch (gender) {
        case 'None':
          return 'fa-fw fa-genderless';
        case 'Male':
          return 'fa-fw fa-mars';
        case 'Female':
          return 'fa-fw fa-venus';
        case 'Shemale':
          return 'fa-fw fa-mars-and-venus';
        case 'Herm':
          return 'fa-fw fa-mercury';
        case 'Male-Herm':
          return 'fa-fw fa-mars-stroke-v';
        case 'Cunt-boy':
          return 'fa-fw fa-mars-stroke-h';
        case 'Transgender':
          return 'fa-fw fa-transgender';
      }
    }

    return 'fa-fw fa-times';
  }

  export interface StatusClasses {
    rankIcon: string | null;
    devIcon: string | null;
    contributorIcon: string | null;
    smartFilterIcon: string | null;
    genderClass: string | null;
    statusClass: string | null;
    matchClass: string | null;
    matchScore: number | string | null;
    userClass: string;
    isBookmark: boolean;
  }

  export function getStatusClasses(
    character: Character,
    channel: Channel | undefined,
    showStatus: boolean,
    showBookmark: boolean,
    showMatch: boolean,
    loadColor: boolean
  ): StatusClasses {
    let rankIcon: string | null = null;
    let devIcon: string | null = null;
    let statusClass = null;
    let matchClass = null;
    let matchScore = null;
    let smartFilterIcon: string | null = null;
    let genderClass = null;
    let gender = 'none';
    let useOfflineColor = false;

    if (character.isChatOp) {
      rankIcon = 'far fa-gem';
    } else if (channel !== undefined) {
      rankIcon =
        channel.owner === character.name
          ? 'fa fa-key'
          : channel.opList.indexOf(character.name) !== -1
            ? channel.id.substr(0, 4) === 'adh-'
              ? 'fa fa-shield-alt'
              : 'fa fa-star'
            : null;
    }

    // Check for dev badge
    if (
      isHorizonDev(character.name) &&
      core.state.settings.horizonShowDeveloperBadges
    ) {
      devIcon = 'fa fa-wrench';
    }

    // Check for contributor badge
    let contributorIcon: string | null = null;
    if (
      isHorizonContributor(character.name) &&
      core.state.settings.horizonShowDeveloperBadges
    ) {
      contributorIcon = 'fa fa-code';
    }

    if (showStatus || character.status === 'crown')
      statusClass = `fa-fw ${getStatusIcon(character.status)}`;

    if (core.connection.character) {
      const cache =
        (showMatch && core.state.settings.risingAdScore) ||
        core.state.settings.risingFilter.showFilterIcon
          ? core.cache.profileCache.getSync(character.name)
          : undefined;

      // undefined == not interested
      // null == no cache hit
      if (
        loadColor &&
        core.cache.hasCacheStarted &&
        core.state.settings.horizonShowCustomCharacterColors &&
        character.overrides.characterColor === undefined
      ) {
        //Don't bother checking again if we don't get a result.
        core.characters.setOverride(character.name, 'characterColor', null);
        core.cache.addProfile(character.name, true, true);
      }
      if (cache === null && showMatch) {
        void core.cache.addProfile(character.name);
      }

      if (core.state.settings.risingAdScore && showMatch && cache) {
        if (
          cache.match.searchScore >= kinkMatchWeights.perfectThreshold &&
          cache.match.matchScore === Scoring.MATCH
        ) {
          matchClass = 'match-found perfect';
          matchScore = 'perfect';
        } else {
          matchClass = `match-found ${Score.getClasses(cache.match.matchScore)}`;
          matchScore = cache.match.matchScore;
        }
      }

      if (
        core.state.settings.risingFilter.showFilterIcon &&
        cache?.match.isFiltered
      ) {
        smartFilterIcon = 'user-filter fas fa-filter';
      }
      useOfflineColor =
        core.state.settings.horizonChangeOfflineColor &&
        character.status == 'offline';

      const baseGender = character.overrides.gender || character.gender;
      gender =
        baseGender !== undefined && !useOfflineColor
          ? baseGender.toLowerCase()
          : 'none';

      if (character.gender) {
        if (!core.state.settings.horizonGenderMarkerOrigColor) {
          genderClass = `fa ${getGenderIcon(character.gender, character.status)}`;
        } else {
          genderClass =
            `fa ${getGenderIcon(character.gender, character.status)}` +
            ` gender-icon-${gender}`;
        }
      }
    }

    const isBookmark =
      showBookmark &&
      core.connection.isOpen &&
      core.state.settings.colorBookmarks &&
      (character.isFriend || character.isBookmarked);

    const userClass =
      `user-view` +
      (isBookmark && !useOfflineColor ? ' user-bookmark' : '') +
      (character.overrides.characterColor !== undefined &&
      !useOfflineColor &&
      character.overrides.characterColor !== CharacterColor.none
        ? ` ${CharacterColor[character.overrides.characterColor]}NameText`
        : ` gender-${gender}`);
    // `user-view gender-${gender}${isBookmark ? ' user-bookmark' : ''}`;

    return {
      genderClass: genderClass ? `user-gender ${genderClass}` : null,
      rankIcon: rankIcon ? `user-rank ${rankIcon}` : null,
      devIcon: devIcon ? `user-dev ${devIcon}` : null,
      contributorIcon: contributorIcon
        ? `user-contributor ${contributorIcon}`
        : null,
      statusClass: statusClass ? `user-status ${statusClass}` : null,
      matchClass,
      matchScore,
      userClass,
      smartFilterIcon,
      isBookmark
    };
  }

  export default defineComponent({
    name: 'UserView',
    props: {
      character: {
        type: Object as PropType<Character>,
        required: true
      },
      channel: {
        type: Object as PropType<Channel>,
        required: false
      },
      showStatus: {
        type: Boolean,
        default: true
      },
      bookmark: {
        type: Boolean,
        default: true
      },
      match: {
        type: Boolean,
        default: false
      },
      preview: {
        type: Boolean,
        default: true
      },
      avatar: {
        type: Boolean,
        default: false
      },
      isMarkerShown: {
        type: Boolean,
        default: false
      },
      useOriginalAvatar: {
        type: Boolean,
        default: false
      },
      loadColor: {
        type: Boolean,
        default: true
      }
    },
    setup(props) {
      const { character, avatar, isMarkerShown } = toRefs(props);
      const userClass = ref('');
      const rankIcon = ref<string | null>(null);
      const devIcon = ref<string | null>(null);
      const contributorIcon = ref<string | null>(null);
      const smartFilterIcon = ref<string | null>(null);
      const genderClass = ref<string | null>(null);
      const statusClass = ref<string | null>(null);
      const matchClass = ref<string | null>(null);
      const matchScore = ref<number | string | null>(null);
      const avatarUrl = ref('');

      const scoreWatcher = ref<((event: any) => void) | null>(null);

      const update = () => {
        const res = getStatusClasses(
          props.character,
          props.channel,
          !!props.showStatus,
          !!props.bookmark,
          !!props.match,
          props.loadColor
        );

        rankIcon.value = res.rankIcon;
        devIcon.value = res.devIcon;
        contributorIcon.value = res.contributorIcon;
        smartFilterIcon.value = res.smartFilterIcon;
        genderClass.value = res.genderClass;
        statusClass.value = res.statusClass;
        matchClass.value = res.matchClass;
        matchScore.value = res.matchScore;
        userClass.value = res.userClass;
        avatarUrl.value = characterImage(
          props.character.name,
          props.useOriginalAvatar
        );
      };

      const ensureScoreWatcher = () => {
        if (!props.match || matchClass.value) return;
        if (scoreWatcher.value) return;

        scoreWatcher.value = (event: any): void => {
          if (
            event.character &&
            event.character.character.name === props.character.name
          ) {
            update();

            if (scoreWatcher.value) {
              EventBus.$off('character-score', scoreWatcher.value);
              scoreWatcher.value = null;
            }
          }
        };

        EventBus.$on('character-score', scoreWatcher.value);
      };

      watch(
        () => [
          props.character,
          props.channel,
          props.showStatus,
          props.bookmark,
          props.match,
          props.loadColor,
          props.useOriginalAvatar
        ],
        () => {
          update();
          ensureScoreWatcher();
        },
        { immediate: true, deep: true }
      );

      watch(
        () => props.match,
        value => {
          if (!value && scoreWatcher.value) {
            EventBus.$off('character-score', scoreWatcher.value);
            scoreWatcher.value = null;
          } else if (value) {
            ensureScoreWatcher();
          }
        }
      );

      onMounted(() => {
        EventBus.$on('configuration-update', update);
        ensureScoreWatcher();
      });

      onBeforeUnmount(() => {
        if (scoreWatcher.value) {
          EventBus.$off('character-score', scoreWatcher.value);
        }
        EventBus.$off('configuration-update', update);
        dismiss();
      });

      onDeactivated(() => {
        dismiss();
      });

      const getMatchScoreTitle = (score: number | string | null): string => {
        switch (score) {
          case 'perfect':
            return 'Perfect';
          case Scoring.MATCH:
            return 'Great';
          case Scoring.WEAK_MATCH:
            return 'Good';
          case Scoring.WEAK_MISMATCH:
            return 'Maybe';
          case Scoring.MISMATCH:
            return 'No';
        }

        return '';
      };

      const getCharacterUrl = (): string =>
        `flist-character://${props.character.name}`;

      const dismiss = (force: boolean = false): void => {
        if (!props.preview) {
          return;
        }

        EventBus.$emit('imagepreview-dismiss', {
          url: getCharacterUrl(),
          force
        });
      };

      const show = (): void => {
        if (!props.preview) {
          return;
        }

        EventBus.$emit('imagepreview-show', { url: getCharacterUrl() });
      };

      const toggleStickyness = (): void => {
        if (!props.preview) {
          return;
        }

        EventBus.$emit('imagepreview-toggle-stickyness', {
          url: getCharacterUrl()
        });
      };

      const safeAvatarUrl = computed(() => avatarUrl.value || '');

      return {
        character,
        avatar,
        isMarkerShown,
        userClass,
        rankIcon,
        devIcon,
        contributorIcon,
        smartFilterIcon,
        genderClass,
        statusClass,
        matchClass,
        matchScore,
        safeAvatarUrl,
        show,
        dismiss,
        toggleStickyness,
        getMatchScoreTitle
      };
    }
  });
</script>

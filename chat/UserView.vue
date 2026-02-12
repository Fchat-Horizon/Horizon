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
    ><span v-if="!!devIcon" :class="devIcon" title="Horizon Maintainer"></span
    ><span
      v-if="!!contributorIcon"
      :class="contributorIcon"
      :title="contributorTitle"
    ></span
    ><span
      v-if="!!translatorIcon"
      :class="translatorIcon"
      :title="translatorTitle"
    ></span
    ><span v-if="!!staffIcon" :class="staffIcon" :title="staffTitle"></span
    ><span
      v-if="!!supporterIcon"
      :class="supporterIcon"
      :title="supporterTitle"
    ></span
    ><span
      v-if="!!sponsorIcon"
      :class="sponsorIcon"
      :title="sponsorTitle"
    ></span
    ><span v-if="!!smartFilterIcon" :class="smartFilterIcon"></span
    >{{ character.name
    }}<span v-if="!!matchClass" :class="matchClass">{{
      getMatchScoreTitle(matchScore)
    }}</span></span
  >
</template>

<script lang="ts">
  import Vue from 'vue';
  import { Channel, Character } from '../fchat';
  import { Score } from '../learn/matcher';
  import core from './core';
  import { EventBus } from './preview/event-bus';
  import { kinkMatchWeights, Scoring } from '../learn/matcher-types';
  import { characterImage } from './common';
  import {
    getContributorAlias,
    getTranslatorAlias,
    getTranslatorLanguages,
    getSponsorAlias,
    getStaffAlias,
    getStaffRole,
    getSupporterAlias,
    isHorizonContributor,
    isHorizonTranslator,
    isHorizonDev,
    isHorizonSponsor,
    isHorizonStaff,
    isHorizonSupporter
  } from './profile_api';
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
    translatorIcon: string | null;
    staffIcon: string | null;
    supporterIcon: string | null;
    sponsorIcon: string | null;
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

    let translatorIcon: string | null = null;
    if (
      isHorizonTranslator(character.name) &&
      core.state.settings.horizonShowDeveloperBadges
    ) {
      translatorIcon = 'fa fa-language';
    }

    let staffIcon: string | null = null;
    let supporterIcon: string | null = null;
    let sponsorIcon: string | null = null;

    // should likely change this icon later, lets get the pr out first
    if (
      isHorizonStaff(character.name) &&
      core.state.settings.horizonShowDeveloperBadges
    ) {
      staffIcon = 'fa fa-id-badge';
    }

    if (
      isHorizonSupporter(character.name) &&
      core.state.settings.horizonShowDeveloperBadges
    ) {
      supporterIcon = 'fa fa-handshake';
    }

    if (
      isHorizonSponsor(character.name) &&
      core.state.settings.horizonShowDeveloperBadges
    ) {
      sponsorIcon = 'fa fa-cookie';
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
      translatorIcon: translatorIcon
        ? `user-translator ${translatorIcon}`
        : null,
      staffIcon: staffIcon ? `user-staff ${staffIcon}` : null,
      supporterIcon: supporterIcon ? `user-supporter ${supporterIcon}` : null,
      sponsorIcon: sponsorIcon ? `user-sponsor ${sponsorIcon}` : null,
      statusClass: statusClass ? `user-status ${statusClass}` : null,
      matchClass,
      matchScore,
      userClass,
      smartFilterIcon,
      isBookmark
    };
  }

  export default Vue.extend({
    components: {},
    props: {
      character: { required: true as const },
      channel: {},
      showStatus: { default: true },
      bookmark: { default: true },
      match: { default: false },
      preview: { default: true },
      avatar: { default: false },
      isMarkerShown: { default: false },
      useOriginalAvatar: { default: false },
      loadColor: { default: true }
    },
    data() {
      return {
        userClass: '',
        rankIcon: null as string | null,
        devIcon: null as string | null,
        contributorIcon: null as string | null,
        translatorIcon: null as string | null,
        staffIcon: null as string | null,
        supporterIcon: null as string | null,
        sponsorIcon: null as string | null,
        smartFilterIcon: null as string | null,
        genderClass: null as string | null,
        statusClass: null as string | null,
        matchClass: null as string | null,
        matchScore: null as number | string | null,
        avatarUrl: '',
        // tslint:disable-next-line no-any
        scoreWatcher: null as ((event: any) => void) | null
      };
    },
    computed: {
      safeAvatarUrl(): string {
        return this.avatarUrl || '';
      },
      staffTitle(): string {
        const alias = getStaffAlias((this as any).character.name);
        const role = getStaffRole((this as any).character.name);
        if (alias && role) return `Horizon Staff (${role}) "${alias}"`;
        if (alias) return `Horizon Staff "${alias}"`;
        return role ? `Horizon Staff (${role})` : 'Horizon Staff';
      },
      contributorTitle(): string {
        const alias = getContributorAlias((this as any).character.name);
        return alias ? `Horizon Contributor "${alias}"` : 'Horizon Contributor';
      },
      translatorTitle(): string {
        const alias = getTranslatorAlias((this as any).character.name);
        const langs = getTranslatorLanguages((this as any).character.name);
        const langLabel = langs.length > 0 ? ` (${langs.join(', ')})` : '';
        if (alias) return `Horizon Translator${langLabel} "${alias}"`;
        return `Horizon Translator${langLabel}`;
      },
      supporterTitle(): string {
        const alias = getSupporterAlias((this as any).character.name);
        return alias ? `Horizon Supporter "${alias}"` : 'Horizon Supporter';
      },
      sponsorTitle(): string {
        const alias = getSponsorAlias((this as any).character.name);
        return alias ? `Horizon Sponsor "${alias}"` : 'Horizon Sponsor';
      }
    },
    watch: {
      'character.status'(): void {
        this.update();
      },
      'character.overrides.avatarUrl'(): void {
        this.update();
      },
      'character.overrides.characterColor'(): void {
        this.update();
      }
    },
    mounted(): void {
      this.update();
      // Refresh on global configuration changes (e.g., toggling developer badges)
      EventBus.$on('configuration-update', this.update);

      if ((this as any).match && !this.matchClass) {
        if (this.scoreWatcher) {
          EventBus.$off('character-score', this.scoreWatcher);
        }

        // tslint:disable-next-line no-unsafe-any no-any
        this.scoreWatcher = (event: any): void => {
          // console.log('scoreWatcher', event);

          // tslint:disable-next-line no-unsafe-any no-any
          if (
            event.character &&
            event.character.character.name === (this as any).character.name
          ) {
            this.update();

            if (this.scoreWatcher) {
              EventBus.$off('character-score', this.scoreWatcher);

              this.scoreWatcher = null;
            }
          }
        };

        EventBus.$on('character-score', this.scoreWatcher);
      }
    },
    beforeDestroy(): void {
      if (this.scoreWatcher)
        EventBus.$off('character-score', this.scoreWatcher);
      EventBus.$off('configuration-update', this.update);

      this.dismiss();
    },
    deactivated(): void {
      this.dismiss();
    },
    beforeUpdate(): void {
      this.update();
    },
    methods: {
      update(): void {
        // console.log('user.view.update', this.character.name);

        const res = getStatusClasses(
          (this as any).character,
          (this as any).channel,
          !!(this as any).showStatus,
          !!(this as any).bookmark,
          !!(this as any).match,
          (this as any).loadColor
        );

        this.rankIcon = res.rankIcon;
        this.devIcon = res.devIcon;
        this.contributorIcon = res.contributorIcon;
        this.translatorIcon = res.translatorIcon;
        this.staffIcon = res.staffIcon;
        this.supporterIcon = res.supporterIcon;
        this.sponsorIcon = res.sponsorIcon;
        this.smartFilterIcon = res.smartFilterIcon;
        this.genderClass = res.genderClass;
        this.statusClass = res.statusClass;
        this.matchClass = res.matchClass;
        this.matchScore = res.matchScore;
        this.userClass = res.userClass;
        this.avatarUrl = characterImage(
          (this as any).character.name,
          (this as any).useOriginalAvatar
        );
      },

      getMatchScoreTitle(score: number | string | null): string {
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
      },

      getCharacterUrl(): string {
        return `flist-character://${(this as any).character.name}`;
      },

      dismiss(force: boolean = false): void {
        if (!(this as any).preview) {
          return;
        }

        EventBus.$emit('imagepreview-dismiss', {
          url: this.getCharacterUrl(),
          force
        });
      },

      show(): void {
        if (!(this as any).preview) {
          return;
        }

        EventBus.$emit('imagepreview-show', { url: this.getCharacterUrl() });
      },

      toggleStickyness(): void {
        if (!(this as any).preview) {
          return;
        }

        EventBus.$emit('imagepreview-toggle-stickyness', {
          url: this.getCharacterUrl()
        });
      }
    }
  });
</script>

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
    ><img v-if="!!avatar" :src="avatarUrl" class="user-avatar" /><span v-if="!!statusClass" :class="statusClass"></span
    ><span v-if="!!rankIcon" :class="rankIcon"></span><span v-if="!!smartFilterIcon" :class="smartFilterIcon"></span>{{ character.name
    }}<span v-if="!!matchClass" :class="matchClass">{{ getMatchScoreTitle(matchScore) }}</span></span
  >
</template>

<script lang="ts">
  import { Component, Hook, Prop, Watch } from '@f-list/vue-ts';
  import Vue from 'vue';
  import { Channel, Character } from '../fchat';
  import { Score } from '../learn/matcher';
  import core from './core';
  import { EventBus } from './preview/event-bus';
  import { kinkMatchWeights, Scoring } from '../learn/matcher-types';
  import { characterImage } from './common';

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

  export interface StatusClasses {
    rankIcon: string | null;
    smartFilterIcon: string | null;
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
    showMatch: boolean
  ): StatusClasses {
    let rankIcon: string | null = null;
    let statusClass = null;
    let matchClass = null;
    let matchScore = null;
    let smartFilterIcon: string | null = null;

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

    if (showStatus || character.status === 'crown') statusClass = `fa-fw ${getStatusIcon(character.status)}`;

    const cache =
      (showMatch && core.state.settings.risingAdScore) || core.state.settings.risingFilter.showFilterIcon
        ? core.cache.profileCache.getSync(character.name)
        : undefined;

    // undefined == not interested
    // null == no cache hit
    if (cache === null && showMatch) {
      void core.cache.addProfile(character.name);
    }

    if (core.state.settings.risingAdScore && showMatch && cache) {
      if (cache.match.searchScore >= kinkMatchWeights.unicornThreshold && cache.match.matchScore === Scoring.MATCH) {
        matchClass = 'match-found unicorn';
        matchScore = 'unicorn';
      } else {
        matchClass = `match-found ${Score.getClasses(cache.match.matchScore)}`;
        matchScore = cache.match.matchScore;
      }
    }

    if (core.state.settings.risingFilter.showFilterIcon && cache?.match.isFiltered) {
      smartFilterIcon = 'user-filter fas fa-filter';
    }

    const baseGender = character.overrides.gender || character.gender;
    const gender = baseGender !== undefined ? baseGender.toLowerCase() : 'none';

    const isBookmark =
      showBookmark && core.connection.isOpen && core.state.settings.colorBookmarks && (character.isFriend || character.isBookmarked);

    const userClass = `user-view gender-${gender}${isBookmark ? ' user-bookmark' : ''}`;

    return {
      rankIcon: rankIcon ? `user-rank ${rankIcon}` : null,
      statusClass: statusClass ? `user-status ${statusClass}` : null,
      matchClass,
      matchScore,
      userClass,
      smartFilterIcon,
      isBookmark
    };
  }

  @Component({
    components: {}
  })
  export default class UserView extends Vue {
    @Prop({ required: true })
    readonly character!: Character;

    @Prop()
    readonly channel?: Channel;

    @Prop()
    readonly showStatus?: boolean = true;

    @Prop({ default: true })
    readonly bookmark?: boolean = true;

    @Prop()
    readonly match?: boolean = false;

    @Prop({ default: true })
    readonly preview: boolean = true;

    @Prop({ default: false })
    readonly avatar: boolean = false;

    userClass = '';

    rankIcon: string | null = null;
    smartFilterIcon: string | null = null;
    statusClass: string | null = null;
    matchClass: string | null = null;
    matchScore: number | string | null = null;
    avatarUrl: string | null = null;

    // tslint:disable-next-line no-any
    scoreWatcher: ((event: any) => void) | null = null;

    @Hook('mounted')
    onMounted(): void {
      this.update();

      if (this.match && !this.matchClass) {
        if (this.scoreWatcher) {
          EventBus.$off('character-score', this.scoreWatcher);
        }

        // tslint:disable-next-line no-unsafe-any no-any
        this.scoreWatcher = (event: any): void => {
          // console.log('scoreWatcher', event);

          // tslint:disable-next-line no-unsafe-any no-any
          if (event.character && event.character.character.name === this.character.name) {
            this.update();

            if (this.scoreWatcher) {
              EventBus.$off('character-score', this.scoreWatcher);

              this.scoreWatcher = null;
            }
          }
        };

        EventBus.$on('character-score', this.scoreWatcher);
      }
    }

    @Hook('beforeDestroy')
    onBeforeDestroy(): void {
      if (this.scoreWatcher) EventBus.$off('character-score', this.scoreWatcher);

      this.dismiss();
    }

    @Hook('deactivated')
    deactivate(): void {
      this.dismiss();
    }

    @Hook('beforeUpdate')
    onBeforeUpdate(): void {
      this.update();
    }

    @Watch('character.status')
    onStatusUpdate(): void {
      this.update();
    }

    @Watch('character.overrides.avatarUrl')
    onAvatarUrlUpdate(): void {
      this.update();
    }

    update(): void {
      // console.log('user.view.update', this.character.name);

      const res = getStatusClasses(this.character, this.channel, !!this.showStatus, !!this.bookmark, !!this.match);

      this.rankIcon = res.rankIcon;
      this.smartFilterIcon = res.smartFilterIcon;
      this.statusClass = res.statusClass;
      this.matchClass = res.matchClass;
      this.matchScore = res.matchScore;
      this.userClass = res.userClass;
      this.avatarUrl = this.character.overrides.avatarUrl || characterImage(this.character.name);
    }

    getMatchScoreTitle(score: number | string | null): string {
      switch (score) {
        case 'unicorn':
          return 'Unicorn';

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
    }

    getCharacterUrl(): string {
      return `flist-character://${this.character.name}`;
    }

    dismiss(force: boolean = false): void {
      if (!this.preview) {
        return;
      }

      EventBus.$emit('imagepreview-dismiss', { url: this.getCharacterUrl(), force });
    }

    show(): void {
      if (!this.preview) {
        return;
      }

      EventBus.$emit('imagepreview-show', { url: this.getCharacterUrl() });
    }

    toggleStickyness(): void {
      if (!this.preview) {
        return;
      }

      EventBus.$emit('imagepreview-toggle-stickyness', { url: this.getCharacterUrl() });
    }
  }
</script>

<template>
  <div
    class="shadow-sm"
    style="margin: 10px 10px 5px; position: fixed; z-index: 1100"
  >
    <div
      id="userMenu"
      class="list-group bg-solid-text"
      :style="position"
      v-if="character && showContextMenu"
      style="position: fixed; display: block; min-width: 220px; z-index: 1100"
      ref="menu"
    >
      <div
        style="min-height: 65px; overflow: auto"
        id="userMenuUser"
        class="list-group-item"
        @click.stop
      >
        <img
          :src="characterImage"
          id="userMenu-avatar"
          style="width: 60px; height: 60px; margin-right: 5px; float: left"
          v-if="showAvatars"
        />
        <div id="userMenu-userInfo">
          <h4 style="margin: 0; line-height: 1" class="userInfo-name">
            {{ character.name }}
          </h4>
          <span class="userInfo-status">{{
            l('status.' + character.status)
          }}</span>
        </div>
      </div>
      <div class="userMenuInner">
        <bbcode
          id="userMenuStatus"
          :text="character.statusText"
          v-show="character.statusText"
          class="list-group-item"
          style="max-height: 200px; overflow: auto; clear: both"
        ></bbcode>

        <match-tags
          v-if="match"
          id="userMenuMatch"
          :match="match"
          class="list-group-item"
        ></match-tags>
      </div>
      <a
        tabindex="-1"
        :href="profileLink"
        target="_blank"
        v-if="showProfileFirst"
        class="list-group-item list-group-item-action"
      >
        <span class="fa fa-fw fa-user"></span
        ><span class="action-label">{{ l('user.profile') }}</span></a
      >
      <a
        tabindex="-1"
        href="#"
        @click.prevent="openConversation(true)"
        class="list-group-item list-group-item-action"
      >
        <span class="fa fa-fw fa-comment"></span
        ><span class="action-label">{{ l('user.messageJump') }}</span></a
      >
      <a
        tabindex="-1"
        href="#"
        @click.prevent="openConversation(false)"
        class="list-group-item list-group-item-action"
      >
        <span class="fa fa-fw fa-comment-medical"></span
        ><span class="action-label">{{ l('user.message') }}</span></a
      >

      <a
        tabindex="-1"
        :href="profileLink"
        target="_blank"
        v-if="!showProfileFirst"
        class="list-group-item list-group-item-action"
      >
        <span class="fas fa-fw fa-address-card"></span
        ><span class="action-label">{{ l('user.profile') }}</span></a
      >
      <a
        tabindex="-1"
        href="#"
        @click.prevent="showMemo()"
        class="list-group-item list-group-item-action"
      >
        <span class="fas fa-fw fa-sticky-note"></span
        ><span class="action-label">{{ l('user.memo') }}</span></a
      >
      <a
        tabindex="-1"
        href="#"
        @click.prevent="setBookmarked()"
        class="list-group-item list-group-item-action"
      >
        <span
          :class="
            character.isBookmarked
              ? 'fa fa-fw fa-bookmark'
              : 'far fa-fw fa-bookmark'
          "
        ></span
        ><span class="action-label">{{
          l('user.' + (character.isBookmarked ? 'unbookmark' : 'bookmark'))
        }}</span></a
      >
      <a
        tabindex="-1"
        href="#"
        @click.prevent="showAdLogs()"
        class="list-group-item list-group-item-action"
        :class="{ disabled: !hasAdLogs() }"
      >
        <span class="fa fa-fw fa-ad"></span
        ><span class="action-label">Show ad log</span>
      </a>
      <a
        tabindex="-1"
        href="#"
        @click.prevent="setHidden()"
        class="list-group-item list-group-item-action"
        v-show="!isChatOp"
      >
        <span class="fa fa-fw fa-eye-slash"></span
        ><span class="action-label">{{
          l('user.' + (isHidden ? 'unhide' : 'hide'))
        }}</span></a
      >
      <a
        tabindex="-1"
        href="#"
        @click.prevent="report()"
        class="list-group-item list-group-item-action"
        style="border-top-width: 1px"
      >
        <span class="fa fa-fw fa-exclamation-triangle"></span
        ><span class="action-label">{{ l('user.report') }}</span></a
      >
      <a
        tabindex="-1"
        href="#"
        @click.prevent="setIgnored()"
        class="list-group-item list-group-item-action"
      >
        <span class="fa fa-fw fa-minus-circle"></span
        ><span class="action-label">{{
          l('user.' + (character.isIgnored ? 'unignore' : 'ignore'))
        }}</span></a
      >
      <a
        tabindex="-1"
        href="#"
        @click.prevent="channelKick()"
        class="list-group-item list-group-item-action"
        v-if="isChannelMod"
      >
        <span class="fa fa-fw fa-ban"></span
        ><span class="action-label">{{ l('user.channelKick') }}</span></a
      >
      <a
        tabindex="-1"
        href="#"
        @click.prevent="chatKick()"
        style="color: #f00"
        class="list-group-item list-group-item-action"
        v-if="isChatOp"
        ><span class="fas fa-fw fa-trash"></span
        ><span class="action-label">{{ l('user.chatKick') }}</span></a
      >
    </div>
    <modal
      :action="l('user.memo.action')"
      ref="memo"
      :disabled="memoLoading"
      @submit="updateMemo"
      buttonText="Save and Close"
      dialogClass="w-100"
      iconClass="fas fa-note-sticky"
    >
      <div style="float: right; text-align: right">
        {{ getByteLength(memo) }} / 1000
      </div>
      <textarea
        class="form-control"
        v-model="memo"
        :disabled="memoLoading"
        maxlength="1000"
      ></textarea>
    </modal>
    <ad-view
      ref="adViewDialog"
      :character="character"
      v-if="character"
    ></ad-view>
  </div>
</template>

<script lang="ts">
  import { Component, Prop } from '@f-list/vue-ts';
  import Vue from 'vue';
  import { BBCodeView } from '../bbcode/view';
  import Modal from '../components/Modal.vue';
  import CharacterAdView from './character/CharacterAdView.vue';
  import {
    characterImage,
    errorToString,
    getByteLength,
    profileLink
  } from './common';
  import core from './core';
  import { Channel, Character } from './interfaces';
  import l from './localize';
  import ReportDialog from './ReportDialog.vue';
  import { Matcher, MatchReport } from '../learn/matcher';
  import _ from 'lodash';
  import MatchTags from './preview/MatchTags.vue';
  import { MemoManager } from './character/memo';

  @Component({
    components: {
      'match-tags': MatchTags,
      bbcode: BBCodeView(core.bbCodeParser),
      modal: Modal,
      'ad-view': CharacterAdView
    }
  })
  export default class UserMenu extends Vue {
    @Prop({ required: true })
    readonly reportDialog!: ReportDialog;
    l = l;
    showContextMenu = false;
    getByteLength = getByteLength;
    character: Character | undefined;
    position = { left: '', top: '' };
    characterImage: string | undefined;
    touchedElement: HTMLElement | undefined;
    channel: Channel | undefined;
    memo = '';
    // memoId = 0;
    memoLoading = false;
    match: MatchReport | null = null;
    memoManager?: MemoManager;

    openConversation(jump: boolean): void {
      const conversation = core.conversations.getPrivate(this.character!);
      if (jump) conversation.show();
    }

    setIgnored(): void {
      core.connection.send('IGN', {
        action: this.character!.isIgnored ? 'delete' : 'add',
        character: this.character!.name
      });
    }

    setBookmarked(): void {
      core.connection
        .queryApi(
          `bookmark-${this.character!.isBookmarked ? 'remove' : 'add'}.php`,
          { name: this.character!.name }
        )
        .catch((e: object) => alert(errorToString(e)));
    }

    setHidden(): void {
      const index = core.state.hiddenUsers.indexOf(this.character!.name);
      if (index !== -1) core.state.hiddenUsers.splice(index, 1);
      else core.state.hiddenUsers.push(this.character!.name);
    }

    report(): void {
      this.reportDialog.report(this.character!);
    }

    channelKick(): void {
      core.connection.send('CKU', {
        channel: this.channel!.id,
        character: this.character!.name
      });
    }

    chatKick(): void {
      core.connection.send('KIK', { character: this.character!.name });
    }

    async showMemo(): Promise<void> {
      this.memoLoading = true;
      this.memo = '';
      this.memoManager = new MemoManager(this.character!.name);

      (<Modal>this.$refs['memo']).show();

      try {
        await this.memoManager.load();

        this.memo = this.memoManager.get().memo;
        this.memoLoading = false;
      } catch (e) {
        alert(errorToString(e));
      }
    }

    updateMemo(): void {
      this.memoManager
        ?.set(this.memo)
        .catch((e: object) => alert(errorToString(e)));
    }

    showAdLogs(): void {
      if (!this.hasAdLogs()) {
        return;
      }

      (<CharacterAdView>this.$refs['adViewDialog']).show();
    }

    hasAdLogs(): boolean {
      if (!this.character) {
        return false;
      }

      const cache = core.cache.adCache.get(this.character.name);

      if (!cache) {
        return false;
      }

      return cache.count() > 0;
    }

    get isChannelMod(): boolean {
      if (this.channel === undefined) return false;
      if (core.characters.ownCharacter.isChatOp) return true;
      const member = this.channel.members[core.connection.character];
      return member !== undefined && member.rank > Channel.Rank.Member;
    }

    get isHidden(): boolean {
      return core.state.hiddenUsers.indexOf(this.character!.name) !== -1;
    }

    get isChatOp(): boolean {
      return core.characters.ownCharacter.isChatOp;
    }

    get showProfileFirst(): boolean {
      return core.state.settings.clickOpensMessage;
    }

    get showAvatars(): boolean {
      return core.state.settings.showAvatars;
    }

    get profileLink(): string | undefined {
      return profileLink(this.character!.name);
    }

    handleEvent(e: MouseEvent | TouchEvent): void {
      const touch =
        e.type === 'touchstart'
          ? (<TouchEvent>e).changedTouches[0]
          : <MouseEvent>e;
      let node = <
        HTMLElement & {
          character?: Character;
          channel?: Channel;
          touched?: boolean;
        }
      >touch.target;
      while (node !== document.body) {
        if (
          (e.type !== 'click' && node === this.$refs['menu']) ||
          node.id === 'userMenuStatus' ||
          node.className === 'spoiler-tag'
        )
          return;
        if (
          node.character !== undefined ||
          node.dataset['character'] !== undefined ||
          node.parentNode === null
        )
          break;
        node = node.parentElement!;
      }
      if (node.dataset['touch'] === 'false' && e.type !== 'contextmenu') return;
      if (!node.character)
        if (node.dataset['character'] !== undefined)
          node.character = core.characters.get(node.dataset['character']!);
        else {
          this.showContextMenu = false;
          this.touchedElement = undefined;
          return;
        }
      switch (e.type) {
        case 'click':
          if (node.dataset['character'] === undefined)
            if (node === this.touchedElement)
              // tslint:disable-next-line no-floating-promises
              this.openMenu(touch, node.character, node.channel || undefined);
            else this.onClick(node.character);
          e.preventDefault();
          break;
        case 'touchstart':
          this.touchedElement = node;
          break;
        case 'contextmenu':
          // tslint:disable-next-line no-floating-promises
          this.openMenu(touch, node.character, node.channel || undefined);
          e.preventDefault();
      }
    }

    private onClick(character: Character): void {
      this.character = character;
      if (core.state.settings.clickOpensMessage) this.openConversation(true);
      else window.open(this.profileLink);
      this.showContextMenu = false;
    }

    private async openMenu(
      touch: MouseEvent | Touch,
      character: Character,
      channel: Channel | undefined
    ): Promise<void> {
      this.channel = channel;
      this.character = character;
      this.characterImage = undefined;
      this.showContextMenu = true;
      this.position = { left: `${touch.clientX}px`, top: `${touch.clientY}px` };
      this.match = null;

      if (core.state.settings.risingComparisonInUserMenu) {
        const myProfile = core.characters.ownProfile;
        const theirProfile = await core.cache.profileCache.get(
          this.character.name
        );

        if (myProfile && theirProfile) {
          const match = Matcher.identifyBestMatchReport(
            myProfile.character,
            theirProfile.character.character
          );

          if (_.keys(match.merged).length > 0) {
            this.match = match;
          }
        }
      }

      this.$nextTick(() => {
        const menu = <HTMLElement>this.$refs['menu'];
        this.characterImage = characterImage(character.name);
        if (
          parseInt(this.position.left, 10) + menu.offsetWidth >
          window.innerWidth
        )
          this.position.left = `${window.innerWidth - menu.offsetWidth - 1}px`;
        if (
          parseInt(this.position.top, 10) + menu.offsetHeight >
          window.innerHeight
        )
          this.position.top = `${window.innerHeight - menu.offsetHeight - 1}px`;
      });
    }
  }
</script>

<style lang="scss">
  @import '~bootstrap/scss/functions';
  @import '~bootstrap/scss/variables';
  @import '~bootstrap/scss/mixins/breakpoints';

  #userMenu .list-group-item {
    padding: 3px 5px 3px 5px;
  }

  #userMenu-userInfo {
    max-width: 70%;
    overflow-x: hidden;
    & > .userInfo-name {
      width: min-content;
      min-width: 100%;
    }
  }

  #userMenu-userInfo,
  #userMenu-avatar {
    //display: inline-block;
  }

  #userMenu-userInfo {
    //width: 140px;
  }

  .userInfo-status {
    opacity: 0.7;
  }

  .userInfo-name {
    font-size: 1.3em;
    font-weight: bold;
  }

  #userMenu .list-group-item-action {
    font-size: 1.04em;
  }

  #userMenu .list-group-item .fa-fw,
  #userMenu .list-group-item .action-label {
    margin-left: 0.4rem;
  }

  #userMenu {
    border-radius: 15px;
    max-width: 265px;
  }

  #userMenu #userMenuUser {
    padding: 7px 10px 5px 10px;
  }

  #userMenuMatch,
  #userMenuStatus {
    background: none;
    width: min-content;
    min-width: 100%;
  }

  #userMenuMatch {
    max-width: 220px;
  }

  .userMenuInner {
    background-color: var(--scoreReportBg);
  }

  #userMenu .list-group-item-action {
    border-top-width: 0;
    z-index: -1;
  }
</style>

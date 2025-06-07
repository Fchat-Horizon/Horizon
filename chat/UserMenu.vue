<template>
  <div>
    <div
      id="userMenu"
      class="list-group"
      v-show="showContextMenu"
      :style="position"
      v-if="character"
      style="
        position: fixed;
        padding: 10px 10px 5px;
        display: block;
        width: 220px;
        z-index: 1100;
      "
      ref="menu"
    >
      <div
        style="min-height: 65px; padding: 5px; overflow: auto"
        class="list-group-item"
        @click.stop
      >
        <img
          :src="characterImage"
          style="width: 60px; height: 60px; margin-right: 5px; float: left"
          v-if="showAvatars"
        />
        <h5 style="margin: 0; line-height: 1">{{ character.name }}</h5>
        {{ l('status.' + character.status) }}
      </div>
      <bbcode
        id="userMenuStatus"
        :text="character.statusText"
        v-show="character.statusText"
        class="list-group-item"
        style="max-height: 200px; overflow: auto; clear: both"
      ></bbcode>

      <match-tags
        v-if="match"
        :match="match"
        class="list-group-item"
      ></match-tags>

      <a
        tabindex="-1"
        :href="profileLink"
        target="_blank"
        v-if="showProfileFirst"
        class="list-group-item list-group-item-action"
      >
        <span class="fa fa-fw fa-user"></span>{{ l('user.profile') }}</a
      >
      <a
        tabindex="-1"
        href="#"
        @click.prevent="openConversation(true)"
        class="list-group-item list-group-item-action"
      >
        <span class="fa fa-fw fa-comment"></span>{{ l('user.messageJump') }}</a
      >
      <a
        tabindex="-1"
        href="#"
        @click.prevent="openConversation(false)"
        class="list-group-item list-group-item-action"
      >
        <span class="fa fa-fw fa-plus"></span>{{ l('user.message') }}</a
      >
      <a
        tabindex="-1"
        :href="profileLink"
        target="_blank"
        v-if="!showProfileFirst"
        class="list-group-item list-group-item-action"
      >
        <span class="fa fa-fw fa-user"></span>{{ l('user.profile') }}</a
      >
      <a
        tabindex="-1"
        href="#"
        @click.prevent="showMemo()"
        class="list-group-item list-group-item-action"
      >
        <span class="far fa-fw fa-sticky-note"></span>{{ l('user.memo') }}</a
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
        >{{
          l('user.' + (character.isBookmarked ? 'unbookmark' : 'bookmark'))
        }}</a
      >
      <a
        tabindex="-1"
        href="#"
        @click.prevent="showAdLogs()"
        class="list-group-item list-group-item-action"
        :class="{ disabled: !hasAdLogs() }"
      >
        <span class="fa fa-fw fa-ad"></span>Show ad log
      </a>
      <a
        tabindex="-1"
        href="#"
        @click.prevent="setHidden()"
        class="list-group-item list-group-item-action"
        v-show="!isChatOp"
      >
        <span class="fa fa-fw fa-eye-slash"></span
        >{{ l('user.' + (isHidden ? 'unhide' : 'hide')) }}</a
      >
      <a
        tabindex="-1"
        href="#"
        @click.prevent="report()"
        class="list-group-item list-group-item-action"
        style="border-top-width: 1px"
      >
        <span class="fa fa-fw fa-exclamation-triangle"></span
        >{{ l('user.report') }}</a
      >
      <a
        tabindex="-1"
        href="#"
        @click.prevent="setIgnored()"
        class="list-group-item list-group-item-action"
      >
        <span class="fa fa-fw fa-minus-circle"></span
        >{{ l('user.' + (character.isIgnored ? 'unignore' : 'ignore')) }}</a
      >
      <a
        tabindex="-1"
        href="#"
        @click.prevent="channelKick()"
        class="list-group-item list-group-item-action"
        v-show="isChannelMod"
      >
        <span class="fa fa-fw fa-ban"></span>{{ l('user.channelKick') }}</a
      >
      <a
        tabindex="-1"
        href="#"
        @click.prevent="chatKick()"
        style="color: #f00"
        class="list-group-item list-group-item-action"
        v-show="isChatOp"
        ><span class="fas fa-fw fa-trash"></span>{{ l('user.chatKick') }}</a
      >
    </div>
    <modal
      :action="l('user.memo.action')"
      ref="memo"
      :disabled="memoLoading"
      @submit="updateMemo"
      dialogClass="w-100"
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
          node.id === 'userMenuStatus'
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
  #userMenu .list-group-item {
    padding: 3px;
  }

  #userMenu .list-group-item-action {
    border-top-width: 0;
    z-index: -1;
  }
</style>

<template>
  <div style="margin: 10px 10px 5px; position: fixed; z-index: 1100">
    <custom-context-menu
      id="userMenu"
      :menu-items="userMenuItems"
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
            {{ displayName || character.name }}
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
          class="list-group-item bbcode"
          style="max-height: 200px; overflow: auto; clear: both"
        ></bbcode>

        <match-tags
          v-if="match"
          id="userMenuMatch"
          :match="match"
          class="list-group-item"
        ></match-tags>
      </div>
    </custom-context-menu>
    <modal
      :action="l('user.memo.action')"
      ref="memo"
      :disabled="memoLoading"
      @submit="updateMemo"
      :buttonText="l('action.saveAndClose')"
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
    <modal
      :action="l('user.channelTimeout.name', displayName || '')"
      ref="timeoutPrompt"
      @submit="channelTimeout"
      :buttonText="l('user.channelTimeout')"
      dialogClass="w-100"
      iconClass="fas fa-stopwatch"
      v-if="channel"
    >
      <label for="timeoutValue" class="form-label">{{
        l('user.channelTimeout.prompt', displayName || '""', channel.name)
      }}</label>
      <div class="input-group mb-3">
        <input
          id="inputPassword5"
          class="form-control"
          type="number"
          v-model="timeoutLength"
          min="1"
          max="90"
        />
        <span class="input-group-text">{{ l('unit.minutes') }}</span>
      </div>
    </modal>
    <ad-view
      ref="adViewDialog"
      :character="character"
      v-if="character"
    ></ad-view>
  </div>
</template>

<script lang="ts">
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
  import { Dialog } from '../helpers/dialog';
  import { Channel, Character } from './interfaces';
  import l from './localize';
  import ReportDialog from './ReportDialog.vue';
  import { Matcher, MatchReport } from '../learn/matcher';
  import _ from 'lodash';
  import MatchTags from './preview/MatchTags.vue';
  import { MemoManager } from './character/memo';
  import CustomContextMenu, {
    ContextMenuItemProps
  } from '../components/CustomContextMenu.vue';

  export default Vue.extend({
    components: {
      'match-tags': MatchTags,
      bbcode: BBCodeView(core.bbCodeParser),
      modal: Modal,
      'ad-view': CharacterAdView,
      'custom-context-menu': CustomContextMenu
    },
    props: {
      reportDialog: {
        type: Object as () => InstanceType<typeof ReportDialog>,
        required: true
      }
    },
    data() {
      return {
        l,
        showContextMenu: false,
        getByteLength,
        character: undefined as Character | undefined,
        displayName: undefined as string | undefined,
        position: { left: '', top: '' },
        characterImage: undefined as string | undefined,
        touchedElement: undefined as HTMLElement | undefined,
        channel: undefined as Channel | undefined,
        memo: '',
        timeoutLength: 1,
        // memoId: 0,
        memoLoading: false,
        match: null as MatchReport | null,
        memoManager: undefined as MemoManager | undefined
      };
    },
    computed: {
      isChannelMod(): boolean {
        if (this.channel === undefined) return false;
        if (core.characters.ownCharacter.isChatOp) return true;
        const member = this.channel.members[core.connection.character];
        return member !== undefined && member.rank > Channel.Rank.Member;
      },
      isHidden(): boolean {
        void core.state.hiddenUsers;
        return core.isHidden(this.character!.name);
      },
      isChatOp(): boolean {
        return core.characters.ownCharacter.isChatOp;
      },
      showProfileFirst(): boolean {
        return core.state.settings.clickOpensMessage;
      },
      showAvatars(): boolean {
        return core.state.settings.showAvatars;
      },
      profileLink(): string | undefined {
        return profileLink(this.character!.name);
      },
      userMenuItems(): ContextMenuItemProps[] {
        if (!this.character) return [];

        const items: ContextMenuItemProps[] = [];

        if (this.showProfileFirst) {
          items.push({
            label: this.l('user.profile'),
            iconClass: 'fa fa-fw fa-address-card',
            href: this.profileLink
          });
        }

        items.push(
          {
            label: this.l('user.messageJump'),
            iconClass: 'fa fa-fw fa-comment',
            onClick: () => {
              this.openConversation(true);
              this.close();
            }
          },
          {
            label: this.l('user.message'),
            iconClass: 'fa fa-fw fa-comment-medical',
            onClick: () => {
              this.openConversation(false);
              this.close();
            }
          }
        );

        if (!this.showProfileFirst) {
          items.push({
            label: this.l('user.profile'),
            iconClass: 'fas fa-fw fa-address-card',
            href: this.profileLink
          });
        }

        items.push(
          {
            label: this.l('user.memo'),
            iconClass: 'fas fa-fw fa-sticky-note',
            onClick: () => {
              this.close();
              void this.showMemo();
            }
          },
          {
            label: this.l(
              'user.' +
                (this.character.isBookmarked ? 'unbookmark' : 'bookmark')
            ),
            iconClass: this.character.isBookmarked
              ? 'fa fa-fw fa-bookmark'
              : 'far fa-fw fa-bookmark',
            onClick: () => {
              this.setBookmarked();
              this.close();
            }
          },
          {
            label: this.l('user.showAdLog'),
            iconClass: 'fa fa-fw fa-ad',
            disabled: !this.hasAdLogs(),
            onClick: () => {
              this.showAdLogs();
              this.close();
            }
          }
        );

        if (!this.isChatOp) {
          items.push({
            label: this.l('user.' + (this.isHidden ? 'unhide' : 'hide')),
            iconClass: 'fa fa-fw fa-eye-slash',
            onClick: () => {
              this.setHidden();
              this.close();
            }
          });
        }

        items.push(
          {
            label: this.l('user.report'),
            iconClass: 'fa fa-fw fa-exclamation-triangle',
            topBorder: true,
            onClick: () => {
              this.report();
              this.close();
            }
          },
          {
            label: this.l(
              'user.' + (this.character.isIgnored ? 'unignore' : 'ignore')
            ),
            iconClass: 'fa fa-fw fa-minus-circle',
            onClick: () => {
              this.setIgnored();
              this.close();
            }
          }
        );

        if (this.isChannelMod) {
          items.push(
            {
              label: this.l('user.channelKick'),
              iconClass: 'fa fa-fw fa-ban',
              topBorder: true,
              onClick: () => {
                this.channelKick();
                this.close();
              }
            },
            {
              label: this.l('user.channelTimeout'),
              iconClass: 'fa fa-fw fas fa-stopwatch',
              onClick: () => {
                this.promptTimeout();
                this.close();
              }
            },
            {
              label: this.l('user.channelBan'),
              iconClass: 'fa fa-fw fa-trash-can',
              dangerous: true,
              onClick: () => {
                this.channelBan();
                this.close();
              }
            }
          );
        }

        if (this.isChatOp) {
          items.push({
            label: this.l('user.chatKick'),
            iconClass: 'fas fa-fw fa-trash',
            dangerous: true,
            onClick: () => {
              this.chatKick();
              this.close();
            }
          });
        }

        return items;
      }
    },
    methods: {
      getMenuElement(): HTMLElement | undefined {
        const menu = this.$refs['menu'] as any;
        if (!menu) return undefined;
        return menu instanceof HTMLElement ? menu : (menu.$el as HTMLElement);
      },
      close(): void {
        if (!this.showContextMenu) return;
        document.removeEventListener('click', this.closeOnOutsideClick);
        this.showContextMenu = false;
        this.$emit('close');
      },
      closeOnOutsideClick(e: MouseEvent): void {
        const menu = this.getMenuElement();
        if (menu && menu.contains(e.target as Node)) return;
        document.removeEventListener('click', this.closeOnOutsideClick);
        this.close();
      },
      openConversation(jump: boolean): void {
        const conversation = core.conversations.getPrivate(this.character!);
        if (jump) conversation.show();
      },
      setIgnored(): void {
        core.connection.send('IGN', {
          action: this.character!.isIgnored ? 'delete' : 'add',
          character: this.character!.name
        });
      },
      setBookmarked(): void {
        core.connection
          .queryApi(
            `bookmark-${this.character!.isBookmarked ? 'remove' : 'add'}.php`,
            { name: this.character!.name }
          )
          .catch((e: object) => core.notifications.alert(errorToString(e)));
      },
      setHidden(): void {
        core.toggleHidden(this.character!.name);
      },
      report(): void {
        this.reportDialog.report(this.character!);
      },
      channelKick(): void {
        core.connection.send('CKU', {
          channel: this.channel!.id,
          character: this.character!.name
        });
      },
      channelBan(): void {
        if (
          this.displayName &&
          this.channel &&
          Dialog.confirmDialog(
            l('user.channelBan.confirm', this.displayName, this.channel.name),
            true
          )
        ) {
          core.connection.send('CBU', {
            channel: this.channel!.id,
            character: this.character!.name
          });
        }
      },
      promptTimeout(): void {
        this.timeoutLength = 1;
        (this.$refs['timeoutPrompt'] as InstanceType<typeof Modal>).show();
      },
      channelTimeout(): void {
        if (this.timeoutLength && !isNaN(this.timeoutLength)) {
          core.connection.send('CTU', {
            channel: this.channel!.id,
            character: this.character!.name,
            length: this.timeoutLength
          });
        }
      },

      chatKick(): void {
        core.connection.send('KIK', { character: this.character!.name });
      },
      async showMemo(): Promise<void> {
        this.memoLoading = true;
        this.memo = '';
        this.memoManager = new MemoManager(this.character!.name);

        (this.$refs['memo'] as InstanceType<typeof Modal>).show();

        try {
          await this.memoManager.load();

          this.memo = this.memoManager.get().memo;
          this.memoLoading = false;
        } catch (e) {
          core.notifications.alert(errorToString(e));
        }
      },
      updateMemo(): void {
        this.memoManager
          ?.set(this.memo)
          .catch((e: object) => core.notifications.alert(errorToString(e)));
      },
      showAdLogs(): void {
        if (!this.hasAdLogs()) {
          return;
        }

        (
          this.$refs['adViewDialog'] as InstanceType<typeof CharacterAdView>
        ).show();
      },
      hasAdLogs(): boolean {
        if (!this.character) {
          return false;
        }

        const cache = core.cache.adCache.get(this.character.name);

        if (!cache) {
          return false;
        }

        return cache.count() > 0;
      },
      handleEvent(e: MouseEvent | TouchEvent): void {
        const menuElement = this.getMenuElement();
        const touch =
          e.type === 'touchstart'
            ? (<TouchEvent>e).changedTouches[0]
            : <MouseEvent>e;
        let node = <
          HTMLElement & {
            character?: Character;
            channel?: Channel;
            displayName?: string;
            touched?: boolean;
          }
        >touch.target;
        while (node !== document.body) {
          if (
            (e.type !== 'click' && node === menuElement) ||
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
        if (node.dataset['touch'] === 'false' && e.type !== 'contextmenu')
          return;
        if (!node.character)
          if (node.dataset['character'] !== undefined)
            node.character = core.characters.get(node.dataset['character']!);
          else {
            this.close();
            this.touchedElement = undefined;
            return;
          }
        switch (e.type) {
          case 'click':
            if (node.dataset['character'] === undefined)
              if (node === this.touchedElement)
                // tslint:disable-next-line no-floating-promises
                this.openMenu(
                  touch,
                  node.character,
                  node.channel || undefined,
                  node.displayName
                );
              else this.onClick(node.character);
            e.preventDefault();
            break;
          case 'touchstart':
            this.touchedElement = node;
            break;
          case 'contextmenu':
            // tslint:disable-next-line no-floating-promises
            this.openMenu(
              touch,
              node.character,
              node.channel || undefined,
              node.displayName
            );
            e.preventDefault();
        }
      },
      onClick(character: Character): void {
        this.character = character;
        // Always open profile for own character, regardless of clickOpensMessage setting
        if (character.name === core.characters.ownCharacter.name) {
          window.open(this.profileLink);
        } else if (core.state.settings.clickOpensMessage) {
          this.openConversation(true);
        } else {
          window.open(this.profileLink);
        }
        this.close();
      },
      async openMenu(
        touch: MouseEvent | Touch,
        character: Character,
        channel: Channel | undefined,
        displayName?: string
      ): Promise<void> {
        this.channel = channel;
        this.character = character;
        this.displayName = displayName;
        this.characterImage = undefined;
        this.showContextMenu = true;
        this.$emit('open');
        this.position = {
          left: `${touch.clientX}px`,
          top: `${touch.clientY}px`
        };
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
          const menu = this.getMenuElement();
          if (!menu) return;
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

        document.removeEventListener('click', this.closeOnOutsideClick);
        document.addEventListener('click', this.closeOnOutsideClick);
      }
    }
  });
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

  #userMenu-avatar {
    object-fit: contain;
  }

  .userInfo-status {
    opacity: 0.7;
  }

  .userInfo-name {
    font-size: 1.3em;
    font-weight: bold;
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

  #userMenuStatus {
    max-width: 100%;
  }

  #userMenuMatch {
    max-width: 220px;
  }

  .userMenuInner {
    background-color: var(--scoreReportBg);
    border-bottom: 1px solid var(--bs-border-color);
  }
</style>

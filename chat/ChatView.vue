<template>
  <div
    style="height: 100%; display: flex; position: relative"
    id="chatView"
    @click="userMenuHandle"
    @contextmenu="userMenuHandle"
    @touchstart.passive="userMenuHandle"
    @touchend="userMenuHandle"
  >
    <sidebar id="sidebar" :label="l('chat.menu')" icon="fa-bars">
      <img
        :src="characterImage(ownCharacter.name)"
        v-if="showAvatars"
        style="
          float: left;
          margin-right: 5px;
          margin-top: 5px;
          width: 70px;
          height: 70px;
        "
      />
      <a
        target="_blank"
        :href="ownCharacterLink"
        class="btn"
        style="display: block"
        >{{ ownCharacter.name }}</a
      >
      <a href="#" @click.prevent="logOut()" class="btn"
        ><i class="fas fa-sign-out-alt"></i>{{ l('chat.logout') }}</a
      ><br />
      <div>
        {{ l('chat.status') }}
        <a href="#" @click.prevent="showStatus()" class="btn">
          <span
            class="fas fa-fw"
            :class="getStatusIcon(ownCharacter.status)"
          ></span
          >{{ l('status.' + ownCharacter.status) }}
        </a>
      </div>
      <div style="clear: both">
        <a href="#" @click.prevent="showSearch()" class="btn"
          ><span class="fas fa-fw fa-search"></span>
          {{ l('characterSearch.open') }}</a
        >
      </div>
      <div>
        <a href="#" @click.prevent="showSettings()" class="btn"
          ><span class="fas fa-fw fa-cog"></span> {{ l('settings.open') }}</a
        >
      </div>
      <div>
        <a href="#" @click.prevent="showRecent()" class="btn"
          ><span class="fas fa-fw fa-history"></span>
          {{ l('chat.recentConversations') }}</a
        >
      </div>

      <div>
        <a href="#" @click.prevent="showAdCenter()" class="btn"
          ><span class="fas fa-fw fa-ad"></span> Ad Editor</a
        >
      </div>

      <div>
        <a href="#" @click.prevent="showAdLauncher()" class="btn"
          ><span class="fas fa-fw fa-play"></span> Post Ads</a
        >

        <span v-show="adsAreRunning()" class="adControls">
          <span
            aria-label="Stop All Ads"
            class="fas fa-fw fa-stop"
            @click.prevent="stopAllAds()"
          ></span>
        </span>
      </div>

      <div>
        <a href="#" @click.prevent="showProfileAnalyzer()" class="btn"
          ><span class="fas fa-fw fa-user-md"></span> Profile Helper</a
        >
      </div>

      <div class="list-group conversation-nav">
        <a
          :class="getClasses(conversations.consoleTab)"
          href="#"
          @click.prevent="conversations.consoleTab.show()"
          class="list-group-item list-group-item-action"
        >
          {{ conversations.consoleTab.name }}
        </a>
      </div>

      <a
        href="#"
        @click.prevent="showAddPmPartner()"
        class="btn btn-new-conversation"
        ><span class="fas fa-comment"></span> {{ l('chat.pms') }}</a
      >

      <div class="list-group conversation-nav" ref="privateConversations">
        <a
          v-for="conversation in conversations.privateConversations"
          href="#"
          @click.prevent="conversation.show()"
          :class="getClasses(conversation)"
          :data-character="conversation.character.name"
          data-touch="false"
          class="list-group-item list-group-item-action item-private"
          :key="conversation.key"
          @click.middle.prevent.stop="conversation.close()"
        >
          <img
            :src="characterImage(conversation.character.name)"
            v-if="showAvatars"
          />
          <div class="name">
            <span>{{ conversation.character.name }}</span>
            <div style="line-height: 0; display: flex">
              <span
                class="fas fa-reply"
                v-show="needsReply(conversation)"
              ></span>
              <span
                class="online-status"
                :class="getOnlineStatusIconClasses(conversation)"
              ></span>
              <span style="flex: 1"></span>
              <span
                class="pin fas fa-thumbtack"
                :class="{ active: conversation.isPinned }"
                @click="conversation.isPinned = !conversation.isPinned"
                :aria-label="l('chat.pinTab')"
              ></span>
              <span
                class="fas fa-times leave"
                @click.stop="conversation.close()"
                :aria-label="l('chat.closeTab')"
              ></span>
            </div>
          </div>
        </a>
      </div>
      <a
        href="#"
        @click.prevent="showAddPmPartner()"
        class="new-conversation"
        :class="{
          glowing:
            conversations.privateConversations.length === 0 && privateCanGlow
        }"
        >Open Conversation</a
      >
      <a
        href="#"
        @click.prevent="showChannels()"
        class="btn btn-new-conversation"
        ><span class="fas fa-list"></span> {{ l('chat.channels') }}</a
      >

      <div class="list-group conversation-nav" ref="channelConversations">
        <a
          v-for="conversation in conversations.channelConversations"
          href="#"
          @click.prevent="conversation.show()"
          :class="getClasses(conversation)"
          class="list-group-item list-group-item-action item-channel"
          :key="conversation.key"
          @click.middle.prevent.stop="conversation.close()"
        >
          <span class="name">{{ conversation.name }}</span>
          <span>
            <span
              v-if="conversation.hasAutomatedAds()"
              class="fas fa-ad"
              :class="{ active: conversation.isSendingAutomatedAds() }"
              aria-label="Toggle ads"
              @click.stop="conversation.toggleAutomatedAds()"
            ></span>
            <span
              class="pin fas fa-thumbtack"
              :class="{ active: conversation.isPinned }"
              :aria-label="l('chat.pinTab')"
              @click.stop="conversation.isPinned = !conversation.isPinned"
              @mousedown.prevent
            ></span>
            <span
              class="fas fa-times leave"
              @click.stop="conversation.close()"
              :aria-label="l('chat.closeTab')"
            ></span>
          </span>
        </a>
      </div>
      <a
        href="#"
        @click.prevent="showChannels()"
        class="join-channel"
        :class="{
          glowing:
            conversations.channelConversations.length === 0 && channelCanGlow
        }"
        >Join Channel</a
      >
    </sidebar>
    <div style="display: flex; flex-direction: column; flex: 1; min-width: 0">
      <div id="quick-switcher" class="list-group">
        <a
          :class="getClasses(conversations.consoleTab)"
          href="#"
          @click.prevent="conversations.consoleTab.show()"
          class="list-group-item list-group-item-action"
        >
          <span class="fas fa-home conversation-icon"></span>
          {{ conversations.consoleTab.name }}
        </a>
        <a
          v-for="conversation in conversations.privateConversations"
          href="#"
          @click.prevent="conversation.show()"
          :class="getClasses(conversation)"
          class="list-group-item list-group-item-action"
          :key="conversation.key"
        >
          <img
            :src="characterImage(conversation.character.name)"
            v-if="showAvatars"
          />
          <span class="far fa-user-circle conversation-icon" v-else></span>
          <div class="name">{{ conversation.character.name }}</div>
        </a>
        <a
          v-for="conversation in conversations.channelConversations"
          href="#"
          @click.prevent="conversation.show()"
          :class="getClasses(conversation)"
          class="list-group-item list-group-item-action"
          :key="conversation.key"
        >
          <span class="fas fa-hashtag conversation-icon"></span>
          <div class="name">{{ conversation.name }}</div>
        </a>
      </div>
      <conversation :reportDialog="$refs['reportDialog']"></conversation>
    </div>
    <user-list></user-list>
    <channels ref="channelsDialog"></channels>
    <status-switcher ref="statusDialog"></status-switcher>
    <character-search ref="searchDialog"></character-search>
    <adLauncher ref="adLauncher"></adLauncher>
    <adCenter ref="adCenter"></adCenter>
    <settings ref="settingsDialog"></settings>
    <report-dialog ref="reportDialog"></report-dialog>
    <user-menu ref="userMenu" :reportDialog="$refs['reportDialog']"></user-menu>
    <recent-conversations ref="recentDialog"></recent-conversations>
    <image-preview ref="imagePreview"></image-preview>
    <add-pm-partner ref="addPmPartnerDialog"></add-pm-partner>
    <note-status
      v-if="coreState.settings.risingShowUnreadOfflineCount"
    ></note-status>

    <modal
      :buttons="false"
      ref="profileAnalysis"
      dialogClass="profile-analysis"
    >
      <profile-analysis></profile-analysis>
      <template slot="title">
        {{ ownCharacter.name }}
        <a class="btn" @click="showProfileAnalyzer"><i class="fa fa-sync" /></a>
      </template>
    </modal>
  </div>
</template>

<script lang="ts">
  import Sortable from 'sortablejs';

  import { Component, Hook } from '@f-list/vue-ts';
  import Vue from 'vue';
  import { Keys } from '../keys';
  import ChannelList from './ChannelList.vue';
  import CharacterSearch from './CharacterSearch.vue';
  import { characterImage, getKey, profileLink } from './common';
  import ConversationView from './ConversationView.vue';
  import core from './core';
  import { Character, Connection, Conversation } from './interfaces';
  import l from './localize';
  import PmPartnerAdder from './PmPartnerAdder.vue';
  import RecentConversations from './RecentConversations.vue';
  import ReportDialog from './ReportDialog.vue';
  import SettingsView from './SettingsView.vue';
  import Sidebar from './Sidebar.vue';
  import StatusSwitcher from './StatusSwitcher.vue';
  import { getStatusIcon } from './UserView.vue';
  import UserList from './UserList.vue';
  import UserMenu from './UserMenu.vue';
  import ImagePreview from './preview/ImagePreview.vue';
  import PrivateConversation = Conversation.PrivateConversation;
  import * as _ from 'lodash';
  import NoteStatus from '../site/NoteStatus.vue';
  import { Dialog } from '../helpers/dialog';
  // import { EventBus } from './preview/event-bus';
  import AdCenterDialog from './ads/AdCenter.vue';
  import AdLauncherDialog from './ads/AdLauncher.vue';
  import Modal from '../components/Modal.vue';
  import ProfileAnalysis from '../learn/recommend/ProfileAnalysis.vue';

  const unreadClasses = {
    [Conversation.UnreadState.None]: '',
    [Conversation.UnreadState.Mention]: 'list-group-item-warning',
    [Conversation.UnreadState.Unread]: 'list-group-item-danger'
  };

  @Component({
    components: {
      'user-list': UserList,
      channels: ChannelList,
      'status-switcher': StatusSwitcher,
      'character-search': CharacterSearch,
      settings: SettingsView,
      conversation: ConversationView,
      'report-dialog': ReportDialog,
      sidebar: Sidebar,
      'user-menu': UserMenu,
      'recent-conversations': RecentConversations,
      'image-preview': ImagePreview,
      'add-pm-partner': PmPartnerAdder,
      'note-status': NoteStatus,
      adCenter: AdCenterDialog,
      adLauncher: AdLauncherDialog,
      modal: Modal,
      'profile-analysis': ProfileAnalysis
    }
  })
  export default class ChatView extends Vue {
    l = l;
    sidebarExpanded = false;
    characterImage = characterImage;
    conversations = core.conversations;
    getStatusIcon = getStatusIcon;
    coreState = core.state;
    keydownListener!: (e: KeyboardEvent) => void;
    focusListener!: () => void;
    blurListener!: () => void;
    readonly isMac = process.platform === 'darwin';

    channelConversations = core.conversations.channelConversations;
    privateConversations = core.conversations.privateConversations;

    privateCanGlow = !this.channelConversations?.length;
    channelCanGlow = !this.privateConversations?.length;

    @Hook('mounted')
    onMounted(): void {
      this.keydownListener = (e: KeyboardEvent) => this.onKeyDown(e);
      window.addEventListener('keydown', this.keydownListener);
      this.setFontSize(core.state.settings.fontSize);

      this.$watch('conversations.channelConversations', newVal => {
        if (newVal?.length) {
          this.channelCanGlow = false;
        }
      });

      this.$watch('conversations.privateConversations', newVal => {
        if (newVal?.length) {
          this.privateCanGlow = false;
        }
      });

      Sortable.create(<HTMLElement>this.$refs['privateConversations'], {
        animation: 50,
        fallbackTolerance: 5,
        onEnd: async e => {
          if (e.oldIndex === e.newIndex) return;
          return core.conversations.privateConversations[e.oldIndex!].sort(
            e.newIndex!
          );
        }
      });
      Sortable.create(<HTMLElement>this.$refs['channelConversations'], {
        animation: 50,
        fallbackTolerance: 5,
        onEnd: async e => {
          if (e.oldIndex === e.newIndex) return;
          return core.conversations.channelConversations[e.oldIndex!].sort(
            e.newIndex!
          );
        }
      });
      const ownCharacter = core.characters.ownCharacter;
      let idleTimer: number | undefined,
        idleStatus: Connection.ClientCommands['STA'] | undefined,
        lastUpdate = 0;
      window.addEventListener(
        'focus',
        (this.focusListener = () => {
          core.notifications.isInBackground = false;
          if (idleTimer !== undefined) {
            clearTimeout(idleTimer);
            idleTimer = undefined;
          }
          if (idleStatus !== undefined) {
            const status = idleStatus;
            window.setTimeout(
              () => core.connection.send('STA', status),
              Math.max(
                lastUpdate +
                  core.connection.vars.sta_flood * 1000 +
                  1000 -
                  Date.now(),
                0
              )
            );
            idleStatus = undefined;
          }
        })
      );
      window.addEventListener(
        'blur',
        (this.blurListener = () => {
          core.notifications.isInBackground = true;
          if (idleTimer !== undefined) clearTimeout(idleTimer);
          if (
            core.state.settings.idleTimer > 0 &&
            core.characters.ownCharacter.status !== 'dnd'
          )
            idleTimer = window.setTimeout(() => {
              lastUpdate = Date.now();
              idleStatus = {
                status: ownCharacter.status,
                statusmsg: ownCharacter.statusText
              };
              core.connection.send('STA', {
                status: 'idle',
                statusmsg: ownCharacter.statusText
              });
            }, core.state.settings.idleTimer * 60000);
        })
      );
      core.connection.onEvent('closed', () => {
        if (idleTimer !== undefined) {
          window.clearTimeout(idleTimer);
          idleTimer = undefined;
        }
      });
      core.watch<number>(
        function (): number {
          return this.state.settings.fontSize;
        },
        value => {
          this.setFontSize(value);
        }
      );

      void core.adCenter.load();
    }

    @Hook('destroyed')
    destroyed(): void {
      window.removeEventListener('keydown', this.keydownListener);
      window.removeEventListener('focus', this.focusListener);
      window.removeEventListener('blur', this.blurListener);
    }

    needsReply(conversation: Conversation): boolean {
      if (!core.state.settings.showNeedsReply) return false;
      for (let i = conversation.messages.length - 1; i >= 0; --i) {
        const sender = (<Partial<Conversation.ChatMessage>>(
          conversation.messages[i]
        )).sender;

        // noinspection TypeScriptValidateTypes
        if (sender !== undefined)
          return sender !== core.characters.ownCharacter;
      }
      return false;
    }

    onKeyDown(e: KeyboardEvent): void {
      const selected = this.conversations.selectedConversation;
      const pms = this.conversations.privateConversations;
      const channels = this.conversations.channelConversations;
      const console = this.conversations.consoleTab;
      if (getKey(e) === Keys.ArrowUp) {
        if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          this.navigateChannelUpward(selected, console, channels, pms);
        } else if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey) {
          this.navigateChannelUpward(
            selected,
            console,
            channels.filter(
              channel =>
                channel.unread != Conversation.UnreadState.None ||
                channel === selected
            ),
            pms.filter(
              pm =>
                pm.unread != Conversation.UnreadState.None || pm === selected
            )
          );
        } else if (e.altKey && e.shiftKey && this.isControlOrCommand(e)) {
          this.navigateChannelUpward(
            selected,
            console,
            channels.filter(
              channel =>
                channel.unread === Conversation.UnreadState.Mention ||
                channel === selected
            ),
            pms.filter(
              pm =>
                pm.unread === Conversation.UnreadState.Mention ||
                pm === selected
            )
          );
        }
      } else if (getKey(e) === Keys.ArrowDown) {
        if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          this.navigateChannelDownward(selected, console, channels, pms);
        } else if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey) {
          this.navigateChannelDownward(
            selected,
            console,
            channels.filter(
              channel =>
                channel.unread != Conversation.UnreadState.None ||
                channel === selected
            ),
            pms.filter(
              pm =>
                pm.unread != Conversation.UnreadState.None || pm === selected
            )
          );
        } else if (e.altKey && e.shiftKey && this.isControlOrCommand(e)) {
          this.navigateChannelDownward(
            selected,
            console,
            channels.filter(
              channel =>
                channel.unread === Conversation.UnreadState.Mention ||
                channel === selected
            ),
            pms.filter(
              pm =>
                pm.unread === Conversation.UnreadState.Mention ||
                pm === selected
            )
          );
        }
      }
    }

    navigateChannelUpward(
      selected: Conversation,
      console: Conversation,
      channels: readonly Conversation.ChannelConversation[],
      pms: readonly Conversation.PrivateConversation[]
    ): void {
      if (selected === console) {
        //tslint:disable-line:curly
        if (channels.length > 0) channels[channels.length - 1].show();
        else if (pms.length > 0) pms[pms.length - 1].show();
      } else if (Conversation.isPrivate(selected)) {
        const index = pms.indexOf(selected);
        if (index === 0) console.show();
        else pms[index - 1].show();
      } else {
        const index = channels.indexOf(
          <Conversation.ChannelConversation>selected
        );
        if (index === 0)
          if (pms.length > 0) pms[pms.length - 1].show();
          else console.show();
        else channels[index - 1].show();
      }
    }

    navigateChannelDownward(
      selected: Conversation,
      console: Conversation,
      channels: readonly Conversation.ChannelConversation[],
      pms: readonly Conversation.PrivateConversation[]
    ): void {
      if (selected === console) {
        //tslint:disable-line:curly - false positive
        if (pms.length > 0) pms[0].show();
        else if (channels.length > 0) channels[0].show();
      } else if (Conversation.isPrivate(selected)) {
        const index = pms.indexOf(selected);
        if (index === pms.length - 1) {
          if (channels.length > 0) channels[0].show();
        } else pms[index + 1].show();
      } else {
        const index = channels.indexOf(
          <Conversation.ChannelConversation>selected
        );
        if (index < channels.length - 1) channels[index + 1].show();
        else console.show();
      }
    }

    //Should this be a generic helper function that other components can use too?
    //Right now they indiscriminately use the Ctrl or Meta key, even though it should ideally only be one.
    isControlOrCommand(e: KeyboardEvent): boolean {
      return this.isMac ? e.metaKey : e.ctrlKey;
    }
    setFontSize(fontSize: number): void {
      let overrideEl = <HTMLStyleElement | null>(
        document.getElementById('overrideFontSize')
      );
      if (overrideEl !== null) document.body.removeChild(overrideEl);
      overrideEl = document.createElement('style');
      overrideEl.id = 'overrideFontSize';
      document.body.appendChild(overrideEl);
      const sheet = <CSSStyleSheet>overrideEl.sheet;
      sheet.insertRule(
        `#chatView, .btn, .form-control, .custom-select { font-size: ${fontSize}px; }`,
        sheet.cssRules.length
      );
      sheet.insertRule(
        `.form-control, select.form-control { line-height: 1.428571429 }`,
        sheet.cssRules.length
      );
    }

    getOnlineStatusIconClasses(
      conversation: PrivateConversation
    ): Record<string, any> {
      const status = conversation.character.status;

      if (
        conversation.typingStatus === 'typing' ||
        conversation.typingStatus === 'paused'
      ) {
        return {
          fas: true,
          'fa-comment-dots': conversation.typingStatus === 'typing',
          'fa-comment': conversation.typingStatus === 'paused'
        };
      }

      const styling = {
        crown: { color: 'online', icon: ['fas', 'fa-crown'] },
        online: { color: 'online', icon: ['fas', 'fa-circle'] },
        looking: { color: 'online', icon: ['fa', 'fa-eye'] },
        offline: { color: 'offline', icon: ['fa', 'fa-ban'] },
        busy: { color: 'away', icon: ['fa', 'fa-cog'] },
        idle: { color: 'away', icon: ['far', 'fa-clock'] },
        dnd: { color: 'dnd', icon: ['fa', 'fa-minus-circle'] },
        away: { color: 'away', icon: ['far', 'fa-circle'] }
      };

      const cls = { [styling[status].color]: true };

      _.forEach(styling[status].icon, (name: string) => (cls[name] = true));

      return cls;
    }

    logOut(): void {
      if (Dialog.confirmDialog(l('chat.confirmLeave'))) core.connection.close();
    }

    showSettings(): void {
      (<SettingsView>this.$refs['settingsDialog']).show();
    }

    showSearch(): void {
      (<CharacterSearch>this.$refs['searchDialog']).show();
    }

    showRecent(): void {
      (<RecentConversations>this.$refs['recentDialog']).show();
    }

    showChannels(): void {
      (<ChannelList>this.$refs['channelsDialog']).show();
    }

    showStatus(): void {
      (<StatusSwitcher>this.$refs['statusDialog']).show();
    }

    showAdCenter(): void {
      (<AdCenterDialog>this.$refs['adCenter']).show();
    }

    showAdLauncher(): void {
      (<AdLauncherDialog>this.$refs['adLauncher']).show();
    }

    showProfileAnalyzer(): void {
      (this.$refs.profileAnalysis as any).show();
      void (this.$refs.profileAnalysis as any).$children[0].analyze();
    }

    showAddPmPartner(): void {
      (<PmPartnerAdder>this.$refs['addPmPartnerDialog']).show();
    }

    userMenuHandle(e: MouseEvent | TouchEvent): void {
      (<UserMenu>this.$refs['userMenu']).handleEvent(e);
    }

    get showAvatars(): boolean {
      return core.state.settings.showAvatars;
    }

    get ownCharacter(): Character {
      return core.characters.ownCharacter;
    }

    get ownCharacterLink(): string {
      return profileLink(core.characters.ownCharacter.name);
    }

    getClasses(conversation: Conversation): string {
      return conversation === core.conversations.selectedConversation
        ? ' active'
        : unreadClasses[conversation.unread];
    }

    isColorblindModeActive(): boolean {
      return core.state.settings.risingColorblindMode;
    }

    getImagePreview(): ImagePreview | undefined {
      return this.$refs['imagePreview'] as ImagePreview;
    }

    adsAreRunning(): boolean {
      return core.adCenter.adsAreRunning();
    }

    stopAllAds(): void {
      core.adCenter.stopAllAds();
    }
  }
</script>

<style lang="scss">
  @import '~bootstrap/scss/functions';
  @import '~bootstrap/scss/variables';
  @import '~bootstrap/scss/mixins/breakpoints';

  body {
    user-select: none;
  }

  .bbcode,
  .message,
  .profile-viewer {
    user-select: text;
  }

  .pm-add {
    font-size: 90%;
    float: right;
    margin-right: 5px;
  }

  .list-group.conversation-nav {
    .fas.active {
      color: #02a002;
    }

    .list-group-item {
      padding: 5px;
      display: flex;
      align-items: center;
      border-right: 0;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      .name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .fas {
        font-size: 16px;
        padding: 0 3px;
        &:last-child {
          padding-right: 0;
        }
      }
      &.item-private {
        padding-left: 0;
        padding-top: 0;
        padding-bottom: 0;

        .online-status {
          padding-left: 1px;
          font-size: 85%;
        }

        /*.offline,*/
        /*.online,*/
        /*.away {*/
        /*    font-size: 80%;*/
        /*}*/

        .offline {
          color: #5c5c84;
        }

        .online {
          color: #02a002;
        }

        .away {
          color: #c7894f;
        }
        .dnd {
          color: #ce2d4f;
        }

        .fa-comment,
        .fa-comment-dots {
          color: #cbcbe5;
        }

        /*.fa-eye {*/
        /*    // margin-right: 3px;*/
        /*}*/
      }
      img {
        height: 40px;
        width: 40px;
        margin: -1px 5px -1px -1px;
      }
      &:first-child img {
        border-top-left-radius: 4px;
      }
      &:last-child img {
        border-bottom-left-radius: 4px;
      }
    }

    .list-group-item-danger:not(.active) {
      color: inherit;
    }
  }

  #quick-switcher {
    margin: 0 45px 5px;
    overflow: auto;
    display: none;
    align-items: stretch;
    flex-direction: row;

    @media (max-width: breakpoint-max(sm)) {
      display: flex;
    }

    a {
      width: 40px;
      text-align: center;
      line-height: 1;
      padding: 5px 5px 0;
      overflow: hidden;
      flex-shrink: 0;
      &:first-child {
        border-radius: 4px 0 0 4px;
        &:last-child {
          border-radius: 4px;
        }
      }
      &:last-child {
        border-radius: 0 4px 4px 0;
      }
    }

    img {
      width: 30px;
    }

    .name {
      overflow: hidden;
      white-space: nowrap;
    }

    .conversation-icon {
      font-size: 2em;
      height: 30px;
    }

    .list-group-item-danger:not(.active) {
      color: inherit;
    }
  }

  #sidebar {
    .body a.btn {
      padding: 2px 0;
      text-align: left;
    }
    .btn-new-conversation {
      display: block;
      margin-top: 10px;
    }
    @media (min-width: breakpoint-min(md)) {
      .sidebar {
        position: static;
        margin: 0;
        padding: 0;
        height: 100%;
      }

      .body {
        display: block;
      }

      .expander {
        display: none;
      }
    }

    .adControls {
      float: right;
      margin-right: 0.25rem;
      margin-top: 3px;

      span {
        color: var(--danger);
        cursor: pointer;

        &:hover {
          color: var(--red);
        }
      }
    }

    .new-conversation,
    .join-channel {
      font-size: 90%;
      margin-left: 0.2em;
      margin-top: 0.25em;
      -webkit-user-drag: none;
      -webkit-app-region: no-drag;
    }

    .glowing {
      padding: 3px;
      margin-right: 0.5em;
      animation: noticeme 2.5s alternate;
      animation-iteration-count: 10;
      animation-timing-function: ease-in-out;
    }

    .join-channel.glowing {
      animation-delay: 0.3s !important;
    }

    @keyframes noticeme {
      0% {
        // box-shadow: 0 0 10px -10px #aef4af;
        color: var(--gray-dark);
      }
      80% {
        // box-shadow: 0 0 10px -10px #aef4af;
        color: var(--gray-dark);
      }
      100% {
        // box-shadow: 0 0 10px 10px #aef4af;
        color: var(--yellow);
      }
    }
  }
</style>

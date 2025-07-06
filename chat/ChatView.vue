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

      <div class="list-group conversation-nav" ref="privateConversationsRef">
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

      <div class="list-group conversation-nav" ref="channelConversationsRef">
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
      <div>
        {{
          conversations.selectedConversation.name || 'no selected conversation'
        }}
      </div>
      <!-- This one has issues right now, so it is commented out. -->
      <!-- <conversation :reportDialog="reportDialogRef"></conversation> -->
    </div>
    <user-list></user-list>
    <channels ref="channelsDialogRef"></channels>
    <status-switcher ref="statusDialogRef"></status-switcher>
    <character-search ref="searchDialogRef"></character-search>
    <adLauncher ref="adLauncherRef"></adLauncher>
    <adCenter ref="adCenterRef"></adCenter>
    <settings ref="settingsDialogRef"></settings>
    <report-dialog ref="reportDialogRef"></report-dialog>
    <user-menu ref="userMenuRef" :reportDialog="reportDialogRef"></user-menu>
    <recent-conversations ref="recentDialogRef"></recent-conversations>
    <image-preview ref="imagePreviewRef"></image-preview>
    <add-pm-partner ref="addPmPartnerDialogRef"></add-pm-partner>
    <note-status
      v-if="coreState.settings.risingShowUnreadOfflineCount"
    ></note-status>

    <modal
      :buttons="false"
      ref="profileAnalysisRef"
      dialogClass="profile-analysis"
    >
      <profile-analysis></profile-analysis>
      <template #title>
        {{ ownCharacter.name }}
        <a class="btn" @click="showProfileAnalyzer"><i class="fa fa-sync" /></a>
      </template>
    </modal>
  </div>
</template>

<script lang="ts">
  import {
    defineComponent,
    ref,
    computed,
    onMounted,
    onBeforeUnmount,
    watch
  } from 'vue';
  import Sortable from 'sortablejs';

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
  import NoteStatus from '../site/NoteStatus.vue';
  import { Dialog } from '../helpers/dialog';
  import AdCenterDialog from './ads/AdCenter.vue';
  import AdLauncherDialog from './ads/AdLauncher.vue';
  import Modal from '../components/Modal.vue';
  import ProfileAnalysis from '../learn/recommend/ProfileAnalysis.vue';
  import * as _ from 'lodash';
  import { Keys } from '../keys';
  import conversations from './conversations';
  import { StatusCodeError } from 'request-promise/errors';

  const unreadClasses = {
    [Conversation.UnreadState.None]: '',
    [Conversation.UnreadState.Mention]: 'list-group-item-warning',
    [Conversation.UnreadState.Unread]: 'list-group-item-danger'
  };

  export default defineComponent({
    name: 'ChatView',
    components: {
      'user-list': UserList,
      channels: ChannelList,
      'status-switcher': StatusSwitcher,
      'character-search': CharacterSearch,
      settings: SettingsView,
      conversationView: ConversationView,
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
    },
    setup() {
      // --- Reactive State ---
      const sidebarExpanded = false;
      const conversations = core.conversations; // now reactive!
      const coreState = core.state; // now reactive!

      // Glow logic as computed
      const privateCanGlow = computed(
        () => conversations.privateConversations.length === 0
      );
      const channelCanGlow = computed(
        () => conversations.channelConversations.length === 0
      );

      // --- Refs for dialogs ---
      const channelsDialogRef = ref();
      const statusDialogRef = ref();
      const searchDialogRef = ref();
      const adLauncherRef = ref();
      const adCenterRef = ref();
      const settingsDialogRef = ref();
      const reportDialogRef = ref();
      const userMenuRef = ref();
      const recentDialogRef = ref();
      const imagePreviewRef = ref();
      const addPmPartnerDialogRef = ref();
      const profileAnalysisRef = ref();
      const privateConversationsRef = ref();
      const channelConversationsRef = ref();

      // --- Computed ---
      const isMac = computed(() => process.platform === 'darwin');
      const showAvatars = computed(() => core.state.settings.showAvatars);
      const ownCharacter = computed(() => core.characters.ownCharacter);
      const ownCharacterLink = computed(() =>
        profileLink(core.characters.ownCharacter.name)
      );

      // --- Keyboard/Focus Listeners ---
      let keydownListener: ((e: KeyboardEvent) => void) | undefined;
      let focusListener: (() => void) | undefined;
      let blurListener: (() => void) | undefined;

      // --- Sortable Setup ---
      onMounted(() => {
        // Keyboard navigation
        keydownListener = (e: KeyboardEvent) => onKeyDown(e);
        window.addEventListener('keydown', keydownListener);

        setFontSize(core.state.settings.fontSize);

        // Sortable for private conversations
        if (privateConversationsRef.value) {
          Sortable.create(privateConversationsRef.value, {
            animation: 50,
            fallbackTolerance: 5,
            onEnd: async e => {
              if (e.oldIndex === e.newIndex) return;
              return conversations.privateConversations[e.oldIndex!].sort(
                e.newIndex!
              );
            }
          });
        }

        // Sortable for channel conversations
        if (channelConversationsRef.value) {
          Sortable.create(channelConversationsRef.value, {
            animation: 50,
            fallbackTolerance: 5,
            onEnd: async e => {
              if (e.oldIndex === e.newIndex) return;
              return conversations.channelConversations[e.oldIndex!].sort(
                e.newIndex!
              );
            }
          });
        }

        // Focus/blur listeners for idle status
        let idleTimer: number | undefined,
          idleStatus: Connection.ClientCommands['STA'] | undefined,
          lastUpdate = 0;
        focusListener = () => {
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
        };
        blurListener = () => {
          core.notifications.isInBackground = true;
          if (idleTimer !== undefined) clearTimeout(idleTimer);
          if (
            core.state.settings.idleTimer > 0 &&
            core.characters.ownCharacter.status !== 'dnd'
          )
            idleTimer = window.setTimeout(() => {
              lastUpdate = Date.now();
              idleStatus = {
                status: core.characters.ownCharacter.status,
                statusmsg: core.characters.ownCharacter.statusText
              };
              core.connection.send('STA', {
                status: 'idle',
                statusmsg: core.characters.ownCharacter.statusText
              });
            }, core.state.settings.idleTimer * 60000);
        };
        window.addEventListener('focus', focusListener);
        window.addEventListener('blur', blurListener);

        core.connection.onEvent('closed', () => {
          if (idleTimer !== undefined) {
            window.clearTimeout(idleTimer);
            idleTimer = undefined;
          }
        });

        core.watch<number>(
          function (): number {
            return coreState.settings.fontSize;
          },
          value => {
            setFontSize(value);
          }
        );

        void core.adCenter.load();
      });

      onBeforeUnmount(() => {
        if (keydownListener)
          window.removeEventListener('keydown', keydownListener);
        if (focusListener) window.removeEventListener('focus', focusListener);
        if (blurListener) window.removeEventListener('blur', blurListener);
      });

      // --- Methods ---
      function needsReply(conversation: Conversation): boolean {
        if (!core.state.settings.showNeedsReply) return false;
        for (let i = conversation.messages.length - 1; i >= 0; --i) {
          const sender = (<Partial<Conversation.ChatMessage>>(
            conversation.messages[i]
          )).sender;
          if (sender !== undefined)
            return sender !== core.characters.ownCharacter;
        }
        return false;
      }

      function onKeyDown(e: KeyboardEvent): void {
        const selected = conversations.selectedConversation;
        const pms = conversations.privateConversations;
        const channels = conversations.channelConversations;
        const console = conversations.consoleTab;
        if (getKey(e) === Keys.ArrowUp) {
          if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            navigateChannelUpward(selected, console, channels, pms);
          } else if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey) {
            navigateChannelUpward(
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
          } else if (e.altKey && e.shiftKey && isControlOrCommand(e)) {
            navigateChannelUpward(
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
            navigateChannelDownward(selected, console, channels, pms);
          } else if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey) {
            navigateChannelDownward(
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
          } else if (e.altKey && e.shiftKey && isControlOrCommand(e)) {
            navigateChannelDownward(
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

      function navigateChannelUpward(
        selected: Conversation,
        console: Conversation,
        channels: readonly Conversation.ChannelConversation[],
        pms: readonly Conversation.PrivateConversation[]
      ): void {
        if (selected === console) {
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

      function navigateChannelDownward(
        selected: Conversation,
        console: Conversation,
        channels: readonly Conversation.ChannelConversation[],
        pms: readonly Conversation.PrivateConversation[]
      ): void {
        if (selected === console) {
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

      function isControlOrCommand(e: KeyboardEvent): boolean {
        return isMac.value ? e.metaKey : e.ctrlKey;
      }

      function setFontSize(fontSize: number): void {
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

      function getOnlineStatusIconClasses(
        conversation: Conversation.PrivateConversation
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

      function logOut(): void {
        if (Dialog.confirmDialog(l('chat.confirmLeave')))
          core.connection.close();
      }

      function showSettings(): void {
        settingsDialogRef.value?.show();
      }

      function showSearch(): void {
        searchDialogRef.value?.show();
      }

      function showRecent(): void {
        recentDialogRef.value?.show();
      }

      function showChannels(): void {
        channelsDialogRef.value?.show();
      }

      function showStatus(): void {
        statusDialogRef.value?.show();
      }

      function showAdCenter(): void {
        adCenterRef.value?.show();
      }

      function showAdLauncher(): void {
        adLauncherRef.value?.show();
      }

      function showProfileAnalyzer(): void {
        profileAnalysisRef.value?.show();
        void profileAnalysisRef.value?.$children[0]?.analyze();
      }

      function showAddPmPartner(): void {
        addPmPartnerDialogRef.value?.show();
      }

      function userMenuHandle(e: MouseEvent | TouchEvent): void {
        userMenuRef.value?.handleEvent(e);
      }

      function getClasses(conversation: Conversation): string {
        return conversation === conversations.selectedConversation
          ? ' active'
          : unreadClasses[conversation.unread];
      }

      function isColorblindModeActive(): boolean {
        return core.state.settings.risingColorblindMode;
      }

      function getImagePreview():
        | InstanceType<typeof ImagePreview>
        | undefined {
        return imagePreviewRef.value;
      }

      function adsAreRunning(): boolean {
        return core.adCenter.adsAreRunning();
      }

      function stopAllAds(): void {
        core.adCenter.stopAllAds();
      }

      // --- Expose for template ---
      return {
        l,
        sidebarExpanded,
        characterImage,
        conversations,
        getStatusIcon,
        coreState,
        privateCanGlow,
        channelCanGlow,
        showAvatars,
        ownCharacter,
        ownCharacterLink,
        needsReply,
        getOnlineStatusIconClasses,
        logOut,
        showSettings,
        showSearch,
        showRecent,
        showChannels,
        showStatus,
        showAdCenter,
        showAdLauncher,
        showProfileAnalyzer,
        showAddPmPartner,
        userMenuHandle,
        getClasses,
        isColorblindModeActive,
        getImagePreview,
        adsAreRunning,
        stopAllAds,
        // dialog refs
        channelsDialogRef,
        statusDialogRef,
        searchDialogRef,
        adLauncherRef,
        adCenterRef,
        settingsDialogRef,
        reportDialogRef,
        userMenuRef,
        recentDialogRef,
        imagePreviewRef,
        addPmPartnerDialogRef,
        profileAnalysisRef,
        privateConversationsRef,
        channelConversationsRef
      };
    }
  });
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

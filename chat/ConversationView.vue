<template>
  <div
    style="
      height: 100%;
      display: flex;
      flex-direction: column;
      flex: 1;
      margin: 0 5px;
      position: relative;
    "
    id="conversation"
  >
    <div style="display: flex" v-if="isPrivate(conversation)" class="header">
      <img
        :src="characterImage"
        style="height: 60px; width: 60px; margin-right: 10px"
        v-if="settings.showAvatars"
      />
      <div
        style="
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          user-select: text;
        "
      >
        <div>
          <user
            :character="conversation.character"
            :match="true"
            :isMarkerShown="shouldShowMarker"
          ></user>
          <a href="#" @click.prevent="showLogs()" class="btn">
            <span class="fa fa-file-alt"></span>
            <span class="btn-text">{{ l('logs.title') }}</span>
          </a>
          <a href="#" @click.prevent="showSettings()" class="btn">
            <span class="fa fa-cog"></span>
            <span class="btn-text">{{ l('conversationSettings.title') }}</span>
          </a>
          <a href="#" @click.prevent="reportDialog.report()" class="btn">
            <span class="fa fa-exclamation-triangle"></span
            ><span class="btn-text">{{ l('chat.report') }}</span></a
          >

          <a href="#" @click.prevent="showAds()" class="btn">
            <span class="fa fa-ad"></span><span class="btn-text">Ads</span>
          </a>

          <a href="#" @click.prevent="showChannels()" class="btn">
            <span class="fa fa-tv"></span><span class="btn-text">Channels</span>
          </a>

          <a href="#" @click.prevent="showMemo()" class="btn">
            <span class="fas fa-edit"></span><span class="btn-text">Memo</span>
          </a>
        </div>
        <div
          style="
            overflow: auto;
            overflow-x: hidden;
            max-height: 50px;
            user-select: text;
          "
        >
          {{ l('status.' + conversation.character.status) }}
          <span v-show="conversation.character.statusText">
            – <bbcode :text="conversation.character.statusText"></bbcode
          ></span>
          <div v-show="userMemo"><b>Memo:</b> {{ userMemo }}</div>
        </div>
      </div>
    </div>
    <div v-else-if="isChannel(conversation)" class="header">
      <div style="display: flex; align-items: center">
        <div style="flex: 1">
          <span
            class="fa-fw"
            :class="
              conversation.channel.id.substr(0, 4) !== 'adh-'
                ? 'fa fa-star'
                : 'fas fa-hashtag'
            "
            :title="l('channel.official')"
            style="vertical-align: sub"
          ></span>
          <h5 style="margin: 0; display: inline; vertical-align: middle">
            {{ conversation.name }}
          </h5>
          <a
            href="#"
            @click.prevent="descriptionExpanded = !descriptionExpanded"
            class="btn"
          >
            <span
              class="fa"
              :class="{
                'fa-chevron-down': !descriptionExpanded,
                'fa-chevron-up': descriptionExpanded
              }"
            ></span>
            <span class="btn-text">{{ l('channel.description') }}</span>
          </a>
          <a
            href="#"
            @click.prevent="showManage()"
            v-show="isChannelMod"
            class="btn"
          >
            <span class="fa fa-edit"></span>
            <span class="btn-text">{{ l('manageChannel.open') }}</span>
          </a>
          <a href="#" @click.prevent="showLogs()" class="btn">
            <span class="fa fa-file-alt"></span>
            <span class="btn-text">{{ l('logs.title') }}</span>
          </a>
          <a href="#" @click.prevent="showSettings()" class="btn">
            <span class="fa fa-cog"></span>
            <span class="btn-text">{{ l('conversationSettings.title') }}</span>
          </a>
          <a href="#" @click.prevent="reportDialog.report()" class="btn">
            <span class="fa fa-exclamation-triangle"></span
            ><span class="btn-text">{{ l('chat.report') }}</span></a
          >
        </div>

        <!--                <ul class="nav nav-pills mode-switcher">-->
        <!--                    <li v-for="mode in modes" class="nav-item">-->
        <!--                        <a :class="isChannel(conversation) ? {active: conversation.mode == mode, disabled: conversation.channel.mode != 'both'} : undefined"-->
        <!--                            class="nav-link" href="#" @click.prevent="setMode(mode)">{{l('channel.mode.' + mode)}}</a>-->
        <!--                    </li>-->
        <!--                    <li>-->
        <!--                        <a @click.prevent="toggleNonMatchingAds()" :class="{active: showNonMatchingAds}" v-show="(conversation.mode == 'both' || conversation.mode == 'ads')"-->
        <!--                            class="nav-link" href="#">Non-Matching</a>-->
        <!--                    </li>-->
        <!--                </ul>-->

        <div class="btn-toolbar">
          <dropdown
            :keep-open="false"
            title="View"
            :icon-class="{
              fas: true,
              'fa-comments': conversation.mode === 'chat',
              'fa-ad': conversation.mode === 'ads',
              'fa-asterisk': conversation.mode === 'both'
            }"
            wrap-class="btn-group views"
            link-class="btn btn-secondary dropdown-toggle"
            v-show="conversation.channel.mode == 'both'"
          >
            <button
              v-for="mode in modes"
              class="dropdown-item"
              :class="{ selected: conversation.mode == mode }"
              type="button"
              @click="setMode(mode)"
            >
              {{ l('channel.mode.' + mode) }}
            </button>
          </dropdown>

          <dropdown
            :keep-open="false"
            wrap-class="btn-group ads"
            link-style=""
            link-class="btn btn-secondary dropdown-toggle dropdown-toggle-split"
            v-show="
              conversation.channel.mode == 'both' ||
              conversation.channel.mode == 'ads'
            "
          >
            <button
              class="dropdown-item"
              type="button"
              @click="toggleAutoPostAds()"
            >
              {{ conversation.adManager.isActive() ? 'Pause' : 'Start' }}
              Posting Ads
            </button>
            <button
              class="dropdown-item"
              type="button"
              @click="showAdSettings()"
            >
              Edit Channel Ads...
            </button>
            <div class="dropdown-divider"></div>
            <button
              class="dropdown-item"
              :class="{ selected: showNonMatchingAds }"
              type="button"
              @click="toggleNonMatchingAds()"
            >
              Show Incompatible Ads
            </button>

            <template v-slot:split>
              <a class="btn btn-secondary" @click="toggleAutoPostAds()">
                <i
                  :class="{
                    fas: true,
                    'fa-pause': conversation.adManager.isActive(),
                    'fa-play': !conversation.adManager.isActive()
                  }"
                ></i>
                {{ conversation.adManager.isActive() ? 'Pause' : 'Start' }} Ads
              </a>
            </template>
          </dropdown>
        </div>
      </div>
      <div
        style="
          z-index: 5;
          position: absolute;
          left: 0;
          right: 0;
          max-height: 60%;
          overflow: auto;
        "
        :style="{ display: descriptionExpanded ? 'block' : 'none' }"
        class="bg-solid-text border-bottom hidden-scrollbar"
      >
        <bbcode :text="conversation.channel.description"></bbcode>
      </div>
    </div>
    <div v-else class="header" style="display: flex; align-items: center">
      <i
        style="margin-right: 5px; vertical-align: sub"
        class="fa-solid fa-fw fa-house"
      ></i>
      <h5 style="margin: 0; display: inline; vertical-align: middle">
        {{ l('chat.consoleTab') }}
      </h5>

      <a href="#" @click.prevent="showLogs()" class="btn">
        <span class="fa fa-file-alt"></span>
        <span class="btn-text">{{ l('logs.title') }}</span>
      </a>
    </div>
    <div class="search input-group" v-show="showSearch">
      <span class="input-group-text">
        <span class="fas fa-search"></span>
      </span>
      <input
        v-model="searchInput"
        @keydown.esc="hideSearch()"
        @keypress="lastSearchInput = Date.now()"
        :placeholder="l('chat.search')"
        ref="searchField"
        class="form-control"
      />
      <a
        class="btn btn-sm btn-light"
        style="
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
          line-height: 0;
          z-index: 10;
        "
        @click="hideSearch"
        ><i class="fas fa-times"></i
      ></a>
    </div>
    <div class="auto-ads" v-show="isAutopostingAds()">
      <h4>{{ l('admgr.activeHeader') }}</h4>
      <div class="update">{{ adAutoPostUpdate }}</div>

      <div v-show="adAutoPostNextAd" class="next">
        <h5>
          {{ l('admgr.comingNext') }}
          <a @click="skipAd()"><i class="adAction fas fa-arrow-right" /></a>
        </h5>
        <div>
          {{ adAutoPostNextAd ? adAutoPostNextAd.substr(0, 100) : '' }}...
        </div>
      </div>

      <a
        class="btn btn-sm btn-outline-primary renew-autoposts"
        @click="renewAutoPosting()"
        v-if="!adsRequireSetup"
        >{{ l('admgr.renew') }}</a
      >
      <a
        class="btn btn-sm btn-outline-primary renew-autoposts"
        @click="showAdSettings()"
        v-if="adsRequireSetup"
        >{{ l('admgr.setup') }}</a
      >
    </div>
    <div
      class="border-top messages hidden-scrollbar"
      :class="getMessageWrapperClasses()"
      ref="messages"
      @scroll="onMessagesScroll"
      style="flex: 1; overflow: auto; margin-top: 2px"
    >
      <template v-for="(message, i) in messages">
        <message-view
          :message="message"
          :channel="isChannel(conversation) ? conversation.channel : undefined"
          :key="message.id"
          :classes="message == conversation.lastRead ? 'last-read' : ''"
          :previous="messages[i - 1]"
        >
        </message-view>
        <span
          v-if="hasSFC(message) && message.sfc.action === 'report'"
          :key="'r' + message.id"
        >
          <a
            :href="
              'https://www.f-list.net/fchat/getLog.php?log=' + message.sfc.logid
            "
            v-if="message.sfc.logid"
            target="_blank"
            >{{ l('events.report.viewLog') }}</a
          >
          <span v-else>{{ l('events.report.noLog') }}</span>
          <span v-show="!message.sfc.confirmed">
            |
            <a
              href="#"
              @click.prevent="
                message.sfc.action === 'report' && acceptReport(message.sfc)
              "
              >{{ l('events.report.confirm') }}</a
            >
          </span>
        </span>
      </template>
    </div>
    <bbcode-editor
      v-model="conversation.enteredText"
      @keydown="onKeyDown"
      :extras="extraButtons"
      @input="keepScroll"
      :classes="
        'form-control chat-text-box' +
        (isChannel(conversation) && conversation.isSendingAds
          ? ' ads-text-box'
          : '')
      "
      :hasToolbar="settings.bbCodeBar"
      ref="textBox"
      style="position: relative; margin-top: 5px"
      :maxlength="
        isChannel(conversation) || isPrivate(conversation)
          ? conversation.maxMessageLength
          : undefined
      "
      :characterName="ownName"
      :type="'big'"
    >
      <span
        v-if="isPrivate(conversation) && conversation.typingStatus !== 'clear'"
        class="chat-info-text"
      >
        <user
          :character="conversation.character"
          :match="false"
          :bookmark="false"
          :isMarkerShown="shouldShowMarker"
        ></user
        >&nbsp;{{ l('chat.typing.' + conversation.typingStatus, '').trim() }}
      </span>
      <div v-show="conversation.infoText" class="chat-info-text">
        <span
          class="fa fa-times"
          style="cursor: pointer"
          @click.stop="conversation.infoText = ''"
        ></span>
        <span style="flex: 1; margin-left: 5px">{{
          conversation.infoText
        }}</span>
      </div>
      <div v-show="conversation.errorText" class="chat-info-text">
        <span
          class="fa fa-times"
          style="cursor: pointer"
          @click.stop="conversation.errorText = ''"
        ></span>
        <span class="redText" style="flex: 1; margin-left: 5px">{{
          conversation.errorText
        }}</span>
      </div>
      <div class="bbcode-editor-controls">
        <div
          v-if="isChannel(conversation) || isPrivate(conversation)"
          style="margin-right: 5px"
        >
          {{ getByteLength(conversation.enteredText) }} /
          {{ conversation.maxMessageLength }}
        </div>
        <ul
          class="nav nav-pills send-ads-switcher"
          v-if="isChannel(conversation)"
          style="position: relative; z-index: 10; margin-right: 5px"
        >
          <li
            class="nav-item"
            v-show="
              conversation.channel.mode === 'both' ||
              conversation.channel.mode === 'chat'
            "
          >
            <a
              href="#"
              :class="{
                active: !conversation.isSendingAds,
                disabled:
                  conversation.channel.mode != 'both' ||
                  conversation.adManager.isActive()
              }"
              class="nav-link"
              @click.prevent="setSendingAds(false)"
              >{{ l('channel.mode.chat') }}</a
            >
          </li>
          <li
            class="nav-item"
            v-show="
              conversation.channel.mode === 'both' ||
              conversation.channel.mode === 'ads'
            "
          >
            <a
              href="#"
              :class="{
                active: conversation.isSendingAds,
                disabled:
                  conversation.channel.mode != 'both' ||
                  conversation.adManager.isActive()
              }"
              class="nav-link"
              @click.prevent="setSendingAds(true)"
              >{{ adsMode }}</a
            >
          </li>
          <!--                    <li class="nav-item">-->
          <!--                        <a href="#" :class="{active: conversation.adManager.isActive()}" class="nav-link toggle-autopost" @click="toggleAutoPostAds()">{{l('admgr.toggleAutoPost')}}</a>-->
          <!--                    </li>-->
        </ul>
        <div
          class="btn btn-sm btn-primary"
          v-show="!settings.enterSend"
          @click="sendButton"
        >
          {{ l('chat.send') }}
        </div>
      </div>
    </bbcode-editor>
    <command-help ref="helpDialog"></command-help>
    <settings ref="settingsDialog" :conversation="conversation"></settings>
    <adSettings
      ref="adSettingsDialog"
      :conversation="conversation"
    ></adSettings>
    <logs ref="logsDialog" :conversation="conversation"></logs>
    <manage-channel
      ref="manageDialog"
      v-if="isChannel(conversation)"
      :channel="conversation.channel"
    ></manage-channel>
    <ad-view
      ref="adViewer"
      v-if="isPrivate(conversation) && conversation.character"
      :character="conversation.character"
    ></ad-view>
    <channel-list
      ref="channelList"
      v-if="isPrivate(conversation)"
      :character="conversation.character"
    ></channel-list>
    <modal
      :action="l('user.memo.action')"
      ref="userMemoEditor"
      @submit="updateMemo"
      dialogClass="w-100"
    >
      <div style="float: right; text-align: right">
        {{ getByteLength(editorMemo) }} / 1000
      </div>
      <textarea
        class="form-control"
        v-model="editorMemo"
        maxlength="1000"
      ></textarea>
    </modal>
  </div>
</template>

<script lang="ts">
  import { Component, Hook, Prop, Watch } from '@f-list/vue-ts';
  import Vue from 'vue';
  import { EditorButton, EditorSelection } from '../bbcode/editor';
  import { BBCodeView } from '../bbcode/view';
  import Modal, { isShowing as anyDialogsShown } from '../components/Modal.vue';
  import { Keys } from '../keys';
  import CharacterAdView from './character/CharacterAdView.vue';
  import { Editor } from './bbcode';
  import CommandHelp from './CommandHelp.vue';
  import {
    characterImage,
    errorToString,
    getByteLength,
    getKey
  } from './common';
  import ConversationSettings from './ConversationSettings.vue';
  import ConversationAdSettings from './ads/ConversationAdSettings.vue';
  import core from './core';
  import {
    Channel,
    channelModes,
    Character,
    Conversation,
    Settings
  } from './interfaces';
  import l from './localize';
  import Logs from './Logs.vue';
  import ManageChannel from './ManageChannel.vue';
  import MessageView from './message_view';
  import ReportDialog from './ReportDialog.vue';
  import { isCommand } from './slash_commands';
  import UserView from './UserView.vue';
  import CharacterChannelList from './character/CharacterChannelList.vue';
  import * as _ from 'lodash';
  import Dropdown from '../components/Dropdown.vue';
  import { EventBus } from './preview/event-bus';
  // import { CharacterMemo } from '../site/character_page/interfaces';
  import { MemoManager } from './character/memo';
  import { CharacterMemo } from '../site/character_page/interfaces';

  @Component({
    components: {
      user: UserView,
      'bbcode-editor': Editor,
      'manage-channel': ManageChannel,
      settings: ConversationSettings,
      logs: Logs,
      'message-view': MessageView,
      bbcode: BBCodeView(core.bbCodeParser),
      'command-help': CommandHelp,
      'ad-view': CharacterAdView,
      'channel-list': CharacterChannelList,
      dropdown: Dropdown,
      adSettings: ConversationAdSettings,
      modal: Modal
    }
  })
  export default class ConversationView extends Vue {
    @Prop({ required: true })
    readonly reportDialog!: ReportDialog;
    modes = channelModes;
    descriptionExpanded = false;
    l = l;
    extraButtons: EditorButton[] = [];
    getByteLength = getByteLength;
    tabOptions: string[] | undefined;
    tabOptionsIndex!: number;
    tabOptionSelection!: EditorSelection;
    showSearch = false;
    searchInput = '';
    search = '';
    lastSearchInput = 0;
    messageCount = 0;
    searchTimer = 0;
    messageView!: HTMLElement;
    resizeHandler!: EventListener;
    keydownHandler!: EventListener;
    keypressHandler!: EventListener;
    scrolledDown = true;
    scrolledUp = false;
    ignoreScroll = false;
    adCountdown = 0;
    adsMode = l('channel.mode.ads');
    autoPostingUpdater = 0;
    adAutoPostUpdate: string | null = null;
    adAutoPostNextAd: string | null = null;
    adsRequireSetup = false;
    isChannel = Conversation.isChannel;
    isPrivate = Conversation.isPrivate;
    showNonMatchingAds = true;

    userMemo: string = '';
    editorMemo: string = '';
    memoManager?: MemoManager;

    ownName?: Character;

    @Hook('beforeMount')
    async onBeforeMount(): Promise<void> {
      this.updateOwnName();

      this.showNonMatchingAds =
        !(await core.settingsStore.get('hideNonMatchingAds'));
    }

    @Hook('mounted')
    mounted(): void {
      this.updateOwnName();

      this.extraButtons = [
        {
          title:
            'Help\n\nClick this button for a quick overview of slash commands.',
          tag: '?',
          icon: 'fa-question',
          handler: () => (<CommandHelp>this.$refs['helpDialog']).show()
        }
      ];
      window.addEventListener(
        'resize',
        (this.resizeHandler = () => this.keepScroll())
      );
      window.addEventListener(
        'keypress',
        (this.keypressHandler = () => {
          const selection = document.getSelection();
          if (
            (selection === null || selection.isCollapsed) &&
            !anyDialogsShown &&
            (document.activeElement === document.body ||
              document.activeElement === null ||
              document.activeElement.tagName === 'A')
          )
            (<Editor>this.$refs['textBox']).focus();
        })
      );
      window.addEventListener(
        'keydown',
        (this.keydownHandler = ((e: KeyboardEvent) => {
          if (
            getKey(e) === Keys.KeyF &&
            (e.ctrlKey || e.metaKey) &&
            !e.shiftKey &&
            !e.altKey
          ) {
            this.showSearch = true;
            this.$nextTick(() =>
              (<HTMLElement>this.$refs['searchField']).focus()
            );
          }
        }) as EventListener)
      );
      this.searchTimer = window.setInterval(() => {
        if (
          Date.now() - this.lastSearchInput > 500 &&
          this.search !== this.searchInput
        )
          this.search = this.searchInput;
      }, 500);
      this.messageView = <HTMLElement>this.$refs['messages'];
      this.$watch('conversation.nextAd', (value: number) => {
        const setAdCountdown = () => {
          const diff =
            ((<Conversation.ChannelConversation>this.conversation).nextAd -
              Date.now()) /
            1000;
          if (diff <= 0) {
            if (this.adCountdown !== 0) window.clearInterval(this.adCountdown);
            this.adCountdown = 0;
            this.adsMode = l('channel.mode.ads');
          } else
            this.adsMode = l(
              'channel.mode.ads.countdown',
              Math.floor(diff / 60),
              Math.floor(diff % 60)
            );
        };
        if (Date.now() < value && this.adCountdown === 0)
          this.adCountdown = window.setInterval(setAdCountdown, 1000);
        setAdCountdown();
      });

      this.$watch(
        () => this.conversation.adManager.isActive(),
        () => this.refreshAutoPostingTimer()
      );
      this.refreshAutoPostingTimer();

      this.configUpdateHook = () => this.updateOwnName();
      EventBus.$on('configuration-update', this.configUpdateHook);

      this.memoUpdateHook = (e: any) => this.refreshMemo(e);
      EventBus.$on('character-memo', this.memoUpdateHook);
    }

    protected configUpdateHook: any;

    protected memoUpdateHook: any;

    @Hook('destroyed')
    destroyed(): void {
      window.removeEventListener('resize', this.resizeHandler);
      window.removeEventListener('keydown', this.keydownHandler);
      window.removeEventListener('keypress', this.keypressHandler);
      clearInterval(this.searchTimer);
      clearInterval(this.autoPostingUpdater);
      clearInterval(this.adCountdown);

      EventBus.$off('configuration-update', this.configUpdateHook);
      EventBus.$off('character-memo', this.memoUpdateHook);
    }

    hideSearch(): void {
      this.showSearch = false;
      this.searchInput = '';
    }

    updateOwnName(): void {
      this.ownName = core.state.settings.risingShowPortraitNearInput
        ? core.characters.ownCharacter
        : undefined;
    }

    get conversation(): Conversation {
      return core.conversations.selectedConversation;
    }

    get shouldShowMarker(): boolean {
      return core.state.settings.horizonShowGenderMarker;
    }

    get messages(): ReadonlyArray<
      Conversation.Message | Conversation.SFCMessage
    > {
      if (this.search === '') return this.conversation.messages;
      const filter = new RegExp(this.search.replace(/[^\w]/gi, '\\$&'), 'i');
      return this.conversation.messages.filter(
        x =>
          filter.test(x.text) ||
          filter.test(_.get(x, 'sender.name', '') as string)
      );
    }

    async sendButton(): Promise<void> {
      return this.conversation.send();
    }

    @Watch('conversation')
    async conversationChanged(): Promise<void> {
      this.updateOwnName();

      if (!anyDialogsShown) (<Editor>this.$refs['textBox']).focus();
      this.$nextTick(() =>
        setTimeout(
          () => (this.messageView.scrollTop = this.messageView.scrollHeight)
        )
      );
      this.scrolledDown = true;
      this.refreshAutoPostingTimer();
      this.userMemo = '';

      if (this.isPrivate(this.conversation)) {
        const c = await core.cache.profileCache.get(this.conversation.name);
        this.userMemo = c?.character?.memo?.memo || '';
      }
    }

    @Watch('conversation.messages')
    messageAdded(newValue: Conversation.Message[]): void {
      this.keepScroll();
      if (!this.scrolledDown && newValue.length === this.messageCount)
        this.messageView.scrollTop -=
          this.messageView.firstElementChild!.clientHeight;
      this.messageCount = newValue.length;
    }

    keepScroll(): void {
      if (this.scrolledDown) {
        this.ignoreScroll = true;
        this.$nextTick(() =>
          setTimeout(() => {
            this.ignoreScroll = true;
            this.messageView.scrollTop = this.messageView.scrollHeight;
          }, 0)
        );
      }
    }

    onMessagesScroll(): void {
      if (this.ignoreScroll) {
        this.ignoreScroll = false;
        return;
      }
      if (this.messageView.scrollTop < 20) {
        if (!this.scrolledUp) {
          const firstMessage = this.messageView.firstElementChild;
          if (this.conversation.loadMore() && firstMessage !== null) {
            this.messageView.style.overflow = 'hidden';
            this.$nextTick(() => {
              this.messageView.scrollTop = (<HTMLElement>(
                firstMessage
              )).offsetTop;
              this.messageView.style.overflow = 'auto';
            });
          }
        }
        this.scrolledUp = true;
      } else this.scrolledUp = false;
      this.scrolledDown =
        this.messageView.scrollTop + this.messageView.offsetHeight >=
        this.messageView.scrollHeight - 15;
    }

    @Watch('conversation.errorText')
    @Watch('conversation.infoText')
    textChanged(newValue: string, oldValue: string): void {
      if (oldValue.length === 0 && newValue.length > 0) this.keepScroll();
    }

    @Watch('conversation.typingStatus')
    // tslint:disable-next-line: ban-ts-ignore
    // @ts-ignore-next
    typingStatusChanged(str: string, oldValue: string): void {
      if (oldValue === 'clear') this.keepScroll();
    }

    async onKeyDown(e: KeyboardEvent): Promise<void> {
      const editor = <Editor>this.$refs['textBox'];
      if (getKey(e) === Keys.Tab) {
        if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
        e.preventDefault();
        if (this.conversation.enteredText.length === 0 || this.isConsoleTab)
          return;
        if (this.tabOptions === undefined) {
          const selection = editor.getSelection();
          if (selection.text.length === 0) {
            const match = /\b[\w]+$/.exec(
              editor.text.substring(0, selection.end)
            );
            if (match === null) return;
            selection.start = match.index < 0 ? 0 : match.index;
            selection.text = editor.text.substring(
              selection.start,
              selection.end
            );
            if (selection.text.length === 0) return;
          }
          const search = new RegExp(
            `^${selection.text.replace(/[^\w]/gi, '\\$&')}`,
            'i'
          );
          const c = <Conversation.PrivateConversation>this.conversation;
          let options: ReadonlyArray<{ character: Character }>;
          options = Conversation.isChannel(this.conversation)
            ? this.conversation.channel.sortedMembers
            : [
                { character: c.character },
                { character: core.characters.ownCharacter }
              ];
          this.tabOptions = options
            .filter(x => search.test(x.character.name))
            .map(x => x.character.name);
          this.tabOptionsIndex = 0;
          this.tabOptionSelection = selection;
        }
        if (this.tabOptions.length > 0) {
          const selection = editor.getSelection();
          if (selection.end !== this.tabOptionSelection.end) return;
          if (this.tabOptionsIndex >= this.tabOptions.length)
            this.tabOptionsIndex = 0;
          const name = this.tabOptions[this.tabOptionsIndex];
          const userName = isCommand(this.conversation.enteredText)
            ? name
            : `[user]${name}[/user]`;
          this.tabOptionSelection.end =
            this.tabOptionSelection.start + userName.length;
          this.conversation.enteredText =
            this.conversation.enteredText.substr(
              0,
              this.tabOptionSelection.start
            ) +
            userName +
            this.conversation.enteredText.substr(selection.end);
          ++this.tabOptionsIndex;
        }
      } else {
        if (this.tabOptions !== undefined) this.tabOptions = undefined;
        if (
          getKey(e) === Keys.ArrowUp &&
          this.conversation.enteredText.length === 0 &&
          !e.shiftKey &&
          !e.altKey &&
          !e.ctrlKey &&
          !e.metaKey
        )
          this.conversation.loadLastSent();
        else if (getKey(e) === Keys.Enter) {
          if (e.shiftKey === this.settings.enterSend) return;
          e.preventDefault();
          await this.conversation.send();
        }
      }
    }

    setMode(mode: Channel.Mode): void {
      const conv = <Conversation.ChannelConversation>this.conversation;
      if (conv.channel.mode === 'both') conv.mode = mode;
    }

    async toggleNonMatchingAds(): Promise<void> {
      this.showNonMatchingAds = !this.showNonMatchingAds;

      await core.settingsStore.set(
        'hideNonMatchingAds',
        !this.showNonMatchingAds
      );
    }

    /* tslint:disable */
    getMessageWrapperClasses(): any {
      const filter = core.state.settings.risingFilter;
      const classes: any = {};
      const layout = core.state.settings.chatLayoutMode || 'classic';

      if (this.isPrivate(this.conversation)) {
        classes['filter-channel-messages'] = filter.hidePrivateMessages;
        classes['layout-' + layout] = true;
        return classes;
      }

      if (!this.isChannel(this.conversation)) {
        return {};
      }

      const conv = <Conversation.ChannelConversation>this.conversation;

      classes['messages-' + conv.mode] = true;
      classes['hide-non-matching'] = !this.showNonMatchingAds;

      classes['filter-ads'] = filter.hideAds;
      classes['filter-channel-messages'] =
        conv.channel.owner !== ''
          ? filter.hidePrivateChannelMessages
          : filter.hidePublicChannelMessages;

      // Apply chat layout mode class (classic/modern)
      classes['layout-' + layout] = true;
      return classes;
    }

    acceptReport(sfc: { callid: number }): void {
      core.connection.send('SFC', { action: 'confirm', callid: sfc.callid });
    }

    setSendingAds(is: boolean): void {
      const conv = <Conversation.ChannelConversation>this.conversation;
      if (conv.channel.mode === 'both') {
        conv.isSendingAds = is;
        (<Editor>this.$refs['textBox']).focus();
      }
    }

    showLogs(): void {
      (<Logs>this.$refs['logsDialog']).show();
    }

    showSettings(): void {
      (<ConversationSettings>this.$refs['settingsDialog']).show();
    }

    showAdSettings(): void {
      (<ConversationAdSettings>this.$refs['adSettingsDialog']).show();
    }

    showManage(): void {
      (<ManageChannel>this.$refs['manageDialog']).show();
    }

    showAds(): void {
      (<CharacterAdView>this.$refs['adViewer']).show();
    }

    showChannels(): void {
      (<CharacterChannelList>this.$refs['channelList']).show();
    }

    isAutopostingAds(): boolean {
      return this.conversation.adManager.isActive();
    }

    skipAd(): void {
      this.conversation.adManager.skipAd();
      this.updateAutoPostingState();
    }

    stopAutoPostAds(): void {
      this.conversation.adManager.stop();
    }

    renewAutoPosting(): void {
      this.conversation.adManager.renew();

      this.refreshAutoPostingTimer();
    }

    toggleAutoPostAds(): void {
      if (this.isAutopostingAds()) this.stopAutoPostAds();
      else this.conversation.adManager.start();

      this.refreshAutoPostingTimer();
    }

    updateAutoPostingState() {
      const adManager = this.conversation.adManager;

      this.adAutoPostNextAd = adManager.getNextAd() || null;

      if (this.adAutoPostNextAd) {
        const diff =
          ((adManager.getNextPostDue() || new Date()).getTime() - Date.now()) /
          1000;
        const expDiff =
          ((adManager.getExpireDue() || new Date()).getTime() - Date.now()) /
          1000;

        const diffMins = Math.floor(diff / 60);
        const diffSecs = Math.floor(diff % 60);
        const expDiffMins = Math.floor(expDiff / 60);
        const expDiffSecs = Math.floor(expDiff % 60);

        this.adAutoPostUpdate =
          l(
            adManager.getNextPostDue() && !adManager.getFirstPost()
              ? 'admgr.postingBegins'
              : 'admgr.nextPostDue',
            diffMins,
            diffSecs
          ) + l('admgr.expiresIn', expDiffMins, expDiffSecs);

        this.adsRequireSetup = false;
      } else {
        this.adAutoPostNextAd = null;

        this.adAutoPostUpdate = l('admgr.noAds');
        this.adsRequireSetup = true;
      }
    }

    refreshAutoPostingTimer(): void {
      if (this.autoPostingUpdater)
        window.clearInterval(this.autoPostingUpdater);

      if (!this.isAutopostingAds()) {
        this.adAutoPostUpdate = null;
        this.adAutoPostNextAd = null;
        return;
      }

      this.autoPostingUpdater = window.setInterval(
        () => this.updateAutoPostingState(),
        1000
      );
      this.updateAutoPostingState();
    }

    hasSFC(message: Conversation.Message): message is Conversation.SFCMessage {
      // noinspection TypeScriptValidateTypes
      return (<Partial<Conversation.SFCMessage>>message).sfc !== undefined;
    }

    updateMemo(): void {
      this.memoManager
        ?.set(this.editorMemo)
        .catch((e: object) => alert(errorToString(e)));
      this.userMemo = this.editorMemo;
    }

    refreshMemo(event: { character: string; memo: CharacterMemo }): void {
      this.userMemo = event.memo.memo;
    }

    async showMemo(): Promise<void> {
      if (this.isPrivate(this.conversation)) {
        const c = this.conversation.character;

        this.editorMemo = '';

        (<Modal>this.$refs['userMemoEditor']).show();

        try {
          this.memoManager = new MemoManager(c.name);
          await this.memoManager.load();

          this.userMemo = this.memoManager.get().memo;
          this.editorMemo = this.userMemo;
        } catch (e) {
          alert(errorToString(e));
        }
      }
    }

    get characterImage(): string {
      return characterImage(this.conversation.name);
    }

    get settings(): Settings {
      return core.state.settings;
    }

    get isConsoleTab(): boolean {
      return this.conversation === core.conversations.consoleTab;
    }

    get isChannelMod(): boolean {
      if (core.characters.ownCharacter.isChatOp) return true;
      const conv = <Conversation.ChannelConversation>this.conversation;
      const member = conv.channel.members[core.connection.character];
      return member !== undefined && member.rank > Channel.Rank.Member;
    }
  }
</script>

<style lang="scss">
  @import '~bootstrap/scss/functions';
  @import '~bootstrap/scss/variables';
  @import '~bootstrap/scss/mixins/breakpoints';

  #conversation {
    .header {
      @media (min-width: breakpoint-min(md)) {
        margin-right: 32px;
      }
      .btn {
        padding: 2px 5px;
      }
    }

    .btn-toolbar {
      .btn-group {
        margin-right: 0.3rem;

        &:last-child {
          margin-right: 0;
        }

        a.btn {
          padding-left: 0.5rem;
          padding-right: 0.5rem;
          // color: #cbcbe5;

          i {
            margin-right: 0.4rem;
            font-size: 90%;
          }
        }

        button::before {
          display: inline-block;
          width: 1.3rem;
          height: 1rem;
          content: '';
          margin-left: -1.3rem;
          margin-right: 0.1rem;
          padding-left: 0.3rem;
          font-weight: bold;
        }

        button.selected::before {
          content: '✓';
        }

        &.views {
          button.selected::before {
            content: '•';
          }
        }
      }
    }

    .send-ads-switcher a {
      padding: 3px 10px;
    }

    .toggle-autopost {
      margin-left: 1px;
    }

    .auto-ads {
      background-color: rgb(220, 113, 31);
      padding-left: 10px;
      padding-right: 10px;
      padding-top: 5px;
      padding-bottom: 5px;
      margin: 0;
      position: relative;
      margin-top: 5px;

      .adAction {
        &:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        &:active {
          color: rgba(255, 255, 255, 0.6);
        }
      }

      .renew-autoposts {
        display: block;
        float: right;
        /* margin-top: auto; */
        /* margin-bottom: auto; */
        position: absolute;
        /* bottom: 1px; */
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        border-color: rgba(255, 255, 255, 0.5);
        color: rgba(255, 255, 255, 0.9);

        &:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }

        &:active {
          background-color: rgba(255, 255, 255, 0.6);
        }
      }

      h4 {
        font-size: 1.1rem;
        margin: 0;
        line-height: 100%;
      }

      .update {
        color: rgba(255, 255, 255, 0.6);
        font-size: 13px;
        width: 75%;
      }

      .next {
        margin-top: 0.5rem;
        color: rgba(255, 255, 255, 0.4);
        font-size: 11px;

        h5 {
          font-size: 0.8rem;
          margin: 0;
          line-height: 100%;
        }
      }
    }

    @media (max-width: breakpoint-max(sm)) {
      .mode-switcher a {
        padding: 5px 8px;
      }
    }
  }

  .chat-info-text {
    display: flex;
    align-items: center;
    flex: 1 auto;
    width: 100%;
    @media (max-width: breakpoint-max(xs)) {
      flex-basis: 100%;
    }
  }

  .message-time,
  .message .message-time,
  .ad-viewer .message-time {
    background-color: var(--messageTimeBgColor);
    color: var(--messageTimeFgColor);
    border-radius: 3px;
    padding-left: 3px;
    padding-right: 3px;
    padding-bottom: 2px;
    padding-top: 1px;
    margin-right: 3px;
    font-size: 80%;
  }

  .ad-viewer {
    display: block;

    h3 {
      font-size: 12pt;

      .message-time {
        padding-bottom: 1px;
      }
    }

    .border-bottom {
      margin-bottom: 15px;
      border-width: 1px;
    }
  }

  .user-view {
    .user-rank {
      font-size: 80%;
      margin-right: 2px;
    }

    .user-dev {
      font-size: 80%;
      margin-right: 2px;
    }

    .match-found {
      margin-left: 3px;
      padding-left: 2px;
      padding-right: 2px;
      border-radius: 3px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 75%;
      text-align: center;
      display: inline-block;
      text-transform: uppercase;
      line-height: 100%;
      padding-top: 2px;
      padding-bottom: 2px;

      &.perfect {
        background-color: var(--scorePerfectMatchBg);
        border: 1px solid var(--scorePerfectMatchFg);
        box-shadow: 0 0 5px 0 rgba(255, 255, 255, 0.5);

        &::before {
          content: '✨';
          padding-right: 3px;
        }
      }

      &.match {
        background-color: var(--scoreMatchBg);
        border: solid 1px var(--scoreMatchFg);
      }

      &.weak-match {
        background-color: var(--scoreWeakMatchBg);
        border: 1px solid var(--scoreWeakMatchFg);
      }

      &.weak-mismatch {
        background-color: var(--scoreWeakMismatchBg);
        border: 1px solid var(--scoreWeakMismatchFg);
      }

      &.mismatch {
        background-color: var(--scoreMismatchBg);
        border: 1px solid var(--scoreMismatchFg);
      }
    }
  }

  .messages.hide-non-matching .message.message-score {
    &.mismatch {
      display: none;
    }
  }

  .messages.filter-ads {
    .message.filter-match.message-ad {
      display: none;
    }
  }

  .messages.filter-channel-messages {
    .message.filter-match.message-message,
    .message.filter-match.message-action {
      display: none;
    }
  }

  .message {
    .message-pre {
      font-size: 75%;
      padding-right: 2px;
      padding-left: 1px;
      opacity: 0.9;
      display: inline-block;
    }

    &.message-event {
      font-size: 85%;
      background-color: rgba(255, 255, 255, 0.1);
    }

    &.message-score {
      padding-left: 5px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      &.match {
        border-left: 12px solid var(--scoreStandoutMatchBorderColor);
        background-color: var(--scoreStandoutMatchBgColor);
        // border-left: 12px solid #027b02;
        // background-color: rgba(1, 115, 1, 0.45);
      }

      &.weak-match {
        border-left: 12px solid var(--scoreStandoutWeakMatchBorderColor);
        background-color: var(--scoreStandoutWeakMatchBgColor);

        .bbcode {
          filter: grayscale(0.25);
          opacity: 0.77;
        }
      }

      &.neutral {
        border-left: 12px solid var(--scoreStandoutNeutralBorderColor);

        .bbcode {
          filter: grayscale(0.5);
        }

        .bbcode,
        .user-view,
        .message-time,
        .message-pre,
        .message-post {
          opacity: 0.6;
        }
      }

      &.weak-mismatch {
        border-left: 12px solid var(--scoreStandoutWeakMismatchBorderColor);
        background-color: var(--scoreStandoutWeakMismatchBgColor);

        .bbcode {
          filter: grayscale(0.7);
        }

        .bbcode,
        .user-view,
        .message-time,
        .message-pre,
        .message-post {
          opacity: 0.55;
        }
      }

      &.mismatch {
        border-left: 12px solid var(--scoreStandoutMismatchBorderColor);

        .bbcode {
          filter: grayscale(0.8);
        }

        .bbcode,
        .user-view,
        .message-time,
        .message-pre,
        .message-post {
          opacity: 0.3;
        }
      }
    }
  }

  .user-avatar {
    max-height: 1.2em;
    min-height: 1.2em;
    margin-right: 2px !important;
    margin-top: 0;
    min-width: 1.2em;
    max-width: 1.2em;
  }
</style>

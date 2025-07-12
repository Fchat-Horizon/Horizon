<template>
  <modal
    :action="l('settings.action')"
    @submit="submit"
    @open="load()"
    id="settings"
    dialogClass="w-100"
  >
    <tabs
      style="flex-shrink: 0; margin-bottom: 10px"
      v-model="selectedTab"
      :tabs="[
        l('settings.tabs.general'),
        l('settings.tabs.notifications'),
        'Horizon ✨',
        'Smart Filters ✨',
        l('settings.tabs.hideAds'),
        l('settings.tabs.import')
      ]"
    ></tabs>
    <div v-show="selectedTab === '0'">
      <div class="info">
        <h5>Info</h5>
        <div>
          {{ l('settings.charactersToGeneral') }}
        </div>

        <div>
          {{ l('settings.charactersToGeneral.instructions') }}
        </div>
      </div>

      <div class="form-group">
        <label class="control-label" for="disallowedTags">{{
          l('settings.disallowedTags')
        }}</label>
        <input
          id="disallowedTags"
          class="form-control"
          v-model="disallowedTags"
        />
      </div>
      <div class="form-group">
        <label class="control-label" for="clickOpensMessage">
          <input
            type="checkbox"
            id="clickOpensMessage"
            v-model="clickOpensMessage"
          />
          {{ l('settings.clickOpensMessage') }}
        </label>
      </div>
      <div class="form-group">
        <label class="control-label" for="enterSend">
          <input type="checkbox" id="enterSend" v-model="enterSend" />
          {{ l('settings.enterSend') }}
        </label>
      </div>
      <div class="form-group">
        <label class="control-label" for="showAvatars">
          <input type="checkbox" id="showAvatars" v-model="showAvatars" />
          {{ l('settings.showAvatars') }}
        </label>
      </div>
      <div class="form-group">
        <label class="control-label" for="colorBookmarks">
          <input type="checkbox" id="colorBookmarks" v-model="colorBookmarks" />
          {{ l('settings.colorBookmarks') }}
        </label>
      </div>
      <div class="form-group">
        <label class="control-label" for="animatedEicons">
          <input type="checkbox" id="animatedEicons" v-model="animatedEicons" />
          {{ l('settings.animatedEicons') }}
        </label>
      </div>
      <div class="form-group">
        <label class="control-label" for="idleTimer">{{
          l('settings.idleTimer')
        }}</label>
        <input
          id="idleTimer"
          class="form-control"
          type="number"
          v-model="idleTimer"
          min="0"
          max="1440"
        />
      </div>
      <div class="form-group">
        <label class="control-label" for="messageSeparators">
          <input
            type="checkbox"
            id="messageSeparators"
            v-model="messageSeparators"
          />
          {{ l('settings.messageSeparators') }}
        </label>
      </div>
      <div class="form-group">
        <label class="control-label" for="bbCodeBar">
          <input type="checkbox" id="bbCodeBar" v-model="bbCodeBar" />
          {{ l('settings.bbCodeBar') }}
        </label>
      </div>
      <div class="form-group">
        <label class="control-label" for="logMessages">
          <input type="checkbox" id="logMessages" v-model="logMessages" />
          {{ l('settings.logMessages') }}
        </label>
      </div>
      <div class="form-group">
        <label class="control-label" for="logAds">
          <input type="checkbox" id="logAds" v-model="logAds" />
          {{ l('settings.logAds') }}
        </label>
      </div>
      <div class="form-group">
        <label class="control-label" for="fontSize">{{
          l('settings.fontSize')
        }}</label>
        <input
          id="fontSize"
          type="number"
          min="10"
          max="24"
          class="form-control"
          v-model="fontSize"
        />
      </div>
    </div>
    <div v-show="selectedTab === '1'">
      <div class="form-group">
        <label class="control-label" for="playSound">
          <input type="checkbox" id="playSound" v-model="playSound" />
          {{ l('settings.playSound') }}
        </label>
      </div>
      <div class="form-group">
        <label class="control-label" for="alwaysNotify">
          <input
            type="checkbox"
            id="alwaysNotify"
            v-model="alwaysNotify"
            :disabled="!playSound"
          />
          {{ l('settings.alwaysNotify') }}
        </label>
      </div>
      <div class="form-group">
        <label class="control-label" for="notifications">
          <input type="checkbox" id="notifications" v-model="notifications" />
          {{ l('settings.notifications') }}
        </label>
      </div>
      <div class="form-group">
        <label class="control-label" for="highlight">
          <input type="checkbox" id="highlight" v-model="highlight" />
          {{ l('settings.highlight') }}
        </label>
      </div>
      <div class="form-group">
        <label class="control-label" for="highlightWords">{{
          l('settings.highlightWords')
        }}</label>
        <input
          id="highlightWords"
          class="form-control"
          v-model="highlightWords"
        />
      </div>
      <div class="form-group">
        <label class="control-label" for="eventMessages">
          <input type="checkbox" id="eventMessages" v-model="eventMessages" />
          {{ l('settings.eventMessages') }}
        </label>
      </div>
      <div class="form-group">
        <label class="control-label" for="joinMessages">
          <input type="checkbox" id="joinMessages" v-model="joinMessages" />
          {{ l('settings.joinMessages') }}
        </label>
      </div>
      <div class="form-group">
        <label class="control-label" for="showNeedsReply">
          <input type="checkbox" id="showNeedsReply" v-model="showNeedsReply" />
          {{ l('settings.showNeedsReply') }}
        </label>
      </div>
    </div>
    <div v-show="selectedTab === '2'">
      <h5>Matching</h5>

      <div class="form-group">
        <label class="control-label" for="risingAdScore">
          <input type="checkbox" id="risingAdScore" v-model="risingAdScore" />
          Colorize ads, profiles, and names of compatible and incompatible
          characters
        </label>
      </div>

      <div class="form-group">
        <label class="control-label" for="risingComparisonInUserMenu">
          <input
            type="checkbox"
            id="risingComparisonInUserMenu"
            v-model="risingComparisonInUserMenu"
          />
          Show quick match results in the right click character menu
        </label>
      </div>

      <div class="form-group">
        <label class="control-label" for="risingComparisonInSearch">
          <input
            type="checkbox"
            id="risingComparisonInSearch"
            v-model="risingComparisonInSearch"
          />
          Show quick match results in the search results
        </label>
      </div>

      <!--            <div class="form-group">-->
      <!--                <label class="control-label" for="hideProfileComparisonSummary">-->
      <!--                    <input type="checkbox" id="hideProfileComparisonSummary" :checked="!hideProfileComparisonSummary" @input="hideProfileComparisonSummary = !$event.target.checked"/>-->
      <!--                    Show quick match results at the top of the character profile-->
      <!--                </label>-->
      <!--            </div>-->

      <h5>Preview</h5>

      <div class="form-group">
        <label class="control-label" for="risingLinkPreview">
          <input
            type="checkbox"
            id="risingLinkPreview"
            v-model="risingLinkPreview"
          />
          Show a link/image preview when the mouse hovers over a link
        </label>
      </div>

      <div class="form-group">
        <label class="control-label" for="risingCharacterPreview">
          <input
            type="checkbox"
            id="risingCharacterPreview"
            v-model="risingCharacterPreview"
          />
          Show a character preview when the mouse hovers over a character name
        </label>
      </div>

      <h5>Profile</h5>

      <div class="form-group">
        <label class="control-label" for="risingAutoCompareKinks">
          <input
            type="checkbox"
            id="risingAutoCompareKinks"
            v-model="risingAutoCompareKinks"
          />
          Automatically compare kinks when viewing a character profile
        </label>
      </div>

      <div class="form-group">
        <label class="control-label" for="risingAutoExpandCustomKinks">
          <input
            type="checkbox"
            id="risingAutoExpandCustomKinks"
            v-model="risingAutoExpandCustomKinks"
          />
          Automatically expand custom kinks
        </label>
      </div>

      <h5>Draft Messages</h5>

      <div class="form-group">
        <label class="control-label" for="horizonCacheDraftMessages">
          <input
            type="checkbox"
            id="horizonCacheDraftMessages"
            v-model="horizonCacheDraftMessages"
          />
          {{ l('settings.horizonCacheDraftMessages') }}
        </label>
      </div>

      <div class="form-group">
        <label class="control-label" for="horizonSaveDraftMessagesToDiskTimer">
          {{ l('settings.horizonSaveDraftMessagesToDiskTimer') }}
        </label>
        <input
          id="horizonSaveDraftMessagesToDiskTimer"
          type="number"
          class="form-control"
          v-model="horizonSaveDraftMessagesToDiskTimer"
          placeholder="60"
          min="5"
        />
      </div>

      <h5>Misc</h5>

      <div class="form-group">
        <label class="control-label" for="risingShowUnreadOfflineCount">
          <input
            type="checkbox"
            id="risingShowUnreadOfflineCount"
            v-model="risingShowUnreadOfflineCount"
          />
          Show unread note and offline message counts at the bottom right corner
        </label>
      </div>
      <div class="form-group">
        <label class="control-label" for="horizonNotifyFriendSignIn">
          <input
            type="checkbox"
            id="horizonNotifyFriendSignIn"
            v-model="horizonNotifyFriendSignIn"
          />
          Notify when friends or bookmarks sign in.
        </label>
      </div>
      <div class="form-group">
        <label class="control-label" for="risingColorblindMode">
          <input
            type="checkbox"
            id="risingColorblindMode"
            v-model="risingColorblindMode"
          />
          Colorblind mode
        </label>
      </div>

      <div class="form-group">
        <label class="control-label" for="risingShowPortraitNearInput">
          <input
            type="checkbox"
            id="risingShowPortraitNearInput"
            v-model="risingShowPortraitNearInput"
          />
          Show character portrait by text input
        </label>
      </div>

      <div class="form-group">
        <label class="control-label" for="risingShowPortraitInMessage">
          <input
            type="checkbox"
            id="risingShowPortraitInMessage"
            v-model="risingShowPortraitInMessage"
          />
          Show character portrait with each message
        </label>
      </div>

      <div class="form-group">
        <label class="control-label" for="risingShowHighQualityPortraits">
          <input
            type="checkbox"
            id="risingShowHighQualityPortraits"
            v-model="risingShowHighQualityPortraits"
          />
          Show high-quality portraits
        </label>
      </div>

      <div class="form-group">
        <label class="control-label" for="horizonShowCustomCharacterColors">
          <input
            type="checkbox"
            id="horizonShowCustomCharacterColors"
            v-model="horizonShowCustomCharacterColors"
          />
          Show custom character name colors
        </label>
      </div>

      <div class="form-group">
        <label class="control-label" for="horizonShowGenderMarker">
          <input
            type="checkbox"
            id="horizonShowGenderMarker"
            v-model="horizonShowGenderMarker"
          />
          Show a gender icon on everyone
        </label>
      </div>

      <div class="form-group">
        <label class="control-label" for="horizonGenderMarkerOrigColor">
          <input
            type="checkbox"
            id="horizonGenderMarkerOrigColor"
            v-model="horizonGenderMarkerOrigColor"
            :disabled="
              !horizonShowGenderMarker || !horizonShowCustomCharacterColors
            "
          />
          Make gender icon use the original gender color instead of the custom
          name color
        </label>
      </div>

      <div class="form-group">
        <label class="control-label" for="horizonChangeOfflineColor">
          <input
            type="checkbox"
            id="horizonChangeOfflineColor"
            v-model="horizonChangeOfflineColor"
          />
          Make color in chat change to grey when a user goes offline
        </label>
      </div>

      <div class="form-group">
        <label class="control-label" for="risingCharacterTheme">
          Override UI theme (for this character only)
          <select
            id="risingCharacterTheme"
            class="form-control"
            v-model="risingCharacterTheme"
            style="flex: 1; margin-right: 10px"
          >
            <option value="undefined">(Use default theme)</option>
            <option disabled>---</option>
            <option v-for="theme in risingAvailableThemes" :value="theme">
              {{ theme }}
            </option>
          </select>
        </label>
      </div>
    </div>

    <div v-show="selectedTab === '3'">
      <div class="warning">
        <h5>Danger Zone!</h5>
        <div>
          By activating filtering, you may no longer be able to see or receive
          all messages from F-Chat. Filters do not apply to friends or
          bookmarked characters.
        </div>

        <div>
          Beta version. Some of these features and behaviors may be removed or
          significantly changed in the future.
        </div>
      </div>

      <h5>Visibility</h5>

      <div class="form-group filters">
        <label class="control-label" for="risingFilter.hideAds">
          <input
            type="checkbox"
            id="risingFilter.hideAds"
            v-model="risingFilter.hideAds"
          />
          Hide <b>ads</b> from matching characters
        </label>

        <label class="control-label" for="risingFilter.hideSearchResults">
          <input
            type="checkbox"
            id="risingFilter.hideSearchResults"
            v-model="risingFilter.hideSearchResults"
          />
          Hide matching characters from <b>search results</b>
        </label>

        <label class="control-label" for="risingFilter.hideChannelMembers">
          <input
            type="checkbox"
            id="risingFilter.hideChannelMembers"
            v-model="risingFilter.hideChannelMembers"
          />
          Hide matching characters from <b>channel members lists</b>
        </label>

        <label
          class="control-label"
          for="risingFilter.hidePublicChannelMessages"
        >
          <input
            type="checkbox"
            id="risingFilter.hidePublicChannelMessages"
            v-model="risingFilter.hidePublicChannelMessages"
          />
          Hide <b>public channel messages</b> from matching characters
        </label>

        <label
          class="control-label"
          for="risingFilter.hidePrivateChannelMessages"
        >
          <input
            type="checkbox"
            id="risingFilter.hidePrivateChannelMessages"
            v-model="risingFilter.hidePrivateChannelMessages"
          />
          Hide <b>private channel messages</b> from matching characters
        </label>

        <label class="control-label" for="risingFilter.hidePrivateMessages">
          <input
            type="checkbox"
            id="risingFilter.hidePrivateMessages"
            v-model="risingFilter.hidePrivateMessages"
          />
          Hide <b>private messages</b> (PMs) from matching characters
        </label>

        <label class="control-label" for="risingFilter.showFilterIcon">
          <input
            type="checkbox"
            id="risingFilter.showFilterIcon"
            v-model="risingFilter.showFilterIcon"
          />
          Show <b>filter icon</b> on matching characters
        </label>
      </div>

      <div class="form-group filters">
        <label class="control-label" for="risingFilter.penalizeMatches">
          <input
            type="checkbox"
            id="risingFilter.penalizeMatches"
            v-model="risingFilter.penalizeMatches"
          />
          Penalize <b>match scores</b> for matching characters
        </label>

        <label class="control-label" for="risingFilter.rewardNonMatches">
          <input
            type="checkbox"
            id="risingFilter.rewardNonMatches"
            v-model="risingFilter.rewardNonMatches"
          />
          Increase <b>match scores</b> for non-matching characters
        </label>
      </div>

      <h5>Character Age Match</h5>
      <div class="form-group">Leave empty for no limit.</div>

      <div class="form-group">
        <label class="control-label" for="risingFilter.minAge"
          >Characters younger than (years)</label
        >
        <input
          id="risingFilter.minAge"
          type="number"
          class="form-control"
          v-model="risingFilter.minAge"
          placeholder="Enter age"
        />

        <label class="control-label" for="risingFilter.maxAge"
          >Characters older than (years)</label
        >
        <input
          id="risingFilter.maxAge"
          type="number"
          class="form-control"
          v-model="risingFilter.maxAge"
          placeholder="Enter age"
        />
      </div>

      <h5>Type Match</h5>
      <div class="form-group filters">
        <label
          class="control-label"
          :for="'risingFilter.smartFilters.' + key"
          v-for="(value, key) in smartFilterTypes"
        >
          <input
            type="checkbox"
            :id="'risingFilter.smartFilters.' + key"
            v-bind:checked="getSmartFilter(key)"
            @change="v => setSmartFilter(key, v)"
          />
          {{ value.name }}
        </label>
      </div>

      <h5>Automatic Replies</h5>
      <div class="form-group filters">
        <label class="control-label" for="risingFilter.autoReply">
          <input
            type="checkbox"
            id="risingFilter.autoReply"
            v-model="risingFilter.autoReply"
          />
          Send an automatic 'no thank you' response to matching characters if
          they message you
        </label>

        <label class="control-label" for="risingFilter.autoReplyCustom">
          <input
            type="checkbox"
            id="risingFilter.autoReplyCustom"
            v-model="risingFilter.autoReplyCustom"
            :disabled="!risingFilter.autoReply"
          />
          Use a custom message defined below instead of the default message
        </label>

        <editor
          v-model="risingFilter.autoReplyCustomMessage"
          :hasToolbar="true"
          class="form-control"
          rows="5"
          :disabled="!risingFilter.autoReplyCustom || !risingFilter.autoReply"
          placeholder="Put your custom message for automatic replies here"
          maxlength="10000"
        >
        </editor>

        <div class="form-group">
          You will still see messages unless you have the "Hide private channel
          messages" option above selected. Even then, if they send a second
          message it will bypass the restriction and show you their message.
          These messages are limited to 10000 characters.
        </div>
      </div>

      <h5>Exception List</h5>
      <div class="form-group">
        Filters and automatic replies are not applied to these character names.
        Separate names with a linefeed. Friends and bookmarked characters bypass
        filtering automatically.
      </div>

      <div class="form-group">
        <textarea
          class="form-control"
          :value="getExceptionList()"
          @change="v => setExceptionList(v)"
          placeholder="Enter names"
        ></textarea>
      </div>
    </div>

    <div v-show="selectedTab === '4'">
      <template v-if="hidden.length">
        <div v-for="(user, i) in hidden">
          <span
            class="fa fa-times"
            style="cursor: pointer"
            @click.stop="hidden.splice(i, 1)"
          ></span>
          {{ user }}
        </div>
      </template>
      <template v-else>{{ l('settings.hideAds.empty') }}</template>
    </div>
    <div v-show="selectedTab === '5'">
      <div style="display: flex; padding-top: 10px">
        <select
          id="import"
          class="form-control"
          v-model="importCharacter"
          style="flex: 1; margin-right: 10px"
        >
          <option value="">{{ l('settings.import.selectCharacter') }}</option>
          <option v-for="character in availableImports" :value="character">
            {{ character }}
          </option>
        </select>
        <button
          class="btn btn-secondary"
          @click="doImport"
          :disabled="!importCharacter"
        >
          {{ l('settings.import') }}
        </button>
      </div>
    </div>
  </modal>
</template>

<script lang="ts">
  import * as fs from 'fs';
  import * as path from 'path';
  import { Component } from '@f-list/vue-ts';
  import CustomDialog from '../components/custom_dialog';
  import Modal from '../components/Modal.vue';
  import { Editor } from './bbcode';
  import Tabs from '../components/tabs';
  import core from './core';
  import { Settings as SettingsInterface } from './interfaces';
  import l from './localize';
  import {
    SmartFilterSettings,
    SmartFilterSelection
  } from '../learn/filter/types';
  import { smartFilterTypes as smartFilterTypesOrigin } from '../learn/filter/types';
  import _ from 'lodash';
  import { matchesSmartFilters } from '../learn/filter/smart-filter';
  import { EventBus } from './preview/event-bus';

  @Component({
    components: { modal: Modal, editor: Editor, tabs: Tabs }
  })
  export default class SettingsView extends CustomDialog {
    l = l;
    availableImports: ReadonlyArray<string> = [];
    selectedTab = '0';
    importCharacter = '';
    playSound!: boolean;
    clickOpensMessage!: boolean;
    disallowedTags!: string;
    notifications!: boolean;
    highlight!: boolean;
    highlightWords!: string;
    showAvatars!: boolean;
    animatedEicons!: boolean;
    idleTimer!: string;
    messageSeparators!: boolean;
    eventMessages!: boolean;
    joinMessages!: boolean;
    alwaysNotify!: boolean;
    logMessages!: boolean;
    logAds!: boolean;
    fontSize!: string;
    showNeedsReply!: boolean;
    enterSend!: boolean;
    colorBookmarks!: boolean;
    bbCodeBar!: boolean;

    risingAdScore!: boolean;
    risingLinkPreview!: boolean;
    risingAutoCompareKinks!: boolean;

    risingAutoExpandCustomKinks!: boolean;
    risingCharacterPreview!: boolean;
    risingComparisonInUserMenu!: boolean;
    risingComparisonInSearch!: boolean;

    risingShowUnreadOfflineCount!: boolean;
    risingColorblindMode!: boolean;

    risingShowPortraitNearInput!: boolean;
    risingShowPortraitInMessage!: boolean;
    risingShowHighQualityPortraits!: boolean;
    horizonShowCustomCharacterColors!: boolean;
    horizonShowGenderMarker!: boolean;
    horizonGenderMarkerOrigColor!: boolean;
    horizonChangeOfflineColor!: boolean;
    horizonNotifyFriendSignIn!: boolean;

    horizonCacheDraftMessages!: boolean;
    horizonSaveDraftMessagesToDiskTimer!: string;

    risingFilter!: SmartFilterSettings = {} as any;

    risingAvailableThemes!: ReadonlyArray<string> = [];
    risingCharacterTheme!: string | undefined;

    smartFilterTypes = smartFilterTypesOrigin;

    async load(): Promise<void> {
      const settings = core.state.settings;
      this.playSound = settings.playSound;
      this.clickOpensMessage = settings.clickOpensMessage;
      this.disallowedTags = settings.disallowedTags.join(',');
      this.notifications = settings.notifications;
      this.highlight = settings.highlight;
      this.highlightWords = settings.highlightWords.join(',');
      this.showAvatars = settings.showAvatars;
      this.animatedEicons = settings.animatedEicons;
      this.idleTimer = settings.idleTimer.toString();
      this.messageSeparators = settings.messageSeparators;
      this.eventMessages = settings.eventMessages;
      this.joinMessages = settings.joinMessages;
      this.alwaysNotify = settings.alwaysNotify;
      this.logMessages = settings.logMessages;
      this.logAds = settings.logAds;
      this.fontSize = settings.fontSize.toString();
      this.showNeedsReply = settings.showNeedsReply;
      this.enterSend = settings.enterSend;
      this.colorBookmarks = settings.colorBookmarks;
      this.bbCodeBar = settings.bbCodeBar;
      this.availableImports = (
        await core.settingsStore.getAvailableCharacters()
      ).filter(x => x !== core.connection.character);

      // settings.rising

      this.risingAdScore = settings.risingAdScore;
      this.risingLinkPreview = settings.risingLinkPreview;
      this.risingAutoCompareKinks = settings.risingAutoCompareKinks;

      this.risingAutoExpandCustomKinks = settings.risingAutoExpandCustomKinks;
      this.risingCharacterPreview = settings.risingCharacterPreview;
      this.risingComparisonInUserMenu = settings.risingComparisonInUserMenu;
      this.risingComparisonInSearch = settings.risingComparisonInSearch;
      this.risingShowUnreadOfflineCount = settings.risingShowUnreadOfflineCount;

      this.risingColorblindMode = settings.risingColorblindMode;
      this.risingShowPortraitNearInput = settings.risingShowPortraitNearInput;
      this.risingShowPortraitInMessage = settings.risingShowPortraitInMessage;
      this.risingShowHighQualityPortraits =
        settings.risingShowHighQualityPortraits;
      this.horizonShowCustomCharacterColors =
        settings.horizonShowCustomCharacterColors;
      this.horizonShowGenderMarker = settings.horizonShowGenderMarker;
      this.horizonGenderMarkerOrigColor = settings.horizonGenderMarkerOrigColor;
      this.horizonChangeOfflineColor = settings.horizonChangeOfflineColor;

      this.horizonCacheDraftMessages = settings.horizonCacheDraftMessages;
      this.horizonSaveDraftMessagesToDiskTimer =
        settings.horizonSaveDraftMessagesToDiskTimer.toString();

      this.horizonNotifyFriendSignIn = settings.horizonNotifyFriendSignIn;
      this.risingFilter = settings.risingFilter;

      this.risingAvailableThemes = fs
        .readdirSync(path.join(__dirname, 'themes'))
        .filter(x => x.substr(-4) === '.css')
        .map(x => x.slice(0, -4));
      this.risingCharacterTheme = settings.risingCharacterTheme;
    }

    async doImport(): Promise<void> {
      if (
        !confirm(
          l(
            'settings.import.confirm',
            this.importCharacter,
            core.connection.character
          )
        )
      )
        return;
      const importKey = async (key: keyof SettingsInterface.Keys) => {
        const settings = await core.settingsStore.get(
          key,
          this.importCharacter
        );
        if (settings !== undefined) await core.settingsStore.set(key, settings);
      };
      await importKey('settings');
      await importKey('pinned');
      await importKey('modes');
      await importKey('conversationSettings');
      core.connection.close(false);
    }

    get hidden(): string[] {
      return core.state.hiddenUsers;
    }

    async submit(): Promise<void> {
      const oldRisingFilter = JSON.parse(
        JSON.stringify(core.state.settings.risingFilter)
      );

      const idleTimer = parseInt(this.idleTimer, 10);
      const fontSize = parseFloat(this.fontSize);

      const minAge = this.getAsNumber(this.risingFilter.minAge);
      const maxAge = this.getAsNumber(this.risingFilter.maxAge);

      const diskDraftTimer = this.getAsNumber(
        this.horizonSaveDraftMessagesToDiskTimer
      );

      core.state.settings = {
        playSound: this.playSound,
        clickOpensMessage: this.clickOpensMessage,
        disallowedTags: this.disallowedTags
          .split(',')
          .map(x => x.trim())
          .filter(x => x.length),
        notifications: this.notifications,
        highlight: this.highlight,
        highlightWords: this.highlightWords
          .split(',')
          .map(x => x.trim())
          .filter(x => x.length),
        showAvatars: this.showAvatars,
        animatedEicons: this.animatedEicons,
        idleTimer: isNaN(idleTimer)
          ? 0
          : idleTimer < 0
            ? 0
            : idleTimer > 1440
              ? 1440
              : idleTimer,
        messageSeparators: this.messageSeparators,
        eventMessages: this.eventMessages,
        joinMessages: this.joinMessages,
        alwaysNotify: this.alwaysNotify,
        logMessages: this.logMessages,
        logAds: this.logAds,
        fontSize: isNaN(fontSize)
          ? 14
          : fontSize < 10
            ? 10
            : fontSize > 24
              ? 24
              : fontSize,
        showNeedsReply: this.showNeedsReply,
        enterSend: this.enterSend,
        colorBookmarks: this.colorBookmarks,
        bbCodeBar: this.bbCodeBar,

        risingAdScore: this.risingAdScore,
        risingLinkPreview: this.risingLinkPreview,
        risingAutoCompareKinks: this.risingAutoCompareKinks,

        risingAutoExpandCustomKinks: this.risingAutoExpandCustomKinks,
        risingCharacterPreview: this.risingCharacterPreview,
        risingComparisonInUserMenu: this.risingComparisonInUserMenu,
        risingComparisonInSearch: this.risingComparisonInSearch,
        risingShowUnreadOfflineCount: this.risingShowUnreadOfflineCount,
        risingShowPortraitNearInput: this.risingShowPortraitNearInput,
        risingShowPortraitInMessage: this.risingShowPortraitInMessage,
        risingShowHighQualityPortraits: this.risingShowHighQualityPortraits,
        horizonShowCustomCharacterColors: this.horizonShowCustomCharacterColors,
        horizonShowGenderMarker: this.horizonShowGenderMarker,
        horizonGenderMarkerOrigColor: this.horizonGenderMarkerOrigColor,
        horizonChangeOfflineColor: this.horizonChangeOfflineColor,
        horizonNotifyFriendSignIn: this.horizonNotifyFriendSignIn,

        horizonCacheDraftMessages: this.horizonCacheDraftMessages,
        horizonSaveDraftMessagesToDiskTimer:
          diskDraftTimer === null
            ? 60
            : diskDraftTimer > 5
              ? diskDraftTimer
              : 5,

        risingColorblindMode: this.risingColorblindMode,
        risingFilter: {
          ...this.risingFilter,
          minAge:
            minAge !== null && maxAge !== null
              ? Math.min(minAge, maxAge)
              : minAge,
          maxAge:
            minAge !== null && maxAge !== null
              ? Math.max(minAge, maxAge)
              : maxAge
        },

        risingCharacterTheme:
          this.risingCharacterTheme != 'undefined'
            ? this.risingCharacterTheme
            : undefined
      };

      console.log('SETTINGS', minAge, maxAge, core.state.settings);

      const newRisingFilter = JSON.parse(
        JSON.stringify(core.state.settings.risingFilter)
      );

      if (!_.isEqual(oldRisingFilter, newRisingFilter)) {
        this.rebuildFilters();
      }

      if (this.notifications) await core.notifications.requestPermission();

      EventBus.$emit('configuration-update', core.state.settings);
    }

    rebuildFilters() {
      core.cache.profileCache.onEachInMemory(c => {
        const oldFiltered = c.match.isFiltered;

        c.match.isFiltered = matchesSmartFilters(
          c.character.character,
          core.state.settings.risingFilter
        );

        if (oldFiltered !== c.match.isFiltered) {
          core.cache.populateAllConversationsWithScore(
            c.character.character.name,
            c.match.matchScore,
            c.match.isFiltered
          );
        }
      });
    }

    getAsNumber(input: any): number | null {
      if (_.isNil(input) || input === '') {
        return null;
      }

      const n = parseInt(input, 10);

      return !Number.isNaN(n) && Number.isFinite(n) ? n : null;
    }

    getExceptionList(): string {
      return _.join(this.risingFilter.exceptionNames, '\n');
    }

    setExceptionList(v: any): void {
      this.risingFilter.exceptionNames = _.map(_.split(v.target.value), v =>
        _.trim(v)
      );
    }

    getSmartFilter(key: keyof SmartFilterSelection): boolean {
      return !!this.risingFilter.smartFilters?.[key];
    }

    setSmartFilter(key: keyof SmartFilterSelection, value: any): void {
      this.risingFilter.smartFilters[key] = value.target.checked;
    }
  }
</script>

<style lang="scss">
  #settings .form-group {
    margin-left: 0;
    margin-right: 0;
  }

  #settings .form-group.filters label {
    display: list-item;
    margin: 0;
    margin-left: 5px;
    list-style: none;
  }

  #settings .warning,
  #settings .info {
    padding: 10px;
    margin-bottom: 20px;
    border-radius: 3px;

    div {
      margin-top: 10px;
    }
  }
  #settings .warning {
    border: 1px solid var(--warning);
  }

  #settings .info {
    border: 1px solid var(--info);
  }

  #settings .bbcode-preview {
    margin-top: 0;
    border: 1px solid;
    padding: 5px;
    border-radius: 0 5px 5px 5px;
    background: var(--input-bg);
    border-color: var(--secondary);
  }

  #settings .bbcode-editor {
    border: none;
    background: none;
    height: auto;

    textarea {
      width: 100%;
      color: var(--input-color);
      background-color: var(--input-bg);
      border-radius: 0 5px 5px 5px;
    }
  }

  #settings .form-group.filters.age label {
    padding-top: 10px;
  }

  #settings .form-group.filters.age input {
    margin-left: 5px;
  }
</style>

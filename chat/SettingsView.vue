<template>
  <modal
    :action="l('settings.character')"
    :buttonText="l('settings.action')"
    @submit="submit"
    @open="load()"
    id="settings"
    dialogClass="modal-70"
    iconClass="fas fa-user-gear"
  >
    <tabs
      style="flex-shrink: 0; margin-bottom: 10px"
      v-model="selectedTab"
      :fullWidth="true"
      :tabs="[
        l('settings.tabs.chat'),
        l('settings.tabs.appearance'),
        l('settings.tabs.notifications'),
        l('settings.tabs.profiles'),
        l('settings.tabs.smartFilters'),
        l('settings.tabs.import')
      ]"
    ></tabs>
    <div class="warning">
      <h5>{{ l('warning.info') }}</h5>
      <div>
        {{ l('settings.charactersToGeneral') }}
      </div>

      <div>
        {{ l('settings.charactersToGeneral.instructions') }}
      </div>
    </div>

    <div v-show="selectedTab === '0'">
      <h5>{{ l('settings.chat.bbcode') }}</h5>

      <div class="mb-3 p-2">
        <label class="control-label" for="disallowedTags">{{
          l('settings.disallowedTags')
        }}</label>
        <input
          id="disallowedTags"
          class="form-control"
          v-model="disallowedTags"
        />
      </div>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="animatedEicons">
              {{ l('settings.animatedEicons') }}
            </label>
          </div>
          <settings-checkbox
            v-model="animatedEicons"
            :name="'animatedEicons'"
          ></settings-checkbox>
        </div>
      </div>
      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="smoothMosaics">
              {{ l('settings.smoothMosaics') }}
            </label>
          </div>
          <settings-checkbox
            v-model="smoothMosaics"
            :name="'smoothMosaics'"
          ></settings-checkbox>
        </div>
      </div>

      <h5>{{ l('settings.chat.textBox') }}</h5>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="bbCodeBar">
              {{ l('settings.bbCodeBar') }}
            </label>
          </div>
          <settings-checkbox
            v-model="bbCodeBar"
            :name="'bbCodeBar'"
          ></settings-checkbox>
        </div>
      </div>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="enterSend">
              {{ l('settings.enterSend') }}
            </label>
          </div>
          <settings-checkbox
            v-model="enterSend"
            :name="'enterSend'"
          ></settings-checkbox>
        </div>
      </div>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="horizonUseColorPicker">
              {{ l('settings.horizonUseColorPicker') }}
            </label>
          </div>
          <settings-checkbox
            v-model="horizonUseColorPicker"
            :name="'horizonUseColorPicker'"
            :disabled="!bbCodeBar"
          ></settings-checkbox>
        </div>
      </div>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="risingShowPortraitNearInput">
              {{ l('settings.showPortraitNearInput') }}
            </label>
          </div>
          <settings-checkbox
            v-model="risingShowPortraitNearInput"
            :name="'risingShowPortraitNearInput'"
          ></settings-checkbox>
        </div>
      </div>

      <h5>{{ l('settings.chat.behavior') }}</h5>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="clickOpensMessage">
              {{ l('settings.clickOpensMessage') }}
            </label>
          </div>
          <settings-checkbox
            v-model="clickOpensMessage"
            :name="'clickOpensMessage'"
          ></settings-checkbox>
        </div>
      </div>
      <div class="mb-3 p-2">
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
      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="showNeedsReply">
              {{ l('settings.showNeedsReply') }}
            </label>
          </div>
          <settings-checkbox
            v-model="showNeedsReply"
            :name="'showNeedsReply'"
          ></settings-checkbox>
        </div>
      </div>
      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="risingShowUnreadOfflineCount">
              {{ l('settings.risingShowUnreadOfflineCount') }}
            </label>
          </div>
          <settings-checkbox
            v-model="risingShowUnreadOfflineCount"
            :name="'risingShowUnreadOfflineCount'"
          ></settings-checkbox>
        </div>
      </div>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="colorBookmarks">
              {{ l('settings.colorBookmarks') }}
            </label>
          </div>
          <settings-checkbox
            v-model="colorBookmarks"
            :name="'colorBookmarks'"
          ></settings-checkbox>
        </div>
      </div>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="showPerCharacterFriends">
              {{ l('settings.showPerCharacterFriends') }}
            </label>
          </div>
          <settings-checkbox
            v-model="showPerCharacterFriends"
            :name="'showPerCharacterFriends'"
          ></settings-checkbox>
        </div>
      </div>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="hideNonCharacterFriends">
              {{ l('settings.hideNonCharacterFriends') }}
            </label>
          </div>
          <settings-checkbox
            v-model="hideNonCharacterFriends"
            :name="'hideNonCharacterFriends'"
          ></settings-checkbox>
        </div>
      </div>

      <h5>{{ l('settings.chat.logging') }}</h5>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="logMessages">
              {{ l('settings.logMessages') }}
            </label>
          </div>
          <settings-checkbox
            v-model="logMessages"
            :name="'logMessages'"
          ></settings-checkbox>
        </div>
      </div>
      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="logAds">
              {{ l('settings.logAds') }}
            </label>
          </div>
          <settings-checkbox
            v-model="logAds"
            :name="'logAds'"
          ></settings-checkbox>
        </div>
      </div>
      <h5>{{ l('settings.horizonDraftMessages') }}</h5>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="horizonCacheDraftMessages">
              {{ l('settings.horizonCacheDraftMessages') }}
            </label>
          </div>
          <settings-checkbox
            v-model="horizonCacheDraftMessages"
            :name="'horizonCacheDraftMessages'"
          ></settings-checkbox>
        </div>
      </div>

      <div class="mb-3 p-2">
        <label class="control-label" for="horizonSaveDraftMessagesToDiskTimer">
          {{ l('settings.horizonSaveDraftMessagesToDiskTimer') }}
        </label>
        <input
          id="horizonSaveDraftMessagesToDiskTimer"
          type="number"
          class="form-control"
          v-model="horizonSaveDraftMessagesToDiskTimer"
          :placeholder="'60'"
          min="5"
        />
      </div>

      <h5>{{ l('settings.preview') }}</h5>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="risingLinkPreview">
              {{ l('settings.preview.link') }}
            </label>
          </div>
          <settings-checkbox
            v-model="risingLinkPreview"
            :name="'risingLinkPreview'"
          ></settings-checkbox>
        </div>
      </div>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="risingCharacterPreview">
              {{ l('settings.preview.character') }}
            </label>
          </div>
          <settings-checkbox
            v-model="risingCharacterPreview"
            :name="'risingCharacterPreview'"
          ></settings-checkbox>
        </div>
      </div>
    </div>

    <div v-show="selectedTab === '1'">
      <h5>{{ l('settings.appearance.layout') }}</h5>

      <div class="mb-3 p-2">
        <label class="control-label" for="fontSize">{{
          l('settings.experimental', l('settings.fontSize'))
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
      <div class="mb-3 p-2">
        <label class="control-label" for="risingCharacterTheme">
          {{ l('settings.overrideCharacterTheme') }}
          <select
            id="risingCharacterTheme"
            class="form-select"
            v-model="risingCharacterTheme"
            style="flex: 1; margin-right: 10px"
          >
            <option value="undefined">
              {{ l('settings.useDefaultTheme') }}
            </option>
            <option disabled>---</option>
            <option v-for="theme in risingAvailableThemes" :value="theme">
              {{ theme }}
            </option>
          </select>
        </label>
      </div>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="showAvatars">
              {{ l('settings.showAvatars') }}
            </label>
          </div>
          <settings-checkbox
            v-model="showAvatars"
            :name="'showAvatars'"
          ></settings-checkbox>
        </div>
      </div>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="risingShowHighQualityPortraits">
              {{ l('settings.showHighQualityPortraits') }}
            </label>
          </div>
          <settings-checkbox
            v-model="risingShowHighQualityPortraits"
            :name="'risingShowHighQualityPortraits'"
          ></settings-checkbox>
        </div>
      </div>

      <h5>{{ l('settings.appearance.messages') }}</h5>

      <div class="mb-3 p-2">
        <label class="control-label" for="chatLayoutMode">{{
          l('settings.experimental', l('settings.chatLayoutMode'))
        }}</label>
        <select
          id="chatLayoutMode"
          class="form-select"
          v-model="chatLayoutMode"
        >
          <option value="classic">
            {{ l('settings.chatLayoutMode.classic') }}
          </option>
          <option value="modern">
            {{ l('settings.chatLayoutMode.modern') }}
          </option>
        </select>
        <small class="form-text text-muted">{{
          l('settings.chatLayoutMode.modernDescription')
        }}</small>
      </div>
      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="messageGrouping">
              {{ l('settings.messageGrouping') }}
            </label>
            <div class="form-text text-muted">
              {{ l('settings.messageGrouping.description') }}
            </div>
          </div>
          <settings-checkbox
            v-model="messageGrouping"
            :name="'messageGrouping'"
            :disabled="chatLayoutMode !== 'modern'"
          ></settings-checkbox>
        </div>
      </div>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="messageSeparators">
              {{ l('settings.messageSeparators') }}
            </label>
          </div>
          <settings-checkbox
            v-model="messageSeparators"
            :name="'messageSeparators'"
          ></settings-checkbox>
        </div>
      </div>
      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="risingShowPortraitInMessage">
              {{ l('settings.showPortraitInMessage') }}
            </label>
          </div>
          <settings-checkbox
            v-model="risingShowPortraitInMessage"
            :name="'risingShowPortraitInMessage'"
          ></settings-checkbox>
        </div>
      </div>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label
              class="control-label"
              for="horizonMessagePortraitHighQuality"
            >
              {{ l('settings.messagePortraitHighQuality') }}
            </label>
          </div>
          <settings-checkbox
            v-model="horizonMessagePortraitHighQuality"
            :name="'horizonMessagePortraitHighQuality'"
            :disabled="!risingShowHighQualityPortraits"
          ></settings-checkbox>
        </div>
      </div>

      <h5>{{ l('settings.appearance.users') }}</h5>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="horizonShowCustomCharacterColors">
              {{ l('settings.showCustomCharacterColors') }}
            </label>
          </div>
          <settings-checkbox
            v-model="horizonShowCustomCharacterColors"
            :name="'horizonShowCustomCharacterColors'"
          ></settings-checkbox>
        </div>
      </div>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="risingColorblindMode">
              {{ l('settings.colorblindMode') }}
            </label>
          </div>
          <settings-checkbox
            v-model="risingColorblindMode"
            :name="'risingColorblindMode'"
          ></settings-checkbox>
        </div>
      </div>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="horizonShowDeveloperBadges">
              {{ l('settings.showDeveloperBadges') }}
            </label>
          </div>
          <settings-checkbox
            v-model="horizonShowDeveloperBadges"
            :name="'horizonShowDeveloperBadges'"
          ></settings-checkbox>
        </div>
      </div>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="horizonShowGenderMarker">
              {{ l('settings.showGenderIcon') }}
            </label>
          </div>
          <settings-checkbox
            v-model="horizonShowGenderMarker"
            :name="'horizonShowGenderMarker'"
          ></settings-checkbox>
        </div>
      </div>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="horizonGenderMarkerOrigColor">
              {{ l('settings.genderIconUseOriginalColor') }}
            </label>
          </div>
          <settings-checkbox
            v-model="horizonGenderMarkerOrigColor"
            :name="'horizonGenderMarkerOrigColor'"
            :disabled="
              !horizonShowGenderMarker || !horizonShowCustomCharacterColors
            "
          ></settings-checkbox>
        </div>
      </div>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="horizonChangeOfflineColor">
              {{ l('settings.changeOfflineColor') }}
            </label>
          </div>
          <settings-checkbox
            v-model="horizonChangeOfflineColor"
            :name="'horizonChangeOfflineColor'"
          ></settings-checkbox>
        </div>
      </div>
    </div>

    <div v-show="selectedTab === '2'">
      <h5>{{ l('settings.chat.behavior') }}</h5>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="playSound">
              {{ l('settings.playSound') }}
            </label>
          </div>
          <settings-checkbox
            v-model="playSound"
            :name="'playSound'"
          ></settings-checkbox>
        </div>
      </div>
      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="alwaysNotify">
              {{ l('settings.alwaysNotify') }}
            </label>
          </div>
          <settings-checkbox
            v-model="alwaysNotify"
            :name="'alwaysNotify'"
            :disabled="!playSound"
          ></settings-checkbox>
        </div>
      </div>
      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="notifications">
              {{ l('settings.notifications') }}
            </label>
          </div>
          <settings-checkbox
            v-model="notifications"
            :name="'notifications'"
          ></settings-checkbox>
        </div>
      </div>

      <h5>{{ l('settings.notifications.pings') }}</h5>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="highlight">
              {{ l('settings.highlight') }}
            </label>
          </div>
          <settings-checkbox
            v-model="highlight"
            :name="'highlight'"
          ></settings-checkbox>
        </div>
      </div>
      <div class="mb-3 p-2">
        <label class="control-label" for="highlightWords">{{
          l('settings.highlightWords')
        }}</label>
        <input
          id="highlightWords"
          class="form-control"
          v-model="highlightWords"
        />
      </div>
      <div class="mb-3 p-2">
        <label class="control-label" for="horizonHighlightUsers">{{
          l('settings.highlightUsers')
        }}</label>
        <input
          id="highlightUsers"
          class="form-control"
          v-model="horizonHighlightUsers"
        />
      </div>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="horizonNotifyFriendSignIn">
              {{ l('settings.notifyFriendSignIn') }}
            </label>
          </div>
          <settings-checkbox
            v-model="horizonNotifyFriendSignIn"
            :name="'horizonNotifyFriendSignIn'"
            :disabled="!horizonShowSigninNotifications"
          ></settings-checkbox>
        </div>
      </div>

      <h5>{{ l('settings.notifications.console') }}</h5>
      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="eventMessages">
              {{ l('settings.eventMessages') }}
            </label>
          </div>
          <settings-checkbox
            v-model="eventMessages"
            :name="'eventMessages'"
          ></settings-checkbox>
        </div>
      </div>
      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="joinMessages">
              {{ l('settings.joinMessages') }}
            </label>
          </div>
          <settings-checkbox
            v-model="joinMessages"
            :name="'joinMessages'"
          ></settings-checkbox>
        </div>
      </div>
      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="horizonShowSigninNotifications">
              {{ l('settings.showSigninNotifications') }}
            </label>
          </div>
          <settings-checkbox
            v-model="horizonShowSigninNotifications"
            :name="'horizonShowSigninNotifications'"
          ></settings-checkbox>
        </div>
      </div>
      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label
              class="control-label"
              for="horizonShowDuplicateStatusNotifications"
            >
              {{ l('settings.showDuplicateStatusNotifications') }}
            </label>
            <div class="form-text text-muted">
              {{ l('settings.showDuplicateStatusNotifications.note') }}
            </div>
          </div>
          <settings-checkbox
            v-model="horizonShowDuplicateStatusNotifications"
            :name="'horizonShowDuplicateStatusNotifications'"
          ></settings-checkbox>
        </div>
      </div>
    </div>

    <div v-show="selectedTab === '3'">
      <h5>{{ l('settings.tabs.hideAds') }}</h5>
      <div class="mb-3 p-2">
        <template v-if="hidden.length">
          <div v-for="(user, i) in hidden">
            <span
              class="fa fa-times"
              style="cursor: pointer"
              @click.stop="hidden.splice(i, 1)"
            ></span>
            <user-view :character="getCharacter(user)"></user-view>
          </div>
        </template>
        <template v-else>{{ l('settings.hideAds.empty') }}</template>
      </div>

      <h5>{{ l('settings.matching') }}</h5>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="risingAdScore">
              {{ l('settings.matching.adScore') }}
            </label>
          </div>
          <settings-checkbox
            v-model="risingAdScore"
            :name="'risingAdScore'"
          ></settings-checkbox>
        </div>
      </div>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="risingComparisonInUserMenu">
              {{ l('settings.matching.comparisonInUserMenu') }}
            </label>
          </div>
          <settings-checkbox
            v-model="risingComparisonInUserMenu"
            :name="'risingComparisonInUserMenu'"
          ></settings-checkbox>
        </div>
      </div>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="risingComparisonInSearch">
              {{ l('settings.matching.comparisonInSearch') }}
            </label>
          </div>
          <settings-checkbox
            v-model="risingComparisonInSearch"
            :name="'risingComparisonInSearch'"
          ></settings-checkbox>
        </div>
      </div>

      <!--            <div class="mb-3">-->
      <!--                <label class="control-label" for="hideProfileComparisonSummary">-->
      <!--                    <input type="checkbox" id="hideProfileComparisonSummary" :checked="!hideProfileComparisonSummary" @input="hideProfileComparisonSummary = !$event.target.checked"/>-->
      <!--                    Show quick match results at the top of the character profile-->
      <!--                </label>-->
      <!--            </div>-->

      <h5>{{ l('settings.profile.viewer') }}</h5>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="risingAutoCompareKinks">
              {{ l('settings.profile.autoCompareKinks') }}
            </label>
          </div>
          <settings-checkbox
            v-model="risingAutoCompareKinks"
            :name="'risingAutoCompareKinks'"
          ></settings-checkbox>
        </div>
      </div>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="risingAutoExpandCustomKinks">
              {{ l('settings.profile.autoExpandCustoms') }}
            </label>
          </div>
          <settings-checkbox
            v-model="risingAutoExpandCustomKinks"
            :name="'risingAutoExpandCustomKinks'"
          ></settings-checkbox>
        </div>
      </div>
      <h5>{{ l('settings.profile.ignoredList') }}</h5>
      <div class="mb-3 p-2">
        <template v-if="ignored.length">
          <div v-for="(user, i) in ignored">
            <span
              class="fa fa-times"
              style="cursor: pointer"
              role="button"
              :aria-label="l('user.unignore')"
              @click.stop="unignore(user)"
            ></span>
            <user-view :character="getCharacter(user)"></user-view>
          </div>
        </template>
        <template v-else>{{
          l('settings.profile.ignoredList.empty')
        }}</template>
      </div>
    </div>

    <div v-show="selectedTab === '4'">
      <div class="warning">
        <h5>{{ l('settings.dangerZone') }}</h5>
        <div>
          {{ l('settings.filteringWarning1') }}
        </div>

        <div>
          {{ l('settings.filteringWarning2') }}
        </div>
      </div>

      <h5>{{ l('settings.visibility') }}</h5>

      <div class="mb-3 filters">
        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            id="risingFilter.hideAds"
            v-model="risingFilter.hideAds"
          />
          <label class="form-check-label" for="risingFilter.hideAds">
            <bbcode :text="l('settings.filter.hideAds')"></bbcode>
          </label>
        </div>

        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            id="risingFilter.hideSearchResults"
            v-model="risingFilter.hideSearchResults"
          />
          <label class="form-check-label" for="risingFilter.hideSearchResults">
            <bbcode :text="l('settings.filter.hideSearchResults')"></bbcode>
          </label>
        </div>

        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            id="risingFilter.hideChannelMembers"
            v-model="risingFilter.hideChannelMembers"
          />
          <label class="form-check-label" for="risingFilter.hideChannelMembers">
            <bbcode :text="l('settings.filter.hideChannelMembers')"></bbcode>
          </label>
        </div>

        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            id="risingFilter.hidePublicChannelMessages"
            v-model="risingFilter.hidePublicChannelMessages"
          />
          <label
            class="form-check-label"
            for="risingFilter.hidePublicChannelMessages"
          >
            <bbcode
              :text="l('settings.filter.hidePublicChannelMessages')"
            ></bbcode>
          </label>
        </div>

        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            id="risingFilter.hidePrivateChannelMessages"
            v-model="risingFilter.hidePrivateChannelMessages"
          />
          <label
            class="form-check-label"
            for="risingFilter.hidePrivateChannelMessages"
          >
            <bbcode
              :text="l('settings.filter.hidePrivateChannelMessages')"
            ></bbcode>
          </label>
        </div>

        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            id="risingFilter.hidePrivateMessages"
            v-model="risingFilter.hidePrivateMessages"
          />
          <label
            class="form-check-label"
            for="risingFilter.hidePrivateMessages"
          >
            <bbcode :text="l('settings.filter.hidePrivateMessages')"></bbcode>
          </label>
        </div>

        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            id="risingFilter.showFilterIcon"
            v-model="risingFilter.showFilterIcon"
          />
          <label class="form-check-label" for="risingFilter.showFilterIcon">
            <bbcode :text="l('settings.filter.showFilterIcon')"></bbcode>
          </label>
        </div>
      </div>

      <div class="mb-3 filters">
        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            id="risingFilter.penalizeMatches"
            v-model="risingFilter.penalizeMatches"
          />
          <label class="form-check-label" for="risingFilter.penalizeMatches">
            <bbcode :text="l('settings.filter.penalizeMatches')"></bbcode>
          </label>
        </div>

        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            id="risingFilter.rewardNonMatches"
            v-model="risingFilter.rewardNonMatches"
          />
          <label class="form-check-label" for="risingFilter.rewardNonMatches">
            <bbcode :text="l('settings.filter.rewardNonMatches')"></bbcode>
          </label>
        </div>
      </div>

      <h5>{{ l('settings.channelMembersFilters') }}</h5>

      <div class="mb-3">
        <div class="d-flex p-2 justify-content-between align-items-start">
          <div class="w-50">
            <label class="control-label" for="horizonPersistentMemberFilters">
              {{ l('settings.horizon.persistentMemberFilters') }}
            </label>
            <div class="form-text text-muted">
              {{ l('settings.horizon.persistentMemberFilters.help') }}
            </div>
          </div>
          <settings-checkbox
            v-model="horizonPersistentMemberFilters"
            :name="'horizonPersistentMemberFilters'"
          ></settings-checkbox>
        </div>
      </div>

      <h5>{{ l('settings.ageMatch') }}</h5>
      <div class="mb-3">{{ l('settings.leaveEmptyNoLimit') }}</div>

      <div class="mb-3">
        <label class="control-label" for="risingFilter.minAge">{{
          l('settings.minAge')
        }}</label>
        <input
          id="risingFilter.minAge"
          type="number"
          class="form-control"
          v-model="risingFilter.minAge"
          :placeholder="l('settings.enterAge')"
        />

        <label class="control-label" for="risingFilter.maxAge">{{
          l('settings.maxAge')
        }}</label>
        <input
          id="risingFilter.maxAge"
          type="number"
          class="form-control"
          v-model="risingFilter.maxAge"
          :placeholder="l('settings.enterAge')"
        />
      </div>

      <h5>{{ l('settings.typeMatch') }}</h5>
      <div class="mb-3 filters">
        <div class="form-check" v-for="(value, key) in smartFilterTypes">
          <input
            class="form-check-input"
            type="checkbox"
            :id="'risingFilter.smartFilters.' + key"
            v-bind:checked="getSmartFilter(key)"
            @change="v => setSmartFilter(key, v)"
          />
          <label
            class="form-check-label"
            :for="'risingFilter.smartFilters.' + key"
          >
            {{ value.name }}
          </label>
        </div>
      </div>

      <h5>{{ l('settings.automaticReplies') }}</h5>
      <div class="mb-3 filters">
        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            id="risingFilter.autoReply"
            v-model="risingFilter.autoReply"
          />
          <label class="form-check-label" for="risingFilter.autoReply">
            {{ l('settings.autoReply') }}
          </label>
        </div>

        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            id="risingFilter.autoReplyCustom"
            v-model="risingFilter.autoReplyCustom"
            :disabled="!risingFilter.autoReply"
          />
          <label class="form-check-label" for="risingFilter.autoReplyCustom">
            {{ l('settings.autoReplyCustom') }}
          </label>
        </div>

        <editor
          v-model="risingFilter.autoReplyCustomMessage"
          :hasToolbar="true"
          :classes="'form-control'"
          rows="5"
          :disabled="!risingFilter.autoReplyCustom || !risingFilter.autoReply"
          :placeholder="l('settings.autoReplyPlaceholder')"
          maxlength="10000"
        >
        </editor>

        <div class="mb-3">
          {{ l('settings.autoReplyNote') }}
        </div>
      </div>

      <h5>{{ l('settings.exceptionList') }}</h5>
      <div class="mb-3">
        {{ l('settings.exceptionList.help') }}
      </div>

      <div class="mb-3">
        <textarea
          class="form-control"
          :value="getExceptionList()"
          @change="v => setExceptionList(v)"
          :placeholder="l('settings.enterNames')"
        ></textarea>
      </div>
    </div>

    <div v-show="selectedTab === '5'">
      <div style="display: flex; padding-top: 10px">
        <select
          id="import"
          class="form-select"
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
  import { BBCodeView } from '../bbcode/view';
  import SettingsCheckbox from '../components/SettingsCheckbox.vue';
  import { UserInterfaceBBCodeParser } from '../bbcode/user-interface';
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
  import UserView from './UserView.vue';

  const bbcodeParser = new UserInterfaceBBCodeParser();

  @Component({
    components: {
      modal: Modal,
      editor: Editor,
      tabs: Tabs,
      bbcode: BBCodeView(bbcodeParser),
      'settings-checkbox': SettingsCheckbox,
      'user-view': UserView
    }
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
    smoothMosaics!: boolean;
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
    showPerCharacterFriends!: boolean;
    hideNonCharacterFriends!: boolean;
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
    horizonMessagePortraitHighQuality!: boolean;
    horizonShowCustomCharacterColors!: boolean;
    horizonShowDeveloperBadges!: boolean;
    horizonShowGenderMarker!: boolean;
    horizonGenderMarkerOrigColor!: boolean;
    horizonChangeOfflineColor!: boolean;
    horizonNotifyFriendSignIn!: boolean;
    horizonShowSigninNotifications!: boolean;
    horizonShowDuplicateStatusNotifications!: boolean;
    horizonHighlightUsers!: string;
    chatLayoutMode!: 'classic' | 'modern';
    messageGrouping!: boolean;
    horizonUseColorPicker!: boolean;

    horizonCacheDraftMessages!: boolean;
    horizonSaveDraftMessagesToDiskTimer!: string;

    risingFilter: SmartFilterSettings = {} as any;

    horizonPersistentMemberFilters!: boolean;
    risingAvailableThemes: ReadonlyArray<string> = [];
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
      this.smoothMosaics = settings.smoothMosaics;
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
      this.showPerCharacterFriends = settings.showPerCharacterFriends;
      this.hideNonCharacterFriends = settings.hideNonCharacterFriends;
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
      this.horizonMessagePortraitHighQuality =
        settings.horizonMessagePortraitHighQuality;
      this.horizonShowCustomCharacterColors =
        settings.horizonShowCustomCharacterColors;
      this.horizonShowDeveloperBadges = settings.horizonShowDeveloperBadges;
      this.horizonShowGenderMarker = settings.horizonShowGenderMarker;
      this.horizonGenderMarkerOrigColor = settings.horizonGenderMarkerOrigColor;
      this.horizonChangeOfflineColor = settings.horizonChangeOfflineColor;
      this.chatLayoutMode = settings.chatLayoutMode || 'classic';
      this.messageGrouping = settings.messageGrouping;
      this.horizonUseColorPicker = settings.horizonUseColorPicker;

      this.horizonCacheDraftMessages = settings.horizonCacheDraftMessages;
      this.horizonSaveDraftMessagesToDiskTimer =
        settings.horizonSaveDraftMessagesToDiskTimer.toString();

      this.horizonNotifyFriendSignIn = settings.horizonNotifyFriendSignIn;
      this.horizonShowSigninNotifications =
        settings.horizonShowSigninNotifications;
      this.horizonShowDuplicateStatusNotifications =
        settings.horizonShowDuplicateStatusNotifications;
      this.horizonHighlightUsers = settings.horizonHighlightUsers.join(',');
      this.risingFilter = settings.risingFilter;

      this.risingAvailableThemes = fs
        .readdirSync(path.join(__dirname, 'themes'))
        .filter(x => x.substr(-4) === '.css')
        .map(x => x.slice(0, -4));
      this.risingCharacterTheme = settings.risingCharacterTheme;
      this.horizonPersistentMemberFilters =
        typeof (settings as any).horizonPersistentMemberFilters === 'boolean'
          ? (settings as any).horizonPersistentMemberFilters
          : false;
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
      await importKey('hiddenUsers');
      await importKey('favoriteEIcons');
      core.connection.close(false);
    }

    get hidden(): string[] {
      return core.state.hiddenUsers;
    }

    get ignored(): readonly string[] {
      return core.characters.ignoreList;
    }

    unignore(character: string): void {
      core.connection.send('IGN', { action: 'delete', character });
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

      const previousSettings = core.state.settings;

      core.state.settings = {
        playSound: this.playSound,
        soundTheme: previousSettings.soundTheme,
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
        smoothMosaics: this.smoothMosaics,
        soundTheme: core.state.settings.soundTheme || 'default',
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
        showPerCharacterFriends: this.showPerCharacterFriends,
        hideNonCharacterFriends: this.hideNonCharacterFriends,
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
        horizonMessagePortraitHighQuality:
          this.horizonMessagePortraitHighQuality,
        horizonShowCustomCharacterColors: this.horizonShowCustomCharacterColors,
        horizonShowDeveloperBadges: this.horizonShowDeveloperBadges,
        horizonAutoGenderFilter: (previousSettings as any)
          .horizonAutoGenderFilter,
        horizonSavedGenderFilters: (previousSettings as any)
          .horizonSavedGenderFilters,
        horizonSavedMembersSort: (previousSettings as any)
          .horizonSavedMembersSort,
        horizonPersistentMemberFilters: this.horizonPersistentMemberFilters,
        horizonShowGenderMarker: this.horizonShowGenderMarker,
        horizonGenderMarkerOrigColor: this.horizonGenderMarkerOrigColor,
        horizonChangeOfflineColor: this.horizonChangeOfflineColor,
        horizonNotifyFriendSignIn: this.horizonNotifyFriendSignIn,
        horizonShowSigninNotifications: this.horizonShowSigninNotifications,
        horizonShowDuplicateStatusNotifications:
          this.horizonShowDuplicateStatusNotifications,
        horizonHighlightUsers: this.horizonHighlightUsers
          .split(',')
          .map(x => x.trim())
          .filter(x => x.length),
        chatLayoutMode: this.chatLayoutMode,
        messageGrouping: this.messageGrouping,
        horizonCacheDraftMessages: this.horizonCacheDraftMessages,
        horizonSaveDraftMessagesToDiskTimer:
          diskDraftTimer === null
            ? 60
            : diskDraftTimer > 5
              ? diskDraftTimer
              : 5,
        horizonUseColorPicker: this.horizonUseColorPicker,

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
    getCharacter(name: string): Character {
      return core.characters.get(name);
    }
  }
</script>

<style lang="scss">
  #settings .form-group {
    margin-left: 0;
    margin-right: 0;
  }

  #settings .modal-content {
    height: 90vh;
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
    border: 1px solid var(--bs-warning);
  }

  #settings .info {
    border: 1px solid var(--bs-info);
  }

  #settings .bbcode-preview {
    margin-top: 0;
    border: 1px solid;
    padding: 5px;
    border-radius: 0 5px 5px 5px;
    background: var(--input-bg);
    border-color: var(--bs-secondary);
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

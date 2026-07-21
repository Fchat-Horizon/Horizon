<template>
  <modal
    :action="l('settings.action')"
    :buttonText="l('action.save')"
    @submit="submit"
    @open="load()"
    id="settings"
    dialogClass="modal-70"
    iconClass="fas fa-user-gear"
  >
    <div class="d-flex h-100 overflow-hidden">
      <tabs
        style="flex-shrink: 0; margin-bottom: 10px"
        v-model="selectedTab"
        :tabs="[
          //discord icon is a placeholder because icba to make a css class with the horizon icon right now
          {
            type: 'label',
            label: l('settings.tabs.app'),
            iconClass: 'fa-brands fa-discord'
          },
          { id: 'app.general', label: l('settings.tabs.general') },
          { id: 'app.look', label: l('settings.tabs.look') },
          { id: 'app.notifications', label: l('settings.tabs.notifications') },
          { id: 'app.behavior', label: l('settings.tabs.behavior') },
          { id: 'app.accessibility', label: l('settings.tabs.accessibility') },
          { id: 'app.advanced', label: l('settings.tabs.advanced') },
          { type: 'divider' },
          {
            type: 'label',
            label: l('settings.tabs.chat'),
            iconClass: 'fas fa-comments'
          },
          { id: 'chat.bbcode', label: l('settings.chat.bbcode') },
          { id: 'chat.textBox', label: l('settings.chat.textBox') },
          { id: 'chat.behavior', label: l('settings.chat.behavior') },
          { id: 'chat.logging', label: l('settings.chat.logging') },
          {
            id: 'chat.draftMessages',
            label: l('settings.horizonDraftMessages')
          },
          { id: 'chat.preview', label: l('settings.preview') },

          {
            type: 'label',
            label: l('settings.tabs.appearance'),
            iconClass: 'fas fa-paint-roller'
          },
          { id: 'appearance.layout', label: l('settings.appearance.layout') },
          {
            id: 'appearance.messages',
            label: l('settings.appearance.messages')
          },
          { id: 'appearance.users', label: l('settings.appearance.users') },

          {
            type: 'label',
            label: l('settings.tabs.pings'),
            iconClass: 'fas fa-bell'
          },
          {
            id: 'notifications.behavior',
            label: l('settings.chat.behavior')
          },
          {
            id: 'notifications.pings',
            label: l('settings.notifications.pings')
          },
          {
            id: 'notifications.console',
            label: l('settings.notifications.console')
          },

          {
            type: 'label',
            label: l('settings.tabs.profiles'),
            iconClass: 'fas fa-id-card'
          },
          { id: 'profiles.hiddenAds', label: l('settings.tabs.hideAds') },
          { id: 'profiles.matching', label: l('settings.matching') },
          {
            id: 'profiles.smartFilters',
            label: l('settings.tabs.smartFilters')
          },
          { id: 'profiles.viewer', label: l('settings.profile.viewer') },
          {
            id: 'profiles.ignoredList',
            label: l('settings.profile.ignoredList')
          },
          { type: 'divider' },
          { id: 'import.main', label: l('settings.tabs.import') }
        ]"
        tab-class="flex-column nav-pills"
        class="overflow-y-scroll hidden-scrollbar"
      ></tabs>
      <div
        class="settings-tab-content flex-grow-1 ms-3 h-100 d-flex flex-column"
      >
        <div
          class="mb-3"
          v-if="
            selectedTab !== 'app.general' &&
            selectedTab !== 'app.look' &&
            selectedTab !== 'app.notifications' &&
            selectedTab !== 'app.behavior' &&
            selectedTab !== 'app.accessibility' &&
            selectedTab !== 'app.advanced'
          "
        >
          <tabs
            style="flex-shrink: 0; margin-bottom: 10px"
            v-model="settingsMode"
            :fullWidth="true"
            :tabs="[
              { id: '0', label: l('settings.tab.global') },
              {
                id: '1',
                label: l('settings.tab.character', {
                  characterName: currentCharacter || ''
                })
              }
            ]"
          ></tabs>

          <!--
              Having an exception for the smartFilter tab isn't clean, but we also don't fill this menu dynamically yet so this will have to do for now.
          -->
          <template v-if="selectedTab !== 'profiles.smartFilters'">
            <div class="warning" v-if="settingsMode === '0'">
              <h5>{{ l('warning.info') }}</h5>
              <div>
                {{ l('settings.mode.global') }}
              </div>
            </div>

            <div class="warning" v-else>
              <h5>{{ l('warning.info') }}</h5>
              <div>
                {{
                  l('settings.mode.character', {
                    characterName: currentCharacter || ''
                  })
                }}
              </div>
            </div>
          </template>
        </div>

        <div class="overflow-auto h-100">
          <div
            v-show="
              selectedTab === 'app.general' ||
              selectedTab === 'app.look' ||
              selectedTab === 'app.notifications' ||
              selectedTab === 'app.behavior' ||
              selectedTab === 'app.accessibility' ||
              selectedTab === 'app.advanced'
            "
          >
            <div class="mb-3 alert alert-warning">
              <h5>{{ l('warning.info') }}</h5>
              <div>
                Placeholder for global app settings. These are still in the
                bespoke window for now.
              </div>
            </div>
          </div>
          <div v-show="selectedTab === 'chat.bbcode'">
            <h5>{{ l('settings.chat.bbcode') }}</h5>

            <div class="mb-3 p-2">
              <settings-array
                id="disallowedTags"
                v-model="settings.disallowedTags"
                :placeholder="
                  l('settings.disallowedTags.placeholder', { tagName: 'eicon' })
                "
                :globalValue="settings.disallowedTags"
                :overrideValue="characterOverrides.disallowedTags"
                :usingGlobal="isUsingGlobal()"
                @update:globalValue="settings.disallowedTags = $event"
                @update:overrideValue="
                  $set(characterOverrides, 'disallowedTags', $event)
                "
                :name="l('settings.disallowedTags')"
              />
            </div>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="animatedEicons">
                    {{ l('settings.animatedEicons') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.animatedEicons"
                  :overrideValue="characterOverrides.animatedEicons"
                  :usingGlobal="isUsingGlobal()"
                  name="animatedEicons"
                  @update:globalValue="settings.animatedEicons = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'animatedEicons', $event)
                  "
                />
              </div>
            </div>
            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="smoothMosaics">
                    {{ l('settings.smoothMosaics') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.smoothMosaics"
                  :overrideValue="characterOverrides.smoothMosaics"
                  :usingGlobal="isUsingGlobal()"
                  name="smoothMosaics"
                  @update:globalValue="settings.smoothMosaics = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'smoothMosaics', $event)
                  "
                />
              </div>
            </div>
          </div>

          <div v-show="selectedTab === 'chat.textBox'">
            <h5>{{ l('settings.chat.textBox') }}</h5>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="bbCodeBar">
                    {{ l('settings.bbCodeBar') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.bbCodeBar"
                  :overrideValue="characterOverrides.bbCodeBar"
                  :usingGlobal="isUsingGlobal()"
                  name="bbCodeBar"
                  @update:globalValue="settings.bbCodeBar = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'bbCodeBar', $event)
                  "
                />
              </div>
            </div>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="enterSend">
                    {{ l('settings.enterSend') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.enterSend"
                  :overrideValue="characterOverrides.enterSend"
                  :usingGlobal="isUsingGlobal()"
                  name="enterSend"
                  @update:globalValue="settings.enterSend = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'enterSend', $event)
                  "
                />
              </div>
            </div>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="horizonUseColorPicker">
                    {{ l('settings.horizonUseColorPicker') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.horizonUseColorPicker"
                  :overrideValue="characterOverrides.horizonUseColorPicker"
                  :usingGlobal="isUsingGlobal()"
                  name="horizonUseColorPicker"
                  @update:globalValue="settings.horizonUseColorPicker = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'horizonUseColorPicker', $event)
                  "
                  :disabled="!settings.bbCodeBar"
                />
              </div>
            </div>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label
                    class="control-label"
                    for="risingShowPortraitNearInput"
                  >
                    {{ l('settings.showPortraitNearInput') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.risingShowPortraitNearInput"
                  :overrideValue="
                    characterOverrides.risingShowPortraitNearInput
                  "
                  :usingGlobal="isUsingGlobal()"
                  name="risingShowPortraitNearInput"
                  @update:globalValue="
                    settings.risingShowPortraitNearInput = $event
                  "
                  @update:overrideValue="
                    $set(
                      characterOverrides,
                      'risingShowPortraitNearInput',
                      $event
                    )
                  "
                />
              </div>
            </div>
          </div>

          <div v-show="selectedTab === 'chat.behavior'">
            <h5>{{ l('settings.chat.behavior') }}</h5>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="clickOpensMessage">
                    {{ l('settings.clickOpensMessage') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.clickOpensMessage"
                  :overrideValue="characterOverrides.clickOpensMessage"
                  :usingGlobal="isUsingGlobal()"
                  name="clickOpensMessage"
                  @update:globalValue="settings.clickOpensMessage = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'clickOpensMessage', $event)
                  "
                />
              </div>
            </div>
            <div class="mb-3 p-2">
              <label class="control-label" for="idleTimer">{{
                l('settings.idleTimer')
              }}</label>
              <settings-input
                id="idleTimer"
                type="number"
                :globalValue="settings.idleTimer"
                :overrideValue="characterOverrides.idleTimer"
                :usingGlobal="isUsingGlobal()"
                @update:globalValue="settings.idleTimer = $event"
                @update:overrideValue="
                  $set(characterOverrides, 'idleTimer', $event)
                "
              />
            </div>
            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="showNeedsReply">
                    {{ l('settings.showNeedsReply') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.showNeedsReply"
                  :overrideValue="characterOverrides.showNeedsReply"
                  :usingGlobal="isUsingGlobal()"
                  name="showNeedsReply"
                  @update:globalValue="settings.showNeedsReply = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'showNeedsReply', $event)
                  "
                />
              </div>
            </div>
            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label
                    class="control-label"
                    for="risingShowUnreadOfflineCount"
                  >
                    {{ l('settings.risingShowUnreadOfflineCount') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.risingShowUnreadOfflineCount"
                  :overrideValue="
                    characterOverrides.risingShowUnreadOfflineCount
                  "
                  :usingGlobal="isUsingGlobal()"
                  name="risingShowUnreadOfflineCount"
                  @update:globalValue="
                    settings.risingShowUnreadOfflineCount = $event
                  "
                  @update:overrideValue="
                    $set(
                      characterOverrides,
                      'risingShowUnreadOfflineCount',
                      $event
                    )
                  "
                />
              </div>
            </div>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="colorBookmarks">
                    {{ l('settings.colorBookmarks') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.colorBookmarks"
                  :overrideValue="characterOverrides.colorBookmarks"
                  :usingGlobal="isUsingGlobal()"
                  name="colorBookmarks"
                  @update:globalValue="settings.colorBookmarks = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'colorBookmarks', $event)
                  "
                />
              </div>
            </div>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="showPerCharacterFriends">
                    {{ l('settings.showPerCharacterFriends') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.showPerCharacterFriends"
                  :overrideValue="characterOverrides.showPerCharacterFriends"
                  :usingGlobal="isUsingGlobal()"
                  name="showPerCharacterFriends"
                  @update:globalValue="
                    settings.showPerCharacterFriends = $event
                  "
                  @update:overrideValue="
                    $set(characterOverrides, 'showPerCharacterFriends', $event)
                  "
                />
              </div>
            </div>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="hideNonCharacterFriends">
                    {{ l('settings.hideNonCharacterFriends') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.hideNonCharacterFriends"
                  :overrideValue="characterOverrides.hideNonCharacterFriends"
                  :usingGlobal="isUsingGlobal()"
                  name="hideNonCharacterFriends"
                  @update:globalValue="
                    settings.hideNonCharacterFriends = $event
                  "
                  @update:overrideValue="
                    $set(characterOverrides, 'hideNonCharacterFriends', $event)
                  "
                />
              </div>
            </div>
            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label
                    class="control-label"
                    for="horizonPersistentMemberFilters"
                  >
                    {{ l('settings.horizon.persistentMemberFilters') }}
                  </label>
                  <div class="form-text text-muted">
                    {{ l('settings.horizon.persistentMemberFilters.help') }}
                  </div>
                </div>
                <settings-override
                  :globalValue="settings.horizonPersistentMemberFilters"
                  :overrideValue="
                    characterOverrides.horizonPersistentMemberFilters
                  "
                  :usingGlobal="isUsingGlobal()"
                  name="horizonPersistentMemberFilters"
                  @update:globalValue="
                    settings.horizonPersistentMemberFilters = $event
                  "
                  @update:overrideValue="
                    $set(
                      characterOverrides,
                      'horizonPersistentMemberFilters',
                      $event
                    )
                  "
                />
              </div>
            </div>
          </div>

          <div v-show="selectedTab === 'chat.logging'">
            <h5>{{ l('settings.chat.logging') }}</h5>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="logMessages">
                    {{ l('settings.logMessages') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.logMessages"
                  :overrideValue="characterOverrides.logMessages"
                  :usingGlobal="isUsingGlobal()"
                  name="logMessages"
                  @update:globalValue="settings.logMessages = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'logMessages', $event)
                  "
                />
              </div>
            </div>
            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="logAds">
                    {{ l('settings.logAds') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.logAds"
                  :overrideValue="characterOverrides.logAds"
                  :usingGlobal="isUsingGlobal()"
                  name="logAds"
                  @update:globalValue="settings.logAds = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'logAds', $event)
                  "
                />
              </div>
            </div>
          </div>

          <div v-show="selectedTab === 'chat.draftMessages'">
            <h5>{{ l('settings.horizonDraftMessages') }}</h5>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="horizonCacheDraftMessages">
                    {{ l('settings.horizonCacheDraftMessages') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.horizonCacheDraftMessages"
                  :overrideValue="characterOverrides.horizonCacheDraftMessages"
                  :usingGlobal="isUsingGlobal()"
                  name="horizonCacheDraftMessages"
                  @update:globalValue="
                    settings.horizonCacheDraftMessages = $event
                  "
                  @update:overrideValue="
                    $set(
                      characterOverrides,
                      'horizonCacheDraftMessages',
                      $event
                    )
                  "
                />
              </div>
            </div>

            <div class="mb-3 p-2">
              <label
                class="control-label"
                for="horizonSaveDraftMessagesToDiskTimer"
              >
                {{ l('settings.horizonSaveDraftMessagesToDiskTimer') }}
              </label>
              <settings-input
                id="horizonSaveDraftMessagesToDiskTimer"
                type="number"
                :globalValue="settings.horizonSaveDraftMessagesToDiskTimer"
                :overrideValue="
                  characterOverrides.horizonSaveDraftMessagesToDiskTimer
                "
                :usingGlobal="isUsingGlobal()"
                @update:globalValue="
                  settings.horizonSaveDraftMessagesToDiskTimer = $event
                "
                @update:overrideValue="
                  $set(
                    characterOverrides,
                    'horizonSaveDraftMessagesToDiskTimer',
                    $event
                  )
                "
              />
            </div>
          </div>

          <div v-show="selectedTab === 'chat.preview'">
            <h5>{{ l('settings.preview') }}</h5>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="risingLinkPreview">
                    {{ l('settings.preview.link') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.risingLinkPreview"
                  :overrideValue="characterOverrides.risingLinkPreview"
                  :usingGlobal="isUsingGlobal()"
                  name="risingLinkPreview"
                  @update:globalValue="settings.risingLinkPreview = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'risingLinkPreview', $event)
                  "
                />
              </div>
            </div>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="risingCharacterPreview">
                    {{ l('settings.preview.character') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.risingCharacterPreview"
                  :overrideValue="characterOverrides.risingCharacterPreview"
                  :usingGlobal="isUsingGlobal()"
                  name="risingCharacterPreview"
                  @update:globalValue="settings.risingCharacterPreview = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'risingCharacterPreview', $event)
                  "
                />
              </div>
            </div>
          </div>

          <div v-show="selectedTab === 'appearance.layout'">
            <h5>{{ l('settings.appearance.layout') }}</h5>

            <div class="mb-3 p-2">
              <label class="control-label" for="fontSize">{{
                l('settings.experimental', l('settings.fontSize'))
              }}</label>
              <settings-input
                id="fontSize"
                type="number"
                :globalValue="settings.fontSize"
                :overrideValue="characterOverrides.fontSize"
                :usingGlobal="isUsingGlobal()"
                @update:globalValue="settings.fontSize = $event"
                @update:overrideValue="
                  $set(characterOverrides, 'fontSize', $event)
                "
              />
            </div>
            <div class="mb-3 p-2">
              <label class="control-label" for="risingCharacterTheme">
                {{ l('settings.overrideCharacterTheme') }}
                <select
                  id="risingCharacterTheme"
                  class="form-select"
                  v-model="characterOverrides.risingCharacterTheme"
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
                <settings-override
                  :globalValue="settings.showAvatars"
                  :overrideValue="characterOverrides.showAvatars"
                  :usingGlobal="isUsingGlobal()"
                  name="showAvatars"
                  @update:globalValue="settings.showAvatars = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'showAvatars', $event)
                  "
                ></settings-override>
              </div>
            </div>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label
                    class="control-label"
                    for="risingShowHighQualityPortraits"
                  >
                    {{ l('settings.showHighQualityPortraits') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.risingShowHighQualityPortraits"
                  :overrideValue="
                    characterOverrides.risingShowHighQualityPortraits
                  "
                  :usingGlobal="isUsingGlobal()"
                  name="risingShowHighQualityPortraits"
                  @update:globalValue="
                    settings.risingShowHighQualityPortraits = $event
                  "
                  @update:overrideValue="
                    $set(
                      characterOverrides,
                      'risingShowHighQualityPortraits',
                      $event
                    )
                  "
                />
              </div>
            </div>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="forceQuickConvoList">
                    {{ l('settings.forceQuickConvoList') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.forceQuickConvoList"
                  :overrideValue="characterOverrides.forceQuickConvoList"
                  :usingGlobal="isUsingGlobal()"
                  name="forceQuickConvoList"
                  @update:globalValue="settings.forceQuickConvoList = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'forceQuickConvoList', $event)
                  "
                />
              </div>
            </div>
          </div>

          <div v-show="selectedTab === 'appearance.messages'">
            <h5>{{ l('settings.appearance.messages') }}</h5>

            <div class="mb-3 p-2">
              <label class="control-label" for="chatLayoutMode">{{
                l('settings.experimental', l('settings.chatLayoutMode'))
              }}</label>
              <!--TODO
              Do this for global settings too. Maybe with a parent component or something.
              -->
              <select
                id="chatLayoutMode"
                class="form-select"
                v-model="characterOverrides.chatLayoutMode"
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
                <settings-override
                  :globalValue="settings.messageGrouping"
                  :overrideValue="characterOverrides.messageGrouping"
                  :usingGlobal="isUsingGlobal()"
                  name="messageGrouping"
                  @update:globalValue="settings.messageGrouping = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'messageGrouping', $event)
                  "
                />
              </div>
            </div>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="messageSeparators">
                    {{ l('settings.messageSeparators') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.messageSeparators"
                  :overrideValue="characterOverrides.messageSeparators"
                  :usingGlobal="isUsingGlobal()"
                  name="messageSeparators"
                  @update:globalValue="settings.messageSeparators = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'messageSeparators', $event)
                  "
                />
              </div>
            </div>
            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label
                    class="control-label"
                    for="risingShowPortraitInMessage"
                  >
                    {{ l('settings.showPortraitInMessage') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.risingShowPortraitInMessage"
                  :overrideValue="
                    characterOverrides.risingShowPortraitInMessage
                  "
                  :usingGlobal="isUsingGlobal()"
                  name="risingShowPortraitInMessage"
                  @update:globalValue="
                    settings.risingShowPortraitInMessage = $event
                  "
                  @update:overrideValue="
                    $set(
                      characterOverrides,
                      'risingShowPortraitInMessage',
                      $event
                    )
                  "
                />
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
                <settings-override
                  :globalValue="settings.horizonMessagePortraitHighQuality"
                  :overrideValue="
                    characterOverrides.horizonMessagePortraitHighQuality
                  "
                  :usingGlobal="isUsingGlobal()"
                  name="horizonMessagePortraitHighQuality"
                  @update:globalValue="
                    settings.horizonMessagePortraitHighQuality = $event
                  "
                  @update:overrideValue="
                    $set(
                      characterOverrides,
                      'horizonMessagePortraitHighQuality',
                      $event
                    )
                  "
                />
              </div>
            </div>
          </div>

          <div v-show="selectedTab === 'appearance.users'">
            <h5>{{ l('settings.appearance.users') }}</h5>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label
                    class="control-label"
                    for="horizonShowCustomCharacterColors"
                  >
                    {{ l('settings.showCustomCharacterColors') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.horizonShowCustomCharacterColors"
                  :overrideValue="
                    characterOverrides.horizonShowCustomCharacterColors
                  "
                  :usingGlobal="isUsingGlobal()"
                  name="horizonShowCustomCharacterColors"
                  @update:globalValue="
                    settings.horizonShowCustomCharacterColors = $event
                  "
                  @update:overrideValue="
                    $set(
                      characterOverrides,
                      'horizonShowCustomCharacterColors',
                      $event
                    )
                  "
                />
              </div>
            </div>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="risingColorblindMode">
                    {{ l('settings.colorblindMode') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.risingColorblindMode"
                  :overrideValue="characterOverrides.risingColorblindMode"
                  :usingGlobal="isUsingGlobal()"
                  name="risingColorblindMode"
                  @update:globalValue="settings.risingColorblindMode = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'risingColorblindMode', $event)
                  "
                />
              </div>
            </div>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="horizonShowDeveloperBadges">
                    {{ l('settings.showDeveloperBadges') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.horizonShowDeveloperBadges"
                  :overrideValue="characterOverrides.horizonShowDeveloperBadges"
                  :usingGlobal="isUsingGlobal()"
                  name="horizonShowDeveloperBadges"
                  @update:globalValue="
                    settings.horizonShowDeveloperBadges = $event
                  "
                  @update:overrideValue="
                    $set(
                      characterOverrides,
                      'horizonShowDeveloperBadges',
                      $event
                    )
                  "
                />
              </div>
            </div>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="horizonShowGenderMarker">
                    {{ l('settings.showGenderIcon') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.horizonShowGenderMarker"
                  :overrideValue="characterOverrides.horizonShowGenderMarker"
                  :usingGlobal="isUsingGlobal()"
                  name="horizonShowGenderMarker"
                  @update:globalValue="
                    settings.horizonShowGenderMarker = $event
                  "
                  @update:overrideValue="
                    $set(characterOverrides, 'horizonShowGenderMarker', $event)
                  "
                />
              </div>
            </div>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label
                    class="control-label"
                    for="horizonGenderMarkerOrigColor"
                  >
                    {{ l('settings.genderIconUseOriginalColor') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.horizonGenderMarkerOrigColor"
                  :overrideValue="
                    characterOverrides.horizonGenderMarkerOrigColor
                  "
                  :usingGlobal="isUsingGlobal()"
                  name="horizonGenderMarkerOrigColor"
                  @update:globalValue="
                    settings.horizonGenderMarkerOrigColor = $event
                  "
                  @update:overrideValue="
                    $set(
                      characterOverrides,
                      'horizonGenderMarkerOrigColor',
                      $event
                    )
                  "
                  :disabled="!settings.horizonShowGenderMarker"
                />
              </div>
            </div>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="horizonChangeOfflineColor">
                    {{ l('settings.changeOfflineColor') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.horizonChangeOfflineColor"
                  :overrideValue="characterOverrides.horizonChangeOfflineColor"
                  :usingGlobal="isUsingGlobal()"
                  name="horizonChangeOfflineColor"
                  @update:globalValue="
                    settings.horizonChangeOfflineColor = $event
                  "
                  @update:overrideValue="
                    $set(
                      characterOverrides,
                      'horizonChangeOfflineColor',
                      $event
                    )
                  "
                />
              </div>
            </div>
          </div>

          <div v-show="selectedTab === 'notifications.behavior'">
            <h5>{{ l('settings.chat.behavior') }}</h5>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="playSound">
                    {{ l('settings.playSound') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.playSound"
                  :overrideValue="characterOverrides.playSound"
                  :usingGlobal="isUsingGlobal()"
                  name="playSound"
                  @update:globalValue="settings.playSound = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'playSound', $event)
                  "
                />
              </div>
            </div>
            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="alwaysNotify">
                    {{ l('settings.alwaysNotify') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.alwaysNotify"
                  :overrideValue="characterOverrides.alwaysNotify"
                  :usingGlobal="isUsingGlobal()"
                  name="alwaysNotify"
                  @update:globalValue="settings.alwaysNotify = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'alwaysNotify', $event)
                  "
                  :disabled="!settings.playSound"
                />
              </div>
            </div>
            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="notifications">
                    {{ l('settings.notifications') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.notifications"
                  :overrideValue="characterOverrides.notifications"
                  :usingGlobal="isUsingGlobal()"
                  name="notifications"
                  @update:globalValue="settings.notifications = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'notifications', $event)
                  "
                  :disabled="!settings.playSound"
                />
              </div>
            </div>
          </div>

          <div v-show="selectedTab === 'notifications.pings'">
            <h5>{{ l('settings.notifications.pings') }}</h5>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="highlight">
                    {{ l('settings.highlight') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.highlight"
                  :overrideValue="characterOverrides.highlight"
                  :usingGlobal="isUsingGlobal()"
                  name="highlight"
                  @update:globalValue="settings.highlight = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'highlight', $event)
                  "
                  :disabled="!settings.playSound"
                />
              </div>
            </div>
            <div class="mb-3 p-2">
              <settings-array
                id="highlightWords"
                v-model="settings.highlightWords"
                :globalValue="settings.highlightWords"
                :overrideValue="characterOverrides.highlightWords"
                :usingGlobal="isUsingGlobal()"
                @update:globalValue="settings.highlightWords = $event"
                @update:overrideValue="
                  $set(characterOverrides, 'highlightWords', $event)
                "
                :name="l('settings.highlightWords')"
              />
            </div>
            <div class="mb-3 p-2">
              <settings-array
                id="horizonHighlightUsers"
                v-model="settings.horizonHighlightUsers"
                :globalValue="settings.horizonHighlightUsers"
                :overrideValue="characterOverrides.horizonHighlightUsers"
                :usingGlobal="isUsingGlobal()"
                @update:globalValue="settings.horizonHighlightUsers = $event"
                @update:overrideValue="
                  $set(characterOverrides, 'horizonHighlightUsers', $event)
                "
                :name="l('settings.highlightUsers')"
              />
            </div>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="horizonNotifyFriendSignIn">
                    {{ l('settings.notifyFriendSignIn') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.horizonNotifyFriendSignIn"
                  :overrideValue="characterOverrides.horizonNotifyFriendSignIn"
                  :usingGlobal="isUsingGlobal()"
                  name="horizonNotifyFriendSignIn"
                  @update:globalValue="
                    settings.horizonNotifyFriendSignIn = $event
                  "
                  @update:overrideValue="
                    $set(
                      characterOverrides,
                      'horizonNotifyFriendSignIn',
                      $event
                    )
                  "
                />
              </div>
            </div>
          </div>

          <div v-show="selectedTab === 'notifications.console'">
            <h5>{{ l('settings.notifications.console') }}</h5>
            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="eventMessages">
                    {{ l('settings.eventMessages') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.eventMessages"
                  :overrideValue="characterOverrides.eventMessages"
                  :usingGlobal="isUsingGlobal()"
                  name="eventMessages"
                  @update:globalValue="settings.eventMessages = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'eventMessages', $event)
                  "
                />
              </div>
            </div>
            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="joinMessages">
                    {{ l('settings.joinMessages') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.joinMessages"
                  :overrideValue="characterOverrides.joinMessages"
                  :usingGlobal="isUsingGlobal()"
                  name="joinMessages"
                  @update:globalValue="settings.joinMessages = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'joinMessages', $event)
                  "
                />
              </div>
            </div>
            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label
                    class="control-label"
                    for="horizonShowSigninNotifications"
                  >
                    {{ l('settings.showSigninNotifications') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.horizonShowSigninNotifications"
                  :overrideValue="
                    characterOverrides.horizonShowSigninNotifications
                  "
                  :usingGlobal="isUsingGlobal()"
                  name="horizonShowSigninNotifications"
                  @update:globalValue="
                    settings.horizonShowSigninNotifications = $event
                  "
                  @update:overrideValue="
                    $set(
                      characterOverrides,
                      'horizonShowSigninNotifications',
                      $event
                    )
                  "
                />
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
                <settings-override
                  :globalValue="
                    settings.horizonShowDuplicateStatusNotifications
                  "
                  :overrideValue="
                    characterOverrides.horizonShowDuplicateStatusNotifications
                  "
                  :usingGlobal="isUsingGlobal()"
                  name="horizonShowDuplicateStatusNotifications"
                  @update:globalValue="
                    settings.horizonShowDuplicateStatusNotifications = $event
                  "
                  @update:overrideValue="
                    $set(
                      characterOverrides,
                      'horizonShowDuplicateStatusNotifications',
                      $event
                    )
                  "
                />
              </div>
            </div>
          </div>

          <div v-show="selectedTab === 'profiles.hiddenAds'">
            <h5>{{ l('settings.tabs.hideAds') }}</h5>
            <div class="mb-3 p-2">
              <!--TODO
              Oh my god, I do not want to do this for global settings too.
              Let's figure this out after the new friends list shite gets merged.
              -->
              <template v-if="hidden.length">
                <input
                  type="text"
                  class="form-control mb-2"
                  :placeholder="l('filter')"
                  v-model="hiddenFilter"
                />
                <virtual-list
                  style="overflow: auto; height: 300px"
                  :items="filteredHidden"
                  :itemHeight="28"
                  :overscan="5"
                  keyField="name"
                  :resetKey="hiddenFilter"
                >
                  <template slot-scope="{ item: entry }">
                    <div>
                      <span
                        class="fa fa-times"
                        style="cursor: pointer"
                        @click.stop="unhide(entry.name)"
                      ></span>
                      <span class="ms-2">{{ entry.name }}</span>
                    </div>
                  </template>
                </virtual-list>
              </template>
              <template v-else>{{ l('settings.hideAds.empty') }}</template>
            </div>
          </div>

          <div v-show="selectedTab === 'profiles.matching'">
            <h5>{{ l('settings.matching') }}</h5>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="risingAdScore">
                    {{ l('settings.matching.adScore') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.risingAdScore"
                  :overrideValue="characterOverrides.risingAdScore"
                  :usingGlobal="isUsingGlobal()"
                  name="risingAdScore"
                  @update:globalValue="settings.risingAdScore = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'risingAdScore', $event)
                  "
                />
              </div>
            </div>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="risingComparisonInUserMenu">
                    {{ l('settings.matching.comparisonInUserMenu') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.risingComparisonInUserMenu"
                  :overrideValue="characterOverrides.risingComparisonInUserMenu"
                  :usingGlobal="isUsingGlobal()"
                  name="risingComparisonInUserMenu"
                  @update:globalValue="
                    settings.risingComparisonInUserMenu = $event
                  "
                  @update:overrideValue="
                    $set(
                      characterOverrides,
                      'risingComparisonInUserMenu',
                      $event
                    )
                  "
                />
              </div>
            </div>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="risingComparisonInSearch">
                    {{ l('settings.matching.comparisonInSearch') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.risingComparisonInSearch"
                  :overrideValue="characterOverrides.risingComparisonInSearch"
                  :usingGlobal="isUsingGlobal()"
                  name="risingComparisonInSearch"
                  @update:globalValue="
                    settings.risingComparisonInSearch = $event
                  "
                  @update:overrideValue="
                    $set(characterOverrides, 'risingComparisonInSearch', $event)
                  "
                />
              </div>
            </div>
          </div>

          <div v-show="selectedTab === 'profiles.viewer'">
            <h5>{{ l('settings.profile.viewer') }}</h5>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label class="control-label" for="risingAutoCompareKinks">
                    {{ l('settings.profile.autoCompareKinks') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.risingAutoCompareKinks"
                  :overrideValue="characterOverrides.risingAutoCompareKinks"
                  :usingGlobal="isUsingGlobal()"
                  name="risingAutoCompareKinks"
                  @update:globalValue="settings.risingAutoCompareKinks = $event"
                  @update:overrideValue="
                    $set(characterOverrides, 'risingAutoCompareKinks', $event)
                  "
                />
              </div>
            </div>

            <div class="mb-3">
              <div class="d-flex p-2 justify-content-between align-items-start">
                <div class="w-50">
                  <label
                    class="control-label"
                    for="risingAutoExpandCustomKinks"
                  >
                    {{ l('settings.profile.autoExpandCustoms') }}
                  </label>
                </div>
                <settings-override
                  :globalValue="settings.risingAutoExpandCustomKinks"
                  :overrideValue="
                    characterOverrides.risingAutoExpandCustomKinks
                  "
                  :usingGlobal="isUsingGlobal()"
                  name="risingAutoExpandCustomKinks"
                  @update:globalValue="
                    settings.risingAutoExpandCustomKinks = $event
                  "
                  @update:overrideValue="
                    $set(
                      characterOverrides,
                      'risingAutoExpandCustomKinks',
                      $event
                    )
                  "
                />
              </div>
            </div>
          </div>

          <div v-show="selectedTab === 'profiles.ignoredList'">
            <h5>{{ l('settings.profile.ignoredList') }}</h5>
            <div class="mb-3 p-2">
              <template v-if="ignored.length">
                <div v-for="user in ignored">
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

          <div v-show="selectedTab === 'profiles.smartFilters'">
            <div class="warning">
              <h5>{{ l('settings.dangerZone') }}</h5>
              <div>
                {{ l('settings.filter.deprecated') }}
              </div>
              <div v-if="settingsMode === '0'">
                {{ l('settings.filter.deprecated.characterOnly') }}
              </div>
            </div>

            <h5>{{ l('settings.visibility') }}</h5>

            <div class="mb-3 filters">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="risingFilter.hideAds"
                  v-model="settings.risingFilter.hideAds"
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
                  v-model="settings.risingFilter.hideSearchResults"
                />
                <label
                  class="form-check-label"
                  for="risingFilter.hideSearchResults"
                >
                  <bbcode
                    :text="l('settings.filter.hideSearchResults')"
                  ></bbcode>
                </label>
              </div>

              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="risingFilter.hideChannelMembers"
                  v-model="settings.risingFilter.hideChannelMembers"
                />
                <label
                  class="form-check-label"
                  for="risingFilter.hideChannelMembers"
                >
                  <bbcode
                    :text="l('settings.filter.hideChannelMembers')"
                  ></bbcode>
                </label>
              </div>

              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="risingFilter.hidePublicChannelMessages"
                  v-model="settings.risingFilter.hidePublicChannelMessages"
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
                  v-model="settings.risingFilter.hidePrivateChannelMessages"
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
                  v-model="settings.risingFilter.hidePrivateMessages"
                />
                <label
                  class="form-check-label"
                  for="risingFilter.hidePrivateMessages"
                >
                  <bbcode
                    :text="l('settings.filter.hidePrivateMessages')"
                  ></bbcode>
                </label>
              </div>

              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="risingFilter.showFilterIcon"
                  v-model="settings.risingFilter.showFilterIcon"
                />
                <label
                  class="form-check-label"
                  for="risingFilter.showFilterIcon"
                >
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
                  v-model="settings.risingFilter.penalizeMatches"
                />
                <label
                  class="form-check-label"
                  for="risingFilter.penalizeMatches"
                >
                  <bbcode :text="l('settings.filter.penalizeMatches')"></bbcode>
                </label>
              </div>

              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="risingFilter.rewardNonMatches"
                  v-model="settings.risingFilter.rewardNonMatches"
                />
                <label
                  class="form-check-label"
                  for="risingFilter.rewardNonMatches"
                >
                  <bbcode
                    :text="l('settings.filter.rewardNonMatches')"
                  ></bbcode>
                </label>
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
                v-model="settings.risingFilter.minAge"
                :placeholder="l('settings.enterAge')"
              />

              <label class="control-label" for="risingFilter.maxAge">{{
                l('settings.maxAge')
              }}</label>
              <input
                id="risingFilter.maxAge"
                type="number"
                class="form-control"
                v-model="settings.risingFilter.maxAge"
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
                  v-model="settings.risingFilter.autoReply"
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
                  v-model="settings.risingFilter.autoReplyCustom"
                  :disabled="!settings.risingFilter.autoReply"
                />
                <label
                  class="form-check-label"
                  for="risingFilter.autoReplyCustom"
                >
                  {{ l('settings.autoReplyCustom') }}
                </label>
              </div>

              <editor
                v-model="settings.risingFilter.autoReplyCustomMessage"
                :hasToolbar="true"
                :classes="'form-control'"
                rows="5"
                :disabled="
                  !settings.risingFilter.autoReplyCustom ||
                  !settings.risingFilter.autoReply
                "
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

          <div v-show="selectedTab === 'import.main'">
            <div style="display: flex; padding-top: 10px">
              <select
                id="import"
                class="form-select"
                v-model="importCharacter"
                style="flex: 1; margin-right: 10px"
              >
                <option value="">
                  {{ l('settings.import.selectCharacter') }}
                </option>
                <option
                  v-for="character in availableImports"
                  :value="character"
                >
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
        </div>
      </div>
    </div>
  </modal>
</template>

<script lang="ts">
  // I'm so, so sorry Joycon
  // We'll get rid of this for 2.5 when we'll write a unified event system.
  import * as electron from 'electron';
  import * as fs from 'fs';
  import * as path from 'path';
  import CustomDialog from '../components/custom_dialog';
  import Modal from '../components/Modal.vue';
  import { Editor } from './bbcode';
  import Tabs from '../components/tabs';
  import { BBCodeView } from '../bbcode/view';
  import SettingsTriState from '../components/SettingsTriState.vue';
  import SettingsOverride from '../components/SettingsOverride.vue';
  import SettingsInput from '../components/SettingsInput.vue';
  import SettingsArray from '../components/SettingsArray.vue';
  import { UserInterfaceBBCodeParser } from '../bbcode/user-interface';
  import { Settings as DefaultSettings } from './common';
  import core from './core';
  import {
    Settings as SettingsInterface,
    Character,
    PartialSettings
  } from './interfaces';
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
  import VirtualList from '../components/VirtualList.vue';

  const bbcodeParser = new UserInterfaceBBCodeParser();

  function notifySettingsReload(): void {
    electron.ipcRenderer.send('request-reload-settings');
  }

  export default CustomDialog.extend({
    components: {
      modal: Modal,
      editor: Editor,
      tabs: Tabs,
      bbcode: BBCodeView(bbcodeParser),
      'settings-tristate': SettingsTriState,
      'user-view': UserView,
      'virtual-list': VirtualList,
      'settings-override': SettingsOverride,
      'settings-input': SettingsInput,
      'settings-array': SettingsArray
    },
    data() {
      const defaultSettings = new DefaultSettings();

      return {
        l,
        availableImports: [] as ReadonlyArray<string>,
        selectedTab: 'chat.bbcode',
        settingsMode: '0',
        importCharacter: '',
        characterOverrides: {} as PartialSettings,

        risingAvailableThemes: [] as ReadonlyArray<string>,
        smartFilterTypes: smartFilterTypesOrigin,
        settings: { ...defaultSettings } as DefaultSettings,
        risingFilter: {} as any as SmartFilterSettings,
        hiddenFilter: ''
      };
    },
    computed: {
      currentCharacter(): string {
        return core.connection.character;
      },
      hidden(): string[] {
        return core.state.hiddenUsers;
      },
      filteredHidden(): ReadonlyArray<{ name: string }> {
        // ^ Wrap entries as objects so VirtualList's keyField="name" can index
        // them; filter is case-insensitive substring on the raw name.
        const q = this.hiddenFilter.trim().toLowerCase();
        const list = this.hidden;
        if (q === '') return list.map(name => ({ name }));
        const out: { name: string }[] = [];
        for (const name of list) {
          if (name.toLowerCase().indexOf(q) !== -1) out.push({ name });
        }
        return out;
      },
      ignored(): readonly string[] {
        return core.characters.ignoreList;
      }
    },
    methods: {
      isUsingGlobal(): boolean {
        return this.settingsMode === '0';
      },
      async load(): Promise<void> {
        const globalSettings = core.state.globalSettings as any;
        const defaultSettings = new DefaultSettings();

        for (const [key, value] of Object.entries(defaultSettings)) {
          if (globalSettings[key] === undefined) globalSettings[key] = value;
        }

        this.settings = { ...globalSettings };
        this.availableImports = (
          await core.settingsStore.getAvailableCharacters()
        ).filter(x => x !== core.connection.character);

        this.risingAvailableThemes = fs
          .readdirSync(path.join(__dirname, 'themes'))
          .filter(x => x.substr(-4) === '.css')
          .map(x => x.slice(0, -4));

        this.characterOverrides = { ...core.state.characterSettings };
      },
      async doImport(): Promise<void> {
        if (
          !confirm(
            l('settings.import.confirm', {
              source: this.importCharacter,
              target: core.connection.character
            })
          )
        )
          return;
        const importKey = async (key: keyof SettingsInterface.Keys) => {
          const settings = await core.settingsStore.get(
            key,
            this.importCharacter
          );
          if (settings !== undefined)
            await core.settingsStore.set(key, settings);
        };
        await importKey('settings');
        await importKey('pinned');
        await importKey('modes');
        await importKey('conversationSettings');
        await importKey('hiddenUsers');
        await importKey('favoriteEIcons');
        core.connection.close(false);
      },
      unignore(character: string): void {
        core.connection.send('IGN', { action: 'delete', character });
      },
      unhide(name: string): void {
        core.toggleHidden(name);
      },
      async submit(): Promise<void> {
        if (this.settingsMode === '0') {
          await this.submitGlobalSettings();
          return;
        }

        await this.submitCharacterOverrides();
      },
      async submitGlobalSettings(): Promise<void> {
        const oldRisingFilter = JSON.parse(
          JSON.stringify(core.state.settings.risingFilter)
        );

        const minAge = this.getAsNumber(this.settings.risingFilter.minAge);
        const maxAge = this.getAsNumber(this.settings.risingFilter.maxAge);

        const diskDraftTimer = this.getAsNumber(
          this.settings.horizonSaveDraftMessagesToDiskTimer
        );

        const previousSettings = core.state.globalSettings;

        const newSettings = {
          ...this.settings,
          risingFilter: {
            ...this.settings.risingFilter,
            minAge,
            maxAge
          }
        };

        newSettings.idleTimer =
          this.settings.idleTimer < 0
            ? 0
            : this.settings.idleTimer > 1440
              ? 1440
              : this.settings.idleTimer;

        newSettings.horizonAutoGenderFilter =
          previousSettings.horizonAutoGenderFilter;
        //  newSettings.horizonSavedGenderFilters =
        //   previousSettings.horizonSavedGenderFilters;
        newSettings.horizonSavedMembersSort =
          previousSettings.horizonSavedMembersSort;

        newSettings.horizonSaveDraftMessagesToDiskTimer =
          diskDraftTimer === null
            ? 60
            : diskDraftTimer > 5
              ? diskDraftTimer
              : 5;

        newSettings.risingCharacterTheme = newSettings.risingCharacterTheme
          ? newSettings.risingCharacterTheme
          : undefined;
        core.state.globalSettings = {
          ...newSettings,
          risingFilter: {
            ...newSettings.risingFilter,
            minAge,
            maxAge
          }
        };
        const newRisingFilter = JSON.parse(
          JSON.stringify(core.state.settings.risingFilter)
        );

        if (!_.isEqual(oldRisingFilter, newRisingFilter)) {
          this.rebuildFilters();
        }

        if (this.settings.notifications)
          await core.notifications.requestPermission();

        EventBus.$emit('configuration-update', core.state.settings);
        notifySettingsReload();
      },
      async submitCharacterOverrides(): Promise<void> {
        const oldRisingFilter = JSON.parse(
          JSON.stringify(core.state.characterSettings.risingFilter)
        );

        core.state.characterSettings = this.characterOverrides;

        const newRisingFilter = JSON.parse(
          JSON.stringify(core.state.characterSettings.risingFilter)
        );

        if (!_.isEqual(oldRisingFilter, newRisingFilter)) {
          this.rebuildFilters();
        }

        EventBus.$emit('configuration-update', core.state.settings);
        notifySettingsReload();
      },
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

        // if a sender's filtered status is stale (not in memory), rematch them
        void core.cache.rematchStaleAdsInConversations();
      },
      getAsNumber(input: any): number | null {
        if (_.isNil(input) || input === '') {
          return null;
        }

        const n = parseInt(input, 10);

        return !Number.isNaN(n) && Number.isFinite(n) ? n : null;
      },
      getExceptionList(): string {
        return _.join(this.risingFilter.exceptionNames, '\n');
      },
      setExceptionList(v: any): void {
        this.risingFilter.exceptionNames = _.map(_.split(v.target.value), v =>
          _.trim(v)
        );
      },
      getSmartFilter(key: keyof SmartFilterSelection): boolean {
        return !!this.risingFilter.smartFilters?.[key];
      },
      setSmartFilter(key: keyof SmartFilterSelection, value: any): void {
        this.risingFilter.smartFilters[key] = value.target.checked;
      },
      getCharacter(name: string): Character {
        return core.characters.get(name);
      }
    }
  });
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

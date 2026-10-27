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
          {
            type: 'label',
            label: l('settings.tabs.app'),
            iconClass: 'fa-horizon fa-logo'
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
            v-if="currentCharacter"
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
              Having an exception for the smartFilter tab isn't clean, 
              but we also don't fill this menu dynamically yet so this will have to do for now.
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
            v-show="selectedTab === 'app.general'"
            class="card-body settings-content"
            style="height: 100%; width: 100%"
          >
            <h5>
              {{ l('settings.tabs.general') }}
            </h5>
            <div class="mb-3">
              <div class="form-check">
                <input
                  type="checkbox"
                  id="autoLogin"
                  v-model="generalSettings.horizonAutoLogin"
                  class="form-check-input"
                />
                <label class="form-check-label" for="autoLogin">
                  {{ l('login.auto') }}
                </label>
              </div>
            </div>

            <div class="mb-3">
              <div class="form-check">
                <input
                  type="checkbox"
                  id="showTips"
                  v-model="generalSettings.horizonShowTips"
                  class="form-check-input"
                />
                <label class="form-check-label" for="showTips">
                  {{ l('settings.showTips') }}
                </label>
              </div>
            </div>

            <h5>
              {{ l('settings.spellcheck.language') }}
            </h5>

            <div class="mb-3">
              <label class="control-label" for="displayLanguage">
                {{ l('settings.displayLanguage') }}
                <select
                  id="displayLanguage"
                  class="form-select"
                  style="flex: 1; margin-right: 10px"
                  v-model="generalSettings.displayLanguage"
                >
                  <option
                    v-for="lang in availableDisplayLanguages"
                    :key="lang.code"
                    :value="lang.code"
                  >
                    {{ lang.name }}
                  </option>
                </select>
              </label>
              <div class="form-text text-muted">
                {{ l('settings.displayLanguage.note') }}
              </div>
            </div>

            <!--On MacOS, Electron uses the OS' native spell checker as of version 35.2.0 -->
            <div class="mb-3" v-if="spellcheckLanguages.length > 0">
              <label
                class="control-label"
                for="spellCheckLang"
                style="width: 24ch"
              >
                {{ l('settings.spellcheck') }}
                <filterable-select
                  v-model="selectedLang"
                  :options="sortedLangs"
                  :filterFunc="filterLanguage"
                  :placeholder="l('filter')"
                  :multiple="true"
                  :title="l('settings.spellcheck.language')"
                >
                  <template v-slot="s">
                    {{
                      //s.option ||
                      formatLanguage(s.option) ||
                      l('settings.spellcheck.language')
                    }}
                  </template>
                </filterable-select>
              </label>
            </div>

            <h5>
              {{ l('settings.timeFormat') }}
            </h5>
            <div class="mb-3">
              <div class="form-check">
                <input
                  class="form-check-input"
                  v-model="generalSettings.use12HourTime"
                  type="checkbox"
                  id="use12HourTime"
                />
                <label class="form-check-label" for="use12HourTime">
                  {{ l('settings.timeFormat.12hour') }}
                </label>
              </div>
            </div>

            <div class="mb-3">
              <div class="form-check">
                <input
                  class="form-check-input"
                  v-model="generalSettings.showSeconds"
                  type="checkbox"
                  id="showSeconds"
                />
                <label class="form-check-label" for="showSeconds">
                  {{ l('settings.timeFormat.showSeconds') }}
                </label>
              </div>
            </div>

            <div class="mb-3">
              <div class="form-check">
                <input
                  class="form-check-input"
                  v-model="generalSettings.fuzzyDates"
                  type="checkbox"
                  id="fuzzyDates"
                />
                <label class="form-check-label" for="fuzzyDates">
                  {{ l('settings.timeFormat.fuzzyDates') }}
                </label>
              </div>
            </div>

            <h5>
              {{ l('settings.updates') }}
            </h5>
            <div class="mb-3">
              <div class="form-check">
                <input
                  type="checkbox"
                  id="updateCheck"
                  v-model="generalSettings.updateCheck"
                  class="form-check-input"
                />
                <label class="form-check-label" for="updateCheck">
                  {{ l('settings.updateCheck') }}
                </label>
              </div>
            </div>
            <div class="mb-3" v-if="generalSettings.updateCheck">
              <div class="form-check">
                <input
                  type="checkbox"
                  id="beta"
                  v-model="generalSettings.beta"
                  class="form-check-input"
                />
                <label class="form-check-label" for="beta">
                  {{ l('settings.beta') }}
                </label>
              </div>
            </div>
            <div class="mb-3" v-if="generalSettings.updateCheck">
              <div class="form-check">
                <input
                  type="checkbox"
                  id="hideAutoUpdater"
                  v-model="generalSettings.horizonHideAutoUpdater"
                  class="form-check-input"
                />
                <label class="form-check-label" for="hideAutoUpdater">
                  {{ l('settings.updateHideAutoUpdater') }}
                </label>
              </div>
              <div class="form-text text-muted">
                {{ l('settings.updateHideAutoUpdater.note') }}
              </div>
            </div>
            <div v-if="generalSettings.updateCheck">
              <div class="form-check">
                <input
                  type="checkbox"
                  id="autoDownloadUpdates"
                  v-model="generalSettings.horizonAutoDownloadUpdates"
                  class="form-check-input"
                />
                <label class="form-check-label" for="autoDownloadUpdates">
                  {{ l('settings.autoDownloadUpdates') }}
                </label>
              </div>
              <div class="form-text text-muted">
                {{ l('settings.autoDownloadUpdates.note') }}
              </div>
            </div>
          </div>

          <div v-show="selectedTab === 'app.look'">
            <h5>
              {{ l('settings.theme') }}
            </h5>
            <div class="mb-3">
              <div class="form-check">
                <input
                  type="checkbox"
                  id="themeSystemSync"
                  class="form-check-input"
                  v-model="generalSettings.themeSync"
                />
                <label class="form-check-label" for="themeSystemSync">
                  {{ l('settings.theme.sync') }}
                </label>
              </div>
            </div>
            <div class="mb-3" v-if="!generalSettings.themeSync">
              <label class="control-label" for="theme" style="width: 24ch">
                {{ l('settings.theme.app') }}
                <filterable-select
                  v-model="generalSettings.theme"
                  :options="availableThemes"
                  :placeholder="l('filter')"
                  :title="l('settings.theme')"
                >
                  <template v-slot="s">
                    {{ capitalizeThemeName(s.option) }}
                  </template>
                </filterable-select>
              </label>
            </div>
            <div class="mb-3" v-else>
              <label
                class="control-label"
                for="themeSyncLight"
                style="width: 24ch"
              >
                {{ l('settings.theme.app.light') }}
                <filterable-select
                  v-model="generalSettings.themeSyncLight"
                  :options="availableThemes"
                  :placeholder="l('filter')"
                  :title="l('settings.theme')"
                >
                  <template v-slot="s">
                    {{ capitalizeThemeName(s.option) }}
                  </template>
                </filterable-select>
              </label>

              <label
                class="control-label"
                for="themeSyncDark"
                style="width: 24ch"
              >
                {{ l('settings.theme.app.dark') }}
                <filterable-select
                  v-model="generalSettings.themeSyncDark"
                  :options="availableThemes"
                  :placeholder="l('filter')"
                  :title="l('settings.theme')"
                >
                  <template v-slot="s">
                    {{ capitalizeThemeName(s.option) }}
                  </template>
                </filterable-select>
              </label>
            </div>

            <h5>
              {{ l('settings.theme.textColors') }}
            </h5>

            <div class="mb-3">
              <label class="control-label" for="themeVanillaBbcode">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    v-model="settings.horizonVanillaTextColors"
                    type="checkbox"
                    id="themeVanillaBbcode"
                    aria-describedby="vanillaBbcodeLegibilityNote"
                  />
                  <label class="form-check-label" for="themeVanillaBbcode">
                    {{ l('settings.theme.vanillaBbcode') }}
                  </label>
                </div>
                <div
                  id="vanillaBbcodeLegibilityNote"
                  class="form-text text-muted"
                >
                  {{ l('settings.theme.vanillaBbcode.legibilityNote') }}
                </div>
              </label>
            </div>

            <div class="mb-3">
              <label class="control-label" for="themeVanillaGenders">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    v-model="settings.horizonVanillaGenderColors"
                    type="checkbox"
                    id="themeVanillaGenders"
                    aria-describedby="vanillaGendersNote"
                  />
                  <label class="form-check-label" for="themeVanillaGenders">
                    {{ l('settings.theme.vanillaGenders') }}
                  </label>
                </div>
                <div id="vanillaGendersNote" class="form-text text-muted">
                  {{ l('settings.theme.vanillaGenders.note') }}
                </div>
              </label>
            </div>

            <div class="mb-3">
              <label class="control-label" for="themeBbcodeGlow">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    v-model="settings.horizonBbcodeGlow"
                    type="checkbox"
                    id="themeBbcodeGlow"
                    aria-describedby="bbcodeGlowNote"
                  />
                  <label class="form-check-label" for="themeBbcodeGlow">
                    {{ l('settings.theme.bbcodeGlow') }}
                  </label>
                </div>
                <div id="bbcodeGlowNote" class="form-text text-muted">
                  {{ l('settings.theme.bbcodeGlow.note') }}
                </div>
              </label>
            </div>
          </div>
          <div
            v-show="selectedTab === 'app.notifications'"
            class="card-body settings-content"
            style="height: 100%; width: 100%"
          >
            <h5>{{ l('settings.sounds') }}</h5>
            <div class="form-group">
              <label class="control-label" for="soundTheme" style="width: 24ch">
                {{ l('settings.soundTheme') }}
                <filterable-select
                  v-model="settings.soundTheme"
                  :options="availableSoundThemes"
                  style="flex: 1; margin-right: 10px"
                  :title="l('settings.soundTheme')"
                  :placeholder="l('filter')"
                >
                  <template v-slot="s">
                    {{ capitalizeThemeName(s.option) }}
                  </template>
                </filterable-select>
              </label>
            </div>

            <div class="sound-theme-details">
              <div
                class="d-flex"
                style="justify-content: space-between; align-items: center"
              >
                <div>
                  <h5 style="margin: 0">
                    {{ capitalizeThemeName(settings.soundTheme) }}
                  </h5>
                  <div class="text-muted" v-if="currentSoundThemeDetails">
                    <div>{{ currentSoundThemeDetails.description }}</div>
                    <div v-if="currentSoundThemeDetails.author">
                      {{
                        l('settings.soundTheme.by', {
                          name: currentSoundThemeDetails.author
                        })
                      }}
                    </div>
                    <div class="small">
                      {{
                        l('settings.soundTheme.version', {
                          version: currentSoundThemeDetails.version
                        })
                      }}
                    </div>
                  </div>
                  <div v-else class="text-muted small">
                    {{ l('settings.soundTheme.noMetadata') }}
                  </div>
                </div>
                <div>
                  <div style="display: flex; gap: 8px; align-items: center">
                    <button
                      class="btn btn-outline-primary"
                      @click.prevent.stop="
                        soundListCollapsed = !soundListCollapsed
                      "
                      :title="l('settings.soundTheme.toggleList')"
                    >
                      {{
                        l(
                          soundListCollapsed
                            ? 'settings.soundTheme.show'
                            : 'settings.soundTheme.hide'
                        )
                      }}
                    </button>
                  </div>
                </div>
              </div>
              <div
                v-if="
                  currentSoundThemeDetails && currentSoundThemeDetails.sounds
                "
                class="mt-3"
              >
                <div v-if="!soundListCollapsed" class="mt-2">
                  <div
                    v-for="sound in Object.keys(
                      currentSoundThemeDetails.sounds
                    )"
                    :key="sound"
                    class="sound-row d-flex flex-row mb-3 align-items-center"
                  >
                    <div
                      style="width: 14ch; text-transform: capitalize"
                      class="p-2"
                    >
                      {{ sound }}
                    </div>
                    <input
                      type="range"
                      class="form-range p-2 flex-grow-1"
                      min="0"
                      max="1"
                      step="0.01"
                      v-model.number="liveVolumeMap[sound]"
                      @input="onVolumeChange(sound)"
                      style="width: unset"
                    />
                    <div class="input-group p-2" style="width: unset">
                      <input
                        type="number"
                        class="form-control"
                        min="0"
                        max="100"
                        step="1"
                        style="text-align: right"
                        :value="Math.round((liveVolumeMap[sound] ?? 1) * 100)"
                        @input="handlePercentInput($event, sound)"
                      />
                      <button
                        class="btn btn-sm btn-outline-primary p-2"
                        @click.prevent.stop="previewSound(sound)"
                        :title="l('settings.soundTheme.preview')"
                      >
                        {{ l('settings.soundTheme.preview') }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="mt-2 text-muted small">
                {{ l('settings.soundTheme.noSounds') }}
              </div>
            </div>
            <h5>
              {{ l('settings.notifications.badges') }}
            </h5>
            <div class="mb-3">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="horizonShowNotificationBadge"
                  v-model="settings.horizonShowNotificationBadge"
                />
                <label
                  class="form-check-label"
                  for="horizonShowNotificationBadge"
                >
                  {{ l('settings.notifications.badges.shouldShow') }}
                </label>
              </div>
              <div
                id="horizonShowNotificationBadgeNote"
                class="form-text text-muted"
                v-if="!isWindows && !isMac"
              >
                {{ l('settings.notifications.badges.shouldShow.linuxNote') }}
              </div>
            </div>
            <div class="mb-3">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="horizonShowWindowAndChatNotificationBadge"
                  v-model="settings.horizonShowWindowAndChatNotificationBadge"
                />
                <label
                  class="form-check-label"
                  for="horizonShowWindowAndChatNotificationBadge"
                >
                  {{
                    l('settings.notifications.badges.shouldShow.windowAndChat')
                  }}
                </label>
              </div>
            </div>
            <div class="mb-3" v-if="!isMac">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="flashWindow"
                  v-model="settings.flashWindow"
                />
                <label class="form-check-label" for="flashWindow">
                  {{ l('settings.flashWindow') }}
                </label>
              </div>
              <div
                id="flashWindowNote"
                class="form-text text-muted"
                v-if="!isWindows"
              >
                {{ l('settings.flashWindow.note') }}
              </div>
            </div>
          </div>

          <div v-show="selectedTab === 'app.behavior'">
            <h5>{{ l('user.profile') }}</h5>
            <div class="mb-3">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="profileViewer"
                  v-model="generalSettings.profileViewer"
                />
                <label class="form-check-label" for="profileViewer">
                  {{ l('settings.profileViewer') }}
                </label>
              </div>
            </div>
            <div class="mb-3" v-if="generalSettings.profileViewer">
              <label class="control-label" for="profileViewerGalleryType">
                {{ l('settings.profileViewerGalleryType') }}
                <select
                  id="profileViewerGalleryType"
                  class="form-select"
                  style="flex: 1; margin-right: 10px"
                  v-model="generalSettings.profileViewerGalleryType"
                >
                  <option value="thumbnail">
                    {{ l('settings.profileViewerGalleryType.thumbnail') }}
                  </option>
                  <option value="hover">
                    {{ l('settings.profileViewerGalleryType.hover') }}
                  </option>
                  <option value="full">
                    {{ l('settings.profileViewerGalleryType.full') }}
                  </option>
                </select>
              </label>
              <div
                id="profileViewerGalleryTypeNote"
                class="form-text text-muted"
                v-if="generalSettings.profileViewer"
              >
                {{
                  l(
                    `settings.profileViewerGalleryType.note.${generalSettings.profileViewerGalleryType}`
                  )
                }}
              </div>
            </div>

            <div
              class="mb-3"
              v-if="
                generalSettings.profileViewer &&
                (generalSettings.profileViewerGalleryType === 'thumbnail' ||
                  generalSettings.profileViewerGalleryType === 'hover')
              "
            >
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="profileViewerThumbAnimate"
                  v-model="generalSettings.profileViewerThumbAnimate"
                />
                <label class="form-check-label" for="profileViewerThumbAnimate">
                  {{ l('settings.profileViewerThumbAnimate') }}
                </label>
              </div>
            </div>

            <div class="mb-3" v-if="generalSettings.profileViewer">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="profileViewerSmallerDefaultAvatars"
                  v-model="generalSettings.profileViewerSmallerDefaultAvatars"
                />
                <label
                  class="form-check-label"
                  for="profileViewerSmallerDefaultAvatars"
                >
                  {{ l('settings.profileViewer.smallerDefaultAvatars') }}
                </label>
              </div>
            </div>

            <div class="mb-3">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="horizonForceAsciiProfiles"
                  :disabled="!generalSettings.profileViewer"
                  v-model="generalSettings.horizonForceAsciiProfiles"
                  aria-describedby="forceAsciiNote"
                />
                <label class="form-check-label" for="horizonForceAsciiProfiles">
                  {{ l('settings.horizonForceAsciiProfiles') }}
                </label>
                <div id="forceAsciiNote" class="form-text text-muted">
                  {{ l('settings.horizonForceAsciiProfiles.note') }}
                </div>
              </div>
            </div>

            <h5>{{ l('settings.behavior.chat') }}</h5>
            <div class="mb-3">
              <label class="control-label label-full" for="logDir">
                {{ l('settings.logDir') }}

                <div class="input-group">
                  <input
                    class="form-control"
                    id="logDir"
                    disabled
                    @click="browseForLogDir()"
                    v-model="generalSettings.logDirectory"
                  />
                  <button
                    class="btn btn-outline-secondary"
                    @click="browseForLogDir()"
                    :title="l('settings.logDir.select')"
                  >
                    <span class="fas fa-fw fa-folder-plus"></span></button
                  ><button
                    class="btn btn-outline-secondary"
                    @click="openLogDir()"
                    :title="
                      l('platform.open', {
                        name: l(`platform.fileExplorer.${platform}`)
                      })
                    "
                  >
                    <span class="far fa-fw fa-folder-open"></span>
                  </button></div
              ></label>
              <div
                id="logDirNoteOnedrive"
                class="form-text text-muted"
                v-if="platform === 'win32'"
              >
                <span>{{ `${l('settings.logDir.note.onedrive')} ` }}</span>
              </div>
              <div id="logDirNote" class="form-text text-muted">
                <a
                  href="#"
                  @click="
                    externalUrlHandler(
                      `https://horizn.moe/docs/guides/backup.html`
                    )
                  "
                  ><localized-text k="settings.logDir.guide">
                    <template #icon>
                      <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </template>
                  </localized-text>
                </a>
              </div>
            </div>
            <h5>{{ l('settings.behavior.window') }}</h5>
            <div class="mb-3">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="closeToTray"
                  v-model="generalSettings.closeToTray"
                />
                <label class="form-check-label" for="closeToTray">
                  {{ l('settings.closeToTray') }}
                </label>
              </div>
            </div>

            <div class="mb-3">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="windowTitleCharacter"
                  v-model="generalSettings.horizonWindowTitleCharacter"
                />
                <label class="form-check-label" for="windowTitleCharacter">
                  {{ l('settings.windowTitleCharacter') }}
                </label>
              </div>
            </div>

            <div class="mb-3">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="forceNativeWindowControls"
                  v-model="generalSettings.forceNativeWindowControls"
                />
                <label class="form-check-label" for="forceNativeWindowControls">
                  {{
                    l('settings.experimental', {
                      name: l('settings.forceNativeWindowControls')
                    })
                  }}
                </label>
              </div>
            </div>

            <div class="mb-3">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="nativeWindowShowSingleTab"
                  v-model="generalSettings.nativeWindowShowSingleTab"
                  :disabled="!generalSettings.forceNativeWindowControls"
                />
                <label class="form-check-label" for="nativeWindowShowSingleTab">
                  {{ l('settings.nativeWindowShowSingleTab') }}
                </label>
                <div
                  id="nativeWindowShowSingleTabNote"
                  class="form-text text-muted"
                >
                  {{ l('settings.nativeWindowShowSingleTab.note') }}
                </div>
              </div>
            </div>
          </div>
          <div v-show="selectedTab === 'app.accessibility'">
            <div>
              <div class="mb-3" v-if="!true">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="risingDisableWindowsHighContrast"
                    v-model="generalSettings.risingDisableWindowsHighContrast"
                  />
                  <label
                    class="form-check-label"
                    for="risingDisableWindowsHighContrast"
                  >
                    {{ l('settings.risingDisableWindowsHighContrast') }}
                  </label>
                </div>
              </div>

              <div class="mb-3">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="reducedMotion"
                    v-model="generalSettings.reducedMotion"
                  />
                  <label class="form-check-label" for="reducedMotion">
                    {{ l('settings.reducedMotion') }}
                  </label>
                </div>

                <small class="form-text text-muted">{{
                  l('settings.reducedMotion.description')
                }}</small>
              </div>
            </div>
          </div>

          <div
            v-show="selectedTab === 'app.advanced'"
            class="card-body settings-content"
            style="height: 100%; width: 100%"
          >
            <h5>
              {{ l('settings.system') }}
            </h5>
            <div class="mb-3">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="hwAcceleration"
                  v-model="generalSettings.hwAcceleration"
                />
                <label class="form-check-label" for="hwAcceleration">
                  {{ l('settings.hwAcceleration') }}
                </label>
              </div>
            </div>
            <div class="mb-3">
              <!--We do this one slightly differently because we
                cannot and will not make ElectronLogger.LogType reactive -->
              <label class="control-label" for="systemLogLevel">
                {{ l('settings.systemLogLevel') }}
                <div class="input-group">
                  <select
                    id="systemLogLevel"
                    class="form-select form-select"
                    style="flex: 1; margin-right: 10px"
                    v-model="generalSettings.risingSystemLogLevel"
                  >
                    <option value="error">
                      {{ l('settings.systemLogLevel.error') }}
                    </option>
                    <option value="warn">
                      {{ l('settings.systemLogLevel.warn') }}
                    </option>
                    <option value="info">
                      {{ l('settings.systemLogLevel.info') }}
                    </option>
                    <option value="verbose">
                      {{ l('settings.systemLogLevel.verbose') }}
                    </option>
                    <option value="debug">
                      {{ l('settings.systemLogLevel.debug') }}
                    </option>
                    <option value="silly">
                      {{ l('settings.systemLogLevel.silly') }}
                    </option>
                  </select>
                </div>
              </label>
            </div>

            <h5>
              {{ l('settings.cache') }}
            </h5>

            <div class="mb-3">
              <label class="control-label" for="cacheExpiryDays">
                {{ l('settings.cache.expiryDays') }}</label
              >
              <div class="input-group">
                <input
                  class="form-control"
                  id="cacheExpiryDays"
                  type="number"
                  min="0"
                  max="1000"
                  v-model="generalSettings.risingCacheExpiryDays"
                />
                <span class="input-group-text" id="basic-addon3">{{
                  l('unit.days')
                }}</span>
              </div>
              <small class="form-text text-muted">{{
                l('settings.cache.expiryDays.description')
              }}</small>
            </div>
            <div class="mb-3">
              <label class="control-label" for="cacheMemoryCount">
                {{ l('settings.cache.memoryCount') }}
              </label>
              <div class="input-group">
                <input
                  class="form-control"
                  id="cacheMemoryCount"
                  type="number"
                  min="350"
                  max="1000"
                  v-model="generalSettings.horizonCacheMemoryCount"
                />
              </div>
              <small class="form-text text-muted">{{
                l('settings.cache.memoryCount.description')
              }}</small>
            </div>

            <h5>
              {{ l('settings.browserOptionTitle') }}
            </h5>
            <div class="warning" v-if="isMac">
              <h5>{{ l('settings.dangerZone') }}</h5>

              <hr />
              <p>{{ l('settings.macLinkBug1') }}</p>
              <p>{{ l('settings.macLinkBug2') }}</p>
              <p>{{ l('settings.macLinkBug3') }}</p>
            </div>

            <label class="control-label label-full" for="browserPath">
              {{ l('settings.browserOptionPath') }}

              <div class="input-group">
                <input
                  class="form-control"
                  id="browserPath"
                  v-model="generalSettings.browserPath"
                />
                <button
                  class="btn btn-outline-secondary"
                  @click.prevent.stop="browseForPath()"
                >
                  <span class="far fa-fw fa-folder-open"></span>
                </button>
                <button
                  class="btn btn-outline-danger"
                  @click.prevent.stop="browserReset()"
                >
                  <span class="fa-solid fa-fw fa-arrow-rotate-right"></span>
                </button></div
            ></label>

            <label class="control-label label-full" for="browserArgs">
              {{ l('settings.browserOptionArguments') }}
              <div class="input-group">
                <input
                  class="form-control"
                  id="browserArgs"
                  v-model="generalSettings.browserArgs"
                />
              </div>
              <small class="form-text text-muted" v-if="!isMac">{{
                l('settings.browserOptionArgumentsHelp')
              }}</small>
              <small class="form-text text-muted" v-else>
                <span>{{ l('settings.browserOptionArgumentsHelp.mac') }} </span>

                <a
                  class="fa-solid fa-arrow-up-right-from-square"
                  href="#"
                  @click="
                    externalUrlHandler(
                      'https://support.apple.com/guide/terminal/execute-commands-and-run-tools-apdb66b5242-0d18-49fc-9c47-a2498b7c91d5/mac'
                    )
                  "
                ></a>
                <p>
                  <span>
                    {{ l('settings.browserOptionArgumentsHelp.format') }}
                  </span>
                  <kbd>
                    {{
                      `open -a ${generalSettings.browserPath} ${generalSettings.browserArgs}`
                    }}
                  </kbd>
                </p>

                <p>
                  {{ l('settings.browserOptionArgumentsHelp.mac.ignoreMe') }}
                </p>
              </small>
            </label>

            <div class="mb-3" v-if="!isMac">
              <label class="control-label" for="alwaysOpenIncognito">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="alwaysOpenIncognito"
                    v-model="generalSettings.horizonAlwaysOpenIncognito"
                  />
                  <label class="form-check-label" for="alwaysOpenIncognito">
                    {{ l('settings.alwaysOpenIncognito') }}
                  </label>
                </div>
                <small class="form-text text-muted">{{
                  l('settings.alwaysOpenIncognito.help')
                }}</small>
              </label>
            </div>
            <h5>
              {{
                l('settings.experimental', {
                  name: l('settings.customCss')
                })
              }}
            </h5>

            <div class="mb-3">
              <label class="control-label" for="customCssEnabled">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="customCss"
                    v-model="generalSettings.horizonCustomCssEnabled"
                  />
                  <label class="form-check-label" for="customCss">
                    {{ l('settings.customCss.enabled') }}
                  </label>
                </div>
              </label>
            </div>
            <div class="mb-3">
              <label class="control-label" for="windowTransparency">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    v-model="generalSettings.allowWindowTransparency"
                    type="checkbox"
                    :disabled="!generalSettings.horizonCustomCssEnabled"
                    id="windowTransparency"
                    aria-describedby="windowTransparencyNote"
                  />
                  <label class="form-check-label" for="windowTransparency">
                    {{
                      l('settings.experimental', {
                        name: l('settings.customCss.transparency')
                      })
                    }}
                  </label>
                </div>
                <div id="windowTransparencyNote" class="form-text text-muted">
                  {{ l('settings.customCss.transparency.note') }}
                </div>
              </label>

              <label for="customCss" class="control-label label-full"
                >{{ l('settings.customCss.css') }}
                <textarea
                  class="form-control textarea-code"
                  id="customCss"
                  v-model="generalSettings.horizonCustomCss"
                  :disabled="!generalSettings.horizonCustomCssEnabled"
                  :rows="countLines(generalSettings.horizonCustomCss || 0) + 3"
                  @keydown.tab.prevent="handleTab"
                ></textarea>
                <small class="form-text text-warning">{{
                  l('settings.customCss.warning')
                }}</small>
              </label>
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
                l('settings.experimental', { name: l('settings.fontSize') })
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
                  <option v-for="theme in availableThemes" :value="theme">
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
                l('settings.experimental', {
                  name: l('settings.chatLayoutMode')
                })
              }}</label>
              <settings-select-override
                id="chatLayoutMode"
                name="chatLayoutMode"
                :globalValue="settings.chatLayoutMode"
                :overrideValue="characterOverrides.chatLayoutMode"
                :usingGlobal="isUsingGlobal()"
                :options="[
                  {
                    value: 'classic',
                    label: l('settings.chatLayoutMode.classic')
                  },
                  {
                    value: 'modern',
                    label: l('settings.chatLayoutMode.modern')
                  }
                ]"
                :fallbackLabel="l('settings.override.useGlobal')"
                @update:globalValue="setGlobalChatLayoutMode($event)"
                @update:overrideValue="setCharacterChatLayoutMode($event)"
              />
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
                  v-model="activeRisingFilter.hideAds"
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
                  v-model="activeRisingFilter.hideSearchResults"
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
                  v-model="activeRisingFilter.hideChannelMembers"
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
                  v-model="activeRisingFilter.hidePublicChannelMessages"
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
                  v-model="activeRisingFilter.hidePrivateChannelMessages"
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
                  v-model="activeRisingFilter.hidePrivateMessages"
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
                  v-model="activeRisingFilter.showFilterIcon"
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
                  v-model="activeRisingFilter.penalizeMatches"
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
                  v-model="activeRisingFilter.rewardNonMatches"
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
                v-model="activeRisingFilter.minAge"
                :placeholder="l('settings.enterAge')"
              />

              <label class="control-label" for="risingFilter.maxAge">{{
                l('settings.maxAge')
              }}</label>
              <input
                id="risingFilter.maxAge"
                type="number"
                class="form-control"
                v-model="activeRisingFilter.maxAge"
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
                  v-model="activeRisingFilter.autoReply"
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
                  v-model="activeRisingFilter.autoReplyCustom"
                  :disabled="!activeRisingFilter.autoReply"
                />
                <label
                  class="form-check-label"
                  for="risingFilter.autoReplyCustom"
                >
                  {{ l('settings.autoReplyCustom') }}
                </label>
              </div>

              <editor
                v-model="activeRisingFilter.autoReplyCustomMessage"
                :hasToolbar="true"
                :classes="'form-control'"
                rows="5"
                :disabled="
                  !activeRisingFilter.autoReplyCustom ||
                  !activeRisingFilter.autoReply
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
  import * as fs from 'fs';
  import * as path from 'path';
  import CustomDialog from '../components/custom_dialog';
  import Modal from '../components/Modal.vue';
  import { Editor } from './bbcode';
  import Tabs from '../components/tabs';
  import { BBCodeView } from '../bbcode/view';
  import FilterableSelect from '../components/FilterableSelect.vue';
  import SettingsTriState from '../components/SettingsTriState.vue';
  import SettingsOverride from '../components/SettingsOverride.vue';
  import SettingsInput from '../components/SettingsInput.vue';
  import SettingsArray from '../components/SettingsArray.vue';
  import SettingsSelectOverride from '../components/SettingsSelectOverride.vue';
  import { UserInterfaceBBCodeParser } from '../bbcode/user-interface';
  import { Settings as DefaultSettings } from './common';
  import core from './core';
  import {
    Settings as SettingsInterface,
    Character,
    PartialSettings
  } from './interfaces';
  import { GeneralSettings } from './general-settings';
  import l, { availableDisplayLanguages, setLanguage } from './localize';
  import { formatLanguage } from './languages';
  import { SpellcheckLanguage } from './platform';
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

  export default CustomDialog.extend({
    components: {
      modal: Modal,
      editor: Editor,
      tabs: Tabs,
      bbcode: BBCodeView(bbcodeParser),
      'settings-tristate': SettingsTriState,
      'filterable-select': FilterableSelect,
      'user-view': UserView,
      'virtual-list': VirtualList,
      'settings-override': SettingsOverride,
      'settings-input': SettingsInput,
      'settings-array': SettingsArray,
      'settings-select-override': SettingsSelectOverride
    },
    async mounted(): Promise<void> {
      this.availableThemes = fs
        .readdirSync(path.join(__dirname, 'themes'))
        .filter(x => x.substr(-4) === '.css')
        .map(x => x.slice(0, -4));

      this.platform = process.platform;
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
        generalSettings: {} as GeneralSettings,
        availableDisplayLanguages,
        spellcheckLanguages: [] as ReadonlyArray<SpellcheckLanguage>,
        selectedLang: [] as string[],

        availableThemes: [] as ReadonlyArray<string>,
        smartFilterTypes: smartFilterTypesOrigin,
        settings: { ...defaultSettings } as DefaultSettings,
        risingFilter: {} as any as SmartFilterSettings,
        hiddenFilter: '',
        platform: 'win32' || 'darwin' || 'linux'
      };
    },
    computed: {
      currentCharacter(): string {
        return core.connection.character;
      },
      activeRisingFilter(): SmartFilterSettings {
        return (
          this.settingsMode === '0'
            ? this.settings.risingFilter
            : this.characterOverrides.risingFilter || this.settings.risingFilter
        ) as SmartFilterSettings;
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
      },
      sortedLangs(): string[] {
        return this.spellcheckLanguages.map(language => language.code);
      }
    },
    watch: {
      settingsMode(value: string): void {
        if (value === '1' && !this.characterOverrides.risingFilter) {
          this.$set(
            this.characterOverrides,
            'risingFilter',
            _.cloneDeep(this.settings.risingFilter)
          );
        }
      },
      'generalSettings.displayLanguage'(value: string): void {
        setLanguage(value);
      }
    },
    methods: {
      isUsingGlobal(): boolean {
        return this.settingsMode === '0';
      },
      // See also components/SettingsSelectOverride.vue for the actual component
      // This solution is not ideal, but between these 3 options, I went for the 2nd one since I assumed that while we would add more <select> based settings
      // in the future, they wouldn't be so many that we'd need a handler that isn't type-safe:

      // 1. Generic string-based handler, with no type-safety. (Better if we have a lot of <select> based settings)
      // 2. Specific handlers for each setting, with type-safety. (You are here)
      // 3. Handle all of them in SettingsView directly, which would lead to a ton of code duplication per setting.
      setGlobalChatLayoutMode(value: string): void {
        if (value === 'classic' || value === 'modern') {
          this.settings.chatLayoutMode = value;
        }
      },
      setCharacterChatLayoutMode(value: string | undefined): void {
        if (value === undefined) {
          this.$delete(this.characterOverrides, 'chatLayoutMode');
        } else if (value === 'classic' || value === 'modern') {
          this.$set(this.characterOverrides, 'chatLayoutMode', value);
        }
      },
      async load(): Promise<void> {
        const globalSettings = core.state.globalSettings as any;
        const defaultSettings = new DefaultSettings();

        //I think we can safely assume that these settings are loaded by the time a user can open this dialog. If not... lol
        this.generalSettings = {
          ...core.state.generalSettings
        } as GeneralSettings;

        this.spellcheckLanguages = await core.platform.getSpellcheckLanguages();
        this.selectedLang = this.getSafeSpellcheckLanguages(
          this.generalSettings.spellcheckLang
        );
        setLanguage(this.generalSettings.displayLanguage);

        for (const [key, value] of Object.entries(defaultSettings)) {
          if (globalSettings[key] === undefined) globalSettings[key] = value;
        }

        console.log(this.availableThemes);

        this.settings = { ...globalSettings };
        this.availableImports = (
          await core.settingsStore.getAvailableCharacters()
        ).filter(x => x !== core.connection.character);

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
        await this.submitGeneralSettings();
        if (this.settingsMode === '0') {
          await this.submitGlobalSettings();
          return;
        }

        await this.submitCharacterOverrides();
      },
      async submitGeneralSettings(): Promise<void> {
        if (this.spellcheckLanguages.length > 0) {
          this.generalSettings.spellcheckLang = this.selectedLang;
        }
        await core.platform.saveGeneralSettings(this.generalSettings);
      },
      formatLanguage(code: string): string {
        return formatLanguage(code);
      },
      filterLanguage(filter: RegExp, language: string): boolean {
        return filter.test(formatLanguage(language));
      },
      getSafeSpellcheckLanguages(
        languages: string | string[] | undefined
      ): string[] {
        const selected =
          typeof languages === 'string'
            ? [languages]
            : languages === undefined
              ? []
              : languages;
        const supported = new Set(this.sortedLangs);
        const safe = selected
          .map(language => language.replace('_', '-'))
          .filter(language => supported.has(language));

        return selected.length > 0 && safe.length === 0 ? ['en-GB'] : safe;
      },
      async browseForLogDir(): Promise<void> {
        const directory = await core.platform.selectDirectory({
          defaultPath: this.generalSettings.logDirectory
        });

        if (directory === undefined) return;

        if (
          !confirm(
            l('settings.logDir.confirm', {
              newDir: directory,
              currentDir: this.generalSettings.logDirectory
            })
          )
        ) {
          return;
        }

        this.generalSettings.logDirectory = directory;
      },
      async browseForPath(): Promise<void> {
        const file = await core.platform.selectFile({
          defaultPath: this.generalSettings.browserPath
        });

        if (file !== undefined) this.generalSettings.browserPath = file;
      },
      async openLogDir(): Promise<void> {
        await core.platform.openDirectory(this.generalSettings.logDirectory);
      },
      browserReset(): void {
        this.generalSettings.browserPath = '';
        this.generalSettings.browserArgs = '%s';
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
        await core.platform.reloadSettings();
      },
      async submitCharacterOverrides(): Promise<void> {
        const oldRisingFilter = _.cloneDeep(
          core.state.characterSettings.risingFilter
        );
        const newCharacterOverrides = { ...this.characterOverrides };

        if (
          _.isEqual(
            newCharacterOverrides.risingFilter,
            this.settings.risingFilter
          )
        ) {
          delete newCharacterOverrides.risingFilter;
        }

        core.state.characterSettings = newCharacterOverrides;
        this.characterOverrides = newCharacterOverrides;

        const newRisingFilter = _.cloneDeep(
          core.state.characterSettings.risingFilter
        );

        if (!_.isEqual(oldRisingFilter, newRisingFilter)) {
          this.rebuildFilters();
        }

        EventBus.$emit('configuration-update', core.state.settings);
        await core.platform.reloadSettings();
      },
      capitalizeThemeName(themeName: string): string {
        return themeName
          .split(/[\s-_]+/) // Split on spaces, hyphens, or underscores
          .map(
            word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join(' ');
      },
      countLines(text: string): number {
        let pointer = 0;
        for (let i = 0; i < text.length; i += 1) {
          switch (text[i]) {
            case '\r':
              pointer += 1;
              if (text[i + 1] === '\n') {
                i += 1;
              }
              break;
            case '\n':
              pointer += 1;
              if (text[i + 1] === '\r') {
                i += 1;
              }
              break;
          }
        }
        return pointer;
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
        return _.join(this.activeRisingFilter.exceptionNames, '\n');
      },
      setExceptionList(v: any): void {
        this.activeRisingFilter.exceptionNames = _.map(
          _.split(v.target.value),
          v => _.trim(v)
        );
      },
      getSmartFilter(key: keyof SmartFilterSelection): boolean {
        return !!this.activeRisingFilter.smartFilters?.[key];
      },
      setSmartFilter(key: keyof SmartFilterSelection, value: any): void {
        this.activeRisingFilter.smartFilters[key] = value.target.checked;
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

<template>
  <div
    class="card-full"
    style="display: flex; flex-direction: column; height: 100%"
    :class="getThemeClass()"
    @auxclick.prevent
  >
    <div v-html="styling"></div>
    <div class="window-modal modal" :class="getThemeClass()" tabindex="-1">
      <div class="modal-dialog modal-xl" style="height: 100vh">
        <div class="modal-content" style="height: 100vh">
          <div class="modal-header">
            <h5 class="modal-title" style="-webkit-app-region: drag">
              <i class="fas fa-fw fa-database"></i>
              {{ l('settings.export.manageData') }}
            </h5>
            <a
              type="button"
              class="btn-close"
              :aria-label="l('action.close')"
              v-if="!isMac"
              @click.stop="close()"
            >
              <span class="fas fa-times"></span>
            </a>
          </div>
          <div class="modal-body">
            <div class="d-flex" style="flex: 1; min-height: 0">
              <div class="data-manager-sidebar">
                <a
                  class="nav-link"
                  :class="{ active: selectedSection === 'auto-backup' }"
                  href="#"
                  @click.prevent="selectedSection = 'auto-backup'"
                >
                  <i class="fas fa-fw fa-clock-rotate-left me-2"></i>Auto Backup
                </a>
                <a
                  class="nav-link"
                  :class="{ active: selectedSection === 'export' }"
                  href="#"
                  @click.prevent="selectedSection = 'export'"
                >
                  <i class="fas fa-fw fa-file-export me-2"></i>Export
                </a>
                <a
                  class="nav-link"
                  :class="{ active: selectedSection === 'import' }"
                  href="#"
                  @click.prevent="selectedSection = 'import'"
                >
                  <i class="fas fa-fw fa-file-import me-2"></i>Import
                </a>
                <a
                  class="nav-link"
                  :class="{ active: selectedSection === 'vanilla' }"
                  href="#"
                  @click.prevent="selectedSection = 'vanilla'"
                >
                  <i class="fas fa-fw fa-file-arrow-down me-2"></i>Import from
                  Vanilla
                </a>
              </div>
              <div class="data-manager-content hidden-scrollbar">
                <div
                  v-show="selectedSection === 'auto-backup'"
                  class="settings-content"
                >
                  <h5>Auto Backup</h5>
                  <p class="text-muted">
                    Automatically create a backup when the app starts. Old
                    backups are removed based on the retention count.
                  </p>
                  <div class="form-check mb-2">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="autoBackupEnabled"
                      v-model="settings.autoBackupEnabled"
                    />
                    <label class="form-check-label" for="autoBackupEnabled">
                      Enable auto backup on launch
                    </label>
                  </div>
                  <div v-if="settings.autoBackupEnabled">
                    <div class="form-check mb-1">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="autoBackupIncludeGeneralSettings"
                        v-model="settings.autoBackupIncludeGeneralSettings"
                      />
                      <label
                        class="form-check-label"
                        for="autoBackupIncludeGeneralSettings"
                      >
                        {{ l('settings.export.includeGeneral') }}
                      </label>
                    </div>
                    <div class="form-check mb-1">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="autoBackupIncludeCharacterSettings"
                        v-model="settings.autoBackupIncludeCharacterSettings"
                      />
                      <label
                        class="form-check-label"
                        for="autoBackupIncludeCharacterSettings"
                      >
                        {{ l('settings.export.includeCharacterSettings') }}
                      </label>
                    </div>
                    <div class="form-check mb-1">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="autoBackupIncludeLogs"
                        v-model="settings.autoBackupIncludeLogs"
                      />
                      <label
                        class="form-check-label"
                        for="autoBackupIncludeLogs"
                      >
                        {{ l('settings.export.includeLogs') }}
                      </label>
                    </div>
                    <div class="form-check mb-1">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="autoBackupIncludeDrafts"
                        v-model="settings.autoBackupIncludeDrafts"
                      />
                      <label
                        class="form-check-label"
                        for="autoBackupIncludeDrafts"
                      >
                        {{ l('settings.export.includeDrafts') }}
                      </label>
                    </div>
                    <div class="form-check mb-1">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="autoBackupIncludePinnedConversations"
                        v-model="settings.autoBackupIncludePinnedConversations"
                      />
                      <label
                        class="form-check-label"
                        for="autoBackupIncludePinnedConversations"
                      >
                        {{ l('settings.export.includePinnedConversations') }}
                      </label>
                    </div>
                    <div class="form-check mb-1">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="autoBackupIncludePinnedEicons"
                        v-model="settings.autoBackupIncludePinnedEicons"
                      />
                      <label
                        class="form-check-label"
                        for="autoBackupIncludePinnedEicons"
                      >
                        {{ l('settings.export.includePinnedEicons') }}
                      </label>
                    </div>
                    <div class="form-check mb-1">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="autoBackupIncludeRecents"
                        v-model="settings.autoBackupIncludeRecents"
                      />
                      <label
                        class="form-check-label"
                        for="autoBackupIncludeRecents"
                      >
                        {{ l('settings.export.includeRecents') }}
                      </label>
                    </div>
                    <div class="form-check mb-2">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="autoBackupIncludeHidden"
                        v-model="settings.autoBackupIncludeHidden"
                      />
                      <label
                        class="form-check-label"
                        for="autoBackupIncludeHidden"
                      >
                        {{ l('settings.export.includeHidden') }}
                      </label>
                    </div>
                    <div class="mb-2">
                      <label class="form-label" for="autoBackupRetention">
                        Backups to keep
                      </label>
                      <input
                        class="form-control"
                        type="number"
                        id="autoBackupRetention"
                        v-model.number="settings.autoBackupRetention"
                        min="1"
                        max="50"
                        style="max-width: 120px"
                      />
                    </div>
                    <div class="mb-2">
                      <label class="form-label" for="autoBackupDirectory">
                        Custom backup directory (optional)
                      </label>
                      <div class="input-group">
                        <input
                          class="form-control"
                          type="text"
                          id="autoBackupDirectory"
                          v-model="settings.autoBackupDirectory"
                          :placeholder="defaultBackupDir"
                        />
                        <button
                          class="btn btn-outline-secondary"
                          type="button"
                          @click="chooseAutoBackupDir"
                        >
                          Browse
                        </button>
                        <button
                          v-if="settings.autoBackupDirectory"
                          class="btn btn-outline-secondary"
                          type="button"
                          @click="settings.autoBackupDirectory = ''"
                        >
                          Reset
                        </button>
                      </div>
                      <small class="form-text text-muted">
                        Default: {{ defaultBackupDir }}
                      </small>
                    </div>
                  </div>

                  <div v-if="settings.autoBackupEnabled" class="mt-3 mb-2">
                    <h6>Restore from Auto Backup</h6>
                    <p class="text-muted small">
                      Select an auto backup to restore. This loads it into the
                      import section below.
                    </p>
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <select
                        class="form-select"
                        style="max-width: 400px"
                        v-model="selectedAutoBackup"
                        :disabled="importInProgress"
                      >
                        <option :value="undefined" disabled>
                          {{
                            autoBackups.length === 0
                              ? 'No auto backups found'
                              : 'Choose a backup...'
                          }}
                        </option>
                        <option
                          v-for="backup in autoBackups"
                          :key="backup.path"
                          :value="backup.path"
                        >
                          {{ formatBackupLabel(backup) }}
                        </option>
                      </select>
                      <button
                        class="btn btn-outline-secondary btn-sm"
                        type="button"
                        :disabled="importInProgress"
                        @click="refreshAutoBackups"
                      >
                        <i class="fas fa-sync-alt"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div
                  v-show="selectedSection === 'export'"
                  class="settings-content"
                >
                  <h5>{{ l('settings.export.title') }}</h5>
                  <p class="text-muted">
                    {{ l('settings.export.description') }}
                  </p>
                  <div class="form-check mb-2">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="exportIncludeGeneralSettings"
                      v-model="exportIncludeGeneralSettings"
                    />
                    <label
                      class="form-check-label"
                      for="exportIncludeGeneralSettings"
                    >
                      {{ l('settings.export.includeGeneral') }}
                    </label>
                  </div>
                  <div class="form-check mb-2">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="exportIncludeCharacterSettings"
                      v-model="exportIncludeCharacterSettings"
                    />
                    <label
                      class="form-check-label"
                      for="exportIncludeCharacterSettings"
                    >
                      {{ l('settings.export.includeCharacterSettings') }}
                    </label>
                  </div>
                  <div class="form-check mb-2">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="exportIncludeLogs"
                      v-model="exportIncludeLogs"
                    />
                    <label class="form-check-label" for="exportIncludeLogs">
                      {{ l('settings.export.includeLogs') }}
                    </label>
                  </div>
                  <div class="form-check mb-2">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="exportIncludeDrafts"
                      v-model="exportIncludeDrafts"
                    />
                    <label class="form-check-label" for="exportIncludeDrafts">
                      {{ l('settings.export.includeDrafts') }}
                    </label>
                  </div>
                  <div class="form-check mb-2">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="exportIncludePinnedConversations"
                      v-model="exportIncludePinnedConversations"
                    />
                    <label
                      class="form-check-label"
                      for="exportIncludePinnedConversations"
                    >
                      {{ l('settings.export.includePinnedConversations') }}
                    </label>
                  </div>
                  <div class="form-check mb-2">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="exportIncludePinnedEicons"
                      v-model="exportIncludePinnedEicons"
                    />
                    <label
                      class="form-check-label"
                      for="exportIncludePinnedEicons"
                    >
                      {{ l('settings.export.includePinnedEicons') }}
                    </label>
                  </div>
                  <div class="form-check mb-2">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="exportIncludeRecents"
                      v-model="exportIncludeRecents"
                    />
                    <label class="form-check-label" for="exportIncludeRecents">
                      {{ l('settings.export.includeRecents') }}
                    </label>
                  </div>
                  <div class="form-check mb-3">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="exportIncludeHidden"
                      v-model="exportIncludeHidden"
                    />
                    <label class="form-check-label" for="exportIncludeHidden">
                      {{ l('settings.export.includeHidden') }}
                    </label>
                  </div>
                  <fieldset class="character-box mb-3">
                    <legend>{{ l('settings.import.charactersLegend') }}</legend>
                    <div class="d-flex flex-wrap gap-2 mb-3">
                      <button
                        class="btn btn-outline-secondary btn-sm"
                        type="button"
                        @click="toggleExportCharacters"
                      >
                        {{
                          allExportCharactersSelected
                            ? l('settings.import.deselectAll')
                            : l('action.selectAll')
                        }}
                      </button>
                    </div>
                    <div
                      class="overflow-auto d-flex flex-column gap-1 py-2"
                      style="max-height: 200px"
                    >
                      <label
                        class="form-check mb-0"
                        v-for="character in exportCharacters"
                        :key="`export-${character.name}`"
                      >
                        <input
                          class="form-check-input"
                          type="checkbox"
                          v-model="character.selected"
                        />
                        <span class="form-check-label">{{
                          character.name
                        }}</span>
                      </label>
                      <div
                        v-if="exportCharacters.length === 0"
                        class="text-muted"
                      >
                        {{ l('settings.export.noCharacters') }}
                      </div>
                    </div>
                  </fieldset>
                  <div class="mb-3">
                    <button
                      class="btn btn-primary"
                      type="button"
                      :disabled="!canRunExport || exportInProgress"
                      @click="runExport"
                    >
                      <span
                        v-if="exportInProgress"
                        class="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      {{
                        exportInProgress
                          ? l('settings.export.inProgress')
                          : l('settings.export.button')
                      }}
                    </button>
                    <div v-if="exportInProgress" class="mt-2">
                      <progress
                        :value="(exportProgress ?? 0) * 100"
                        max="100"
                        style="width: 100%; height: 8px"
                      ></progress>
                      <small class="form-text text-muted">
                        {{ Math.round((exportProgress ?? 0) * 100) }}%
                        <span v-if="exportTotal">
                          · {{ exportCount || 0 }}/{{ exportTotal }}
                        </span>
                        <span v-if="(exportProgress ?? 0) >= 0.98">
                          · {{ l('settings.export.zipping')
                          }}{{ exportAnimatedDots }}
                        </span>
                      </small>
                    </div>
                  </div>
                  <div v-if="exportSummary" class="alert alert-success">
                    {{ exportSummary }}
                  </div>
                  <div v-if="exportError" class="alert alert-danger">
                    {{ exportError }}
                  </div>
                </div>
                <div
                  v-show="selectedSection === 'import'"
                  class="settings-content"
                >
                  <h5>{{ l('settings.import.zip.title') }}</h5>
                  <p class="text-muted">
                    {{ l('settings.import.zip.description') }}
                  </p>
                  <div class="mb-3">
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      :disabled="importInProgress"
                      @click="chooseImportZip"
                    >
                      {{ l('settings.import.zip.choose') }}
                    </button>
                    <div class="form-text" v-if="importZipName">
                      {{ l('settings.import.zip.selected', importZipName) }}
                    </div>
                    <div class="form-text text-muted" v-else>
                      {{ l('settings.import.zip.noFile') }}
                    </div>
                  </div>
                  <div v-if="importZipError" class="alert alert-danger">
                    {{ importZipError }}
                  </div>
                  <div
                    v-if="
                      importZipName &&
                      !importZipError &&
                      importZipHasManifest &&
                      importZipManifest
                    "
                    class="alert alert-info small mb-3"
                  >
                    Horizon export v{{ importZipManifest.version }} &middot;
                    {{ importZipManifest.characters.length }} character(s)
                    &middot; {{ importZipManifest.expectedFiles }} file(s)
                    &middot; created
                    {{ new Date(importZipManifest.createdAt).toLocaleString() }}
                    &middot; Logs:
                    {{
                      importZipManifest.includes &&
                      importZipManifest.includes.jsonLogs
                        ? 'JSON'
                        : 'Binary'
                    }}
                  </div>
                  <div
                    v-if="
                      importZipName && !importZipError && !importZipHasManifest
                    "
                    class="alert alert-secondary small mb-3"
                  >
                    This export was created without a manifest. It may be from
                    an older version of Horizon. Import should still work
                    normally.
                  </div>
                  <div v-if="importZipName && !importZipError">
                    <div class="form-check mb-2">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="importIncludeGeneralSettings"
                        v-model="importIncludeGeneralSettings"
                        :disabled="!importGeneralAvailable"
                      />
                      <label
                        class="form-check-label"
                        for="importIncludeGeneralSettings"
                      >
                        {{ l('settings.import.zip.includeGeneral') }}
                      </label>
                      <small
                        v-if="!importGeneralAvailable"
                        class="form-text text-muted"
                      >
                        {{ l('settings.import.zip.generalUnavailable') }}
                      </small>
                    </div>
                    <div class="form-check mb-2">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="importIncludeCharacterSettings"
                        v-model="importIncludeCharacterSettings"
                        :disabled="!importCharacterSettingsAvailable"
                      />
                      <label
                        class="form-check-label"
                        for="importIncludeCharacterSettings"
                      >
                        {{ l('settings.import.zip.includeCharacterSettings') }}
                      </label>
                      <small
                        v-if="!importCharacterSettingsAvailable"
                        class="form-text text-muted"
                      >
                        {{
                          l('settings.import.zip.characterSettingsUnavailable')
                        }}
                      </small>
                    </div>
                    <div class="form-check mb-2">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="importIncludeLogs"
                        v-model="importIncludeLogs"
                        :disabled="!importLogsAvailable"
                      />
                      <label class="form-check-label" for="importIncludeLogs">
                        {{ l('settings.import.zip.includeLogs') }}
                      </label>
                      <small
                        v-if="!importLogsAvailable"
                        class="form-text text-muted"
                      >
                        {{ l('settings.import.zip.logsUnavailable') }}
                      </small>
                    </div>
                    <div class="form-check mb-2">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="importIncludeDrafts"
                        v-model="importIncludeDrafts"
                        :disabled="!importDraftsAvailable"
                      />
                      <label class="form-check-label" for="importIncludeDrafts">
                        {{ l('settings.import.zip.includeDrafts') }}
                      </label>
                      <small
                        v-if="!importDraftsAvailable"
                        class="form-text text-muted"
                      >
                        {{ l('settings.import.zip.draftsUnavailable') }}
                      </small>
                    </div>
                    <div class="form-check mb-2">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="importIncludePinnedConversations"
                        v-model="importIncludePinnedConversations"
                        :disabled="!importPinnedConversationsAvailable"
                      />
                      <label
                        class="form-check-label"
                        for="importIncludePinnedConversations"
                      >
                        {{
                          l('settings.import.zip.includePinnedConversations')
                        }}
                      </label>
                      <small
                        v-if="!importPinnedConversationsAvailable"
                        class="form-text text-muted"
                      >
                        {{ l('settings.import.zip.pinnedUnavailable') }}
                      </small>
                      <small
                        v-else-if="importIncludeCharacterSettings"
                        class="form-text text-muted"
                      >
                        {{
                          l('settings.import.zip.pinnedIncludedWithSettings')
                        }}
                      </small>
                    </div>
                    <div class="form-check mb-2">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="importIncludePinnedEicons"
                        v-model="importIncludePinnedEicons"
                        :disabled="!importPinnedEiconsAvailable"
                      />
                      <label
                        class="form-check-label"
                        for="importIncludePinnedEicons"
                      >
                        {{ l('settings.import.zip.includePinnedEicons') }}
                      </label>
                      <small
                        v-if="!importPinnedEiconsAvailable"
                        class="form-text text-muted"
                      >
                        {{ l('settings.import.zip.pinnedUnavailable') }}
                      </small>
                      <small
                        v-else-if="importIncludeCharacterSettings"
                        class="form-text text-muted"
                      >
                        {{
                          l('settings.import.zip.pinnedIncludedWithSettings')
                        }}
                      </small>
                    </div>
                    <div class="form-check mb-2">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="importIncludeRecents"
                        v-model="importIncludeRecents"
                        :disabled="
                          importIncludeCharacterSettings ||
                          !importRecentsAvailable
                        "
                      />
                      <label
                        class="form-check-label"
                        for="importIncludeRecents"
                      >
                        {{ l('settings.import.zip.includeRecents') }}
                      </label>
                      <small
                        v-if="!importRecentsAvailable"
                        class="form-text text-muted"
                      >
                        {{ l('settings.import.zip.recentsUnavailable') }}
                      </small>
                    </div>
                    <div class="form-check mb-2">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="importIncludeHidden"
                        v-model="importIncludeHidden"
                        :disabled="
                          importIncludeCharacterSettings ||
                          !importHiddenAvailable
                        "
                      />
                      <label class="form-check-label" for="importIncludeHidden">
                        {{ l('settings.import.zip.includeHidden') }}
                      </label>
                      <small
                        v-if="!importHiddenAvailable"
                        class="form-text text-muted"
                      >
                        {{ l('settings.import.zip.hiddenUnavailable') }}
                      </small>
                    </div>
                    <fieldset class="character-box mb-3">
                      <legend>
                        {{ l('settings.import.charactersLegend') }}
                      </legend>
                      <div class="d-flex flex-wrap gap-2 mb-3">
                        <button
                          class="btn btn-outline-secondary btn-sm"
                          type="button"
                          @click="toggleImportCharacters"
                        >
                          {{
                            allImportCharactersSelected
                              ? l('settings.import.deselectAll')
                              : l('action.selectAll')
                          }}
                        </button>
                      </div>
                      <div
                        class="overflow-auto d-flex flex-column gap-1 py-2"
                        style="max-height: 200px"
                      >
                        <label
                          class="form-check d-flex align-items-start gap-2 mb-2"
                          v-for="character in importCharacters"
                          :key="`import-${character.name}`"
                        >
                          <input
                            class="form-check-input mt-1"
                            type="checkbox"
                            v-model="character.selected"
                          />
                          <div
                            class="form-check-label d-flex flex-column gap-0 flex-grow-1 lh-sm"
                          >
                            <div class="fw-semibold">
                              {{ character.name }}
                            </div>
                            <div
                              class="text-muted small"
                              style="line-height: 1.2"
                            >
                              {{ describeImportCharacter(character) }}
                            </div>
                          </div>
                        </label>
                        <div
                          v-if="importCharacters.length === 0"
                          class="text-muted"
                        >
                          {{ l('settings.import.zip.noCharacters') }}
                        </div>
                      </div>
                    </fieldset>
                    <div class="form-check mb-3">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="importOverwrite"
                        v-model="importOverwrite"
                      />
                      <label class="form-check-label" for="importOverwrite">
                        {{ l('settings.import.zip.overwrite') }}
                      </label>
                    </div>
                    <div class="mb-3">
                      <div
                        v-if="anyCharactersConnected"
                        class="alert alert-warning"
                      >
                        {{
                          l('settings.import.lockedWhileConnected') ||
                          'Import is disabled while signed into a character.'
                        }}
                        <span v-if="connectedCharacters.length">
                          ({{ connectedCharacters.join(', ') }})
                        </span>
                      </div>
                      <button
                        class="btn btn-primary"
                        type="button"
                        :disabled="!canRunZipImport || importInProgress"
                        @click="runZipImport"
                      >
                        <span
                          v-if="importInProgress"
                          class="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>
                        {{
                          importInProgress
                            ? l('settings.import.inProgress')
                            : l('settings.import.zip.button')
                        }}
                      </button>
                    </div>
                    <div v-if="importSummary" class="alert alert-success">
                      {{ importSummary }}
                    </div>
                    <div v-if="importError" class="alert alert-danger">
                      {{ importError }}
                    </div>
                  </div>
                </div>
                <div
                  v-show="selectedSection === 'vanilla'"
                  class="settings-content"
                >
                  <h5>{{ l('settings.import.vanilla.title') }}</h5>
                  <div class="mb-3">
                    <label
                      class="form-label label-full"
                      for="vanillaImportBaseDir"
                    >
                      {{ l('settings.import.vanilla.customDirLabel') }}
                    </label>
                    <div class="input-group">
                      <input
                        class="form-control"
                        type="text"
                        id="vanillaImportBaseDir"
                        v-model="settings.vanillaCustomBaseDir"
                        @keyup.enter="
                          () =>
                            normalizeVanillaBaseDir(
                              settings.vanillaCustomBaseDir
                            )
                        "
                        @blur="
                          () =>
                            normalizeVanillaBaseDir(
                              settings.vanillaCustomBaseDir
                            )
                        "
                        :disabled="vanillaImportInProgress"
                      />
                      <button
                        class="btn btn-outline-secondary"
                        type="button"
                        :disabled="vanillaImportInProgress"
                        @click="chooseVanillaImportDir"
                      >
                        {{ l('settings.import.vanilla.customDirBrowse') }}
                      </button>
                      <button
                        v-if="settings.vanillaCustomBaseDir"
                        class="btn btn-outline-secondary"
                        type="button"
                        :disabled="vanillaImportInProgress"
                        @click="resetVanillaImportDir"
                      >
                        {{ l('settings.import.vanilla.customDirReset') }}
                      </button>
                    </div>
                    <small class="form-text text-muted">
                      {{ l('settings.import.vanilla.customDirHelp') }}
                    </small>
                  </div>
                  <div v-if="vanillaImportAvailable" class="mb-3">
                    <div class="alert alert-info" v-if="vanillaBaseDir">
                      {{
                        l('settings.import.vanilla.location', vanillaBaseDir)
                      }}
                    </div>
                    <div class="form-check mb-2">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="vanillaImportGeneral"
                        v-model="vanillaImportGeneral"
                        :disabled="!vanillaImportGeneralAvailable"
                      />
                      <label
                        class="form-check-label"
                        for="vanillaImportGeneral"
                      >
                        {{ l('settings.import.vanilla.includeGeneral') }}
                      </label>
                      <small
                        v-if="!vanillaImportGeneralAvailable"
                        class="form-text text-muted"
                      >
                        {{ l('settings.import.vanilla.generalUnavailable') }}
                      </small>
                    </div>
                    <div class="form-check mb-2">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="vanillaImportCharacterSettings"
                        v-model="vanillaImportCharacterSettings"
                      />
                      <label
                        class="form-check-label"
                        for="vanillaImportCharacterSettings"
                      >
                        {{
                          l('settings.import.vanilla.includeCharacterSettings')
                        }}
                      </label>
                    </div>
                    <div class="form-check mb-2">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="vanillaImportPinnedEicons"
                        v-model="vanillaImportPinnedEicons"
                      />
                      <label
                        class="form-check-label"
                        for="vanillaImportPinnedEicons"
                      >
                        {{ l('settings.import.vanilla.includePinnedEicons') }}
                      </label>
                      <small
                        v-if="vanillaImportCharacterSettings"
                        class="form-text text-muted"
                      >
                        {{
                          l(
                            'settings.import.vanilla.pinnedIncludedWithSettings'
                          )
                        }}
                      </small>
                    </div>
                    <div class="form-check mb-2">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="vanillaImportLogs"
                        v-model="vanillaImportLogs"
                      />
                      <label class="form-check-label" for="vanillaImportLogs">
                        {{ l('settings.import.vanilla.includeLogs') }}
                      </label>
                    </div>
                    <div class="form-check mb-3">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="vanillaImportOverwrite"
                        v-model="vanillaImportOverwrite"
                      />
                      <label
                        class="form-check-label"
                        for="vanillaImportOverwrite"
                      >
                        {{ l('settings.import.vanilla.overwrite') }}
                      </label>
                    </div>
                    <fieldset class="character-box mb-3">
                      <legend>
                        {{ l('settings.import.charactersLegend') }}
                      </legend>
                      <div class="d-flex flex-wrap gap-2 mb-3">
                        <button
                          class="btn btn-outline-secondary btn-sm"
                          type="button"
                          @click="toggleVanillaCharacters"
                        >
                          {{
                            allVanillaCharactersSelected
                              ? l('settings.import.deselectAll')
                              : l('action.selectAll')
                          }}
                        </button>
                      </div>
                      <div
                        class="overflow-auto d-flex flex-column gap-1 py-2"
                        style="max-height: 200px"
                      >
                        <label
                          class="form-check mb-0"
                          v-for="character in vanillaCharacters"
                          :key="`vanilla-${character.name}`"
                        >
                          <input
                            class="form-check-input"
                            type="checkbox"
                            v-model="character.selected"
                          />
                          <span class="form-check-label">{{
                            character.name
                          }}</span>
                        </label>
                        <div
                          v-if="vanillaCharacters.length === 0"
                          class="text-muted"
                        >
                          {{ l('settings.import.vanilla.noCharacters') }}
                        </div>
                      </div>
                    </fieldset>
                    <div class="mb-3">
                      <div
                        v-if="anyCharactersConnected"
                        class="alert alert-warning"
                      >
                        {{
                          l('settings.import.lockedWhileConnected') ||
                          'Import is disabled while signed into a character.'
                        }}
                        <span v-if="connectedCharacters.length">
                          ({{ connectedCharacters.join(', ') }})
                        </span>
                      </div>
                      <button
                        class="btn btn-primary"
                        type="button"
                        :disabled="
                          !canRunVanillaImport || vanillaImportInProgress
                        "
                        @click="runVanillaImport"
                      >
                        <span
                          v-if="vanillaImportInProgress"
                          class="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>
                        {{
                          vanillaImportInProgress
                            ? l('settings.import.inProgress')
                            : l('settings.import.vanilla.importButton')
                        }}
                      </button>
                    </div>
                    <div
                      v-if="vanillaImportSummary"
                      class="alert alert-success"
                    >
                      {{ vanillaImportSummary }}
                    </div>
                    <div v-if="vanillaImportError" class="alert alert-danger">
                      {{ vanillaImportError }}
                    </div>
                  </div>
                  <div v-else class="alert alert-secondary">
                    {{ l('settings.import.vanilla.notFound') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            class="modal-footer"
            style="padding: 0.5rem 0.75rem 1rem 0.75rem"
          >
            <button
              type="button"
              class="btn btn-secondary"
              @click.stop="close()"
            >
              {{ l('action.close') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Hook } from '@f-list/vue-ts';
  import * as remote from '@electron/remote';
  import Vue from 'vue';
  import l from '../chat/localize';
  import { GeneralSettings } from './common';
  import fs from 'fs';
  import path from 'path';
  import { ipcRenderer } from 'electron';
  import * as ImportExport from './services';
  import type { VanillaContext } from './services/importer/vanilla-importer';
  import type { BackupCharacterInfo } from './services/importer/backup-import';

  const browserWindow = remote.getCurrentWindow();

  @Component({})
  export default class ExporterWindow extends Vue {
    settings!: GeneralSettings;
    importHint:
      | 'auto'
      | 'vanilla'
      | 'vanilla-advanced'
      | 'slimcat'
      | undefined = undefined;
    l = l;
    osIsDark: boolean = remote.nativeTheme.shouldUseDarkColors;
    selectedSection: 'auto-backup' | 'export' | 'import' | 'vanilla' =
      'auto-backup';
    isMac = process.platform === 'darwin';
    platform = process.platform;

    vanillaContext?: VanillaContext;
    vanillaImportAvailable = false;
    vanillaBaseDir: string | undefined = undefined;
    vanillaCharacters: Array<{ name: string; selected: boolean }> = [];
    vanillaImportGeneral = true;
    vanillaImportGeneralAvailable = true;
    vanillaImportCharacterSettings = true;
    vanillaImportLogs = true;
    vanillaImportPinnedEicons = true;
    vanillaImportOverwrite = false;
    vanillaImportInProgress = false;
    vanillaImportSummary: string | undefined = undefined;
    vanillaImportError: string | undefined = undefined;
    showVanillaAutoPrompt = false;

    exportCharacters: Array<{ name: string; selected: boolean }> = [];
    exportIncludeGeneralSettings = true;
    exportIncludeCharacterSettings = true;
    exportIncludeLogs = true;
    exportIncludeDrafts = true;
    exportIncludePinnedConversations = true;
    exportIncludePinnedEicons = true;
    exportIncludeRecents = true;
    exportIncludeHidden = true;
    exportInProgress = false;
    exportProgress: number | undefined = undefined;
    exportCount: number | undefined = undefined;
    exportTotal: number | undefined = undefined;
    exportSummary: string | undefined = undefined;
    exportError: string | undefined = undefined;
    exportAnimatedDots = '';
    exportAnimationTimer: NodeJS.Timeout | undefined = undefined;

    importCharacters: BackupCharacterInfo[] = [];
    importIncludeGeneralSettings = false;
    importGeneralAvailable = false;
    importIncludeCharacterSettings = false;
    importCharacterSettingsAvailable = false;
    importIncludeLogs = false;
    importLogsAvailable = false;
    importIncludeDrafts = false;
    importDraftsAvailable = false;
    importIncludePinnedConversations = false;
    importPinnedConversationsAvailable = false;
    importIncludePinnedEicons = false;
    importPinnedEiconsAvailable = false;
    importIncludeRecents = false;
    importRecentsAvailable = false;
    importIncludeHidden = false;
    importHiddenAvailable = false;
    importOverwrite = false;
    importInProgress = false;
    importSummary: string | undefined = undefined;
    importError: string | undefined = undefined;
    importZipPath: string | undefined = undefined;
    importZipName: string | undefined = undefined;
    importZipError: string | undefined = undefined;
    private importZipArchive?: any;
    importZipHasManifest = false;
    importZipManifest: any = undefined;

    connectedCharacters: string[] = [];
    autoBackups: { name: string; path: string; mtime: number; size: number }[] =
      [];
    selectedAutoBackup: string | undefined = undefined;

    get defaultBackupDir(): string {
      return path.join(remote.app.getPath('userData'), 'backups');
    }

    async chooseAutoBackupDir(): Promise<void> {
      const result = await remote.dialog.showOpenDialog(browserWindow, {
        properties: ['openDirectory'],
        defaultPath: this.settings.autoBackupDirectory || this.defaultBackupDir
      });
      if (!result.canceled && result.filePaths.length > 0) {
        this.settings.autoBackupDirectory = result.filePaths[0];
      }
    }

    get anyCharactersConnected(): boolean {
      return (
        Array.isArray(this.connectedCharacters) &&
        this.connectedCharacters.length > 0
      );
    }

    get styling(): string {
      try {
        return `<style>${fs
          .readFileSync(
            path.join(__dirname, `themes/${this.getSyncedTheme()}.css`),
            'utf8'
          )
          .toString()}</style>`;
      } catch (e) {
        if (
          (<Error & { code: string }>e).code === 'ENOENT' &&
          this.settings.theme !== 'default'
        ) {
          this.settings.theme = 'default';
          return this.styling;
        }
        throw e;
      }
    }

    getSyncedTheme() {
      if (!this.settings.themeSync) return this.settings.theme;
      return this.osIsDark
        ? this.settings.themeSyncDark
        : this.settings.themeSyncLight;
    }

    get canRunVanillaImport(): boolean {
      if (!this.vanillaImportAvailable || this.vanillaImportInProgress)
        return false;
      if (this.anyCharactersConnected) return false;
      if (
        !this.vanillaImportGeneral &&
        !this.vanillaImportCharacterSettings &&
        !this.vanillaImportLogs &&
        !this.vanillaImportPinnedEicons
      )
        return false;
      if (
        (this.vanillaImportCharacterSettings ||
          this.vanillaImportLogs ||
          this.vanillaImportPinnedEicons) &&
        this.vanillaCharacters.length > 0 &&
        this.vanillaCharacters.every(character => !character.selected)
      )
        return false;
      return true;
    }

    get canRunExport(): boolean {
      if (this.exportInProgress) return false;
      if (
        !this.exportIncludeGeneralSettings &&
        !this.exportIncludeCharacterSettings &&
        !this.exportIncludeLogs &&
        !this.exportIncludeDrafts &&
        !this.exportIncludePinnedConversations &&
        !this.exportIncludePinnedEicons &&
        !this.exportIncludeRecents &&
        !this.exportIncludeHidden
      )
        return false;
      if (
        (this.exportIncludeCharacterSettings ||
          this.exportIncludeLogs ||
          this.exportIncludeDrafts ||
          this.exportIncludePinnedConversations ||
          this.exportIncludePinnedEicons ||
          this.exportIncludeRecents ||
          this.exportIncludeHidden) &&
        this.exportCharacters.length > 0 &&
        this.exportCharacters.every(character => !character.selected)
      )
        return false;
      return true;
    }

    get canRunZipImport(): boolean {
      if (!this.importZipArchive || this.importInProgress) return false;
      if (this.anyCharactersConnected) return false;

      const includeGeneral =
        this.importIncludeGeneralSettings && this.importGeneralAvailable;
      const includeAnyCharacterData =
        (this.importIncludeCharacterSettings &&
          this.importCharacterSettingsAvailable) ||
        (this.importIncludeLogs && this.importLogsAvailable) ||
        (this.importIncludeDrafts && this.importDraftsAvailable) ||
        (this.importIncludePinnedConversations &&
          this.importPinnedConversationsAvailable) ||
        (this.importIncludePinnedEicons && this.importPinnedEiconsAvailable) ||
        (this.importIncludeRecents && this.importRecentsAvailable) ||
        (this.importIncludeHidden && this.importHiddenAvailable);

      if (!includeGeneral && !includeAnyCharacterData) return false;
      if (!includeAnyCharacterData) return true;

      const selectedCharacters = this.importCharacters.filter(
        character => character.selected
      );
      if (selectedCharacters.length === 0) return false;

      return selectedCharacters.some(character => {
        if (
          this.importIncludeCharacterSettings &&
          this.importCharacterSettingsAvailable &&
          character.hasSettings
        )
          return true;
        if (
          this.importIncludeLogs &&
          this.importLogsAvailable &&
          character.hasLogs
        )
          return true;
        if (
          this.importIncludeDrafts &&
          this.importDraftsAvailable &&
          character.hasDrafts
        )
          return true;
        if (
          this.importIncludePinnedConversations &&
          this.importPinnedConversationsAvailable &&
          character.hasPinnedConversations
        )
          return true;
        if (
          this.importIncludePinnedEicons &&
          this.importPinnedEiconsAvailable &&
          character.hasPinnedEicons
        )
          return true;
        if (
          this.importIncludeRecents &&
          this.importRecentsAvailable &&
          character.hasRecents
        )
          return true;
        if (
          this.importIncludeHidden &&
          this.importHiddenAvailable &&
          character.hasHidden
        )
          return true;
        return false;
      });
    }

    get allExportCharactersSelected(): boolean {
      return (
        this.exportCharacters.length > 0 &&
        this.exportCharacters.every(character => character.selected)
      );
    }

    get allImportCharactersSelected(): boolean {
      return (
        this.importCharacters.length > 0 &&
        this.importCharacters.every(character => character.selected)
      );
    }

    get allVanillaCharactersSelected(): boolean {
      return (
        this.vanillaCharacters.length > 0 &&
        this.vanillaCharacters.every(character => character.selected)
      );
    }

    @Hook('mounted')
    async mounted(): Promise<void> {
      remote.nativeTheme.on('updated', () => {
        this.osIsDark = remote.nativeTheme.shouldUseDarkColors;
      });

      window.addEventListener('beforeunload', e => {
        if (this.exportInProgress || this.importInProgress) {
          e.preventDefault();
        }
      });

      window.addEventListener('keyup', e => {
        if (e.key === 'Escape') {
          this.close();
        }
      });
      if (process.platform === 'darwin') {
        window.addEventListener('keydown', e => {
          if (e.metaKey && e.key == 'w') {
            this.close();
          }
        });
      }

      this.$watch(
        () => this.settings.logDirectory,
        () => {
          this.refreshExportCharacters();
        }
      );
      this.$watch(
        () => [
          this.settings.autoBackupEnabled,
          this.settings.autoBackupIncludeGeneralSettings,
          this.settings.autoBackupIncludeCharacterSettings,
          this.settings.autoBackupIncludeLogs,
          this.settings.autoBackupIncludeDrafts,
          this.settings.autoBackupIncludePinnedConversations,
          this.settings.autoBackupIncludePinnedEicons,
          this.settings.autoBackupIncludeRecents,
          this.settings.autoBackupIncludeHidden,
          this.settings.autoBackupRetention,
          this.settings.autoBackupDirectory
        ],
        () => {
          ipcRenderer.send('general-settings-update', this.settings);
        }
      );
      this.$watch(
        () => this.importIncludeCharacterSettings,
        include => {
          if (!include) return;
          if (this.importPinnedConversationsAvailable)
            this.importIncludePinnedConversations = true;
          if (this.importPinnedEiconsAvailable)
            this.importIncludePinnedEicons = true;
        }
      );
      this.$watch(
        () => this.vanillaImportCharacterSettings,
        include => {
          if (include) this.vanillaImportPinnedEicons = true;
        }
      );

      this.$watch(
        () => this.selectedAutoBackup,
        async (backupPath: string | undefined) => {
          if (!backupPath) return;
          await ImportExport.loadImportZip(this, backupPath);
          this.selectedSection = 'import';
        }
      );

      if (this.settings.autoBackupEnabled) {
        this.refreshAutoBackups();
      }

      await this.initializeImportExport();

      try {
        const list: string[] = await ipcRenderer.invoke(
          'get-connected-characters'
        );
        this.connectedCharacters = Array.isArray(list) ? list : [];
      } catch {}
      ipcRenderer.on('connected-characters-updated', (_e, list: string[]) => {
        this.connectedCharacters = Array.isArray(list) ? list : [];
      });
    }

    async initializeImportExport(): Promise<void> {
      this.refreshExportCharacters();
      await ImportExport.initializeVanillaImport(this);
    }

    private refreshExportCharacters = () =>
      ImportExport.refreshExportCharacters(this);
    refreshVanillaContext = () => ImportExport.refreshVanillaContext(this);
    normalizeVanillaBaseDir = () => ImportExport.normalizeVanillaBaseDir(this);
    chooseVanillaImportDir = () => ImportExport.chooseVanillaImportDir(this);
    resetVanillaImportDir = () => ImportExport.resetVanillaImportDir(this);
    handleVanillaBaseDirInput = () =>
      ImportExport.handleVanillaBaseDirInput(this);
    setVanillaCharacters = (selected: boolean) =>
      ImportExport.setVanillaCharacters(this, selected);
    setExportCharacters = (selected: boolean) =>
      ImportExport.setExportCharacters(this, selected);
    setImportCharacters = (selected: boolean) =>
      ImportExport.setImportCharacters(this, selected);

    toggleVanillaCharacters(): void {
      this.setVanillaCharacters(!this.allVanillaCharactersSelected);
    }

    toggleExportCharacters(): void {
      this.setExportCharacters(!this.allExportCharactersSelected);
    }

    toggleImportCharacters(): void {
      this.setImportCharacters(!this.allImportCharactersSelected);
    }
    runVanillaImport = () => ImportExport.runVanillaImport(this);
    runExport = () => {
      this.startExportAnimation();
      ImportExport.runExport(this).finally(() => this.stopExportAnimation());
    };
    chooseImportZip = () => ImportExport.chooseImportZip(this);
    describeImportCharacter = (character: BackupCharacterInfo) =>
      ImportExport.describeImportCharacter(character);
    runZipImport = () => ImportExport.runZipImport(this);

    async refreshAutoBackups(): Promise<void> {
      try {
        this.autoBackups = await ipcRenderer.invoke('list-auto-backups');
      } catch {
        this.autoBackups = [];
      }
    }

    formatBackupLabel(backup: {
      name: string;
      mtime: number;
      size: number;
    }): string {
      const date = new Date(backup.mtime).toLocaleString();
      const mb = (backup.size / (1024 * 1024)).toFixed(1);
      return `${date} (${mb} MB)`;
    }

    startExportAnimation(): void {
      this.exportAnimatedDots = '';
      this.exportAnimationTimer = setInterval(() => {
        if (this.exportAnimatedDots === '...') {
          this.exportAnimatedDots = '';
        } else {
          this.exportAnimatedDots += '.';
        }
      }, 500);
    }

    stopExportAnimation(): void {
      if (this.exportAnimationTimer) {
        clearInterval(this.exportAnimationTimer);
        this.exportAnimationTimer = undefined;
      }
      this.exportAnimatedDots = '';
    }

    close(): void {
      if (this.exportInProgress || this.importInProgress) {
        const choice = remote.dialog.showMessageBoxSync(browserWindow, {
          type: 'warning',
          buttons: ['Cancel', 'Close anyway'],
          defaultId: 0,
          cancelId: 0,
          title: 'Operation in progress',
          message:
            'An export or import is still running. Closing now may result in incomplete or corrupted data.'
        });
        if (choice === 0) return;
      }
      browserWindow.close();
    }

    getThemeClass() {
      try {
        if (process.platform === 'win32') {
          if (this.settings?.risingDisableWindowsHighContrast) {
            document
              .querySelector('html')
              ?.classList.add('disableWindowsHighContrast');
          } else {
            document
              .querySelector('html')
              ?.classList.remove('disableWindowsHighContrast');
          }
        }

        return {
          ['platform-' + this.platform]: true,
          disableWindowsHighContrast:
            this.settings?.risingDisableWindowsHighContrast || false
        };
      } catch (err) {
        return {
          ['platform-' + this.platform]: true
        };
      }
    }
  }
</script>

<style lang="scss">
  .card-full .window-modal {
    position: relative;
    display: block;
  }
  .window-modal .modal-dialog {
    margin: 0px;
    max-width: 100%;
  }

  .modal-title {
    width: 100%;
  }

  .modal-body {
    height: 100%;
    display: flex;
    flex-flow: column;
  }

  .modal-body .modal-footer {
    height: 52px;
    min-height: 52px;
  }

  .modal-footer {
    padding-bottom: 1rem;
  }

  .data-manager-sidebar {
    width: 200px;
    min-width: 200px;
    border-right: 1px solid var(--bs-border-color);
    padding: 0.5rem 0;
  }

  .data-manager-sidebar .nav-link {
    color: var(--bs-body-color);
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    border-radius: 0;

    &:hover {
      background: var(--bs-tertiary-bg);
    }

    &.active {
      background: var(--bs-primary);
      color: #fff;
    }
  }

  .data-manager-content {
    flex: 1;
    overflow: auto;
    padding: 1rem 1.25rem;
  }

  .label-full {
    width: 100%;
  }

  .card-full {
    height: 100%;
    left: 0;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 100;
  }

  fieldset.character-box {
    border: 1px solid var(--bs-border-color, rgba(0, 0, 0, 0.175));
    border-radius: 0.5rem;
    padding: 0.75rem 1rem 1rem;
    margin: 0;
  }

  fieldset.character-box legend {
    width: auto;
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0 0.5rem;
    margin-bottom: 0.5rem;
  }

  .disableWindowsHighContrast,
  .disableWindowsHighContrast * {
    forced-color-adjust: none;
  }
</style>

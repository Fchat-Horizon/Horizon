/**
 * @license MPL-2.0
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * @copyright 2024-2026 Sylvia Roselie & Respective Horizon Contributors
 * @version 1.0
 * @see {@link https://github.com/Fchat-Horizon/Horizon|GitHub repo}
 */

import type { GeneralSettings } from '../common';
import type { ExportManifest } from './exporter/manifest';
import type { BackupCharacterInfo } from './importer/backup-import';
import type { VanillaContext } from './importer/vanilla-importer';

export interface ExporterCharacterEntry {
  name: string;
  selected: boolean;
}

export interface ExporterVm {
  settings: GeneralSettings;
  selectedSection:
    | 'auto-backup'
    | 'export'
    | 'import'
    | 'vanilla'
    | (string & {});
  importHint: 'auto' | 'vanilla' | 'advanced' | 'slimcat' | undefined;

  exportCharacters: ExporterCharacterEntry[];
  exportIncludeGeneralSettings: boolean;
  exportIncludeCharacterSettings: boolean;
  exportIncludeLogs: boolean;
  exportIncludeDrafts: boolean;
  exportIncludePinnedConversations: boolean;
  exportIncludePinnedEicons: boolean;
  exportIncludeRecents: boolean;
  exportIncludeHidden: boolean;
  exportInProgress: boolean;
  exportProgress: number | undefined;
  exportCount: number | undefined;
  exportTotal: number | undefined;
  exportSummary: string | undefined;
  exportError: string | undefined;
  readonly canRunExport: boolean;

  importInProgress: boolean;
  importZipArchive: unknown;
  importZipPath: string | undefined;
  importZipName: string | undefined;
  importZipError: string | undefined;
  importZipHasManifest: boolean;
  importZipManifest: ExportManifest | undefined;
  importCharacters: BackupCharacterInfo[];
  importGeneralAvailable: boolean;
  importCharacterSettingsAvailable: boolean;
  importLogsAvailable: boolean;
  importPinnedConversationsAvailable: boolean;
  importPinnedEiconsAvailable: boolean;
  importRecentsAvailable: boolean;
  importHiddenAvailable: boolean;
  importDraftsAvailable: boolean;
  importIncludeGeneralSettings: boolean;
  importIncludeCharacterSettings: boolean;
  importIncludeLogs: boolean;
  importIncludePinnedConversations: boolean;
  importIncludePinnedEicons: boolean;
  importIncludeRecents: boolean;
  importIncludeHidden: boolean;
  importIncludeDrafts: boolean;
  importOverwrite: boolean;
  importCustomLogDirectory: string | undefined;
  importUseCustomLogLocation: boolean;
  importCustomLogLocationError: string | undefined;
  importSummary: string | undefined;
  importError: string | undefined;
  readonly canRunZipImport: boolean;

  vanillaContext: VanillaContext | undefined;
  vanillaCharacters: ExporterCharacterEntry[];
  vanillaBaseDir: string | undefined;
  vanillaImportAvailable: boolean;
  vanillaImportInProgress: boolean;
  vanillaImportGeneral: boolean;
  vanillaImportGeneralAvailable: boolean;
  vanillaImportCharacterSettings: boolean;
  vanillaImportLogs: boolean;
  vanillaImportPinnedEicons: boolean;
  vanillaImportOverwrite: boolean;
  vanillaImportSummary: string | undefined;
  vanillaImportError: string | undefined;
  showVanillaAutoPrompt: boolean;
  readonly canRunVanillaImport: boolean;

  $nextTick(): Promise<unknown>;
}

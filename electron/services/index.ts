/**
 * @license MPL-2.0
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * @copyright 2024-2026 Sylvia Roselie & Respective Horizon Contributors
 * @version 1.0
 * @see {@link https://github.com/Fchat-Horizon/Horizon|GitHub repo}
 *
 * Horizon Electron Services Module
 *
 * Aggregates and re-exports import/export services for Horizon's Electron backend,
 * including vanilla importers, SlimCat importers, backup import/export, and related types.
 */

export * from './importer/startup-import';
export * as VanillaImporter from './importer/vanilla-importer';
export * from './importer/vanilla-import-ui';
export * from './exporter/backup-export';
export * from './importer/backup-import';
export * as SlimcatImporter from './importer/importer';

export type {
  VanillaContext,
  ImportType,
  CharacterImportOptions,
  ImportSummary
} from './importer/vanilla-importer';

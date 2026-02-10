/**
 * Horizon Electron Services Module
 *
 * Aggregates and re-exports import/export services for Horizon's Electron backend,
 * including vanilla importers, SlimCat importers, backup import/export, and related types.
 */

export * from './importer/startup-import';
export * as VanillaImporter from './importer/vanilla-importer';
export * from './importer/vanilla-import-ui';
export * from './exporter/backup-export';
export type { ExportManifest } from './exporter/manifest';
export * from './importer/backup-import';
export * as SlimcatImporter from './importer/importer';

export type {
  VanillaContext,
  ImportType,
  CharacterImportOptions,
  ImportSummary
} from './importer/vanilla-importer';

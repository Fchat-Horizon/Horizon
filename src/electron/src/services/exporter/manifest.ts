export interface ExportManifest {
  version: number;
  createdAt: string;
  app: 'horizon';
  expectedFiles: number;
  characters: string[];
  includes: {
    generalSettings: boolean;
    logs: boolean;
    drafts: boolean;
    characterSettings: boolean;
    pinned: boolean;
    eicons: boolean;
    recents: boolean;
    hidden: boolean;
    jsonLogs?: boolean;
  };
  logDirectory?: string;
}

export function createManifest(
  characters: string[],
  includes: ExportManifest['includes'],
  expectedFiles: number,
  logDirectory?: string
): ExportManifest {
  const manifest: ExportManifest = {
    version: 2,
    createdAt: new Date().toISOString(),
    app: 'horizon',
    expectedFiles,
    characters,
    includes
  };
  if (logDirectory) {
    manifest.logDirectory = logDirectory;
  }
  return manifest;
}

export function isValidManifest(data: unknown): data is ExportManifest {
  if (!data || typeof data !== 'object') return false;
  const m = data as any;
  return (
    typeof m.version === 'number' &&
    typeof m.createdAt === 'string' &&
    m.app === 'horizon' &&
    typeof m.expectedFiles === 'number' &&
    Array.isArray(m.characters) &&
    typeof m.includes === 'object' &&
    m.includes !== null
  );
}

/**
 * ^ Special files each have a dedicated checkbox and are gated independently:
 * `characterSettings` governs only the generic config, not the special groups.
 */
export interface SettingsSelection {
  /** Generic character config — everything that isn't a special file below. */
  includeCharacterSettings: boolean;
  /** `pinned` */
  includePinnedConversations: boolean;
  /** `favoriteEIcons` */
  includePinnedEicons: boolean;
  /** `recent`, `recentChannels` */
  includeRecents: boolean;
  /** `hiddenUsers` */
  includeHidden: boolean;
}

/**
 * Special files are gated by their own flag; anything else counts as generic
 * character config.
 *
 * @param relPath - Path of the file within the character's settings dir (posix).
 * @param sel - The user's per-category selection.
 */
export function shouldIncludeSettingsFile(
  relPath: string,
  sel: SettingsSelection
): boolean {
  switch (relPath) {
    case 'pinned':
      return sel.includePinnedConversations;
    case 'favoriteEIcons':
      return sel.includePinnedEicons;
    case 'recent':
    case 'recentChannels':
      return sel.includeRecents;
    case 'hiddenUsers':
      return sel.includeHidden;
    default:
      return sel.includeCharacterSettings;
  }
}

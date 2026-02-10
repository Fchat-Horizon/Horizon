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
}

export function createManifest(
  characters: string[],
  includes: ExportManifest['includes'],
  expectedFiles: number
): ExportManifest {
  return {
    version: 2,
    createdAt: new Date().toISOString(),
    app: 'horizon',
    expectedFiles,
    characters,
    includes
  };
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

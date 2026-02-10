import * as remote from '@electron/remote';
import fs from 'fs';
import path from 'path';
import log from 'electron-log';
import archiver from 'archiver';
import AdmZip from 'adm-zip';
import { createManifest, isValidManifest } from './manifest';
import type { ExportManifest } from './manifest';
import { binaryLogToJson } from './backup-export-cli';

async function yieldToUi(vm?: any): Promise<void> {
  try {
    if (vm && typeof vm.$nextTick === 'function') {
      await vm.$nextTick();
    }
    if (typeof (globalThis as any).requestAnimationFrame === 'function') {
      await new Promise<void>(resolve =>
        (globalThis as any).requestAnimationFrame(() => resolve())
      );
    } else {
      await new Promise<void>(resolve => setTimeout(resolve, 16));
    }
  } catch {
    // best-effort
  }
}

/**
 * Refreshes the list of available characters for export from the data directory.
 * Skips special folders like 'settings', 'eicons', and hidden directories.
 *
 * @param vm - Vue component instance containing settings and exportCharacters array
 */
export function refreshExportCharacters(vm: any): void {
  const characters: Array<{ name: string; selected: boolean }> = [];
  try {
    const dataDir = vm.settings.logDirectory;
    if (!dataDir || !fs.existsSync(dataDir)) {
      vm.exportCharacters = [];
      return;
    }
    for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'settings' || entry.name === 'eicons') continue;
      if (entry.name.startsWith('.')) continue;
      characters.push({ name: entry.name, selected: true });
    }
    characters.sort((a, b) => a.name.localeCompare(b.name));
    vm.exportCharacters = characters;
  } catch (error) {
    log.warn('settings.export.refresh.error', error);
    vm.exportCharacters = [];
  }
}

/**
 * Sets the selection state for all export characters.
 *
 * @param vm - Vue component instance containing exportCharacters array
 * @param selected - Whether to select (true) or deselect (false) all characters
 */
export function setExportCharacters(vm: any, selected: boolean): void {
  vm.exportCharacters.forEach((character: any) => {
    character.selected = selected;
  });
}

/**
 * Gets an array of character names that are currently selected for export.
 *
 * @param vm - Vue component instance containing exportCharacters array
 * @returns Array of character names where selected is true
 */
export function getSelectedExportCharacters(vm: any): string[] {
  return vm.exportCharacters
    .filter((c: any) => c.selected)
    .map((c: any) => c.name);
}

/**
 * Generates the default export file path with timestamp.
 * Filename format: `horizon-export-YYYY-MM-DDTHH-MM-SS.zip` (colons replaced with hyphens for Windows).
 *
 * @returns Absolute path to a timestamped ZIP file in the user's Downloads folder
 */
export function getExportDefaultPath(): string {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  return path.join(
    remote.app.getPath('downloads'),
    `horizon-export-${timestamp}.zip`
  );
}

function listFilesRecursive(rootDir: string): string[] {
  const results: string[] = [];
  const stack: string[] = [rootDir];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries: string[] = [];
    try {
      entries = fs.readdirSync(dir).map(n => path.join(dir, n));
    } catch {
      continue;
    }
    for (const abs of entries) {
      try {
        const stat = fs.statSync(abs);
        if (stat.isDirectory()) stack.push(abs);
        else if (stat.isFile()) results.push(abs);
      } catch {}
    }
  }
  return results;
}

type ExportEntry = { abs: string; zip: string; isLog?: boolean };

function buildExportEntries(
  dataDir: string,
  selectedCharacters: string[],
  vm: any
): ExportEntry[] {
  const entries: ExportEntry[] = [];

  if (vm.exportIncludeGeneralSettings) {
    const generalSettingsFile = path.join(dataDir, 'settings');
    if (fs.existsSync(generalSettingsFile))
      entries.push({ abs: generalSettingsFile, zip: 'settings' });
  }

  for (const character of selectedCharacters) {
    const characterDir = path.join(dataDir, character);
    if (!fs.existsSync(characterDir)) continue;

    if (vm.exportIncludeLogs) {
      const logsDir = path.join(characterDir, 'logs');
      if (fs.existsSync(logsDir)) {
        const files = listFilesRecursive(logsDir);
        for (const abs of files) {
          if (abs.endsWith('.idx')) continue;
          const rel = path.relative(logsDir, abs).replace(/\\/g, '/');
          const zip = path.posix.join(
            'characters',
            character,
            'logs',
            rel + '.json'
          );
          entries.push({ abs, zip, isLog: true });
        }
      }
    }

    if (vm.exportIncludeDrafts) {
      const draftsFile = path.join(characterDir, 'drafts.txt');
      if (fs.existsSync(draftsFile))
        entries.push({
          abs: draftsFile,
          zip: path.posix.join('characters', character, 'drafts.txt')
        });
    }

    const settingsDir = path.join(characterDir, 'settings');
    if (fs.existsSync(settingsDir)) {
      if (vm.exportIncludeCharacterSettings) {
        const files = listFilesRecursive(settingsDir);
        for (const abs of files) {
          const rel = path.relative(settingsDir, abs).replace(/\\/g, '/');
          const zip = path.posix.join('characters', character, 'settings', rel);
          entries.push({ abs, zip });
        }
      } else {
        const includeFiles = getSettingsFilesToInclude(vm);
        for (const file of Array.from(includeFiles)) {
          const filePath = path.join(settingsDir, file);
          if (fs.existsSync(filePath)) {
            const zip = path.posix.join(
              'characters',
              character,
              'settings',
              file
            );
            entries.push({ abs: filePath, zip });
          }
        }
      }
    }
  }

  return entries;
}

function getSettingsFilesToInclude(vm: any): Set<string> {
  const includeFiles = new Set<string>();
  if (vm.exportIncludePinnedConversations) includeFiles.add('pinned');
  if (vm.exportIncludePinnedEicons) includeFiles.add('favoriteEIcons');
  if (vm.exportIncludeRecents) {
    includeFiles.add('recent');
    includeFiles.add('recentChannels');
  }
  if (vm.exportIncludeHidden) includeFiles.add('hiddenUsers');
  return includeFiles;
}

/**
 * Executes the full export process with user-selected output location and progress tracking.
 *
 * @param vm - Vue component instance with export state and settings
 * @returns A promise that resolves when export completes or is cancelled
 */
function buildManifestIncludes(vm: any): ExportManifest['includes'] {
  return {
    generalSettings: !!vm.exportIncludeGeneralSettings,
    logs: !!vm.exportIncludeLogs,
    drafts: !!vm.exportIncludeDrafts,
    characterSettings: !!vm.exportIncludeCharacterSettings,
    pinned: !!vm.exportIncludePinnedConversations,
    eicons: !!vm.exportIncludePinnedEicons,
    recents: !!vm.exportIncludeRecents,
    hidden: !!vm.exportIncludeHidden,
    jsonLogs: vm.exportIncludeLogs ? true : undefined
  };
}

function verifyExportZip(
  filePath: string,
  manifest: ExportManifest
): string | undefined {
  try {
    const zip = new AdmZip(filePath);
    const manifestEntry = zip.getEntry('manifest.json');
    if (!manifestEntry)
      return 'Verification failed: manifest.json missing from ZIP.';

    let parsed: unknown;
    try {
      parsed = JSON.parse(manifestEntry.getData().toString('utf8'));
    } catch {
      return 'Verification failed: manifest.json is not valid JSON.';
    }

    if (!isValidManifest(parsed))
      return 'Verification failed: manifest.json has invalid format.';

    const entries = zip.getEntries().filter(e => !e.isDirectory);
    const expected = manifest.expectedFiles + 1; // +1 for manifest itself
    if (Math.abs(entries.length - expected) > 1)
      return `Verification failed: expected ~${expected} files but ZIP contains ${entries.length}.`;

    const zipPaths = new Set(entries.map(e => e.entryName.replace(/\\/g, '/')));
    for (const char of manifest.characters) {
      const hasEntry = Array.from(zipPaths).some(p =>
        p.startsWith(`characters/${char}/`)
      );
      if (!hasEntry)
        return `Verification failed: no files found for character "${char}".`;
    }

    return undefined;
  } catch (err) {
    return `Verification failed: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export async function runExport(vm: any): Promise<void> {
  if (!vm.canRunExport) return;
  vm.exportInProgress = true;
  vm.exportSummary = undefined;
  vm.exportError = undefined;
  vm.exportProgress = 0;
  vm.exportCount = 0;
  vm.exportTotal = 0;

  let outputPath: string | undefined;

  try {
    const saveResult = await remote.dialog.showSaveDialog({
      title: 'Save Horizon Export', // TODO: localize
      defaultPath: getExportDefaultPath(),
      filters: [{ name: 'ZIP archives', extensions: ['zip'] }]
    });

    if (saveResult.canceled || !saveResult.filePath) {
      vm.exportInProgress = false;
      vm.exportProgress = undefined;
      return;
    }

    outputPath = saveResult.filePath;

    const dataDir = vm.settings.logDirectory;
    if (!dataDir || !fs.existsSync(dataDir))
      throw new Error('Log directory not found');

    const selectedCharacters = getSelectedExportCharacters(vm);
    const entries = buildExportEntries(dataDir, selectedCharacters, vm);
    const total = entries.length || 1;
    vm.exportTotal = entries.length;
    vm.exportCount = 0;

    const archive = archiver('zip', {
      zlib: { level: 6 }
    });

    const output = fs.createWriteStream(outputPath);
    let streamErrored = false;

    output.on('error', () => {
      streamErrored = true;
    });

    archive.pipe(output);

    // Write manifest as first entry
    const manifest = createManifest(
      selectedCharacters,
      buildManifestIncludes(vm),
      entries.length
    );
    archive.append(JSON.stringify(manifest, null, 2), {
      name: 'manifest.json'
    });

    archive.on('progress', progressData => {
      const processed = progressData.entries.processed || 0;
      vm.exportCount = Math.max(0, processed - 1); // -1 for manifest
      vm.exportProgress = Math.max(0, Math.min(0.98, processed / (total + 1)));
    });

    let count = 0;
    const failedFiles: string[] = [];
    for (const e of entries) {
      try {
        if (fs.existsSync(e.abs)) {
          if (e.isLog) {
            const buf = fs.readFileSync(e.abs);
            const json = binaryLogToJson(buf);
            archive.append(JSON.stringify(json), { name: e.zip });
          } else {
            archive.file(e.abs, { name: e.zip });
          }
          count++;
          if (count % 10 === 0) {
            await yieldToUi(vm);
          }
        }
      } catch (err) {
        failedFiles.push(e.zip);
        log.warn('export.file.error', e.zip, err);
      }
    }

    if (streamErrored) {
      throw new Error('Output stream error during export.');
    }

    vm.exportProgress = 0.99;
    await archive.finalize();

    await new Promise<void>((resolve, reject) => {
      output.on('close', () => {
        vm.exportProgress = 1;
        const bytes = archive.pointer();
        log.info('export.complete', outputPath, `${bytes} bytes`);
        resolve();
      });
      output.on('error', reject);
      archive.on('error', reject);
    });

    if (archive.pointer() === 0) {
      throw new Error('Export produced an empty ZIP file.');
    }

    // Verify the written ZIP
    const verifyError = verifyExportZip(outputPath, manifest);
    if (verifyError) {
      log.error('export.verify.failed', verifyError);
      vm.exportError = verifyError;
      return;
    }

    let summary = `Exported ${count} file(s) for ${selectedCharacters.length} character(s) to ${outputPath}`;
    if (failedFiles.length > 0) {
      summary += ` (${failedFiles.length} file(s) skipped due to errors)`;
    }
    vm.exportSummary = summary;
  } catch (error) {
    log.error('settings.export.error', error);
    vm.exportError = `Export failed: ${error instanceof Error ? error.message : 'Please check the logs for details.'}`;

    // Clean up partial ZIP on failure
    if (outputPath) {
      try {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch {}
    }
  } finally {
    vm.exportInProgress = false;
    vm.exportProgress = undefined;
    vm.exportCount = undefined;
    vm.exportTotal = undefined;
  }
}

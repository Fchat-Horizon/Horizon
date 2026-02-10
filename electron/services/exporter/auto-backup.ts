import fs from 'fs';
import path from 'path';
import * as electron from 'electron';
import log from 'electron-log';
import { runExportCli } from './backup-export-cli';
import type { GeneralSettings } from '../../common';

function formatTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `T${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
  );
}

function broadcast(channel: string, ...args: any[]): void {
  for (const w of electron.webContents.getAllWebContents()) {
    try {
      w.send(channel, ...args);
    } catch {}
  }
}

function cleanupOldBackups(dir: string, retention: number): void {
  try {
    const files = fs
      .readdirSync(dir)
      .filter(f => /^auto-backup-.*\.zip$/.test(f))
      .map(f => ({
        name: f,
        mtime: fs.statSync(path.join(dir, f)).mtimeMs
      }))
      .sort((a, b) => b.mtime - a.mtime);

    for (const file of files.slice(retention)) {
      try {
        fs.unlinkSync(path.join(dir, file.name));
        log.info('auto-backup.cleanup.deleted', file.name);
      } catch (err) {
        log.warn('auto-backup.cleanup.delete-failed', file.name, err);
      }
    }
  } catch (err) {
    log.warn('auto-backup.cleanup.failed', err);
  }
}

export async function performAutoBackup(
  settings: GeneralSettings,
  baseDir: string
): Promise<void> {
  const backupDir =
    settings.autoBackupDirectory || path.join(baseDir, 'backups');
  const outPath = path.join(backupDir, `auto-backup-${formatTimestamp()}.zip`);

  log.info('auto-backup.start', outPath);
  broadcast('auto-backup-status', 'started');

  try {
    await runExportCli({
      dataDir: settings.logDirectory,
      out: outPath,
      includeGeneral: settings.autoBackupIncludeGeneralSettings,
      includeCharacterSettings: settings.autoBackupIncludeCharacterSettings,
      includeLogs: settings.autoBackupIncludeLogs,
      includeDrafts: settings.autoBackupIncludeDrafts,
      includePinnedConversations: settings.autoBackupIncludePinnedConversations,
      includePinnedEicons: settings.autoBackupIncludePinnedEicons,
      includeRecents: settings.autoBackupIncludeRecents,
      includeHidden: settings.autoBackupIncludeHidden,
      onProgress: (fraction: number) => {
        broadcast('auto-backup-status', 'progress', fraction);
      }
    });

    log.info('auto-backup.success', outPath);
    broadcast('auto-backup-status', 'success');

    const retention = Math.max(1, Math.min(50, settings.autoBackupRetention));
    cleanupOldBackups(backupDir, retention);
  } catch (err) {
    log.error('auto-backup.failed', err);
    broadcast('auto-backup-status', 'error');
  }
}

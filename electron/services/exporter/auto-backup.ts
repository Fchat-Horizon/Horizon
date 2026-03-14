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

function msUntilTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}

export class AutoBackupScheduler {
  private intervalTimer?: NodeJS.Timeout;
  private cronTimers: NodeJS.Timeout[] = [];
  private launchTimer?: NodeJS.Timeout;
  private running = false;
  private backupInProgress = false;

  constructor(
    private settings: GeneralSettings,
    private baseDir: string
  ) {}

  private hasTrigger(t: string): boolean {
    const triggers = this.settings.autoBackupTriggers;
    return Array.isArray(triggers) && triggers.includes(t);
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    if (this.hasTrigger('launch')) {
      this.launchTimer = setTimeout(() => this.runOnce(), 30000);
    }

    if (this.hasTrigger('interval')) {
      const hours = Math.max(0.5, this.settings.autoBackupIntervalHours || 6);
      const ms = hours * 60 * 60 * 1000;
      this.intervalTimer = setInterval(() => this.runOnce(), ms);
    }

    if (this.hasTrigger('cron')) {
      const times = this.settings.autoBackupCronTimes || [];
      for (const time of times) {
        if (!/^\d{2}:\d{2}$/.test(time)) continue;
        this.scheduleCron(time);
      }
    }
  }

  private scheduleCron(time: string): void {
    const ms = msUntilTime(time);
    const timer = setTimeout(() => {
      this.runOnce();
      const idx = this.cronTimers.indexOf(timer);
      if (idx !== -1) this.cronTimers.splice(idx, 1);
      if (this.running) this.scheduleCron(time);
    }, ms);
    this.cronTimers.push(timer);
  }

  stop(): void {
    this.running = false;
    if (this.launchTimer) {
      clearTimeout(this.launchTimer);
      this.launchTimer = undefined;
    }
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = undefined;
    }
    for (const t of this.cronTimers) clearTimeout(t);
    this.cronTimers = [];
  }

  reload(): void {
    this.stop();
    if (this.settings.autoBackupEnabled) {
      this.start();
    }
  }

  async runOnce(): Promise<void> {
    if (this.backupInProgress) return;
    this.backupInProgress = true;
    try {
      await performAutoBackup(this.settings, this.baseDir);
    } finally {
      this.backupInProgress = false;
    }
  }

  async runOnClose(): Promise<void> {
    if (!this.hasTrigger('close')) return;
    await this.runOnce();
  }

  async runOnConnect(): Promise<void> {
    if (!this.hasTrigger('connect')) return;
    await this.runOnce();
  }
}

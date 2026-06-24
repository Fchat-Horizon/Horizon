/**
 * @module logging
 * Wires @horizon/shared's logger to electron-log on the host: the shared logger
 * owns the console, electron-log is only the file sink (its console transport is
 * off to avoid double-printing). Renderer records reach main over IPC.
 */

import type { LogAdapter, LevelOption } from '@horizon/shared/logger';
import {
  combineAdapters,
  detectLogAdapter,
  levelOptionToLogLevel,
  setGlobalLogLevel,
  setHumanReadableLogs,
  setLogAdapter
} from '@horizon/shared/logger';

type LogMethod = (...args: unknown[]) => void;
interface TransportLike {
  level: unknown;
  maxSize?: unknown;
}

/** Minimal structural view of electron-log's main/renderer loggers. */
interface ElectronLogLike {
  error: LogMethod;
  warn: LogMethod;
  info: LogMethod;
  verbose: LogMethod;
  debug: LogMethod;
  silly: LogMethod;
  transports: {
    console?: TransportLike | null;
    file?: TransportLike | null;
    ipc?: TransportLike | null;
  };
}

class ElectronFileAdapter implements LogAdapter {
  constructor(private readonly backend: ElectronLogLike) {}

  log(
    _timestamp: string,
    levelName: string,
    name: string,
    _color: string,
    args: unknown[],
    key?: string
  ): void {
    // File sink: keep the key as plain text (no color codes) so it stays greppable.
    const line: unknown[] =
      key !== undefined ? [`[${name}]`, key, ...args] : [`[${name}]`, ...args];
    switch (levelName) {
      case 'ERROR':
        return this.backend.error(...line);
      case 'WARN':
        return this.backend.warn(...line);
      case 'VERBOSE':
        return this.backend.verbose(...line);
      case 'DEBUG':
        return this.backend.debug(...line);
      case 'SILLY':
        return this.backend.silly(...line);
      default:
        return this.backend.info(...line);
    }
  }
}

let installed = false;

/** Add electron-log as a file sink for shared logging. Call once at startup. */
export function installElectronLogging(electronLog: ElectronLogLike): void {
  // Idempotent: a repeat call would nest the combined adapter and double-write.
  if (installed) return;
  installed = true;
  const t = electronLog.transports;

  if (t.console) t.console.level = false;
  if (t.file) {
    // Main: write the file; the shared logger gates the level.
    t.file.level = 'silly';
    t.file.maxSize = 5 * 1024 * 1024;
    if (t.ipc) t.ipc.level = false;
  } else if (t.ipc) {
    // Renderer: forward to main, which writes the file.
    t.ipc.level = 'silly';
  }

  setLogAdapter(
    combineAdapters(detectLogAdapter(), new ElectronFileAdapter(electronLog))
  );
}

export function applySharedLogLevel(level: LevelOption): void {
  setGlobalLogLevel(levelOptionToLogLevel(level));
}

export function applyHumanReadableLogs(on: boolean): void {
  setHumanReadableLogs(on);
}

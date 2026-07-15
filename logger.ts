/**
 * @module logger
 * Platform-neutral named logger: shared/ runs on every target, so this imports
 * no electron-log or Node built-ins. It prints through an auto-detected console
 * adapter; a host may add sinks (e.g. an electron-log file writer) at startup.
 */

import { logMessages } from './logger-messages';

export enum LogLevel {
  Error = 0,
  Warn = 1,
  Info = 2,
  Verbose = 3,
  Debug = 4,
  Silly = 5
}

// & Mirrors electron-log's LevelOption: a level name, or false to silence.
export type LevelOption =
  | 'error'
  | 'warn'
  | 'info'
  | 'debug'
  | 'verbose'
  | 'silly'
  | false;

/** A logging sink: browser console, terminal, a file writer, ... */
export interface LogAdapter {
  log(
    timestamp: string,
    levelName: string,
    name: string,
    color: string,
    args: unknown[],
    // The dotted key, when the call had one. Rendered as a discreet, still
    // selectable tag so the human sentence (now in args) reads as the message.
    key?: string
  ): void;
}

const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.Error]: 'ERROR',
  [LogLevel.Warn]: 'WARN',
  [LogLevel.Info]: 'INFO',
  [LogLevel.Verbose]: 'VERBOSE',
  [LogLevel.Debug]: 'DEBUG',
  [LogLevel.Silly]: 'SILLY'
};

const LOG_LEVEL_STYLES: Record<string, string> = {
  ERROR: 'color: #ff3b30; font-weight: bold',
  WARN: 'color: #fce0a5; font-weight: bold',
  INFO: 'color: #91ebaf; font-weight: bold',
  DEBUG: 'color: #0a84ff; font-weight: bold',
  VERBOSE: 'color: #bd93f9; font-weight: bold',
  SILLY: 'color: #6272a4; font-weight: bold'
};

const ANSI_BY_LEVEL: Record<string, string> = {
  ERROR: '\x1b[31m',
  WARN: '\x1b[33m',
  INFO: '\x1b[32m',
  DEBUG: '\x1b[36m',
  VERBOSE: '\x1b[35m',
  SILLY: '\x1b[90m'
};

// needs to match the old electron-log default.
let globalLogLevel: LogLevel = LogLevel.Silly;

export function setGlobalLogLevel(level: LogLevel): void {
  globalLogLevel = level;
}

export function getGlobalLogLevel(): LogLevel {
  return globalLogLevel;
}

// On by default: a keyed log prints its dotted key (`api.query.start`) followed
// by the catalog sentence, keeping the key grep-stable. Turning it off in
// settings drops the sentence and leaves the bare key.
let humanReadable = true;

export function setHumanReadableLogs(on: boolean): void {
  humanReadable = on;
}

export function getHumanReadableLogs(): boolean {
  return humanReadable;
}

/** `false` maps below every level, silencing all output. */
export function levelOptionToLogLevel(level: LevelOption): LogLevel {
  switch (level) {
    case false:
      return -1 as LogLevel;
    case 'error':
      return LogLevel.Error;
    case 'warn':
      return LogLevel.Warn;
    case 'info':
      return LogLevel.Info;
    case 'debug':
      return LogLevel.Debug;
    case 'verbose':
      return LogLevel.Verbose;
    case 'silly':
      return LogLevel.Silly;
    default:
      return LogLevel.Info;
  }
}

// Width of the longest level label with brackets and trailing space: `[VERBOSE] `.
const LABEL_WIDTH = 9;

// & Route to the matching console method so DevTools' level filter works
// & (debug/verbose/silly fold into console.debug).
function emit(levelName: string, args: unknown[]): void {
  const method =
    levelName === 'ERROR'
      ? 'error'
      : levelName === 'WARN'
        ? 'warn'
        : levelName === 'INFO'
          ? 'info'
          : 'debug';
  // eslint-disable-next-line no-console
  console[method](...args);
}

export class BrowserLogAdapter implements LogAdapter {
  log(
    timestamp: string,
    levelName: string,
    name: string,
    color: string,
    args: unknown[],
    key?: string
  ): void {
    let format = `%c[${timestamp}]%c ${`[${levelName}]`.padEnd(LABEL_WIDTH)}%c [${name}]`;
    const styles = [
      'color: #888',
      LOG_LEVEL_STYLES[levelName] ?? '',
      `color: ${color}; font-weight: bold`
    ];
    if (key !== undefined) {
      format += `%c ${key}`;
      styles.push('color: #888; font-weight: normal');
    }
    emit(levelName, [format, ...styles, ...args]);
  }
}

export class NodeLogAdapter implements LogAdapter {
  log(
    timestamp: string,
    levelName: string,
    name: string,
    _color: string,
    args: unknown[],
    key?: string
  ): void {
    const level = ANSI_BY_LEVEL[levelName] ?? '\x1b[0m';
    const reset = '\x1b[0m';
    let prefix = `\x1b[90m[${timestamp}]${reset} ${level}${`[${levelName}]`.padEnd(LABEL_WIDTH)}${reset} \x1b[1m[${name}]${reset}`;
    // Dim gray so the key recedes behind the message but stays readable.
    if (key !== undefined) prefix += ` \x1b[90m${key}${reset}`;
    emit(levelName, [prefix, ...args]);
  }
}

export function combineAdapters(...adapters: LogAdapter[]): LogAdapter {
  return {
    log(timestamp, levelName, name, color, args, key): void {
      for (const adapter of adapters)
        adapter.log(timestamp, levelName, name, color, args, key);
    }
  };
}

let cachedAdapter: LogAdapter | null = null;

/** Pass null to fall back to auto-detection. */
export function setLogAdapter(adapter: LogAdapter | null): void {
  cachedAdapter = adapter;
}

export function detectLogAdapter(): LogAdapter {
  if (cachedAdapter) return cachedAdapter;

  const g = globalThis as unknown as {
    window?: { document?: unknown };
    process?: { versions?: { node?: string } };
  };
  // ! Check DOM first: an Electron renderer also exposes process.versions.node,
  // ! so only a Node runtime without a DOM is a real terminal (electron main).
  const hasDom = g.window?.document != null;
  const isNode = !hasDom && g.process?.versions?.node != null;
  cachedAdapter = isNode ? new NodeLogAdapter() : new BrowserLogAdapter();
  return cachedAdapter;
}

export class Logger {
  private readonly name: string;
  private readonly color: string;

  constructor(name: string, color?: string) {
    this.name = name;
    this.color = color ?? this.generateColor(name);
  }

  private generateColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++)
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const hue = ((hash % 360) + 360) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  }

  private getTimestamp(): string {
    // Local wall-clock HH:MM:SS, matching electron-log's file timestamps.
    const d = new Date();
    const pad = (n: number): string => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  isEnabled(level: LogLevel): boolean {
    return level <= globalLogLevel;
  }

  private write(level: LogLevel, args: unknown[]): void {
    if (level > globalLogLevel) return;
    // Pull a known dotted key off the front so the adapter can show it as a
    // discreet tag: with human-readable on its sentence becomes the message,
    // with it off the bare key is the message. Unknown/non-string: untouched.
    let key: string | undefined;
    if (typeof args[0] === 'string') {
      const friendly = logMessages[args[0]];
      if (friendly !== undefined) {
        key = args[0];
        args = humanReadable ? [friendly, ...args.slice(1)] : args.slice(1);
      }
    }
    const adapter = detectLogAdapter();
    adapter.log(
      this.getTimestamp(),
      LOG_LEVEL_NAMES[level],
      this.name,
      this.color,
      args,
      key
    );
  }

  error(...args: unknown[]): void {
    this.write(LogLevel.Error, args);
  }
  warn(...args: unknown[]): void {
    this.write(LogLevel.Warn, args);
  }
  info(...args: unknown[]): void {
    this.write(LogLevel.Info, args);
  }
  debug(...args: unknown[]): void {
    this.write(LogLevel.Debug, args);
  }
  verbose(...args: unknown[]): void {
    this.write(LogLevel.Verbose, args);
  }
  silly(...args: unknown[]): void {
    this.write(LogLevel.Silly, args);
  }

  get debugEnabled(): boolean {
    return this.isEnabled(LogLevel.Debug);
  }
  get sillyEnabled(): boolean {
    return this.isEnabled(LogLevel.Silly);
  }
}

/**
 * The `[bracket]` on every log line: the subsystem a logger speaks for. Name the
 * area of code, not the file - kebab-case, related modules sharing a prefix
 * (`ad-*`, `store-worker-*`). Adding a logger means adding its name here, so an
 * unlisted name or a typo won't compile and the list can't drift from reality.
 */
export type Subsystem =
  | 'about'
  | 'ad-coordinator-guest'
  | 'app-protocol'
  | 'ad-coordinator-host'
  | 'ad-manager'
  | 'auto-backup'
  | 'backup-export'
  | 'backup-host'
  | 'backup-import'
  | 'bbcode-editor'
  | 'blocker'
  | 'browser-windows'
  | 'cache-manager'
  | 'changelog'
  | 'character-images'
  | 'character-page'
  | 'character-preview'
  | 'character-search'
  | 'chat'
  | 'chat-settings-view'
  | 'chat-view'
  | 'chat-view-panel'
  | 'chat-window'
  | 'common'
  | 'connection'
  | 'conversations'
  | 'drafts'
  | 'eicon-store'
  | 'exporter'
  | 'filesystem'
  | 'filesystem-host'
  | 'horizon'
  | 'image-preview'
  | 'image-url-mutator'
  | 'import-host'
  | 'importer'
  | 'incognito'
  | 'indexed-store'
  | 'localize'
  | 'main'
  | 'matcher'
  | 'note-checker'
  | 'notifications'
  | 'preview-external'
  | 'profile-cache'
  | 'settings'
  | 'settings-view'
  | 'site-session'
  | 'site-utils'
  | 'smart-filter'
  | 'status-picker'
  | 'store-worker'
  | 'store-worker-client'
  | 'store-worker-endpoint'
  | 'tab-manager'
  | 'vanilla-import-ui'
  | 'websocket'
  | 'window'
  | 'window-state'
  | 'window-view'
  | 'word-definition'
  | 'word-pos-search';

export function createLogger(name: Subsystem, color?: string): Logger {
  return new Logger(name, color);
}

// ^ Fallback logger; prefer a subsystem-specific createLogger(name) per module.
const log = createLogger('horizon', '#7c5cff');
export default log;

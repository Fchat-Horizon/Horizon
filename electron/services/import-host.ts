/**
 * @module import-host
 * Main-process file IO for the legacy importers: vanilla F-Chat data copying
 * and Slimcat log/config conversion. XML parsing stays in the renderer (it
 * needs DOMParser); everything that touches the filesystem lives here.
 */

import * as electron from 'electron';
import { createLogger } from '../../logger';
const log = createLogger('import-host');
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { addMinutes } from 'date-fns';
import { GeneralSettings } from '../common';
import {
  checkIndex,
  getLogDir,
  LogMessage,
  serializeMessage
} from '../log-format';

let getSettings: (() => GeneralSettings) | undefined;

/* --- Vanilla F-Chat importer ------------------------------------------------
   The renderer's vanilla-importer.ts is an IPC proxy to these functions. */

export interface VanillaContext {
  readonly baseDir: string;
  readonly dataDir: string;
}

export interface VanillaImportOptions {
  readonly includeLogs?: boolean;
  readonly includeSettings?: boolean;
  readonly includePinnedEicons?: boolean;
  readonly overwrite?: boolean;
}

export interface VanillaImportSummary {
  readonly logsCopied: number;
  readonly logsSkipped: number;
  readonly settingsCopied: number;
  readonly settingsSkipped: number;
}

function getDefaultBaseDir(): string | undefined {
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA;
    return appData ? path.join(appData, 'fchat') : undefined;
  }
  const home = process.env.HOME;
  if (!home) return undefined;
  if (process.platform === 'darwin')
    return path.join(home, 'Library', 'Application Support', 'fchat');
  return path.join(home, '.config', 'fchat');
}

function resolveVanillaContext(
  customBaseDir?: string
): VanillaContext | undefined {
  const candidates: Array<{ baseDir: string; dataDir: string }> = [];

  if (customBaseDir) {
    const normalized = path.resolve(customBaseDir);
    candidates.push({
      baseDir: path.dirname(normalized),
      dataDir: normalized
    });
    candidates.push({
      baseDir: normalized,
      dataDir: path.join(normalized, 'data')
    });
  } else {
    const defaultBaseDir = getDefaultBaseDir();
    if (!defaultBaseDir) return undefined;
    const normalized = path.resolve(defaultBaseDir);
    candidates.push({
      baseDir: normalized,
      dataDir: path.join(normalized, 'data')
    });
  }

  for (const candidate of candidates) {
    try {
      const stat = fs.statSync(candidate.dataDir);
      if (!stat.isDirectory()) continue;
      return candidate;
    } catch {
      continue;
    }
  }

  return undefined;
}

function canImportVanilla(context?: VanillaContext): boolean {
  const ctx = context ?? resolveVanillaContext();
  if (!ctx) return false;
  return fs.existsSync(path.join(ctx.dataDir, 'settings'));
}

function listVanillaCharacters(context?: VanillaContext): string[] {
  const ctx = context ?? resolveVanillaContext();
  if (!ctx) return [];
  return fs
    .readdirSync(ctx.dataDir)
    .filter(entry => {
      if (
        entry === 'settings' ||
        entry === 'window.json' ||
        entry === 'eicons.json'
      )
        return false;
      const full = path.join(ctx.dataDir, entry);
      try {
        return fs.statSync(full).isDirectory();
      } catch {
        return false;
      }
    })
    .sort((a, b) => a.localeCompare(b));
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFileIfNeeded(
  source: string,
  destination: string,
  overwrite: boolean
): boolean {
  if (!fs.existsSync(source)) return false;
  if (!overwrite && fs.existsSync(destination)) return false;
  ensureDir(path.dirname(destination));
  fs.copyFileSync(source, destination);
  return true;
}

function copyDirectory(
  source: string,
  destination: string,
  overwrite: boolean
): { copied: number; skipped: number } {
  if (!fs.existsSync(source)) return { copied: 0, skipped: 0 };
  const entries = fs.readdirSync(source, { withFileTypes: true });
  let copied = 0;
  let skipped = 0;
  ensureDir(destination);
  for (const entry of entries) {
    const src = path.join(source, entry.name);
    const dest = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      const result = copyDirectory(src, dest, overwrite);
      copied += result.copied;
      skipped += result.skipped;
    } else if (entry.isFile()) {
      if (copyFileIfNeeded(src, dest, overwrite)) copied++;
      else skipped++;
    }
  }
  return { copied, skipped };
}

function importVanillaGeneralSettings(
  context: VanillaContext,
  destinationDataDir: string
): GeneralSettings | undefined {
  const settingsFile = path.join(context.dataDir, 'settings');
  if (!fs.existsSync(settingsFile)) return undefined;
  try {
    const raw = fs.readFileSync(settingsFile, 'utf8');
    const imported = JSON.parse(raw);
    const result = new GeneralSettings();
    Object.assign(result, imported);
    result.logDirectory = destinationDataDir;
    return result;
  } catch (error) {
    log.error('importGeneralSettings.error', error);
    return undefined;
  }
}

function importVanillaCharacter(
  context: VanillaContext,
  destinationDataDir: string,
  character: string,
  options: VanillaImportOptions
): VanillaImportSummary {
  const includeLogs = options.includeLogs !== false;
  const includeSettings = options.includeSettings !== false;
  const includePinnedEicons =
    options.includePinnedEicons === true ||
    (!includeSettings && options.includePinnedEicons !== false);
  const overwrite = options.overwrite === true;

  let logsCopied = 0;
  let logsSkipped = 0;
  let settingsCopied = 0;
  let settingsSkipped = 0;

  if (includeLogs) {
    const result = copyDirectory(
      path.join(context.dataDir, character, 'logs'),
      path.join(destinationDataDir, character, 'logs'),
      overwrite
    );
    logsCopied = result.copied;
    logsSkipped = result.skipped;
  }

  if (includeSettings) {
    const result = copyDirectory(
      path.join(context.dataDir, character, 'settings'),
      path.join(destinationDataDir, character, 'settings'),
      overwrite
    );
    settingsCopied = result.copied;
    settingsSkipped = result.skipped;
  }

  if (
    includePinnedEicons &&
    (!includeSettings || options.includePinnedEicons === true)
  ) {
    const source = path.join(
      context.dataDir,
      character,
      'settings',
      'favoriteEIcons'
    );
    const destination = path.join(
      destinationDataDir,
      character,
      'settings',
      'favoriteEIcons'
    );
    if (fs.existsSync(source)) {
      const copied = copyFileIfNeeded(source, destination, overwrite);
      if (copied) settingsCopied++;
      else if (!overwrite) settingsSkipped++;
    }
  }

  return { logsCopied, logsSkipped, settingsCopied, settingsSkipped };
}

/* --- Slimcat importer -------------------------------------------------------
   File access for importer.ts; the XML parsing stays in the renderer. */

function getSlimcatRoamingDir(): string | undefined {
  const appdata = process.env.APPDATA;
  if (appdata === undefined || appdata.length === 0) return;
  return path.join(appdata, 'slimCat');
}

function getSlimcatLocalDir(): string | undefined {
  const appdata = process.env.LOCALAPPDATA;
  if (appdata === undefined || appdata.length === 0) return;
  return path.join(appdata, 'slimCat');
}

function getSlimcatSettingsDir(character: string): string | undefined {
  const dir = getSlimcatRoamingDir();
  if (dir === undefined) return;
  let charDir = path.join(dir, character);
  if (fs.existsSync(charDir)) return charDir;
  charDir = path.join(dir, '!Defaults');
  if (fs.existsSync(charDir)) return charDir;
}

/** Newest Slimcat general config file (user.config or !preferences.xml). */
function readSlimcatGeneralConfig(): { file: string; content: string } | null {
  let dir = getSlimcatLocalDir();
  let files: string[] = [];
  if (dir !== undefined)
    files = files.concat(
      ...fs.readdirSync(dir).map(x => {
        const subdir = path.join(<string>dir, x);
        return fs
          .readdirSync(subdir)
          .map(y => path.join(subdir, y, 'user.config'));
      })
    );
  dir = getSlimcatRoamingDir();
  if (dir !== undefined && fs.existsSync(dir))
    files.push(path.join(dir, '!preferences.xml'));
  let file = '';
  for (let max = 0, i = 0; i < files.length; ++i) {
    const time = fs.statSync(files[i]).mtime.getTime();
    if (time > max) {
      max = time;
      file = files[i];
    }
  }
  if (file.length === 0) return null; //tslint:disable-line:no-null-keyword
  return { file, content: fs.readFileSync(file, 'utf8') };
}

/** Content of a character's !settings.xml, with the BOM stripped. */
function readSlimcatSettingsXml(character: string): string | null {
  const dir = getSlimcatSettingsDir(character);
  //tslint:disable-next-line:no-null-keyword
  if (dir === undefined) return null;
  const settingsFile = path.join(dir, 'Global', '!settings.xml');
  //tslint:disable-next-line:no-null-keyword
  if (!fs.existsSync(settingsFile)) return null;
  const buffer = fs.readFileSync(settingsFile);
  return buffer.toString(
    'utf8',
    buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf ? 3 : 0
  );
}

/*
! These mirror Conversation.Message.Type values and slash_commands.isAction;
! importing chat modules here would drag the renderer graph (Vue components,
! core state) into the main-process bundle.
*/
const MESSAGE_TYPE = 0;
const ACTION_TYPE = 1;
const ROLL_TYPE = 3;
const isAction = (text: string): boolean => /^\/me\b/i.test(text);

const charRegex = /([A-Za-z0-9][A-Za-z0-9 \-_]{0,18}[A-Za-z0-9\-_])\b/;

function createMessage(
  line: string,
  ownCharacter: string,
  name: string,
  isChannel: boolean,
  date: Date
): LogMessage | undefined {
  let type = MESSAGE_TYPE;
  let sender: string | null;
  let text: string;

  let lineIndex = line.indexOf(']');
  if (lineIndex === -1) return;
  const time = line.substring(1, lineIndex);
  let h = parseInt(time.substr(0, 2), 10);
  const m = parseInt(time.substr(3, 2), 10);
  if (time.slice(-2) === 'AM') h -= 12;
  lineIndex += 2;
  if (line[lineIndex] === '[') {
    type = ROLL_TYPE;
    let endIndex = line.indexOf('[', (lineIndex += 6));
    if (endIndex - lineIndex > 20) endIndex = lineIndex + 20;
    sender = line.substring(lineIndex, endIndex);
    text = line.substring(endIndex + 6, 50000);
  } else {
    if (
      lineIndex + ownCharacter.length <= line.length &&
      line.substr(lineIndex, ownCharacter.length) === ownCharacter
    )
      sender = ownCharacter;
    else if (
      !isChannel &&
      lineIndex + name.length <= line.length &&
      line.substr(lineIndex, name.length) === name
    )
      sender = name;
    else {
      const matched = charRegex.exec(line.substr(lineIndex, 21));
      sender = matched !== null && matched.length > 1 ? matched[1] : '';
    }
    lineIndex += sender.length;
    if (line[lineIndex] === ':') {
      ++lineIndex;
      if (line[lineIndex] === ' ') ++lineIndex;
      if (isAction(line)) {
        type = ACTION_TYPE;
        lineIndex += 3;
      }
    } else type = ACTION_TYPE;
    text = line.substr(lineIndex, 50000);
  }
  return {
    type,
    sender: { name: sender },
    text,
    time: addMinutes(date, h * 60 + m)
  };
}

const knownOfficialChannels = [
  'Canon Characters',
  "Monster's Lair",
  'German IC',
  'Humans/Humanoids',
  'Warhammer General',
  'Love and Affection',
  'Transformation',
  'Hyper Endowed',
  'Force/Non-Con',
  'Diapers/Infantilism',
  'Avians',
  'Politics',
  'Lesbians',
  'Superheroes',
  'Footplay',
  'Sadism/Masochism',
  'German Politics',
  'Para/Multi-Para RP',
  'Micro/Macro',
  'Ferals / Bestiality',
  'Gamers',
  'Gay Males',
  'Story Driven LFRP',
  'Femdom',
  'German OOC',
  'World of Warcraft',
  'Ageplay',
  'German Furry',
  'Scat Play',
  'Hermaphrodites',
  'RP Dark City',
  'All in the Family',
  'Inflation',
  'Development',
  'Fantasy',
  'Frontpage',
  'Pokefurs',
  'Medical Play',
  'Domination/Submission',
  'Latex',
  'Fat and Pudgy',
  'Muscle Bound',
  'Furries',
  'RP Bar',
  'The Slob Den',
  'Artists / Writers',
  'Mind Control',
  'Ass Play',
  'Sex Driven LFRP',
  'Gay Furry Males',
  'Vore',
  'Non-Sexual RP',
  'Equestria ',
  'Sci-fi',
  'Watersports',
  'Straight Roleplay',
  'Gore',
  'Cuntboys',
  'Femboy',
  'Bondage',
  'Cum Lovers',
  'Transgender',
  'Pregnancy and Impregnation',
  'Canon Characters OOC',
  'Dragons',
  'Helpdesk'
];

/**
 * Converts a character's Slimcat text logs into Horizon's binary format.
 * The settings XML stays with the renderer (DOMParser lives there);
 * progress streams back over 'slimcat-import-progress'.
 */
async function importSlimcatLogs(
  sender: electron.WebContents,
  ownCharacter: string
): Promise<void> {
  const write = promisify(fs.write);
  const dir = getSlimcatSettingsDir(ownCharacter);
  if (dir === undefined) return;
  const adRegex = /Ad at \[.*?]:/;
  const logRegex =
    /^(Ad at \[.*?]:|\[\d{2}.\d{2}.*] (\[user][A-Za-z0-9 \-_]|[A-Za-z0-9 \-_]))/;
  const logDir = getLogDir(getSettings!().logDirectory, ownCharacter);
  const subdirs = fs.readdirSync(dir);
  for (let i = 0; i < subdirs.length; ++i) {
    if (!sender.isDestroyed())
      sender.send('slimcat-import-progress', i / subdirs.length);
    const subdir = subdirs[i];
    const subdirPath = path.join(dir, subdir);
    if (
      subdir === '!Notifications' ||
      subdir === 'Global' ||
      !fs.statSync(subdirPath).isDirectory()
    )
      continue;

    const channelMarker = subdir.indexOf('(');
    let key: string, name: string;
    let isChannel = false;
    if (channelMarker !== -1) {
      isChannel = true;
      key = `#${subdir.slice(channelMarker + 1, -1)}`.toLowerCase();
      name = subdir.substring(0, channelMarker - 1);
    } else {
      name = subdir;
      if (knownOfficialChannels.indexOf(subdir) !== -1) {
        key = `#${subdir}`.toLowerCase();
        isChannel = true;
      } else key = subdir.toLowerCase();
    }

    const logFile = path.join(logDir, key);
    if (fs.existsSync(logFile)) fs.unlinkSync(logFile);
    if (fs.existsSync(`${logFile}.idx`)) fs.unlinkSync(`${logFile}.idx`);
    let logFd, indexFd;
    const logIndex = {};
    let size = 0;
    const files = fs.readdirSync(subdirPath);
    for (const file of files
      .map(filename => {
        const date = path.basename(filename, '.txt').split('-');
        return {
          name: filename,
          date: new Date(
            parseInt(date[2], 10),
            parseInt(date[0], 10) - 1,
            parseInt(date[1], 10)
          )
        };
      })
      .sort((x, y) => x.date.getTime() - y.date.getTime())) {
      if (isNaN(file.date.getTime())) continue;
      const content = fs.readFileSync(path.join(subdirPath, file.name), 'utf8');
      let index = 0,
        start = 0;
      let ignoreLine = false;
      while (index < content.length) {
        if (index === start && adRegex.test(content.substr(start, 14)))
          ignoreLine = true;
        else {
          const char = content[index];
          if (ignoreLine) {
            if (char === '\n') {
              const nextLine = content.substr(index + 1, 29);
              if (logRegex.test(nextLine)) {
                ignoreLine = false;
                start = index + 1;
              }
            }
            ++index;
            continue;
          }
          if (char === '\r' || char === '\n') {
            const nextLine = content.substr(
              index + (char === '\r' ? 2 : 1),
              29
            );
            if (logRegex.test(nextLine) || content.length - index <= 2) {
              const line = content.substring(start, index);
              const message = createMessage(
                line,
                ownCharacter,
                name,
                isChannel,
                file.date
              );
              if (message === undefined) {
                index += char === '\r' ? 2 : 1;
                continue;
              }
              if (indexFd === undefined || logFd === undefined) {
                logFd = fs.openSync(logFile, 'a');
                indexFd = fs.openSync(`${logFile}.idx`, 'a');
              }
              const indexBuffer = checkIndex(
                logIndex,
                message,
                key,
                name,
                size
              );
              if (indexBuffer !== undefined) await write(indexFd, indexBuffer);
              const serialized = serializeMessage(message);
              await write(logFd, serialized.serialized);
              size += serialized.size;
              if (char === '\r') ++index;
              start = index + 1;
            } else if (char === '\r') ++index;
          }
        }
        ++index;
      }
    }
    if (indexFd !== undefined) fs.closeSync(indexFd);
    if (logFd !== undefined) fs.closeSync(logFd);
  }
}

/* --- IPC wiring ------------------------------------------------------------ */

let initialized = false;

/**
 * Registers the legacy importer IPC endpoints. Call once during app startup.
 */
export function initImportHost(opts: { getSettings(): GeneralSettings }): void {
  if (initialized) return;
  initialized = true;
  getSettings = opts.getSettings;

  const ipc = electron.ipcMain;

  /* Vanilla F-Chat */
  ipc.handle('vanilla-resolve-context', (_e, customBaseDir?: string) =>
    resolveVanillaContext(customBaseDir)
  );
  ipc.handle('vanilla-can-import', (_e, context?: VanillaContext) =>
    canImportVanilla(context)
  );
  ipc.handle('vanilla-list-characters', (_e, context?: VanillaContext) =>
    listVanillaCharacters(context)
  );
  ipc.handle(
    'vanilla-import-general-settings',
    (_e, context: VanillaContext, destinationDataDir: string) =>
      importVanillaGeneralSettings(context, destinationDataDir)
  );
  ipc.handle(
    'vanilla-import-character',
    (
      _e,
      context: VanillaContext,
      destinationDataDir: string,
      character: string,
      options: VanillaImportOptions
    ) => importVanillaCharacter(context, destinationDataDir, character, options)
  );
  ipc.handle(
    'vanilla-import-all',
    (
      _e,
      context: VanillaContext,
      destinationDataDir: string,
      options: VanillaImportOptions & { characters?: string[] }
    ): Record<string, VanillaImportSummary> => {
      ensureDir(destinationDataDir);
      const characters = options.characters ?? listVanillaCharacters(context);
      const summaries: Record<string, VanillaImportSummary> = {};
      for (const character of characters)
        summaries[character] = importVanillaCharacter(
          context,
          destinationDataDir,
          character,
          options
        );
      return summaries;
    }
  );

  /* Slimcat */
  ipc.on('slimcat-can-import-general-sync', e => {
    e.returnValue =
      getSlimcatLocalDir() !== undefined &&
      fs.existsSync(<string>getSlimcatLocalDir());
  });
  ipc.on('slimcat-can-import-character-sync', (e, character: string) => {
    e.returnValue = getSlimcatSettingsDir(character) !== undefined;
  });
  ipc.on('slimcat-read-general-config-sync', e => {
    try {
      e.returnValue = readSlimcatGeneralConfig();
    } catch (err) {
      log.error('slimcat.config.read.error', err);
      e.returnValue = null; //tslint:disable-line:no-null-keyword
    }
  });
  ipc.on('slimcat-read-settings-xml-sync', (e, character: string) => {
    try {
      e.returnValue = readSlimcatSettingsXml(character);
    } catch (err) {
      log.error('slimcat.settings.read.error', err);
      e.returnValue = null; //tslint:disable-line:no-null-keyword
    }
  });
  ipc.handle('slimcat-import-logs', (e, character: string) =>
    importSlimcatLogs(e.sender, character)
  );
}

/**
 * @module filesystem-host
 * Main-process file IO for the renderer: chat logs, per-character settings,
 * message drafts, bundled theme/sound-theme assets, the eicon cache, and the
 * app-level key-value store. The renderer reaches all of it over IPC.
 *
 * * Log/settings/draft paths derive from the main process's own
 * * GeneralSettings, which is the source of truth for `logDirectory`.
 */

import * as electron from 'electron';
import { createLogger } from '../logger';
const log = createLogger('filesystem-host');
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import l from '../chat/localize';
import { GeneralSettings } from './common';
import { JsonStore } from './json-store';
import {
  checkIndex,
  deserializeMessage,
  fixLogs,
  getLogDir,
  Index,
  loadIndex,
  PlainLogMessage,
  serializeMessage
} from './log-format';

const read = promisify(fs.read);

let getSettings: (() => GeneralSettings) | undefined;

/** Live indexes for connected characters (loaded via 'logs-init'). */
const liveIndexes = new Map<string, Index>();
/** One-slot cache for browsing a non-connected character's logs. */
let browseCache: { character: string; index: Index } | undefined;

function logDirectory(): string {
  return getSettings!().logDirectory;
}

function logDir(character: string): string {
  return getLogDir(logDirectory(), character);
}

function logFile(character: string, key: string): string {
  return path.join(logDir(character), key);
}

function settingsDir(character: string): string {
  const dir = path.join(logDirectory(), character, 'settings');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function draftFile(character: string): string {
  return path.join(logDirectory(), character, 'drafts.txt');
}

function writeFile(
  p: fs.PathLike | number,
  data: string | NodeJS.ArrayBufferView,
  options?: fs.WriteFileOptions
): void {
  try {
    fs.writeFileSync(p, data, options);
  } catch (e) {
    electron.dialog.showErrorBox(l('fs.error'), (<Error>e).message);
  }
}

function indexFor(character: string): Index {
  const live = liveIndexes.get(character);
  if (live !== undefined) return live;
  if (browseCache?.character === character) return browseCache.index;
  const loaded = loadIndex(logDir(character));
  browseCache = { character, index: loaded.index };
  return loaded.index;
}

function availableCharacters(): string[] {
  const baseDir = logDirectory();
  fs.mkdirSync(baseDir, { recursive: true });
  return fs
    .readdirSync(baseDir)
    .filter(x => fs.statSync(path.join(baseDir, x)).isDirectory());
}

let initialized = false;

/**
 * Registers the filesystem IPC endpoints. Call once during app startup.
 */
export function initFilesystemHost(opts: {
  getSettings(): GeneralSettings;
}): void {
  if (initialized) return;
  initialized = true;
  getSettings = opts.getSettings;

  const ipc = electron.ipcMain;

  /* Loads a character's log index when a tab starts connecting. Returns
     whether any index file was corrupt so the renderer can alert. */
  ipc.handle('logs-init', (_e, character: string) => {
    const loaded = loadIndex(logDir(character));
    liveIndexes.set(character, loaded.index);
    if (browseCache?.character === character) browseCache = undefined;
    return loaded.hadErrors;
  });

  /* Fire-and-forget append, and that's fine: IPC messages arrive in send
     order and this handler is synchronous, so a later read can't overtake
     us. */
  ipc.on(
    'logs-log-message',
    (
      _e,
      character: string,
      conversation: { key: string; name: string },
      message: PlainLogMessage
    ) => {
      const file = logFile(character, conversation.key);
      const logMessage = {
        type: message.type,
        sender: { name: message.sender },
        text: message.text,
        time: new Date(message.time)
      };
      const buffer = serializeMessage(logMessage).serialized;
      let index = liveIndexes.get(character);
      if (index === undefined) {
        index = loadIndex(logDir(character)).index;
        liveIndexes.set(character, index);
      }
      const hasIndex = index[conversation.key] !== undefined;
      const indexBuffer = checkIndex(
        index,
        logMessage,
        conversation.key,
        conversation.name,
        () => (fs.existsSync(file) ? fs.statSync(file).size : 0)
      );
      if (indexBuffer !== undefined)
        writeFile(`${file}.idx`, indexBuffer, { flag: hasIndex ? 'a' : 'wx' });
      writeFile(file, buffer, { flag: 'a' });
    }
  );

  ipc.handle(
    'logs-get-backlog',
    (_e, character: string, key: string): PlainLogMessage[] => {
      const file = logFile(character, key);
      if (!fs.existsSync(file)) return [];
      let count = 20;
      let messages = new Array<PlainLogMessage>(count);
      const fd = fs.openSync(file, 'r');
      try {
        let pos = fs.fstatSync(fd).size;
        const buffer = Buffer.allocUnsafe(65536);
        while (pos > 0 && count > 0) {
          fs.readSync(fd, buffer, 0, 2, pos - 2);
          const length = buffer.readUInt16LE(0);
          pos = pos - length - 2;
          fs.readSync(fd, buffer, 0, length, pos);
          messages[--count] = deserializeMessage(buffer).message;
        }
        if (count !== 0) messages = messages.slice(count);
        return messages;
      } finally {
        fs.closeSync(fd);
      }
    }
  );

  ipc.handle(
    'logs-get-logs',
    async (
      _e,
      character: string,
      key: string,
      dateMs: number
    ): Promise<PlainLogMessage[]> => {
      const index = indexFor(character)[key];
      if (index === undefined) return [];
      const date = new Date(dateMs);
      const dayMs = 86400000;
      const dateOffset =
        index.index[
          Math.floor(date.getTime() / dayMs - date.getTimezoneOffset() / 1440)
        ];
      if (dateOffset === undefined) return [];
      const messages: PlainLogMessage[] = [];
      const pos = index.offsets[dateOffset];
      const fd = fs.openSync(logFile(character, key), 'r');
      try {
        const end =
          dateOffset + 1 < index.offsets.length
            ? index.offsets[dateOffset + 1]
            : fs.fstatSync(fd).size;
        const length = end - pos;
        const buffer = Buffer.allocUnsafe(length);
        await read(fd, buffer, 0, length, pos);
        let offset = 0;
        while (offset < length) {
          const deserialized = deserializeMessage(buffer, offset);
          messages.push(deserialized.message);
          offset += deserialized.size;
        }
        return messages;
      } finally {
        fs.closeSync(fd);
      }
    }
  );

  ipc.handle(
    'logs-get-log-dates',
    (_e, character: string, key: string): number[] => {
      const entry = indexFor(character)[key];
      if (entry === undefined) return [];
      const dayMs = 86400000;
      const dates: number[] = [];
      for (const item in entry.index) {
        const date = new Date(parseInt(item, 10) * dayMs);
        dates.push(date.getTime() + date.getTimezoneOffset() * 60000);
      }
      return dates;
    }
  );

  ipc.handle('logs-get-conversations', (_e, character: string) => {
    const index = indexFor(character);
    const conversations: { key: string; name: string }[] = [];
    for (const key in index)
      conversations.push({ key, name: index[key]!.name });
    return conversations;
  });

  ipc.handle('logs-get-available-characters', () => availableCharacters());

  ipc.handle('logs-fix', (_e, character: string) => {
    fixLogs(logDir(character));
    browseCache = undefined;
    liveIndexes.delete(character);
  });

  ipc.handle(
    'settings-get',
    (_e, character: string, key: string): string | undefined => {
      try {
        const file = path.join(settingsDir(character), key);
        if (!fs.existsSync(file)) return undefined;
        return fs.readFileSync(file, 'utf8');
      } catch (e) {
        log.error('settings.read.error', { character, key, e });
        return undefined;
      }
    }
  );

  ipc.handle(
    'settings-set',
    (_e, character: string, key: string, value: string) => {
      writeFile(path.join(settingsDir(character), key), value);
    }
  );

  ipc.on('drafts-get-sync', (e, character: string) => {
    try {
      const file = draftFile(character);
      e.returnValue = fs.existsSync(file)
        ? fs.readFileSync(file, 'utf8')
        : //tslint:disable-next-line:no-null-keyword
          null;
    } catch (err) {
      log.error('drafts.read.error', err);
      e.returnValue = null; //tslint:disable-line:no-null-keyword
    }
  });

  ipc.on('drafts-set', (_e, character: string, drafts: string) => {
    writeFile(draftFile(character), drafts);
  });

  /* --- Bundled assets: color themes ------------------------------------- */

  const themesDir = path.join(__dirname, 'themes');

  ipc.on('themes-list-sync', e => {
    try {
      e.returnValue = fs
        .readdirSync(themesDir)
        .filter(x => x.substr(-4) === '.css')
        .map(x => x.slice(0, -4));
    } catch (err) {
      log.error('themes.list.error', err);
      e.returnValue = [];
    }
  });

  ipc.on('themes-read-sync', (e, name: string) => {
    try {
      // ! Theme names come from settings; never let them escape themesDir.
      if (path.basename(name) !== name) throw new Error('Invalid theme name');
      e.returnValue = fs.readFileSync(
        path.join(themesDir, `${name}.css`),
        'utf8'
      );
    } catch {
      e.returnValue = null; //tslint:disable-line:no-null-keyword
    }
  });

  /* Theme hot reload for development: renderers re-read on change. */
  if (process.env.NODE_ENV !== 'production') {
    try {
      fs.watch(themesDir, { persistent: false }, (_event, filename) => {
        for (const contents of electron.webContents.getAllWebContents())
          contents.send(
            'theme-files-changed',
            filename === null ? '' : filename.toString()
          );
      });
    } catch (err) {
      log.debug('themes.watch.fail', err);
    }
  }

  /* --- Bundled assets: sound themes ------------------------------------- */

  const soundThemesDir = path.join(__dirname, 'sound-themes');

  ipc.on('sound-themes-list-sync', e => {
    try {
      e.returnValue = fs
        .readdirSync(soundThemesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(name =>
          fs.existsSync(path.join(soundThemesDir, name, 'sound.json'))
        );
    } catch (err) {
      log.error('soundThemes.list.error', err);
      e.returnValue = ['default'];
    }
  });

  ipc.on('sound-theme-read-sync', (e, name: string) => {
    try {
      if (path.basename(name) !== name) throw new Error('Invalid theme name');
      e.returnValue = fs.readFileSync(
        path.join(soundThemesDir, name, 'sound.json'),
        'utf8'
      );
    } catch {
      e.returnValue = null; //tslint:disable-line:no-null-keyword
    }
  });

  /* Resolves the playable file:// sources for one sound of a theme, in the
     same preference order the settings preview uses. */
  ipc.on('sound-sources-sync', (e, theme: string, sound: string) => {
    const sources: { url: string; type: string }[] = [];
    try {
      if (path.basename(theme) !== theme || path.basename(sound) !== sound)
        throw new Error('Invalid sound');
      let details: {
        sounds?: { [key: string]: string };
        formats?: { preferred?: string; fallback?: string[] };
      } | null = null;
      try {
        details = JSON.parse(
          fs.readFileSync(
            path.join(soundThemesDir, theme, 'sound.json'),
            'utf8'
          )
        );
      } catch {
        details = null; //tslint:disable-line:no-null-keyword
      }
      if (details?.sounds?.[sound] !== undefined) {
        const soundPath = details.sounds[sound];
        const formats = [
          details.formats?.preferred,
          ...(details.formats?.fallback ?? [])
        ].filter((x): x is string => Boolean(x));
        for (const format of formats) {
          const ext = format === 'mpeg' ? 'mp3' : format;
          const abs = path.join(soundThemesDir, theme, `${soundPath}.${ext}`);
          sources.push({ url: `file://${abs}`, type: `audio/${format}` });
        }
      } else {
        const codecOrder = ['wav', 'mp3', 'ogg'];
        for (const ext of codecOrder) {
          const candidate1 = path.join(
            __dirname,
            '..',
            'chat',
            'assets',
            `${sound}.${ext}`
          );
          const candidate2 = path.join(
            __dirname,
            '..',
            'assets',
            `${sound}.${ext}`
          );
          if (fs.existsSync(candidate1))
            sources.push({ url: `file://${candidate1}`, type: `audio/${ext}` });
          else if (fs.existsSync(candidate2))
            sources.push({ url: `file://${candidate2}`, type: `audio/${ext}` });
        }
      }
    } catch (err) {
      log.warn('soundThemes.sources.error', err);
    }
    e.returnValue = sources;
  });

  /* --- Eicon cache -------------------------------------------------------- */

  const eiconsFile = () =>
    path.join(electron.app.getPath('userData'), 'data', 'eicons.json');

  ipc.handle('eicons-read', () => {
    try {
      return fs.readFileSync(eiconsFile(), 'utf-8');
    } catch {
      return null; //tslint:disable-line:no-null-keyword
    }
  });

  ipc.on('eicons-write', (_e, content: string) => {
    try {
      fs.writeFileSync(eiconsFile(), content);
    } catch (err) {
      // This is not a showstopper.
      log.error('eicons.save.failure', { err });
    }
  });

  /* --- App-level key-value store (userData/settings.json) ---------------- */

  const appStore = new JsonStore(
    path.join(electron.app.getPath('userData'), 'settings.json')
  );

  ipc.handle('app-store-get', (_e, key: string) => appStore.get(key));
  ipc.handle('app-store-set', (_e, key: string, value: unknown) =>
    appStore.set(key, value)
  );
  ipc.handle('app-store-unset', (_e, key: string) => appStore.unset(key));
}

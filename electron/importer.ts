import { addMinutes } from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { Settings } from '../chat/common';
import { Conversation } from '../chat/interfaces';
import { isAction } from '../chat/slash_commands';
import { GeneralSettings } from './common';
import { checkIndex, getLogDir, Message as LogMessage, serializeMessage, SettingsStore } from './filesystem';

function getRoamingDir(): string | undefined {
  const appdata = process.env.APPDATA;
  if (appdata === undefined || appdata.length === 0) return;
  return path.join(appdata, 'slimCat');
}

function getLocalDir(): string | undefined {
  const appdata = process.env.LOCALAPPDATA;
  if (appdata === undefined || appdata.length === 0) return;
  return path.join(appdata, 'slimCat');
}

function getSettingsDir(character: string): string | undefined {
  const dir = getRoamingDir();
  if (dir === undefined) return;
  let charDir = path.join(dir, character);
  if (fs.existsSync(charDir)) return charDir;
  charDir = path.join(dir, '!Defaults');
  if (fs.existsSync(charDir)) return charDir;
  return;
}

export function canImportGeneral(): boolean {
  const dir = getLocalDir();
  return dir !== undefined && fs.existsSync(dir);
}

export function canImportCharacter(character: string): boolean {
  return getSettingsDir(character) !== undefined;
}

export function importGeneral(data: GeneralSettings): void {
  let dir = getLocalDir();
  let files: string[] = [];
  if (dir !== undefined)
    files = files.concat(
      ...fs.readdirSync(dir).map(x => {
        const subdir = path.join(<string>dir, x);
        return fs.readdirSync(subdir).map(y => path.join(subdir, y, 'user.config'));
      })
    );
  dir = getRoamingDir();
  if (dir !== undefined && fs.existsSync(dir)) files.push(path.join(dir, '!preferences.xml'));
  let file = '';
  for (let max = 0, i = 0; i < files.length; ++i) {
    const time = fs.statSync(files[i]).mtime.getTime();
    if (time > max) {
      max = time;
      file = files[i];
    }
  }
  if (file.length === 0) return;
  let elm = new DOMParser().parseFromString(fs.readFileSync(file, 'utf8'), 'application/xml').firstElementChild;
  if (file.slice(-3) === 'xml') {
    if (elm === null) return;
    let elements;
    if ((elements = elm.getElementsByTagName('Username')).length > 0) data.account = <string>elements[0].textContent;
    if ((elements = elm.getElementsByTagName('Host')).length > 0) data.host = <string>elements[0].textContent;
  } else {
    if (elm !== null) elm = elm.firstElementChild;
    if (elm !== null) elm = elm.firstElementChild;
    if (elm === null) return;
    const config = elm.getElementsByTagName('setting');
    for (const element of config) {
      if (element.firstElementChild === null || element.firstElementChild.textContent === null) continue;
      if (element.getAttribute('name') === 'UserName') data.account = element.firstElementChild.textContent;
      else if (element.getAttribute('name') === 'Host') data.host = element.firstElementChild.textContent;
    }
  }
}

const charRegex = /([A-Za-z0-9][A-Za-z0-9 \-_]{0,18}[A-Za-z0-9\-_])\b/;

function createMessage(line: string, ownCharacter: string, name: string, isChannel: boolean, date: Date): LogMessage | undefined {
  let type = Conversation.Message.Type.Message;
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
    type = Conversation.Message.Type.Roll;
    let endIndex = line.indexOf('[', (lineIndex += 6));
    if (endIndex - lineIndex > 20) endIndex = lineIndex + 20;
    sender = line.substring(lineIndex, endIndex);
    text = line.substring(endIndex + 6, 50000);
  } else {
    if (lineIndex + ownCharacter.length <= line.length && line.substr(lineIndex, ownCharacter.length) === ownCharacter)
      sender = ownCharacter;
    else if (!isChannel && lineIndex + name.length <= line.length && line.substr(lineIndex, name.length) === name) sender = name;
    else {
      const matched = charRegex.exec(line.substr(lineIndex, 21));
      sender = matched !== null && matched.length > 1 ? matched[1] : '';
    }
    lineIndex += sender.length;
    if (line[lineIndex] === ':') {
      ++lineIndex;
      if (line[lineIndex] === ' ') ++lineIndex;
      if (isAction(line)) {
        type = Conversation.Message.Type.Action;
        lineIndex += 3;
      }
    } else type = Conversation.Message.Type.Action;
    text = line.substr(lineIndex, 50000);
  }
  return { type, sender: { name: sender }, text, time: addMinutes(date, h * 60 + m) };
}

async function importSettings(dir: string): Promise<void> {
  const settings = new Settings();
  const settingsStore = new SettingsStore();
  const settingsFile = path.join(dir, 'Global', '!settings.xml');
  if (!fs.existsSync(settingsFile)) return;
  const buffer = fs.readFileSync(settingsFile);
  const content = buffer.toString('utf8', buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf ? 3 : 0);
  const config = new DOMParser().parseFromString(content, 'application/xml').firstElementChild;
  if (config === null) return;

  function getValue(name: string): string | undefined {
    if (config === null) return;
    const elm = <Element | undefined>config.getElementsByTagName(name)[0];
    return elm !== undefined && elm.textContent !== null ? elm.textContent : undefined;
  }

  if (getValue('AllowColors') === 'false') settings.disallowedTags.push('color');
  if (getValue('AllowIcons') === 'false') settings.disallowedTags.push('icon', 'eicon');
  if (getValue('AllowSound') === 'false') settings.playSound = false;
  if (getValue('CheckForOwnName') === 'false') settings.highlight = false;
  const idleTime = getValue('AutoIdleTime');
  if (getValue('AllowAutoIdle') === 'true' && idleTime !== undefined) settings.idleTimer = parseInt(idleTime, 10);
  const highlightWords = getValue('GlobalNotifyTerms');
  if (highlightWords !== undefined)
    settings.highlightWords = highlightWords
      .split(',')
      .map(x => x.trim())
      .filter(x => x.length);
  if (getValue('ShowNotificationsGlobal') === 'false') settings.notifications = false;
  if (getValue('ShowAvatars') === 'false') settings.showAvatars = false;
  if (getValue('PlaySoundEvenWhenTabIsFocused') === 'true') settings.alwaysNotify = true;
  await settingsStore.set('settings', settings);

  const pinned = { channels: <string[]>[], private: [] };
  const elements = config.getElementsByTagName('SavedChannels')[0].getElementsByTagName('channel');
  for (const element of elements) {
    const item = element.textContent;
    if (item !== null && pinned.channels.indexOf(item) === -1) pinned.channels.push(item);
  }
  await settingsStore.set('pinned', pinned);
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

export async function importCharacter(ownCharacter: string, progress: (progress: number) => void): Promise<void> {
  const write = promisify(fs.write);
  const dir = getSettingsDir(ownCharacter);
  if (dir === undefined) return;
  await importSettings(dir);
  const adRegex = /Ad at \[.*?]:/;
  const logRegex = /^(Ad at \[.*?]:|\[\d{2}.\d{2}.*] (\[user][A-Za-z0-9 \-_]|[A-Za-z0-9 \-_]))/;
  const subdirs = fs.readdirSync(dir);
  for (let i = 0; i < subdirs.length; ++i) {
    progress(i / subdirs.length);
    const subdir = subdirs[i];
    const subdirPath = path.join(dir, subdir);
    if (subdir === '!Notifications' || subdir === 'Global' || !fs.statSync(subdirPath).isDirectory()) continue;

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

    const logFile = path.join(getLogDir(ownCharacter), key);
    if (fs.existsSync(logFile)) fs.unlinkSync(logFile);
    if (fs.existsSync(`${logFile}.idx`)) fs.unlinkSync(`${logFile}.idx`);
    let logFd, indexFd;
    const logIndex = {};
    let size = 0;
    const files = fs.readdirSync(subdirPath);
    for (const file of files
      .map(filename => {
        const date = path.basename(filename, '.txt').split('-');
        return { name: filename, date: new Date(parseInt(date[2], 10), parseInt(date[0], 10) - 1, parseInt(date[1], 10)) };
      })
      .sort((x, y) => x.date.getTime() - y.date.getTime())) {
      if (isNaN(file.date.getTime())) continue;
      const content = fs.readFileSync(path.join(subdirPath, file.name), 'utf8');
      let index = 0,
        start = 0;
      let ignoreLine = false;
      while (index < content.length) {
        if (index === start && adRegex.test(content.substr(start, 14))) ignoreLine = true;
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
            const nextLine = content.substr(index + (char === '\r' ? 2 : 1), 29);
            if (logRegex.test(nextLine) || content.length - index <= 2) {
              const line = content.substring(start, index);
              const message = createMessage(line, ownCharacter, name, isChannel, file.date);
              if (message === undefined) {
                index += char === '\r' ? 2 : 1;
                continue;
              }
              if (indexFd === undefined || logFd === undefined) {
                logFd = fs.openSync(logFile, 'a');
                indexFd = fs.openSync(`${logFile}.idx`, 'a');
              }
              const indexBuffer = checkIndex(logIndex, message, key, name, size);
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

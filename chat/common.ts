import { isToday } from 'date-fns';
import { Keys } from '../keys';
import { Character, Conversation, Settings as ISettings } from './interfaces';
import core from './core';

export function profileLink(this: any | never, character: string): string {
  return `https://www.f-list.net/c/${character}`;
}

export function characterImage(this: any | never, character: string): string {
  const c = core.characters.get(character);

  if (c.overrides.avatarUrl) {
    return c.overrides.avatarUrl;
  }

  return `https://static.f-list.net/images/avatar/${character.toLowerCase()}.png`;
}

export function getByteLength(this: any | never, str: string): number {
  let byteLen = 0;
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c > 0xd800 && c < 0xd8ff)
      //surrogate pairs
      c = (c - 0xd800) * 0x400 + str.charCodeAt(++i) - 0xdc00 + 0x10000;
    byteLen +=
      c < 0x80
        ? 1
        : c < 0x800
          ? 2
          : c < 0x10000
            ? 3
            : c < 0x200000
              ? 4
              : c < 0x4000000
                ? 5
                : 6;
  }
  return byteLen;
}

export class Settings implements ISettings {
  playSound = true;
  clickOpensMessage = false;
  disallowedTags: string[] = [];
  notifications = true;
  highlight = true;
  highlightWords: string[] = [];
  showAvatars = true;
  animatedEicons = true;
  idleTimer = 0;
  messageSeparators = false;
  eventMessages = true;
  joinMessages = false;
  alwaysNotify = false;
  logMessages = true;
  logAds = false;
  fontSize = 14;
  showNeedsReply = false;
  enterSend = true;
  colorBookmarks = false;
  bbCodeBar = true;

  risingAdScore = true;
  risingLinkPreview = true;
  risingAutoCompareKinks = true;

  risingAutoExpandCustomKinks = true;
  risingCharacterPreview = true;
  risingComparisonInUserMenu = true;
  risingComparisonInSearch = true;

  risingShowUnreadOfflineCount = true;
  risingColorblindMode = false;
  risingShowPortraitNearInput = true;
  risingShowPortraitInMessage = true;
  risingShowHighQualityPortraits = true;
  horizonShowCustomCharacterColors = true;
  horizonShowDeveloperBadges = true;
  horizonShowGenderMarker = false;
  horizonGenderMarkerOrigColor = false;
  horizonVanillaGenderColors = false;
  horizonChangeOfflineColor = false;
  horizonNotifyFriendSignIn = false;
  horizonHighlightUsers: string[] = [];

  horizonCacheDraftMessages = true;
  horizonSaveDraftMessagesToDiskTimer = 60;

  risingFilter = {
    hideAds: false,
    hideSearchResults: false,
    hideChannelMembers: false,
    hidePublicChannelMessages: false,
    hidePrivateChannelMessages: false,
    hidePrivateMessages: false,
    showFilterIcon: true,
    penalizeMatches: true,
    rewardNonMatches: false,
    autoReply: true,
    autoReplyCustom: false,
    autoReplyCustomMessage:
      '\n' +
      '[sub][color=orange][b][AUTOMATED MESSAGE][/b][/color][/sub]\n' +
      'Sorry, the player of this character is not interested in characters matching your profile.\n' +
      '\n' +
      '✨ Need a filter for yourself? Try out [url=https://horizn.moe/]F-Chat Horizon[/url]',
    minAge: null,
    maxAge: null,
    smartFilters: {
      ageplay: false,
      anthro: false,
      female: false,
      feral: false,
      human: false,
      hyper: false,
      incest: false,
      intersex: false,
      male: false,
      microMacro: false,
      obesity: false,
      pokemon: false,
      pregnancy: false,
      rape: false,
      scat: false,
      std: false,
      taur: false,
      gore: false,
      vore: false,
      unclean: false,
      watersports: false,
      zoophilia: false
    },
    exceptionNames: []
  };

  risingCharacterTheme = undefined;
  soundTheme = 'default';
  // Per-theme per-sound volume overrides. Structure: { [themeName]: { [soundName]: volumeNumber(0-1) } }
  soundThemeSoundVolumes: { [theme: string]: { [sound: string]: number } } = {};
}

export class AdSettings implements Conversation.AdSettings {
  ads: string[] = [];
  randomOrder = false;
  lastAdTimestamp = 0;
}

export class ConversationSettings implements Conversation.Settings {
  notify = Conversation.Setting.Default;
  highlight = Conversation.Setting.Default;
  highlightWords: string[] = [];
  joinMessages = Conversation.Setting.Default;
  defaultHighlights = true;
  adSettings: Conversation.AdSettings = {
    ads: [],
    randomOrder: false,
    lastAdTimestamp: 0
  };
  horizonHighlightUsers: string[] = [];
}

function pad(num: number): string | number {
  return num < 10 ? `0${num}` : num;
}

export function formatTime(
  this: any | never,
  date: Date,
  noDate: boolean = false
): string {
  if (!noDate && isToday(date))
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function messageToString(
  this: any | never,
  msg: Conversation.Message,
  timeFormatter: (date: Date) => string = formatTime,
  characterTransform: (str: string) => string = x => x,
  textTransform: (str: string) => string = x => x
): string {
  let text = `[${timeFormatter(msg.time)}] `;
  if (msg.type !== Conversation.Message.Type.Event)
    text +=
      (msg.type === Conversation.Message.Type.Action ? '*' : '') +
      characterTransform(msg.sender.name) +
      (msg.type === Conversation.Message.Type.Message ? ':' : '');
  return `${text} ${textTransform(msg.text)}\r\n`;
}

export function getKey(e: KeyboardEvent): Keys {
  // tslint:disable-next-line deprecation
  return e.keyCode;
}

/*tslint:disable:no-any no-unsafe-any*/ //because errors can be any
export function errorToString(e: any): string {
  return e instanceof Error ? e.message : e !== undefined ? e.toString() : '';
}

//tslint:enable

let messageId = 0;

export class Message implements Conversation.ChatMessage {
  readonly id = ++messageId;
  isHighlight = false;

  score = 0;
  filterMatch = false;

  constructor(
    readonly type: Conversation.Message.Type,
    readonly sender: Character,
    readonly text: string,
    readonly time: Date = new Date()
  ) {
    if (Conversation.Message.Type[type] === undefined)
      throw new Error('Unknown type'); //tslint:disable-line
  }
}

export class EventMessage implements Conversation.EventMessage {
  readonly id = ++messageId;
  readonly type = Conversation.Message.Type.Event;

  readonly score = 0;
  filterMatch = false;

  constructor(
    readonly text: string,
    readonly time: Date = new Date()
  ) {}
}

export class BroadcastMessage implements Conversation.BcastMessage {
  readonly id = ++messageId;
  readonly type = Conversation.Message.Type.Bcast;

  readonly score = 0;
  filterMatch = false;

  constructor(
    readonly text: string,
    readonly sender: Character,
    readonly time: Date = new Date()
  ) {}
}

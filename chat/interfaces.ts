//tslint:disable:no-shadowed-variable
import { Connection } from '../fchat';

import { Channel, Character } from '../fchat/interfaces';
import { AdManager } from './ads/ad-manager';
import { SmartFilterSettings } from '../learn/filter/types';
export { Connection, Channel, Character } from '../fchat/interfaces';
export const userStatuses: ReadonlyArray<Character.Status> = [
  'online',
  'looking',
  'away',
  'busy',
  'dnd'
];
export const channelModes: ReadonlyArray<Channel.Mode> = [
  'chat',
  'ads',
  'both'
];
import { Ad } from './ads/ad-center';

export namespace Conversation {
  interface BaseMessage {
    readonly id: number;
    readonly type: Message.Type;
    readonly text: string;
    readonly time: Date;

    score: number;
    filterMatch: boolean;
  }

  export interface EventMessage extends BaseMessage {
    readonly type: Message.Type.Event;
  }

  export interface BcastMessage extends BaseMessage {
    readonly type: Message.Type.Bcast;
    readonly sender: Character;
  }

  export interface ChatMessage extends BaseMessage {
    readonly isHighlight: boolean;
    readonly sender: Character;
  }

  export type Message = BcastMessage | EventMessage | ChatMessage;

  export interface SFCMessage extends EventMessage {
    sfc: Connection.ServerCommands['SFC'] & { confirmed?: true };
  }

  export namespace Message {
    export enum Type {
      Message,
      Action,
      Ad,
      Roll,
      Warn,
      Event,
      Bcast
    }
  }

  export type RecentChannelConversation = {
    readonly channel: string;
    readonly name: string;
  };
  export type RecentPrivateConversation = { readonly character: string };

  export type TypingStatus = 'typing' | 'paused' | 'clear';

  interface TabConversation extends Conversation {
    isPinned: boolean;
    readonly maxMessageLength: number;
    close(): Promise<void> | void;
    sort(newIndex: number): Promise<void>;
  }

  export interface PrivateConversation extends TabConversation {
    readonly character: Character;
    readonly typingStatus: TypingStatus;

    sendMessageEx(text: string): Promise<void>;
  }

  export interface ChannelConversation extends TabConversation {
    readonly channel: Channel;
    mode: Channel.Mode;
    readonly nextAd: number;
    isSendingAds: boolean;

    isSendingAutomatedAds(): boolean;
    toggleAutomatedAds(): void;
    hasAutomatedAds(): boolean;

    sendAd(text: string): Promise<void>;
  }

  export function isPrivate(
    conversation: Conversation
  ): conversation is PrivateConversation {
    return (<Partial<PrivateConversation>>conversation).character !== undefined;
  }

  export function isChannel(
    conversation: Conversation
  ): conversation is ChannelConversation {
    return (<Partial<ChannelConversation>>conversation).channel !== undefined;
  }

  export interface State {
    readonly privateConversations: ReadonlyArray<PrivateConversation>;
    readonly channelConversations: ReadonlyArray<ChannelConversation>;
    readonly consoleTab: Conversation;
    readonly recent: ReadonlyArray<RecentPrivateConversation>;
    readonly recentChannels: ReadonlyArray<RecentChannelConversation>;
    readonly selectedConversation: Conversation;
    readonly hasNew: boolean;
    byKey(key: string): Conversation | undefined;

    getPrivate(character: Character): PrivateConversation;
    getPrivate(
      character: Character,
      noCreate: boolean
    ): PrivateConversation | undefined;
  }

  export enum Setting {
    True,
    False,
    Default
  }

  export interface Settings {
    readonly notify: Setting;
    readonly highlight: Setting;
    readonly highlightWords: ReadonlyArray<string>;
    readonly joinMessages: Setting;
    readonly defaultHighlights: boolean;
    readonly adSettings: AdSettings;
    readonly horizonHighlightUsers: ReadonlyArray<string>;
  }

  export interface AdSettings {
    readonly ads: string[];
    readonly randomOrder: boolean;
    readonly lastAdTimestamp: number;
  }

  export const enum UnreadState {
    None,
    Unread,
    Mention
  }

  export interface Conversation {
    enteredText: string;
    infoText: string;
    readonly name: string;
    readonly messages: ReadonlyArray<Message>;
    readonly reportMessages: ReadonlyArray<Message>;
    readonly lastRead: Message | undefined;
    errorText: string;
    readonly key: string;
    readonly unread: UnreadState;
    settings: Settings;
    readonly adManager: AdManager;
    send(): Promise<void>;
    clear(): void;
    loadLastSent(): void;
    show(): void;
    loadMore(): boolean;
    markRead(): void;
  }
}

export type Conversation = Conversation.Conversation;

export namespace Logs {
  export type Conversation = { readonly key: string; readonly name: string };
}

export interface Logs {
  logMessage(
    conversation: Conversation,
    message: Conversation.Message
  ): Promise<void> | void;
  getBacklog(
    conversation: Conversation
  ): Promise<ReadonlyArray<Conversation.Message>>;
  getConversations(
    character: string
  ): Promise<ReadonlyArray<Logs.Conversation>>;
  getLogs(
    character: string,
    key: string,
    date: Date
  ): Promise<ReadonlyArray<Conversation.Message>>;
  getLogDates(character: string, key: string): Promise<ReadonlyArray<Date>>;
  getAvailableCharacters(): Promise<ReadonlyArray<string>>;
  canZip: boolean;
}

export type SearchKink = { id: number; name: string; description: string };
export type SearchSpecies = {
  id: number;
  name: string;
  shortName: string;
  details: string;
  keywords: string;
};

export interface SearchData {
  kinks: SearchKink[];
  genders: string[];
  orientations: string[];
  languages: string[];
  furryprefs: string[];
  roles: string[];
  positions: string[];
  bodytypes: string[];
}

export interface ExtendedSearchData extends SearchData {
  species: SearchSpecies[];
}

export namespace Settings {
  export type Keys = {
    settings: Settings;
    pinned: { channels: string[]; private: string[] };
    conversationSettings: { [key: string]: Conversation.Settings | undefined };
    modes: { [key: string]: Channel.Mode | undefined };
    recent: Conversation.RecentPrivateConversation[];
    recentChannels: Conversation.RecentChannelConversation[];
    hiddenUsers: string[];
    favoriteEIcons: Record<string, boolean>;
    statusHistory: string[];
    searchHistory: (ExtendedSearchData | SearchData)[];
    hideNonMatchingAds: boolean;
    hideProfileComparisonSummary: boolean;
    ads: Ad[];
  };

  export interface Store {
    get<K extends keyof Keys>(
      key: K,
      character?: string
    ): Promise<Keys[K] | undefined>;
    getAvailableCharacters(): Promise<ReadonlyArray<string>>;
    set<K extends keyof Keys>(key: K, value: Keys[K]): Promise<void>;
  }

  export interface Settings {
    readonly playSound: boolean;
    readonly clickOpensMessage: boolean;
    readonly disallowedTags: ReadonlyArray<string>;
    readonly notifications: boolean;
    readonly highlight: boolean;
    readonly highlightWords: ReadonlyArray<string>;
    readonly showAvatars: boolean;
    readonly animatedEicons: boolean;
    readonly smoothMosaics: boolean;
    readonly idleTimer: number;
    readonly messageSeparators: boolean;
    readonly eventMessages: boolean;
    readonly joinMessages: boolean;
    readonly alwaysNotify: boolean;
    readonly logMessages: boolean;
    readonly logAds: boolean;
    readonly fontSize: number;
    readonly showNeedsReply: boolean;
    readonly enterSend: boolean;
    readonly colorBookmarks: boolean;
    readonly bbCodeBar: boolean;

    readonly risingAdScore: boolean;
    readonly risingLinkPreview: boolean;
    readonly risingAutoCompareKinks: boolean;

    readonly risingAutoExpandCustomKinks: boolean;
    readonly risingCharacterPreview: boolean;
    readonly risingComparisonInUserMenu: boolean;
    readonly risingComparisonInSearch: boolean;

    readonly risingShowUnreadOfflineCount: boolean;
    readonly risingColorblindMode: boolean;
    readonly risingShowPortraitNearInput: boolean;
    readonly risingShowPortraitInMessage: boolean;
    readonly risingShowHighQualityPortraits: boolean;
    readonly horizonShowCustomCharacterColors: boolean;
    readonly horizonShowDeveloperBadges: boolean;
    readonly horizonShowGenderMarker: boolean;
    readonly horizonGenderMarkerOrigColor: boolean;
    readonly horizonChangeOfflineColor: boolean;
    readonly horizonNotifyFriendSignIn: boolean;
    readonly horizonHighlightUsers: ReadonlyArray<string>;

    readonly horizonCacheDraftMessages: boolean;
    readonly horizonSaveDraftMessagesToDiskTimer: number;

    readonly risingFilter: SmartFilterSettings;

    readonly risingCharacterTheme: string | undefined;
    readonly soundTheme: string;
  }
}

export type Settings = Settings.Settings;

export interface Notifications {
  isInBackground: boolean;
  notify(
    conversation: Conversation,
    title: string,
    body: string,
    icon: string,
    sound: string
  ): Promise<void>;
  playSound(sound: string): void;
  requestPermission(): Promise<void>;
  initSounds(sounds: ReadonlyArray<string>): Promise<void>;
}

export interface State {
  settings: Settings;
  hiddenUsers: string[];
  favoriteEIcons: Record<string, boolean>;
}

import { Character as CharacterProfile } from '../site/character_page/interfaces';
import { CharacterOverrides } from './characters';

//tslint:disable:no-shadowed-variable
export namespace Connection {
  export type ClientCommands = {
    ACB: { character: string };
    AOP: { character: string };
    BRO: { message: string };
    CBL: { channel: string };
    CBU: { character: string; channel: string };
    CCR: { channel: string };
    CDS: { channel: string; description: string };
    CHA: undefined;
    CIU: { channel: string; character: string };
    CKU: { channel: string; character: string };
    COA: { channel: string; character: string };
    COL: { channel: string };
    COR: { channel: string; character: string };
    CRC: { channel: string };
    CSO: { character: string; channel: string };
    CTU: { channel: string; character: string; length: number };
    CUB: { channel: string; character: string };
    DOP: { character: string };
    FKS: {
      kinks: ReadonlyArray<number>;
      genders?: ReadonlyArray<string>;
      orientations?: ReadonlyArray<string>;
      languages?: ReadonlyArray<string>;
      furryprefs?: ReadonlyArray<string>;
      roles?: ReadonlyArray<string>;
    };
    FRL: undefined;
    IDN: { method: 'ticket'; account: string; ticket: string; character: string; cname: string; cversion: string };
    IGN: { action: 'add' | 'delete' | 'notify'; character: string } | { action: 'list' };
    JCH: { channel: string };
    KIC: { channel: string };
    KIK: { character: string };
    KIN: { character: string };
    LCH: { channel: string };
    LRP: { channel: string; message: string };
    MSG: { channel: string; message: string };
    ORS: undefined;
    PCR: undefined;
    PIN: undefined;
    PRI: { recipient: string; message: string };
    PRO: { character: string };
    RLD: { save: string } | undefined;
    RLL: { channel: string; dice: 'bottle' | string } | { recipient: string; dice: 'bottle' | string };
    RMO: { channel: string; mode: Channel.Mode };
    RST: { channel: string; status: 'public' | 'private' };
    SCP: { action: 'add' | 'remove'; character: string };
    RWD: { character: string };
    SFC: { action: 'report'; report: string; tab?: string; logid: number } | { action: 'confirm'; callid: number };
    STA: { status: Character.Status; statusmsg: string };
    TMO: { character: string; time: number; reason: string };
    TPN: { character: string; status: Character.TypingStatus };
    UNB: { character: string };
    UPT: undefined;
    ZZZ: { command: string; arg: string };
  };

  export type ServerCommands = {
    ADL: { ops: ReadonlyArray<string> };
    AOP: { character: string };
    BRO: { message: string; character?: string };
    CBU: { operator: string; channel: string; character: string };
    CDS: { channel: string; description: string };
    CHA: { channels: ReadonlyArray<{ name: string; mode: Channel.Mode; characters: number }> };
    CIU: { sender: string; title: string; name: string };
    CKU: { operator: string; channel: string; character: string };
    COA: { character: string; channel: string };
    COL: { channel: string; oplist: ReadonlyArray<string> };
    CON: { count: number };
    COR: { character: string; channel: string };
    CSO: { character: string; channel: string };
    CTU: { operator: string; channel: string; length: number; character: string };
    DOP: { character: string };
    ERR: { number: number; message: string };
    FKS: { characters: ReadonlyArray<string>; kinks: ReadonlyArray<number> };
    FLN: { character: string };
    FRL: { characters: ReadonlyArray<string> };
    HLO: { message: string };
    ICH: { users: ReadonlyArray<{ identity: string }>; channel: string; mode: Channel.Mode };
    IDN: { character: string };
    IGN: { action: 'add' | 'delete'; character: string } | { action: 'list' | 'init'; characters: ReadonlyArray<string> };
    JCH: { channel: string; character: { identity: string }; title: string };
    KID: { type: 'start' | 'end'; message: string } | { type: 'custom'; key: number; value: number };
    LCH: { channel: string; character: string };
    LIS: { characters: ReadonlyArray<[string, Character.Gender, Character.Status, string]> };
    LRP: { character: string; message: string; channel: string };
    MSG: { character: string; message: string; channel: string };
    NLN: { identity: string; gender: Character.Gender; status: 'online' };
    ORS: { channels: ReadonlyArray<{ name: string; title: string; characters: number }> };
    PIN: undefined;
    PRD: { type: 'start' | 'end'; message: string } | { type: 'info' | 'select'; key: string; value: string };
    PRI: { character: string; message: string };
    RLL:
      | {
          type: 'dice';
          results: ReadonlyArray<number>;
          message: string;
          rolls: ReadonlyArray<string>;
          character: string;
          endresult: number;
          channel: string;
        }
      | {
          type: 'dice';
          results: ReadonlyArray<number>;
          message: string;
          rolls: ReadonlyArray<string>;
          character: string;
          endresult: number;
          recipient: string;
        }
      | { type: 'bottle'; message: string; character: string; target: string; channel: string }
      | { type: 'bottle'; message: string; character: string; target: string; recipient: string };
    RMO: { mode: Channel.Mode; channel: string };
    RTB:
      | {
          type: 'comment';
          target_type: 'newspost' | 'bugreport' | 'changelog' | 'feature';
          id: number;
          target_id: number;
          parent_id: number;
          name: string;
          target: string;
        }
      | { type: 'note'; sender: string; subject: string; id: number }
      | {
          type: 'grouprequest' | 'bugreport' | 'helpdeskticket' | 'helpdeskreply' | 'featurerequest';
          name: string;
          id: number;
          title?: string;
        }
      | { type: 'trackadd' | 'trackrem' | 'friendadd' | 'friendremove' | 'friendrequest'; name: string };
    SFC:
      | { action: 'confirm'; moderator: string; character: string; timestamp: string; tab: string; logid: number }
      | {
          callid: number;
          action: 'report';
          report: string;
          timestamp: string;
          character: string;
          tab: string;
          logid: number;
          old?: true;
        };
    STA: { status: Character.Status; character: string; statusmsg: string };
    SYS: { message: string; channel?: string };
    TPN: { character: string; status: Character.TypingStatus };
    UPT: { time: number; starttime: number; startstring: string; accepted: number; channels: number; users: number; maxusers: number };
    VAR: { variable: string; value: number | ReadonlyArray<string> };
    ZZZ: { message: string };
  };

  export type CommandHandler<T extends keyof ServerCommands> = (data: ServerCommands[T], date: Date) => Promise<void> | void;
  export type TicketProvider = () => Promise<string>;
  export type EventType = 'connecting' | 'connected' | 'closed';
  export type EventHandler = (isReconnect: boolean) => Promise<void> | void;

  export interface Vars {
    chat_max: number;
    priv_max: number;
    lfrp_max: number;
    cds_max: number;
    lfrp_flood: number;
    msg_flood: number;
    sta_flood: number;
    permissions: number;
    icon_blacklist: ReadonlyArray<string>;
  }

  export interface Connection {
    readonly character: string;
    readonly vars: Readonly<Vars>;
    readonly isOpen: boolean;
    setCredentials(account: string, ticketProvider: TicketProvider | string): void;
    connect(character: string): void;
    close(keepState?: boolean): void;
    onMessage<K extends keyof ServerCommands>(type: K, handler: CommandHandler<K>): void;
    offMessage<K extends keyof ServerCommands>(type: K, handler: CommandHandler<K>): void;
    onEvent(type: EventType, handler: EventHandler): void;
    offEvent(type: EventType, handler: EventHandler): void;
    onError(handler: (error: Error) => void): void;
    send(type: 'CHA' | 'FRL' | 'ORS' | 'PCR' | 'PIN' | 'UPT'): void;
    send<K extends keyof ClientCommands>(type: K, data: ClientCommands[K]): void;
    queryApi<T = object>(endpoint: string, data?: object): Promise<T>;
  }
}
export type Connection = Connection.Connection;

export namespace Character {
  export type Gender = 'None' | 'Male' | 'Female' | 'Shemale' | 'Herm' | 'Male-Herm' | 'Cunt-boy' | 'Transgender';
  export type Status = 'offline' | 'online' | 'away' | 'idle' | 'looking' | 'busy' | 'dnd' | 'crown';
  export type TypingStatus = 'typing' | 'paused' | 'clear';

  export interface State {
    readonly ownCharacter: Character;
    readonly friends: ReadonlyArray<Character>;
    readonly bookmarks: ReadonlyArray<Character>;
    readonly ignoreList: ReadonlyArray<string>;
    readonly opList: ReadonlyArray<string>;
    readonly friendList: ReadonlyArray<string>;
    readonly bookmarkList: ReadonlyArray<string>;

    readonly ownProfile: CharacterProfile;

    get(name: string): Character;
    setOverride(name: string, type: keyof CharacterOverrides, value: any): void;
  }

  export interface Character {
    readonly name: string;
    readonly gender: Gender | undefined;
    readonly status: Status;
    readonly statusText: string;
    readonly isFriend: boolean;
    readonly isBookmarked: boolean;
    readonly isChatOp: boolean;
    readonly isIgnored: boolean;
    readonly overrides: CharacterOverrides;
  }
}

export type Character = Character.Character;

export namespace Channel {
  export type EventHandler = (type: 'join' | 'leave', channel: Channel, member?: Member) => Promise<void> | void;

  export interface State {
    readonly officialChannels: { readonly [key: string]: ListItem | undefined };
    readonly openRooms: { readonly [key: string]: ListItem | undefined };
    readonly joinedChannels: ReadonlyArray<Channel>;

    join(name: string): void;
    leave(name: string): void;
    onEvent(handler: EventHandler): void;
    getChannelItem(id: string): ListItem | undefined;
    getChannel(id: string): Channel | undefined;
    requestChannelsIfNeeded(maxAge: number): void;
  }

  export const enum Rank {
    Member,
    Op,
    Owner
  }

  export type Mode = 'chat' | 'ads' | 'both';

  export interface Member {
    readonly character: Character;
    readonly rank: Rank;
  }

  export interface ListItem {
    readonly id: string;
    readonly name: string;
    readonly memberCount: number;
    readonly isJoined: boolean;
  }

  export interface Channel {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly mode: Mode;
    readonly members: { readonly [key: string]: Member | undefined };
    readonly sortedMembers: ReadonlyArray<Member>;
    readonly opList: ReadonlyArray<string>;
    readonly owner: string;
  }
}

export type Channel = Channel.Channel;

export namespace WebSocketConnection {
  export enum ReadyState {
    CONNECTING,
    OPEN,
    CLOSING,
    CLOSED
  }
}

export interface WebSocketConnection {
  close(): void;
  onMessage(handler: (message: string) => Promise<void>): void;
  onOpen(handler: () => void): void;
  onClose(handler: (e: CloseEvent) => void): void;
  onError(handler: (error: Error) => void): void;
  send(message: string): void;
  readyState: WebSocketConnection.ReadyState;
}

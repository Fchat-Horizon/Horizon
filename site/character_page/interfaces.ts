import {
  Character as CharacterInfo,
  CharacterImage,
  CharacterSettings,
  KinkChoice,
  SharedDefinitions,
  SimpleCharacter
} from '../../interfaces';

export interface SharedStore {
  shared: SharedDefinitions;
  authenticated: boolean;
}

export interface StoreMethods {
  bookmarkUpdate(id: number, state: boolean): Promise<void>;

  characterBlock?(id: number, block: boolean, reason?: string): Promise<void>;
  characterCustomKinkAdd(
    id: number,
    name: string,
    description: string,
    choice: KinkChoice
  ): Promise<void>;
  /**
   * This is the, "I need the data returned right now" version of `CacheManager.addProfile`. Where that function adds the profile fetching to a queue (which calls characterData then adds the character profile to the profile cache), this function directly returns the character profile.
   *
   * All values are passed to `executeCharacterData`.
   * @param name Character name
   * @param definitions Custom kink definitions to use? Otherwise, {@link Store.shared} is used.
   * @param skipEvent (Default: false) Do not emit the `character-data` {@link EventBus | `EventBus`} event.
   * @returns Character with name `name`
   *
   * Comment imported from Frolic; may be inaccurate if significant changes occured.
   */
  characterData(
    name: string | undefined,
    id: number | undefined,
    skipEvent: boolean | undefined
  ): Promise<Character>;
  characterDelete(id: number): Promise<void>;
  characterDuplicate(id: number, name: string): Promise<void>;
  characterFriends(id: number): Promise<FriendsByCharacter>;
  characterNameCheck(name: string): Promise<void>;
  characterRename?(
    id: number,
    name: string,
    renamedFor?: string
  ): Promise<void>;
  characterReport(reportData: CharacterReportData): Promise<void>;

  contactMethodIconUrl(name: string): string;
  sendNoteUrl(character: CharacterInfo): string;

  fieldsGet(): Promise<void>;

  friendDissolve(friend: Friend): Promise<void>;
  friendRequest(target: number, source: number): Promise<Friend | number>;
  friendRequestAccept(request: FriendRequest): Promise<Friend>;
  friendRequestIgnore(request: FriendRequest): Promise<void>;
  friendRequestCancel(request: FriendRequest): Promise<void>;

  friendsGet(id: number): Promise<SimpleCharacter[]>;

  groupsGet(id: number): Promise<CharacterGroup[]>;

  guestbookPageGet(
    character: number,
    offset?: number,
    limit?: number,
    unapproved_only?: boolean
  ): Promise<Guestbook>;
  guestbookPostApprove(
    character: number,
    id: number,
    approval: boolean
  ): Promise<void>;
  guestbookPostDelete(character: number, id: number): Promise<void>;
  guestbookPostPost(
    target: number,
    source: number,
    message: string,
    privatePost: boolean
  ): Promise<void>;
  guestbookPostReply(
    character: number,
    id: number,
    reply: string | null
  ): Promise<void>;

  hasPermission?(permission: string): boolean;

  imagesGet(id: number): Promise<CharacterImage[]>;
  imageUrl(image: CharacterImage): string;
  imageThumbUrl(image: CharacterImage): string;

  kinksGet(id: number): Promise<CharacterKink[]>;

  memoUpdate(id: number, memo: string): Promise<void>;
}

export type SiteDate = number | string | null;
export type KinkChoiceFull = KinkChoice | number;
export const CONTACT_GROUP_ID = 1;

export interface DisplayKink {
  id: number;
  name: string;
  description: string;
  choice?: KinkChoice;
  group: number;
  isCustom: boolean;
  hasSubkinks: boolean;
  viewerChoiceWeight?: number;
  subkinks: DisplayKink[];
  ignore: boolean;
  key: string;
}

export interface CharacterKink {
  id: number;
  choice: KinkChoice;
}

export type ThreadOrderMode = 'post' | 'explicit';

export interface GroupPermissions {
  view: boolean;
  edit: boolean;
  threads: boolean;
  permissions: boolean;
}

export interface CharacterGroup {
  id: number;
  title: string;
  public: boolean;
  description: string;
  threadCount: number;
  orderMode: ThreadOrderMode;
  createdAt: SiteDate;
  myPermissions: GroupPermissions;
  character: SimpleCharacter;
  owner: boolean;
}

export interface CharacterMemo {
  id: number;
  memo: string;
}

/**
 * Character page API response (including the public character page as `character`).
 */
export interface Character {
  readonly is_self: boolean;
  character: CharacterInfo;
  readonly settings: CharacterSettings;
  readonly badges?: string[];
  memo?: CharacterMemo;
  readonly character_list?: {
    id: number;
    name: string;
  }[];
  bookmarked?: boolean;
  readonly self_staff: boolean;
  readonly ban?: string;
  readonly ban_reason?: string;
  readonly timeout?: number;
  readonly block_reason?: string;
}

export interface GuestbookPost {
  readonly id: number;
  readonly character: SimpleCharacter;
  approved: boolean;
  readonly private: boolean;
  postedAt: SiteDate;
  message: string;
  reply: string | null;
  repliedAt: SiteDate;
  canEdit: boolean;
  deleted?: boolean;
}

export interface Guestbook {
  readonly posts: GuestbookPost[];
  readonly total: number;
}

export interface CharacterReportData {
  subject: string;
  message: string;
  character: number | null;
  type: string;
  url: string;
  reported_character: number;
}

export interface Friend {
  id: number;
  source: SimpleCharacter;
  target: SimpleCharacter;
  createdAt: SiteDate;
}

export type FriendRequest = Friend;

export interface FriendsByCharacter {
  existing: Friend[];
  pending: FriendRequest[];
  incoming: FriendRequest[];
  name: string;
}

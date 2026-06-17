/**
 * The most simple character structure, used primarily for listing your characters on the log-in selector.
 *
 * Character name, unique ID, and whether or not the character exists.
 *
 * Comment imported from Frolic; may be inaccurate if significant changes occured.
 */
export interface SimpleCharacter {
  id: number;
  name: string;
  deleted: boolean;
}

export interface InlineImage {
  id: number;
  name: string;
  hash: string;
  extension: string;
  nsfw: boolean;
}

export type CharacterImage = CharacterImageOld | CharacterImageNew;

export interface CharacterImageNew {
  id: number;
  extension: string;
  description: string;
  hash: string;
  sort_order: number | null;
}

export interface CharacterImageOld {
  id: number;
  extension: string;
  hash: string;
  height: number;
  width: number;
  description: string;
  sort_order: number | null;
  url: string;
}

export type InfotagType = 'number' | 'text' | 'list';

export interface CharacterInfotag {
  list?: number;
  string?: string;
  number?: number;
}

export interface Infotag {
  id: number;
  name: string;
  type: InfotagType;
  search_field: string;
  validator?: string;
  allow_legacy: boolean;
  infotag_group: number;
}

/**
 * Public character page. Why does this extend SimpleCharacter? Investigate usage.
 *
 * @see [file://site/character_page/interfaces.ts](site/character_page/interfaces.ts)
 *
 * Comment imported from Frolic; may be inaccurate if significant changes occured.
 */
export interface Character extends SimpleCharacter {
  id: number;
  name: string;
  title: string;
  description: string;
  kinks: { [key: number]: KinkChoice | number | undefined };
  inlines: { [key: string]: InlineImage };
  customs: { [key: string]: CustomKink | undefined };
  infotags: { [key: number]: CharacterInfotag | undefined };
  created_at: number;
  updated_at: number;
  views: number;
  last_online_at?: number;
  timezone?: number;
  image_count?: number;
  online_chat?: boolean;
}

export type KinkChoice = 'favorite' | 'yes' | 'maybe' | 'no';

export interface CharacterSettings {
  readonly customs_first: boolean;
  readonly show_friends: boolean;
  readonly show_badges: boolean;
  readonly guestbook: boolean;
  readonly block_bookmarks: boolean;
  readonly public: boolean;
  readonly moderate_guestbook: boolean;
  readonly hide_timezone: boolean;
  readonly hide_contact_details: boolean;
}

export interface Kink {
  id: number;
  name: string;
  description: string;
  kink_group: number;
}

export interface CustomKink {
  id: number;
  name: string;
  choice: KinkChoice;
  description: string;
}

export interface KinkGroup {
  id: number;
  name: string;
  description: string;
  sort_order: number;
}

export interface InfotagGroup {
  id: number;
  name: string;
  description: string;
  sort_order: number;
}

export interface ListItem {
  id: number;
  name: string;
  value: string;
  sort_order: number;
}

export const enum InlineDisplayMode {
  DISPLAY_ALL,
  DISPLAY_SFW,
  DISPLAY_NONE
}

export interface Settings {
  animateEicons: boolean;
  smoothMosaics: boolean;
  inlineDisplayMode: InlineDisplayMode;
  defaultCharacter: number;
  fuzzyDates: boolean;
}

export interface SharedDefinitions {
  readonly listItems: { readonly [key: string]: Readonly<ListItem> };
  readonly kinks: { readonly [key: string]: Readonly<Kink> };
  readonly kinkGroups: { readonly [key: string]: Readonly<KinkGroup> };
  readonly infotags: { readonly [key: string]: Readonly<Infotag> };
  readonly infotagGroups: { readonly [key: string]: Readonly<InfotagGroup> };
}

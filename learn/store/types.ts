// tslint:disable-next-line:no-duplicate-imports
// import * as path from 'path';
// import core from '../../chat/core';

import { Character as ComplexCharacter, CharacterGroup, Guestbook } from '../../site/character_page/interfaces';
import { CharacterImage, SimpleCharacter } from '../../interfaces';
import { FurryPreference, Gender, Orientation, Species } from '../matcher-types';

// This design should be refactored; it's bad
export interface ProfileRecord {
  id: string;
  name: string;
  profileData: ComplexCharacter;
  firstSeen: number;
  lastFetched: number;
  gender: Gender | null;
  orientation: Orientation | null;
  furryPreference: FurryPreference | null;
  species: Species | null;
  age: number | null;
  domSubRole: number | null;
  position: number | null;

  // lastCounted: number | null;
  // guestbookCount: number | null;
  // friendCount: number | null;
  // groupCount: number | null;

  lastMetaFetched: number | null;
  guestbook: Guestbook | null;
  images: CharacterImage[] | null;
  friends: SimpleCharacter[] | null;
  groups: CharacterGroup[] | null;
}

// export type Statement = any;
// export type Database = any;

export interface PermanentIndexedStore {
  getProfile(name: string): Promise<ProfileRecord | undefined>;
  storeProfile(c: ComplexCharacter): Promise<void>;

  updateProfileMeta(
    name: string,
    images: CharacterImage[] | null,
    guestbook: Guestbook | null,
    friends: SimpleCharacter[] | null,
    groups: CharacterGroup[] | null
  ): Promise<void>;

  flushProfiles(daysToExpire: number): Promise<void>;

  start(): Promise<void>;
  stop(): Promise<void>;
}

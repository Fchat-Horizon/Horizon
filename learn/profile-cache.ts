/**
 * @license MPL-2.0
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * @copyright 2024-2026 Sylvia Roselie & Respective Horizon Contributors
 * @version 1.0
 * @see {@link https://github.com/Fchat-Horizon/Horizon|GitHub repo}
 */

import * as _ from 'lodash';

import core from '../chat/core';
import {
  Character as ComplexCharacter,
  CharacterGroup,
  Guestbook
} from '../site/character_page/interfaces';
import { AsyncCache } from './async-cache';
import { Matcher, MatchReport } from './matcher';
import { PermanentIndexedStore } from './store/types';
import { CharacterImage, SimpleCharacter } from '../interfaces';
import { Scoring } from './matcher-types';
import { matchesSmartFilters } from './filter/smart-filter';
import * as remote from '@electron/remote';
import log from 'electron-log'; //tslint:disable-line:match-default-export-name

export interface MetaRecord {
  images: CharacterImage[] | null;
  groups: CharacterGroup[] | null;
  friends: SimpleCharacter[] | null;
  guestbook: Guestbook | null;
  lastMetaFetched: Date | null;
}

export interface CountRecord {
  groupCount: number | null;
  friendCount: number | null;
  guestbookCount: number | null;
  lastCounted: number | null;
}

export interface CharacterMatchSummary {
  matchScore: number;
  // dimensionsAtScoreLevel: number;
  // dimensionsAboveScoreLevel: number;
  // totalScoreDimensions: number;
  searchScore: number;
  isFiltered: boolean;
  autoResponded?: boolean;
}

/**
 * The default value for the profile cache's queue maximum length.
 * If more entries are added to the cache, the least recently used one(s) will be flushed.
 * */
export const PROFILE_CACHE_MAX_ENTRIES: number = 350;

/**
 * The "cache record" holds information about when the character was added to the cache. This information can be useful for deciding when to refresh a character profile or to remove them entirely.
 */
export interface CharacterCacheRecord {
  character: ComplexCharacter;
  lastFetched: Date;
  added: Date;
  // counts?: CountRecord;
  match: CharacterMatchSummary;
  meta?: MetaRecord;
}

export class ProfileCache extends AsyncCache<CharacterCacheRecord> {
  protected store?: PermanentIndexedStore;
  protected lastFetch = Date.now();

  //tracks the order we've been accessing things in, look up "LRU cache"
  private accessOrder: string[] = [];

  private maxCacheSize: number = PROFILE_CACHE_MAX_ENTRIES;

  setStore(store: PermanentIndexedStore): void {
    this.store = store;
  }

  /**
   * Sets the maximum size of the in-memory cache.
   * If the new size is smaller than the current cache size,
   * excess items will be removed from the cache.
   *
   * This value is used in the {@link clampQueueValues | `clampQueueValues`} method to enforce the cache size limit.
   *
   * @param size - The maximum number of items that the cache can hold. If set to 0 or a negative number, the cache size is unlimited.
   */
  public setMaxCacheSize(size: number): void {
    this.maxCacheSize = Math.max(size, PROFILE_CACHE_MAX_ENTRIES);
    this.clampQueueValues();
  }

  /**
   * Moves the specified key to the end of the access order queue.
   * This is mostly intended for marking an item as the most recently accessed.
   *
   * @param key - The key to move to the end of the access order queue.
   * @private
   */
  private moveToQueueEnd(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * Removes a key from the access order array (if it exists).
   * @param key - The key to remove from the access order
   * @private
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Helper method to properly clean up a cache record before removal.
   * Garbage collection is assisted by nullifying references to large objects.
   *
   * @param record - The cache record to clean up
   * @private
   */
  private cleanupRecord(record: CharacterCacheRecord): void {
    // Clear character references to help garbage collection
    if (record.character) {
      // Don't directly modify the character object, just remove our reference
      (record as any).character = null;
    }

    // Clear meta data references
    if (record.meta) {
      if (record.meta.images) {
        (record.meta as any).images = null;
      }
      if (record.meta.groups) {
        (record.meta as any).groups = null;
      }
      if (record.meta.friends) {
        (record.meta as any).friends = null;
      }
      if (record.meta.guestbook) {
        (record.meta as any).guestbook = null;
      }
      (record as any).meta = null;
    }

    // Clear match data (though this is smaller)
    (record as any).match = null;
  }

  /**
   * Ensures the cache size stays within our threshold by evicting the least recently used entries.
   * Eviction occurs by removing entries from the front of the access order queue (least recently used)
   * until the cache size is at or below the maximum allowed size.
   *
   * Does nothing if `maxCacheSize` is not set or is less than 1 (i.e., unlimited).
   *
   * See also {@link setMaxCacheSize | `setMaxCacheSize`}.
   *
   * @private
   * @returns {void}
   */
  private clampQueueValues(): void {
    if (!this.maxCacheSize || this.maxCacheSize < 1) return;

    while (this.accessOrder.length > this.maxCacheSize) {
      const key = this.accessOrder.shift()!;
      const record = this.cache[key];

      if (record) {
        log.debug('cache.evict', { name: record.character.character.name });

        // Clean up the record before deletion
        this.cleanupRecord(record);

        // Remove from cache
        delete this.cache[key];
      }
    }
    log.silly('cache.evict.size', this.accessOrder.length);
  }

  onEachInMemory(cb: (c: CharacterCacheRecord, key: string) => void): void {
    _.each(this.cache, cb);
  }

  /**
   * Query the cache for a player record, returning immediately. Fails with `null` if the character hasn't been cached. Use {@link get | `get` (async)} if you want to reach deeper and get the profile from the disk-backed store and cache it in readily-accessible memory.
   *
   * This method does **NOT** query the server for the character.
   * @param name Character to query the cache for
   * @returns Character profile if it's cached; null otherwise
   *
   * Comment imported from Frolic; may be inaccurate if significant changes occured.
   */
  getSync(name: string): CharacterCacheRecord | null {
    const key = AsyncCache.nameKey(name);

    if (key in this.cache) {
      // back to the end of the queue; don't forget, you're here forever
      this.moveToQueueEnd(key);
      return this.cache[key];
    }

    return null;
  }

  /**
   * Asynchronously gets a character from the in-memory cache, or from the PermanentIndexedStore if it's not in memory. Then register it with the matcher (was matcher data not saved before...?).
   *
   * This method does **NOT** query the server for the character.
   *
   * This function could use some adjustment to ensure it always runs async, as "potentially async" is bad control flow design. Please remove this comment line when you do so. :)
   * @param name Character to retrieve
   * @param skipStore Return negative if the character isn't in the cache
   * @param _fromChannel Unused
   * @returns Preferably a character; null if not in cache and `skipStore`; null if profile is not in the store
   *
   * Comment imported from Frolic; may be inaccurate if significant changes occured.
   */
  async get(
    name: string,
    skipStore: boolean = false,
    _fromChannel?: string
  ): Promise<CharacterCacheRecord | null> {
    const key = AsyncCache.nameKey(name);

    if (key in this.cache) {
      // back to the end of the queue; don't forget, you're here forever
      this.moveToQueueEnd(key);
      return this.cache[key];
    }

    if (!this.store || skipStore) {
      return null;
    }

    const pd = await this.store.getProfile(name);

    if (!pd) {
      return null;
    }

    const cacheRecord = await this.register(pd.profileData, true);

    cacheRecord.lastFetched = new Date(pd.lastFetched * 1000);
    cacheRecord.added = new Date(pd.firstSeen * 1000);

    cacheRecord.meta = {
      lastMetaFetched: pd.lastMetaFetched
        ? new Date(pd.lastMetaFetched * 1000)
        : null,
      groups: pd.groups,
      friends: pd.friends,
      images: pd.images,
      guestbook: pd.guestbook
    };

    return cacheRecord;
  }

  delete(name: string): void {
    const key = AsyncCache.nameKey(name);

    // Clean up the record before deletion
    const record = this.cache[key];
    if (record) {
      this.cleanupRecord(record);
    }

    this.removeFromAccessOrder(key);
    delete this.cache[key];
    log.debug('cache.profile.deleted', { name });
  }

  // async registerCount(name: string, counts: CountRecord): Promise<void> {
  //     const record = await this.get(name);
  //
  //     if (!record) {
  //         // coward's way out
  //         return;
  //     }
  //
  //     record.counts = counts;
  //
  //     if (this.store) {
  //         await this.store.updateProfileCounts(name, counts.guestbookCount, counts.friendCount, counts.groupCount);
  //     }
  // }

  async registerMeta(name: string, meta: MetaRecord): Promise<void> {
    const record = await this.get(name);

    if (!record) {
      // coward's way out
      return;
    }

    record.meta = meta;

    if (this.store) {
      await this.store.updateProfileMeta(
        name,
        meta.images,
        meta.guestbook,
        meta.friends,
        meta.groups
      );
    }
  }

  static isSafeRisingPortraitURL(url: string): boolean {
    if (url.match(/^https?:\/\/static\.f-list\.net\//i)) {
      return true;
    }

    if (url.match(/^https?:\/\/([a-z0-9\-.]+\.)?freeimage\.host\//i)) {
      return true;
    }

    if (url.match(/^https?:\/\/([a-z0-9\-.]+\.)?iili\.io\//i)) {
      return true;
    }

    if (url.match(/^https?:\/\/([a-z0-9\-.]+\.)?redgifs\.com\//i)) {
      return true;
    }

    if (url.match(/^https?:\/\/([a-z0-9\-.]+\.)?e621\.net\//i)) {
      return true;
    }

    if (url.match(/^https?:\/\/([a-z0-9\-.]+\.)?imgchest\.com\//i)) {
      return true;
    }

    if (url.match(/^https?:\/\/([a-z0-9\-.]+\.)?toyhou\.se\//i)) {
      return true;
    }

    return false;
  }

  static isImgurURL(url: string): boolean {
    return !!url.match(/^https?:\/\/([a-z0-9\-.]+\.)?imgur\.com\//i);
  }

  static isValidCharacterNameColor(color: string): boolean {
    if (
      color.match(
        /^(red|blue|white|yellow|pink|gray|green|orange|purple|black|brown|cyan)$/
      )
    ) {
      return true;
    }
    return false;
  }

  static extractHighQualityPortraitURL(description: string): string | null {
    if (!core.state.settings.risingShowHighQualityPortraits) {
      return null;
    }

    // * We should check for both:
    //  [url=https://some.domain.ext/path/to/image.png]Horizon Portrait[/url]
    //  [url=https://some.domain.ext/path/to/image.png]Rising Portrait[/url]
    // * Despite our name change, we should REMAIN COMPATIBLE!
    const match = description.match(
      /\[url=([^\]]*?)]\s*?(Rising|Horizon)\s*?Portrait\s*?\[\/url]/i
    );

    if (match && match[1]) {
      return match[1].trim();
    }

    return null;
  }

  static extractCharacterNameColor(description: string): string | null {
    if (!core.state.settings.horizonShowCustomCharacterColors) {
      return null;
    }

    const match = description.match(
      /\[color=([a-zA-Z]*?)]\s*?Horizon\s*?Color\s*?\[\/color]/i
    );

    if (match && match[1]) {
      return match[1].trim().toLowerCase();
    }

    return null;
  }

  updateOverrides(c: ComplexCharacter): void {
    const avatarUrl = ProfileCache.extractHighQualityPortraitURL(
      c.character.description
    );

    const characterColor = ProfileCache.extractCharacterNameColor(
      c.character.description
    );

    if (avatarUrl) {
      if (!ProfileCache.isSafeRisingPortraitURL(avatarUrl)) {
        log.info('portrait.hq.invalid.domain', { name, url: avatarUrl });
      } else {
        if (c.character.name === core.characters.ownCharacter.name) {
          const parent = remote.getCurrentWindow().webContents;

          parent.send('update-avatar-url', c.character.name, avatarUrl);
        }

        log.info('portrait.hq.url', { name: c.character.name, url: avatarUrl });
        core.characters.setOverride(c.character.name, 'avatarUrl', avatarUrl);
      }
    }

    if (characterColor) {
      if (!ProfileCache.isValidCharacterNameColor(characterColor)) {
        log.info('character.custom.color.invalid', {
          name: c.character.name,
          color: characterColor
        });
      } else {
        if (c.character.name === core.characters.ownCharacter.name) {
          const parent = remote.getCurrentWindow().webContents;
          parent.send(
            'update-character-color',
            c.character.name,
            characterColor
          );
        }

        log.info('character.custom.color.applied', {
          name: c.character.name,
          color: characterColor
        });
        core.characters.setOverride(
          c.character.name,
          'characterColor',
          characterColor
        );
      }
    } else {
      //Let's hope this won't wind up killing memory too
      core.characters.setOverride(c.character.name, 'characterColor', null);
    }
  }

  /**
   * Register the profile with the in-memory cache and (by default) the disk-backed store; putting it through the matcher and smart filters in the process.
   * @param c Response from "character profile" API request
   * @param skipStore (Default: false) Don't add the updated character to the store
   * @returns Character with match details
   *
   * Comment imported from Frolic; may be inaccurate if significant changes occured.
   */
  async register(
    c: ComplexCharacter,
    skipStore: boolean = false,
    shouldMatch: boolean = true
  ): Promise<CharacterCacheRecord> {
    const k = AsyncCache.nameKey(c.character.name);
    const match = ProfileCache.match(c);
    let score = !match || match.score === null ? Scoring.NEUTRAL : match.score;

    if (score === 0) {
      log.info('cache.profile.store.zero.score', { name: c.character.name });
    }

    this.updateOverrides(c);

    const risingFilter = core.state.settings.risingFilter;
    const isFiltered = matchesSmartFilters(c.character, risingFilter);

    const penalty =
      isFiltered && risingFilter.penalizeMatches
        ? -5
        : !isFiltered && risingFilter.rewardNonMatches
          ? 2
          : 0;

    if (isFiltered && risingFilter.penalizeMatches) {
      score = Scoring.MISMATCH;
    }

    const searchScore = match
      ? Matcher.calculateSearchScoreForMatch(score, match, penalty)
      : 0;

    const matchDetails = { matchScore: score, searchScore, isFiltered };

    if (this.store && !skipStore) {
      await this.store.storeProfile(c);
    }

    if (k in this.cache) {
      const rExisting = this.cache[k];
      rExisting.character = c;
      rExisting.lastFetched = new Date();
      rExisting.match = matchDetails;

      this.moveToQueueEnd(k);
      return rExisting;
    }

    const rNew = {
      character: c,
      lastFetched: new Date(),
      added: new Date(),
      match: matchDetails
    };

    this.cache[k] = rNew;

    this.accessOrder.push(k);
    this.clampQueueValues();

    return rNew;
  }

  static match(c: ComplexCharacter): MatchReport | null {
    const you = core.characters.ownProfile;

    if (!you) {
      return null;
    }

    return Matcher.identifyBestMatchReport(you.character, c.character);
  }
}

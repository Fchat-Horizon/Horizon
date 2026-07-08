/**
 * @module conversation-draft-cache
 * Maintains an in-memory cache of draft messages, and occasionally saves them to disk.
 */

import { Cache } from './cache';
import { emptyMap, toMap } from '../fchat/common';
import { getDrafts, saveDrafts } from '../electron/filesystem';
import core from '../chat/core';

/**
 * @constant
 * The minimum wait time between doing disk saves. As the disk save currently uses fs.writeFileSync, this is primarily to protect
 * against the event loop blocking due to rapid writes.
 */
const MIN_CACHE_DISK_SAVE_IN_SECONDS = 5;

export interface ConversationCachedMessage {
  key: string;
  message: string;
}

export class ConversationDraftRecord {
  key: string;
  message: string;

  /**
   * Fundamental layout of an F-Chat message. Sender is currently implied by core.connection.character.
   * @function
   * @param {string} key
   * The unique key of the conversation the draft belongs to, e.g. `#adh-...` for a channel or a lowercased character name for a PM.
   * @param {string} message
   * The draft text as it currently exists in the input textbox.
   * @internal
   */
  constructor(key: string, message?: string) {
    this.key = key;
    this.message = message || '';
  }
}

export class ConversationDraftCache extends Cache<ConversationDraftRecord> {
  private lastCacheSave = Date.now();
  private cacheAlreadyLoaded = false;
  private useCache = true;
  private diskSaveTimerInSeconds = 60;
  private diskSaveInterval: ReturnType<typeof setInterval> | null = null;
  private currentlyCachedCharacter = '';
  private resetListenerActive = false;
  private loadPromise: Promise<void> | null = null;

  /**
   * Initialize the cache, including pulling the backup from disk if it exists. If setting.horizonCacheDraftMessages is false (opt-out)
   * then the cache will simply be ignored. Otherwise, this feature is on by default.
   * @function
   * @internal
   */
  async loadCache(): Promise<void> {
    if (!this.resetListenerActive) {
      core.connection.onEvent('connected', () => {
        this.resetCacheIfNeeded();
      });
      this.resetListenerActive = true;
    }

    if (!core.connection.character || this.cacheAlreadyLoaded) return;

    // prevents duplicate cache reads
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = this.populateCache();

    try {
      await this.loadPromise;
    } finally {
      this.loadPromise = null;
    }
  }

  private async populateCache(): Promise<void> {
    const settings = await core.settingsStore.get('settings');

    // Check for opt-out setting on cache.
    if (settings?.horizonCacheDraftMessages === false) this.useCache = false;
    this.diskSaveTimerInSeconds =
      settings?.horizonSaveDraftMessagesToDiskTimer ||
      this.diskSaveTimerInSeconds;

    if (!this.useCache) {
      this.cacheAlreadyLoaded = true;
      return;
    }

    // Check possible accidents from the user (mostly a backup check in case the setting somehow gets set to e.g. 0)
    if (this.diskSaveTimerInSeconds < MIN_CACHE_DISK_SAVE_IN_SECONDS)
      this.diskSaveTimerInSeconds = MIN_CACHE_DISK_SAVE_IN_SECONDS;

    const drafts = getDrafts();
    this.cache = toMap(drafts);

    this.cacheAlreadyLoaded = true;
    this.currentlyCachedCharacter = core.connection.character;
    this.diskSaveInterval = setInterval(
      () => this.saveCacheToDisk(),
      this.diskSaveTimerInSeconds * 1000
    );
  }

  /**
   * Check if the cache requires a reset. Usually, this is because the active character has changed, but this can be called if there is
   * doubt that the cache properly initialized due to other weird logic.
   * @function
   * @internal
   */
  async resetCacheIfNeeded(): Promise<void> {
    // Clear cache and re-fetch per-character settings upon switching characters in the same tab.
    if (
      this.currentlyCachedCharacter &&
      this.currentlyCachedCharacter !== core.connection.character
    ) {
      if (this.diskSaveInterval !== null) {
        clearInterval(this.diskSaveInterval);
        this.diskSaveInterval = null;
      }
      // In the future, we could consider keeping all characters in-memory as people jump around in one tab and just reference the "current"
      // cache. A cacheCache, if you will. For now, the on-disk cache should be sufficient, but it's an option for later.
      this.cache = emptyMap();
      this.cacheAlreadyLoaded = false;
    }

    await this.loadCache();
  }

  /**
   * Add or overwrite an entry in the cache.
   * @function
   * @param {ConversationCachedMessage} draft
   * The message and the key of the conversation it belongs to (whether a private message, channel, or the console itself).
   * @internal
   */
  register(draft: ConversationCachedMessage): void {
    if (!this.useCache) return;

    const k = Cache.nameKey(draft.key);

    this.cache[k] = new ConversationDraftRecord(draft.key, draft.message);
  }

  /**
   * Remove an entry from the cache, then immediately remove from disk to prevent it from re-appearing.
   * @function
   * @param {string} key
   * The unique key of the conversation that the draft was intended for.
   * @internal
   */
  deregister(key: string): void {
    if (!this.useCache) return;

    const k = Cache.nameKey(key);
    if (!(k in this.cache)) return;

    delete this.cache[k];
    this.saveCacheToDisk(true);
  }

  /**
   * Attempt to write the cache to disk, as long as the minimum buffer time has been met to avoid blocking the loop.
   * @function
   * @private
   */
  private saveCacheToDisk(force = false): void {
    if (!this.useCache || !core.connection.character) return;

    // in case user switches characters on the same tab
    if (this.currentlyCachedCharacter !== core.connection.character) return;

    // Buffer close writes. Missing an occasional save isn't the end of the world.
    const now = Date.now();
    if (
      !force &&
      now - this.lastCacheSave < MIN_CACHE_DISK_SAVE_IN_SECONDS * 1000
    )
      return;

    this.lastCacheSave = now;
    saveDrafts(this.cache);
  }
}

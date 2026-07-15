/**
 * @module conversation-draft-cache
 * Maintains an in-memory cache of draft messages, and occasionally saves them to disk.
 */

import { Cache, CacheCollection } from './cache';
import { emptyMap } from '../fchat/common';
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

/**
 * A draft record in the pre-key on-disk format, where drafts were stored under the conversation's display name.
 * Kept around solely so these records can be migrated to conversation keys as their conversations are opened.
 */
export interface LegacyDraftRecord {
  channel: string;
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

/**
 * Rebuild the cache from raw draft data parsed off disk. Records matching the current `{key, message}` shape go into the
 * lookup cache, re-keyed from the record itself so the file is robust against hand-edited or mismatched map keys. Records
 * in the pre-key format (`{channel, message}`, stored under the conversation's display name) are quarantined into a
 * separate legacy map instead: their name-based keys share the namespace PM lookups use, which is exactly the collision
 * behind issue #409, so they must never be looked up directly. They stay quarantined until a conversation whose display
 * name matches claims them via migrateLegacyDraft. Old-format files can reappear at any time through backup import, so
 * this splits on every load rather than migrating once. Anything matching neither shape is dropped.
 * @function
 * @param {any} drafts
 * The parsed contents of the draft file, or null if it was missing or unreadable.
 * @internal
 */
function sanitizeDrafts(drafts: any): {
  current: CacheCollection<ConversationDraftRecord>;
  legacy: CacheCollection<LegacyDraftRecord>;
} {
  const current = emptyMap<ConversationDraftRecord>();
  const legacy = emptyMap<LegacyDraftRecord>();
  if (typeof drafts !== 'object' || drafts === null) return { current, legacy };

  for (const record of Object.values<any>(drafts)) {
    if (typeof record?.message !== 'string') continue;

    if (typeof record.key === 'string')
      current[Cache.nameKey(record.key)] = new ConversationDraftRecord(
        record.key,
        record.message
      );
    else if (typeof record.channel === 'string' && record.message !== '')
      legacy[Cache.nameKey(record.channel)] = {
        channel: record.channel,
        message: record.message
      };
  }

  return { current, legacy };
}

export class ConversationDraftCache extends Cache<ConversationDraftRecord> {
  private legacyDrafts: CacheCollection<LegacyDraftRecord> = emptyMap();
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

    const { current, legacy } = sanitizeDrafts(getDrafts());
    this.cache = current;
    this.legacyDrafts = legacy;

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
      this.legacyDrafts = emptyMap();
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
   * Claim any quarantined pre-key draft stored under a conversation's display name and re-key it under the conversation's
   * unique key. Old records only say which name they were stored under, not whether that name was a PM or a channel, so
   * this can only run once a conversation is open and knows both. If a draft already exists under the new key it wins and
   * the legacy record is simply discarded. No forced disk save: the periodic save persists the claim, and if the app dies
   * first the migration just re-runs on the next load with the same result.
   * @function
   * @param {string} name
   * The display name of the conversation, which pre-key drafts were stored under.
   * @param {string} key
   * The unique key of the conversation the draft belongs to.
   * @internal
   */
  migrateLegacyDraft(name: string, key: string): void {
    if (!this.useCache) return;

    const legacyKey = Cache.nameKey(name);
    const legacy = this.legacyDrafts[legacyKey];
    if (!legacy) return;

    delete this.legacyDrafts[legacyKey];

    const k = Cache.nameKey(key);
    if (!(k in this.cache))
      this.cache[k] = new ConversationDraftRecord(key, legacy.message);
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
    // Unclaimed legacy drafts are written back in their original shape so they survive until their conversation is
    // opened (and stay usable on a downgrade). Current records win map-key collisions, which only happen for PMs.
    saveDrafts({ ...this.legacyDrafts, ...this.cache });
  }
}

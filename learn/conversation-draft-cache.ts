import { Cache } from './cache';
import { getDrafts, saveDrafts } from '../electron/filesystem';
import core from '../chat/core';

export interface ConversationCachedMessage {
  channel: string;
  message: string;
}

export class ConversationDraftRecord {
  channel: string;
  message: string;

  constructor(channel: string, message?: string) {
    this.channel = channel;
    this.message = message || '';
  }
}

export class ConversationDraftCache extends Cache<ConversationDraftRecord> {
  private lastCacheSave = Date.now();
  private cacheAlreadyLoaded = false;
  private useCache = true;
  private diskSaveTimerInSeconds = 60;
  private diskSaveInterval: NodeJS.Timer | null = null;
  private currentlyCachedCharacter = '';
  private resetListenerActive = false;

  async loadCache(): Promise<void> {
    if (!this.resetListenerActive) {
      core.connection.onEvent('connected', () => {
        this.resetCacheIfNeeded();
      });
      this.resetListenerActive = true;
    }

    if (!core.connection.character || this.cacheAlreadyLoaded) return;

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
    if (this.diskSaveTimerInSeconds < 5) this.diskSaveTimerInSeconds = 5;

    const drafts = getDrafts();
    this.cache = drafts || {};

    this.cacheAlreadyLoaded = true;
    this.currentlyCachedCharacter = core.connection.character;
    this.diskSaveInterval = setInterval(
      () => this.saveCacheToDisk(),
      this.diskSaveTimerInSeconds * 1000
    );
  }

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
      this.cache = {};
      this.cacheAlreadyLoaded = false;
    }

    await this.loadCache();
  }

  register(draft: ConversationCachedMessage): void {
    if (!this.useCache) return;

    const k = Cache.nameKey(draft.channel);

    this.cache[k] = new ConversationDraftRecord(draft.channel, draft.message);
  }

  deregister(channel: string): void {
    if (!this.useCache) return;

    const k = Cache.nameKey(channel);

    delete this.cache[k];
    this.saveCacheToDisk();
  }

  private saveCacheToDisk(): void {
    if (!this.useCache || !core.connection.character) return;

    // Buffer close writes. Missing an occasional save isn't the end of the world.
    const now = Date.now();
    if (now - this.lastCacheSave < 5000) return;

    this.lastCacheSave = now;
    saveDrafts(this.cache);
  }
}

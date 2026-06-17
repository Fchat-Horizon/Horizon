import * as _ from 'lodash';
import { Cache } from './cache';
import { AdCachedPosting, AdCacheRecord, AdCache } from './ad-cache';

export interface ChannelCachedPosting extends AdCachedPosting {
  channelName: string;
  datePosted: Date;
  message: string;
}

export interface ChannelPosting extends ChannelCachedPosting {
  name: string;
}

export class ChannelCacheRecord extends AdCacheRecord {}

export class ChannelConversationCache extends AdCache<ChannelCacheRecord> {
  register(ad: ChannelPosting): void {
    const k = Cache.nameKey(ad.name);

    if (k in this.cache) {
      const adh = this.cache[k];

      adh.add(ad);
      return;
    }

    this.cache[k] = new ChannelCacheRecord(ad.name, ad);
  }

  deregister(adName: string): void {
    const k = Cache.nameKey(adName);

    delete this.cache[k];
  }
}

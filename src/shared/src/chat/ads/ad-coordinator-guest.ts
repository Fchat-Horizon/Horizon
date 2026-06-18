import _ from 'lodash';
import { ipc } from '@/platform/ipc';
import { createLogger } from '@/logger';
const log = createLogger('ad-coordinator-guest');
import core from '../core';

interface PendingAd {
  resolve(): void;
  reject(err: Error): void;
  from: number;
}

export class AdCoordinatorGuest {
  protected pendingAds: Record<string, PendingAd> = {};
  protected adCounter = 0;

  constructor() {
    ipc.on('grant-send-ad', adId => this.processPendingAd(adId as string));
  }

  processPendingAd(adId: string): void {
    if (!(adId in this.pendingAds)) {
      log.debug('adid.pending.miss', {
        adId,
        character: core.characters.ownCharacter?.name
      });
      return;
    }

    log.debug('adid.pending.process', {
      adId,
      character: core.characters.ownCharacter?.name
    });

    this.pendingAds[adId].resolve();

    delete this.pendingAds[adId];
  }

  async requestTurnToPostAd(): Promise<void> {
    return new Promise((resolve, reject) => {
      const adId = `${Math.round(Math.random() * 1000000)}-${this.adCounter++}-${Date.now()}`;

      this.pendingAds[adId] = { resolve, reject, from: Date.now() };

      log.debug('adid.request', {
        adId,
        character: core.characters.ownCharacter?.name
      });

      ipc.send('request-send-ad', adId);
    });
  }

  clear(): void {
    _.each(this.pendingAds, pa => pa.reject(new Error('Pending ad cleared')));

    log.debug('adid.clear', {
      adIds: _.keys(this.pendingAds),
      character: core.characters.ownCharacter?.name
    });

    this.pendingAds = {};
  }
}

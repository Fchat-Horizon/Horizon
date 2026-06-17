import _ from 'lodash';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import log from 'electron-log'; //tslint:disable-line:match-default-export-name
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
    ipcRenderer.on('grant-send-ad', (_event: IpcRendererEvent, adId: string) =>
      this.processPendingAd(adId)
    );
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

      ipcRenderer.send('request-send-ad', adId);
    });
  }

  clear(): void {
    _.each(this.pendingAds, pa => pa.reject(new Error('Pending ad cleared')));

    console.debug(
      'adid.clear',
      _.keys(this.pendingAds),
      core.characters.ownCharacter?.name
    );

    this.pendingAds = {};
  }
}

import throat from 'throat';
import * as _ from 'lodash';

import log from 'electron-log'; //tslint:disable-line:match-default-export-name

import core from '../core';
import { Conversation } from '../interfaces';
import Timer = NodeJS.Timer;
import ChannelConversation = Conversation.ChannelConversation;

const adManagerThroat = throat(1);

export interface RecoverableAd {
  channel: string;
  index: number;
  nextPostDue: Date | undefined;
  firstPost: Date | undefined;
  expireDue: Date | undefined;
}

export class AdManager {
  static readonly POSTING_PERIOD = 3 * 60 * 60 * 1000;
  static readonly START_VARIANCE = 3 * 60 * 1000;
  static readonly POST_VARIANCE = 8 * 60 * 1000;
  static readonly POST_DELAY = 1.5 * 60 * 1000;

  static readonly POST_MANUAL_THRESHOLD = 5 * 1000; // don't post anything within 5 seconds of other posts

  private conversation: Conversation;

  private adIndex = 0;
  private active = false;
  private nextPostDue?: Date;
  private expireDue?: Date;
  private firstPost?: Date;
  private interval?: Timer;
  private adMap: number[] = [];

  constructor(conversation: Conversation) {
    this.conversation = conversation;
  }

  isActive(): boolean {
    return this.active;
  }

  skipAd(): void {
    this.adIndex += 1;
  }

  // tslint:disable-next-line
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // This makes sure there is a 5s delay between channel posts
  private async sendAdToChannel(
    msg: string,
    conv: Conversation.ChannelConversation
  ): Promise<void> {
    const initTime = Date.now();

    await adManagerThroat(async () => {
      const throatTime = Date.now();

      const delta = Date.now() - core.cache.getLastPost().getTime();

      if (delta > 0 && delta < AdManager.POST_MANUAL_THRESHOLD) {
        await this.delay(delta);
      }

      const delayTime = Date.now();

      log.debug('adManager.sendAdToChannel', {
        character: core.characters.ownCharacter?.name,
        channel: conv.channel.name,
        throatDelta: throatTime - initTime,
        delayDelta: delayTime - throatTime,
        totalWait: delayTime - initTime,
        msg
      });

      await conv.sendAd(msg);
    });
  }

  private determineNextAdDelayMs(
    chanConv: Conversation.ChannelConversation
  ): number {
    const match = chanConv.channel.description
      .toLowerCase()
      .match(
        /\[\s*ads:\s*([0-9.]+)\s*(m|mins?|minutes?|h|hrs?|hours?|s|secs?|seconds?)\.?\s*]/
      );

    if (!match) {
      return AdManager.POST_DELAY;
    }

    const n = _.toNumber(match[1]);
    let mul = 1000; // seconds

    if (match[2].substr(0, 1) === 'h') {
      mul = 60 * 60 * 1000; // hours
    } else if (match[2].substr(0, 1) === 'm') {
      mul = 60 * 1000; // minutes
    }

    return Math.max(
      n * mul - Math.max(Date.now() - chanConv.nextAd, 0),
      AdManager.POST_DELAY
    );
  }

  private async sendNextPost(): Promise<void> {
    const msg = this.getNextAd();

    if (!msg || (this.expireDue && this.expireDue.getTime() < Date.now())) {
      this.stop();
      return;
    }

    const chanConv = <Conversation.ChannelConversation>this.conversation;

    await this.sendAdToChannel(msg, chanConv);

    // post next ad every 12 - 22 minutes
    const nextInMs =
      Math.max(0, chanConv.nextAd - Date.now()) +
      this.determineNextAdDelayMs(chanConv) +
      Math.random() * AdManager.POST_VARIANCE;

    this.adIndex = this.adIndex + 1;

    this.nextPostDue = new Date(
      Math.max(
        Date.now() + nextInMs,
        (chanConv.settings.adSettings.lastAdTimestamp || 0) +
          core.connection.vars.lfrp_flood * 1000
      )
    );

    // tslint:disable-next-line: no-unnecessary-type-assertion
    this.interval = setTimeout(async () => {
      await this.sendNextPost();
    }, nextInMs) as Timer;
  }

  generateAdMap(): number[] {
    const ads = this.getAds();
    const idx = _.range(ads.length);

    return this.shouldUseRandomOrder() ? _.shuffle(idx) : idx;
  }

  shouldUseRandomOrder(): boolean {
    return !!this.conversation.settings.adSettings.randomOrder;
  }

  getAds(): string[] {
    return this.conversation.settings.adSettings.ads;
  }

  getNextAd(): string | undefined {
    const ads = this.getAds();

    if (ads.length === 0) return;

    if (ads.length !== this.adMap.length) {
      log.debug(
        'adManager.regenerate.on-the-fly',
        ads.length,
        this.adMap.length
      );
      this.adMap = this.generateAdMap();
    }

    return ads[this.adMap[this.adIndex % this.adMap.length] % ads.length];
  }

  getNextPostDue(): Date | undefined {
    return this.nextPostDue;
  }

  getExpireDue(): Date | undefined {
    return this.expireDue;
  }

  getFirstPost(): Date | undefined {
    return this.firstPost;
  }

  start(
    timeoutMs = AdManager.POSTING_PERIOD,
    minPostDelaySeconds = core.connection.vars.lfrp_flood
  ): void {
    const chanConv = <Conversation.ChannelConversation>this.conversation;

    const initialWait = Math.max(
      Math.random() * AdManager.START_VARIANCE,
      (chanConv.nextAd - Date.now()) * 1.1,
      (this.conversation.settings.adSettings.lastAdTimestamp || 0) +
        core.connection.vars.lfrp_flood * 1000 -
        Date.now()
    );

    this.adIndex = 0;
    this.active = true;

    this.nextPostDue = new Date(
      Math.max(
        Date.now() + initialWait,
        (this.conversation.settings.adSettings.lastAdTimestamp || 0) +
          Math.max(minPostDelaySeconds, core.connection.vars.lfrp_flood) * 1000
      )
    );

    this.expireDue = new Date(Date.now() + timeoutMs);
    this.adMap = this.generateAdMap();

    // tslint:disable-next-line: no-unnecessary-type-assertion
    this.interval = setTimeout(async () => {
      this.firstPost = new Date();

      await this.sendNextPost();
    }, initialWait) as Timer;
  }

  protected forceTimeout(waitTime: number): void {
    if (this.interval) {
      clearTimeout(this.interval);
    }

    // tslint:disable-next-line: no-unnecessary-type-assertion
    this.interval = setTimeout(async () => {
      await this.sendNextPost();
    }, waitTime) as Timer;
  }

  stop(): void {
    if (this.interval) clearTimeout(this.interval);

    delete this.interval;
    delete this.nextPostDue;
    delete this.expireDue;
    delete this.firstPost;

    this.active = false;
    this.adIndex = 0;

    // const message = new EventMessage(`Advertisements on channel [channel]${this.conversation.name}[/channel] have expired.`);
    // addEventMessage(message);
  }

  renew(): void {
    if (!this.active) return;

    this.expireDue = new Date(Date.now() + 3 * 60 * 60 * 1000);
  }

  protected static recoverableCharacter = '';
  protected static recoverableAds: RecoverableAd[] = [];

  static onConnectionClosed(): void {
    AdManager.recoverableCharacter = _.get(
      core,
      'characters.ownCharacter.name',
      ''
    );

    AdManager.recoverableAds = _.map(
      _.filter(
        core.conversations.channelConversations,
        c => c.adManager && c.adManager.isActive()
      ),
      (chanConv): RecoverableAd => {
        const adManager = chanConv.adManager;

        return {
          channel: chanConv.name,
          index: adManager.adIndex,
          nextPostDue: adManager.nextPostDue,
          firstPost: adManager.firstPost,
          expireDue: adManager.expireDue
        };
      }
    );

    _.each(
      _.filter(
        core.conversations.channelConversations,
        c => c.adManager && c.adManager.isActive()
      ),
      c => c.adManager.stop()
    );
  }

  static onNewChannelAvailable(channel: ChannelConversation): void {
    if (AdManager.recoverableCharacter !== core.characters.ownCharacter.name) {
      AdManager.recoverableAds = [];
      AdManager.recoverableCharacter = '';

      return;
    }

    const ra = _.find(
      AdManager.recoverableAds,
      r => r.channel === channel.name
    );

    if (!ra) {
      return;
    }

    const adManager = channel.adManager;

    adManager.stop();
    adManager.start();

    adManager.adIndex = ra.index;
    adManager.firstPost = ra.firstPost;
    adManager.nextPostDue =
      adManager.nextPostDue || ra.nextPostDue || new Date();
    adManager.expireDue = ra.expireDue;

    adManager.forceTimeout(
      Math.max(0, adManager.nextPostDue.getTime() - Date.now())
    );

    AdManager.recoverableAds = _.filter(
      AdManager.recoverableAds,
      r => r.channel !== ra.channel
    );
  }
}

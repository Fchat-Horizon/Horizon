import _ from 'lodash';
import core from '../core';
import { Conversation } from '../interfaces';

export interface Ad {
  disabled: boolean;
  tags: string[];
  content: string;
}

export class AdCenter {
  private ads: Ad[] = [];

  async load(): Promise<void> {
    this.ads = (await core.settingsStore.get('ads')) || [];
  }

  get(): Ad[] {
    return this.ads;
  }

  async set(ads: Ad[]): Promise<void> {
    const cleanedAds = _.map(
      _.filter(ads, ad => ad.content.trim().length > 0),
      (ad): Ad => {
        const filteredTags = _.map(
          _.filter(ad.tags, tag => tag.trim().length > 0),
          tag => tag.trim()
        );

        return {
          ...ad,
          content: ad.content.trim(),
          tags: filteredTags.length > 0 ? filteredTags : ['default']
        };
      }
    );

    this.ads = cleanedAds;

    await core.settingsStore.set('ads', cleanedAds);
  }

  async add(content: string, tags: string[] = ['default']): Promise<void> {
    this.ads.push({ content, tags, disabled: false });

    await this.set(this.ads);
  }

  getTags(ads: Ad[] = this.ads): string[] {
    return _.uniq(_.flatten(_.map(ads, ad => ad.tags)));
  }

  getActiveTags(): string[] {
    return this.getTags(this.getActiveAds());
  }

  getActiveAds(): Ad[] {
    return _.filter(this.ads, ad => !ad.disabled);
  }

  getMatchingAds(tags: string[]): Ad[] {
    return _.filter(
      this.ads,
      ad => !ad.disabled && _.intersection(ad.tags, tags).length > 0
    );
  }

  schedule(
    tags: string[],
    channelIds: string[],
    order: 'random' | 'ad-center',
    timeoutMinutes: number,
    minPostDelayMinutes: number
  ): void {
    const ads = this.getMatchingAds(tags);

    _.each(channelIds, channelId =>
      this.scheduleForChannel(
        channelId,
        ads,
        order,
        timeoutMinutes,
        minPostDelayMinutes
      )
    );
  }

  adsAreRunning(): boolean {
    return !_.every(
      core.conversations.channelConversations,
      conv => !conv.isSendingAutomatedAds()
    );
  }

  stopAllAds(): void {
    _.each(core.conversations.channelConversations, conv =>
      conv.adManager.stop()
    );
  }

  protected getConversation(
    channelId: string
  ): Conversation.ChannelConversation | undefined {
    return core.conversations.channelConversations.find(
      c => c.channel.id === channelId
    );
  }

  isMissingFromAdCenter(adContentToTest: string): boolean {
    const cleaned = adContentToTest.trim().toLowerCase();

    return _.every(this.ads, ad => ad.content.trim().toLowerCase() !== cleaned);
  }

  isSafeToOverride(channelId: string): boolean {
    const conv = this.getConversation(channelId);

    if (!conv) {
      return true;
    }

    return _.every(
      conv.settings.adSettings.ads,
      adContent => !this.isMissingFromAdCenter(adContent)
    );
  }

  // tslint:disable-next-line:prefer-function-over-method
  protected scheduleForChannel(
    channelId: string,
    ads: Ad[],
    order: 'random' | 'ad-center',
    timeoutMinutes: number,
    minPostDelayMinutes: number
  ): void {
    const conv = this.getConversation(channelId);

    if (!conv) {
      return;
    }

    conv.settings = {
      ...conv.settings,

      adSettings: {
        ...conv.settings.adSettings,
        ads: _.map(
          _.filter(ads, ad => !ad.disabled && ad.content.trim().length > 0),
          ad => ad.content.trim()
        ),
        randomOrder: order === 'random'
      }
    };

    conv.adManager.stop();
    conv.adManager.start(timeoutMinutes * 60 * 1000, minPostDelayMinutes);
  }
}

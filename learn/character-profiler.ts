import core from '../chat/core';
import { Character as CharacterFChatInf } from '../fchat';
import { Character as ComplexCharacter } from '../site/character_page/interfaces';
import { Matcher } from './matcher';
import { AdCache } from './ad-cache';
import { ProfileCacheQueueEntry } from './cache-manager';
import { TagId } from './matcher-types';

export class CharacterProfiler {
  static readonly ADVERTISEMENT_RECENT_RANGE = 22 * 60 * 1000;
  static readonly ADVERTISEMENT_POTENTIAL_RAGE = 50 * 60 * 1000;

  protected adCache: AdCache;
  protected me: ComplexCharacter;

  constructor(me: ComplexCharacter, adCache: AdCache) {
    this.me = me;
    this.adCache = adCache;
  }

  calculateInterestScoreForQueueEntry(entry: ProfileCacheQueueEntry): number {
    const c = core.characters.get(entry.name);

    if (!c) return 0;

    const genderScore = this.getInterestScoreForGender(this.me, c);
    const statusScore = this.getInterestScoreForStatus(c);
    const adScore = genderScore > 0 ? this.getLastAdvertisementStatus(c) : 0;
    const friendlyScore = this.getInterestScoreForFriendlies(c);

    // tslint:disable-next-line: number-literal-format binary-expression-operand-order
    const score = 1.0 * genderScore + 1.0 * statusScore + 1.0 * adScore + 1.0 * friendlyScore;

    // tslint:disable-next-line: number-literal-format binary-expression-operand-order
    return c.status === 'looking' ? score + 10.0 : score;
  }

  getInterestScoreForFriendlies(c: CharacterFChatInf.Character): number {
    if (c.isFriend) return 1;

    if (c.isBookmarked) return 0.5;

    if (c.isIgnored) return -1;

    return 0;
  }

  getInterestScoreForGender(me: ComplexCharacter, c: CharacterFChatInf.Character): number {
    const g = Matcher.strToGender(c.gender);

    if (g === null) {
      return 0;
    }

    const myGender = Matcher.getTagValueList(TagId.Gender, me.character);
    const myOrientation = Matcher.getTagValueList(TagId.Orientation, me.character);
    const score = Matcher.scoreOrientationByGender(myGender, myOrientation, g);

    return score.score;
  }

  getInterestScoreForStatus(c: CharacterFChatInf.Character): number {
    if (c.status === 'offline' || c.status === 'away' || c.status === 'busy' || c.status === 'dnd') return -0.5;

    if (c.status === 'looking') return 0.5;

    return 0;
  }

  getLastAdvertisementStatus(c: CharacterFChatInf.Character): number {
    const ads = this.adCache.get(c.name);

    if (!ads) return 0;

    const lastPost = ads.getDateLastPosted();

    if (lastPost === null) return 0;

    const delta = Date.now() - lastPost.getTime();

    if (delta < CharacterProfiler.ADVERTISEMENT_RECENT_RANGE) return 1;

    if (delta < CharacterProfiler.ADVERTISEMENT_POTENTIAL_RAGE) return 0.5;

    return -0.5; // has been advertising, but not recently, so likely busy
  }
}

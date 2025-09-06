/* eslint-disable no-null-keyword, max-file-line-count */

import * as _ from 'lodash';
import { Character, CharacterInfotag, KinkChoice } from '../interfaces';
import log from 'electron-log'; //tslint:disable-line:match-default-export-name
// tslint:disable-next-line ban-ts-ignore
// @ts-ignore
import anyAscii from 'any-ascii';

import { Store } from '../site/character_page/data_store';

import {
  BodyType,
  bodyTypeKinkMapping,
  fchatGenderMap,
  FurryPreference,
  Gender,
  genderKinkMapping,
  Kink,
  KinkBucketScore,
  kinkComparisonExclusionGroups,
  kinkComparisonExclusions,
  kinkComparisonSwaps,
  kinkMapping,
  kinkMatchScoreMap,
  kinkMatchWeights,
  KinkPreference,
  likelyHuman,
  mammalSpecies,
  nonAnthroSpecies,
  Orientation,
  Position,
  PostLengthPreference,
  postLengthPreferenceMapping,
  postLengthPreferenceScoreMapping,
  Scoring,
  Species,
  SpeciesMap,
  speciesMapping,
  SpeciesMappingCache,
  speciesNames,
  SubDomRole,
  TagId
} from './matcher-types';

export interface MatchReport {
  _isVue: true;
  you: MatchResult;
  them: MatchResult;
  youMultiSpecies: boolean;
  themMultiSpecies: boolean;
  merged: MatchResultScores;
  score: Scoring | null;
  details: MatchScoreDetails;
}

export interface MatchResultCharacterInfo {
  species: Species | null;
  gender: Gender | null;
  orientation: Orientation | null;
}

export interface MatchResultScores {
  [key: number]: Score;
  [TagId.Gender]: Score;
  [TagId.Age]: Score;
  [TagId.FurryPreference]: Score;
  [TagId.Species]: Score;
  [TagId.Kinks]: Score;
}

export interface MatchScoreDetails {
  totalScoreDimensions: number;
  dimensionsAtScoreLevel: number;
}

export interface MatchResult {
  you: Character;
  them: Character;
  scores: MatchResultScores;
  info: MatchResultCharacterInfo;
  total: number;

  yourAnalysis: CharacterAnalysis;
  theirAnalysis: CharacterAnalysis;
}

export interface ScoreClassMap {
  [key: number]: string;
}

const scoreClasses: ScoreClassMap = {
  [Scoring.MATCH]: 'match',
  [Scoring.WEAK_MATCH]: 'weak-match',
  [Scoring.NEUTRAL]: 'neutral',
  [Scoring.WEAK_MISMATCH]: 'weak-mismatch',
  [Scoring.MISMATCH]: 'mismatch'
};

const scoreIcons: ScoreClassMap = {
  [Scoring.MATCH]: 'fas fa-heart',
  [Scoring.WEAK_MATCH]: 'fas fa-thumbs-up',
  [Scoring.NEUTRAL]: 'fas fa-meh',
  [Scoring.WEAK_MISMATCH]: 'fas fa-question-circle',
  [Scoring.MISMATCH]: 'fas fa-heart-broken'
};

export class Score {
  readonly score: Scoring;
  readonly description: string;
  readonly shortDesc: string;

  constructor(
    score: Scoring,
    description: string = '',
    shortDesc: string = ''
  ) {
    if (score !== Scoring.NEUTRAL && description === '')
      throw new Error('Description must be provided if score is not neutral');

    this.score = score;
    this.description = description;
    this.shortDesc = shortDesc;
  }

  getRecommendedClass(): string {
    return Score.getClasses(this.score);
  }

  getRecommendedIcon(): string {
    return Score.getIcon(this.score);
  }

  static getClasses(score: Scoring): string {
    return scoreClasses[score];
  }

  static getIcon(score: Scoring): string {
    return scoreIcons[score];
  }
}

export interface CharacterAnalysisVariation {
  readonly character: Character;
  readonly analysis: CharacterAnalysis;
}

export class CharacterAnalysis {
  readonly character: Character;

  readonly gender: Gender | null;
  readonly orientation: Orientation | null;
  readonly species: Species | null;
  readonly furryPreference: FurryPreference | null;
  readonly age: number | null;
  readonly subDomRole: SubDomRole | null;
  readonly position: Position | null;
  readonly postLengthPreference: PostLengthPreference | null;
  readonly bodyType: BodyType | null;

  readonly isAnthro: boolean | null;
  readonly isHuman: boolean | null;
  readonly isMammal: boolean | null;

  constructor(c: Character) {
    this.character = c;

    this.gender = Matcher.getTagValueList(TagId.Gender, c);
    this.orientation = Matcher.getTagValueList(TagId.Orientation, c);
    this.species = Matcher.species(c);
    this.furryPreference = Matcher.getTagValueList(TagId.FurryPreference, c);
    this.subDomRole = Matcher.getTagValueList(TagId.SubDomRole, c);
    this.position = Matcher.getTagValueList(TagId.Position, c);
    this.postLengthPreference = Matcher.getTagValueList(TagId.PostLength, c);
    this.bodyType = Matcher.getTagValueList(TagId.BodyType, c);

    this.age = Matcher.age(c);

    this.isAnthro = Matcher.isAnthro(c);
    this.isHuman = Matcher.isHuman(c);
    this.isMammal = Matcher.isMammal(c);
  }
}

/**
 * Answers the question: What YOU think about THEM
 * Never what THEY think about YOU
 *
 * So, when comparing two characters, you have to run it twice (you, them / them, you)
 * to get the full picture
 */
export class Matcher {
  readonly you: Character;
  readonly them: Character;

  readonly yourAnalysis: CharacterAnalysis;
  readonly theirAnalysis: CharacterAnalysis;

  constructor(
    you: Character,
    them: Character,
    yourAnalysis?: CharacterAnalysis,
    theirAnalysis?: CharacterAnalysis
  ) {
    this.you = you;
    this.them = them;

    this.yourAnalysis = yourAnalysis || new CharacterAnalysis(you);
    this.theirAnalysis = theirAnalysis || new CharacterAnalysis(them);
  }

  static generateReport(you: Character, them: Character): MatchReport {
    const yourAnalysis = new CharacterAnalysis(you);
    const theirAnalysis = new CharacterAnalysis(them);

    const youThem = new Matcher(you, them, yourAnalysis, theirAnalysis);
    const themYou = new Matcher(them, you, theirAnalysis, yourAnalysis);

    const youThemMatch = youThem.match('their');
    const themYouMatch = themYou.match('your');

    const report: MatchReport = {
      _isVue: true,
      you: youThemMatch,
      them: themYouMatch,
      youMultiSpecies: false,
      themMultiSpecies: false,
      merged: Matcher.mergeResults(youThemMatch, themYouMatch),
      score: null,
      details: {
        totalScoreDimensions: 0,
        dimensionsAtScoreLevel: 0
      }
    };

    report.score = Matcher.calculateReportScore(report);

    report.details.totalScoreDimensions = Matcher.countScoresTotal(report);
    report.details.dimensionsAtScoreLevel =
      Matcher.countScoresAtLevel(report, report.score) || 0;

    // log.debug('report.generate', report);

    return report;
  }

  static identifyBestMatchReport(you: Character, them: Character): MatchReport {
    const reportStartTime = Date.now();

    const yourCharacterAnalyses = Matcher.generateAnalysisVariations(you);
    const theirCharacterAnalyses = Matcher.generateAnalysisVariations(them);

    let bestScore = null;
    let bestScoreLevelCount = -10000;
    let bestReport: MatchReport;

    for (const yourAnalysis of yourCharacterAnalyses) {
      for (const theirAnalysis of theirCharacterAnalyses) {
        const youThem = new Matcher(
          yourAnalysis.character,
          theirAnalysis.character,
          yourAnalysis.analysis,
          theirAnalysis.analysis
        );
        const themYou = new Matcher(
          theirAnalysis.character,
          yourAnalysis.character,
          theirAnalysis.analysis,
          yourAnalysis.analysis
        );

        const youThemMatch = youThem.match('their');
        const themYouMatch = themYou.match('your');

        const report: MatchReport = {
          _isVue: true,
          you: youThemMatch,
          them: themYouMatch,
          youMultiSpecies: yourCharacterAnalyses.length > 1,
          themMultiSpecies: theirCharacterAnalyses.length > 1,
          merged: Matcher.mergeResults(youThemMatch, themYouMatch),
          score: null,
          details: {
            totalScoreDimensions: 0,
            dimensionsAtScoreLevel: 0
          }
        };

        report.score = Matcher.calculateReportScore(report);

        const scoreLevelCount = Matcher.countScoresAtLevel(
          report,
          report.score
        );

        report.details.totalScoreDimensions = Matcher.countScoresTotal(report);
        report.details.dimensionsAtScoreLevel = scoreLevelCount || 0;

        if (
          bestScore === null ||
          (report.score !== null &&
            report.score >= bestScore &&
            scoreLevelCount !== null &&
            report.score * scoreLevelCount > bestScoreLevelCount)
        ) {
          bestScore = report.score;
          bestScoreLevelCount =
            scoreLevelCount !== null && report.score !== null
              ? report.score * scoreLevelCount
              : -1000;
          bestReport = report;
        }
      }
    }

    log.debug('report.identify.best', {
      buildTime: Date.now() - reportStartTime,
      variations: yourCharacterAnalyses.length * theirCharacterAnalyses.length,
      report: bestReport!
    });

    return bestReport!;
  }

  // tslint:disable-next-line
  private static mergeResultScores(
    scores: MatchResultScores,
    results: MatchResultScores
  ): void {
    _.each(scores, (v: Score, k: any) => {
      if (
        // tslint:disable-next-line no-unsafe-any
        (!(k in results) || v.score < results[k].score) &&
        v.score !== Scoring.NEUTRAL
      ) {
        results[k] = v;
      }
    });
  }

  static mergeResults(you: MatchResult, them: MatchResult): MatchResultScores {
    const results: MatchResultScores = {} as any;

    Matcher.mergeResultScores(you.scores, results);
    Matcher.mergeResultScores(them.scores, results);

    return results;
  }

  static generateAnalysisVariations(
    c: Character
  ): CharacterAnalysisVariation[] {
    const speciesOptions = Matcher.getAllSpeciesAsStr(c);

    if (speciesOptions.length === 0) {
      speciesOptions.push('');
    }

    return _.map(speciesOptions, species => {
      // Avoid _.cloneDeep because it chokes on array-like objects with very large keys
      // _.cloneDeep will happily make arrays with 41 million elements
      const nc = {
        ...c,
        infotags: { ...c.infotags, [TagId.Species]: { string: species } }
      };

      return { character: nc, analysis: new CharacterAnalysis(nc) };
    });
  }

  static calculateReportScore(m: MatchReport): Scoring | null {
    const yourScores = _.values(m.you.scores);
    const theirScores = _.values(m.them.scores);

    const finalScore = _.reduce(
      _.concat(yourScores, theirScores),
      (accum: Scoring | null, score: Score) => {
        if (accum === null) {
          return score.score !== Scoring.NEUTRAL ? score.score : null;
        }

        return score.score === Scoring.NEUTRAL
          ? accum
          : Math.min(accum, score.score);
      },
      null
    );

    if (finalScore !== null && finalScore > 0) {
      // Manage edge cases where high score may not be ideal

      // Nothing to score
      if (yourScores.length === 0 || theirScores.length === 0) {
        // can't know
        return Scoring.NEUTRAL;
      }

      // Only neutral scores given
      if (
        _.every(yourScores, (n: Scoring) => n === Scoring.NEUTRAL) ||
        _.every(theirScores, (n: Scoring) => n === Scoring.NEUTRAL)
      ) {
        return Scoring.NEUTRAL;
      }
    }

    // console.log('Profile score', c.character.name, score, m.you.total, m.them.total,
    //    m.you.total + m.them.total, m.you.total * m.them.total);

    return finalScore === null ? Scoring.NEUTRAL : finalScore;
  }

  match(pronoun: string): MatchResult {
    const data: MatchResult = {
      you: this.you,
      them: this.them,

      yourAnalysis: this.yourAnalysis,
      theirAnalysis: this.theirAnalysis,

      total: 0,

      scores: {
        [TagId.Gender]: this.resolveGenderScore(),
        [TagId.Age]: this.resolveAgeScore(),
        [TagId.FurryPreference]: this.resolveFurryPairingsScore(),
        [TagId.Species]: this.resolveSpeciesScore(),
        [TagId.SubDomRole]: this.resolveSubDomScore(),
        [TagId.Kinks]: this.resolveKinkScore(pronoun),
        [TagId.PostLength]: this.resolvePostLengthScore(),
        [TagId.Position]: this.resolvePositionScore(),
        [TagId.BodyType]: this.resolveBodyTypeScore()
      },

      info: {
        species: Matcher.species(this.you),
        gender: Matcher.getTagValueList(TagId.Gender, this.you),
        orientation: Matcher.getTagValueList(TagId.Orientation, this.you)
      }
    };

    data.total = _.reduce(
      data.scores,
      (accum: number, s: Score) => accum + s.score,
      0
    );

    return data;
  }

  static scoreOrientationByGender(
    yourGender: Gender | null,
    yourOrientation: Orientation | null,
    theirGender: Gender | null
  ): Score {
    //Pansexual and Bisexual characters are assumed to love all equally unless otherwise specified.
    if (
      yourOrientation === Orientation.Pansexual ||
      yourOrientation === Orientation.Bisexual
    ) {
      return new Score(Scoring.MATCH, 'Loves <span>all genders</span>');
    }
    if (yourGender === null || theirGender === null || yourOrientation === null)
      return new Score(Scoring.WEAK_MISMATCH, 'Cannot infer preference.');

    // Handle Bi preference cases first
    if (yourOrientation === Orientation.BiFemalePreference) {
      if (theirGender === Gender.Female) {
        return new Score(
          Scoring.MATCH,
          'Strongly prefers <span>female partners</span>'
        );
      }
      return new Score(Scoring.WEAK_MATCH, 'Likes <span>all genders</span>');
    }
    if (yourOrientation === Orientation.BiMalePreference) {
      if (theirGender === Gender.Male) {
        return new Score(
          Scoring.MATCH,
          'Strongly prefers <span>male partners</span>'
        );
      }
      return new Score(Scoring.WEAK_MATCH, 'Likes <span>all genders</span>');
    }

    // CIS
    if (Matcher.isCisGender(yourGender)) {
      if (yourGender === theirGender) {
        // same sex CIS
        if (
          yourOrientation === Orientation.Straight ||
          yourOrientation === Orientation.BiCurious
        )
          return new Score(
            yourOrientation === Orientation.BiCurious
              ? Scoring.WEAK_MISMATCH
              : Scoring.MISMATCH,
            yourOrientation === Orientation.BiCurious
              ? 'Hesitant about <span>same sex</span>'
              : 'No <span>same sex</span>'
          );

        if (yourOrientation === Orientation.Gay)
          return new Score(Scoring.MATCH, 'Loves <span>same sex</span>');
      } else if (Matcher.isCisGender(theirGender)) {
        // straight CIS
        if (yourOrientation === Orientation.Gay)
          return new Score(Scoring.MISMATCH, 'No <span>opposite sex</span>');

        if (yourOrientation === Orientation.Straight)
          return new Score(Scoring.MATCH, 'Loves <span>opposite sex</span>');
      }
    }

    //Should this be "Neutral" or "Weak Mismatch"?
    return new Score(Scoring.NEUTRAL, 'No preference specified');
  }

  static formatKinkScore(score: KinkPreference, description: string): Score {
    if (score === KinkPreference.No)
      return new Score(Scoring.MISMATCH, `No <span>${description}</span>`);

    if (score === KinkPreference.Maybe)
      return new Score(
        Scoring.WEAK_MISMATCH,
        `Hesitant about <span>${description}</span>`
      );

    if (score === KinkPreference.Yes)
      return new Score(Scoring.WEAK_MATCH, `Likes <span>${description}</span>`);

    if (score === KinkPreference.Favorite)
      return new Score(Scoring.MATCH, `Loves <span>${description}</span>`);

    return new Score(Scoring.NEUTRAL);
  }

  private resolvePostLengthScore(): Score {
    const yourLength = this.yourAnalysis.postLengthPreference;
    const theirLength = this.theirAnalysis.postLengthPreference;

    if (
      !yourLength ||
      !theirLength ||
      yourLength === PostLengthPreference.NoPreference ||
      theirLength === PostLengthPreference.NoPreference
    ) {
      return new Score(Scoring.NEUTRAL);
    }

    const score = postLengthPreferenceScoreMapping[yourLength][theirLength];

    return this.formatScoring(score, postLengthPreferenceMapping[theirLength]);
  }

  static getSpeciesName(species: Species): string {
    return speciesNames[species] || `${Species[species].toLowerCase()}s`;
  }

  private resolveSpeciesScore(): Score {
    const you = this.you;
    const theirAnalysis = this.theirAnalysis;
    const theirSpecies = theirAnalysis.species;

    if (theirSpecies === null) return new Score(Scoring.NEUTRAL);

    const speciesScore = Matcher.getKinkSpeciesPreference(you, theirSpecies);

    if (speciesScore !== null) {
      // console.log(this.them.name, speciesScore, theirSpecies);
      const speciesName =
        speciesNames[theirSpecies] || `${Species[theirSpecies].toLowerCase()}s`;

      return Matcher.formatKinkScore(speciesScore, speciesName);
    }

    if (theirAnalysis.isAnthro) {
      const anthroScore = Matcher.getKinkPreference(you, Kink.AnthroCharacters);

      if (anthroScore !== null)
        return Matcher.formatKinkScore(anthroScore, 'anthros');
    }

    if (theirAnalysis.isMammal) {
      const mammalScore = Matcher.getKinkPreference(you, Kink.Mammals);

      if (mammalScore !== null)
        return Matcher.formatKinkScore(mammalScore, 'mammals');
    }

    return new Score(Scoring.NEUTRAL);
  }

  formatScoring(score: Scoring, description: string): Score {
    let type = '';

    switch (score) {
      case Scoring.MISMATCH:
        type = 'No';
        break;

      case Scoring.WEAK_MISMATCH:
        type = 'Hesitant about';
        break;

      case Scoring.WEAK_MATCH:
        type = 'Likes';
        break;

      case Scoring.MATCH:
        type = 'Loves';
        break;
    }

    return new Score(score, `${type} <span>${description}</span>`);
  }

  private resolveFurryPairingsScore(): Score {
    const you = this.you;
    const theyAreAnthro = this.theirAnalysis.isAnthro;
    const theyAreHuman = this.theirAnalysis.isHuman;

    const score = theyAreAnthro
      ? Matcher.furryLikeabilityScore(you)
      : theyAreHuman
        ? Matcher.humanLikeabilityScore(you)
        : Scoring.NEUTRAL;

    if (score === Scoring.WEAK_MATCH)
      return new Score(
        score,
        theyAreAnthro
          ? 'Prefers <span>humans</span>, ok with anthros'
          : 'Prefers <span>anthros</span>, ok with humans'
      );

    return this.formatScoring(
      score,
      theyAreAnthro ? 'furry pairings' : theyAreHuman ? 'human pairings' : ''
    );
  }

  private resolveKinkScore(pronoun: string): Score {
    // const kinkScore = this.resolveKinkBucketScore('all');

    const scores = {
      favorite: this.resolveKinkBucketScore('favorite'),
      yes: this.resolveKinkBucketScore('yes'),
      maybe: this.resolveKinkBucketScore('maybe'),
      no: this.resolveKinkBucketScore('no')
    };

    const weighted =
      scores.favorite.weighted +
      scores.yes.weighted +
      scores.maybe.weighted +
      scores.no.weighted;

    log.debug(
      'report.score.kink',
      this.them.name,
      this.you.name,
      scores,
      weighted
    );

    if (
      scores.favorite.count +
        scores.yes.count +
        scores.maybe.count +
        scores.no.count <
      10
    ) {
      return new Score(Scoring.NEUTRAL);
    }

    if (weighted === 0) {
      return new Score(Scoring.NEUTRAL);
    }

    if (weighted < 0) {
      if (Math.abs(weighted) < kinkMatchWeights.weakMismatchThreshold) {
        return new Score(
          Scoring.WEAK_MISMATCH,
          `Hesitant about ${pronoun} <span>kinks</span>`
        );
      }

      return new Score(
        Scoring.MISMATCH,
        `Dislikes ${pronoun} <span>kinks</span>`
      );
    }

    if (Math.abs(weighted) < kinkMatchWeights.weakMatchThreshold) {
      return new Score(
        Scoring.WEAK_MATCH,
        `Likes ${pronoun} <span>kinks</span>`
      );
    }

    return new Score(Scoring.MATCH, `Loves ${pronoun} <span>kinks</span>`);
  }

  static furryLikeabilityScore(c: Character): Scoring {
    const furryPreference = Matcher.getTagValueList(TagId.FurryPreference, c);

    if (
      furryPreference === FurryPreference.FursAndHumans ||
      furryPreference === FurryPreference.FurriesPreferredHumansOk ||
      furryPreference === FurryPreference.FurriesOnly
    )
      return Scoring.MATCH;

    if (furryPreference === FurryPreference.HumansPreferredFurriesOk)
      return Scoring.WEAK_MATCH;

    if (furryPreference === FurryPreference.HumansOnly) return Scoring.MISMATCH;

    return Scoring.NEUTRAL;
  }

  static humanLikeabilityScore(c: Character): Scoring {
    const humanPreference = Matcher.getTagValueList(TagId.FurryPreference, c);

    if (
      humanPreference === FurryPreference.FursAndHumans ||
      humanPreference === FurryPreference.HumansPreferredFurriesOk ||
      humanPreference === FurryPreference.HumansOnly
    )
      return Scoring.MATCH;

    if (humanPreference === FurryPreference.FurriesPreferredHumansOk)
      return Scoring.WEAK_MATCH;

    if (humanPreference === FurryPreference.FurriesOnly)
      return Scoring.MISMATCH;

    return Scoring.NEUTRAL;
  }

  private resolveAgeScore(): Score {
    const you = this.you;
    const yourAge = this.yourAnalysis.age;
    const theirAge = this.theirAnalysis.age;

    if (theirAge === null) return new Score(Scoring.NEUTRAL);

    if (theirAge < 18) {
      const ageplayScore = Matcher.getKinkPreference(you, Kink.Ageplay);
      // Matches: You're adult with AP kink
      if (
        yourAge !== null &&
        yourAge >= 18 &&
        theirAge < 16 &&
        ageplayScore !== null
      )
        return Matcher.formatKinkScore(ageplayScore, 'very young characters');

      const underageScore = Matcher.getKinkPreference(
        you,
        Kink.UnderageCharacters
      );

      // Matches: you're anyone with UA kink
      if (underageScore !== null)
        return Matcher.formatKinkScore(underageScore, 'underage characters');
    }

    if (
      yourAge !== null &&
      yourAge > 0 &&
      theirAge > 0 &&
      yourAge <= 80 &&
      theirAge <= 80
    ) {
      const olderCharactersScore = Matcher.getKinkPreference(
        you,
        Kink.OlderCharacters
      );
      const youngerCharactersScore = Matcher.getKinkPreference(
        you,
        Kink.YoungerCharacters
      );
      const ageDifference = Math.abs(yourAge - theirAge);

      // Matches: Any age with age difference kinks:
      if (
        yourAge < theirAge &&
        olderCharactersScore !== null &&
        ageDifference >= 8
      )
        return Matcher.formatKinkScore(
          olderCharactersScore,
          'older characters'
        );

      if (
        yourAge > theirAge &&
        youngerCharactersScore !== null &&
        ageDifference >= 8
      )
        return Matcher.formatKinkScore(
          youngerCharactersScore,
          'younger characters'
        );

      // Matches: You're UA in age proximity (they can still MISMATCH you if they're 18/19!)
      if (yourAge < 18 && ageDifference <= 2)
        return new Score(Scoring.WEAK_MATCH, `Has <span>similar age</span>`);
    }

    // Matches: You're adult and they're not
    if (yourAge !== null && yourAge >= 18 && theirAge < 18)
      return new Score(Scoring.MISMATCH, 'No <span>ages under 18</span>');

    // Matches:
    //   You're UA, they're adult, you have no relevant kinks;
    //   you're UA, they're UA, you have >2 year age gap, you have no relevant kinks;
    //   you're adult, they're adult and you have no age diff kinks;
    //   you or they are 2000 year old cosmic beings;
    //   you have no age and no relevant kinks
    return new Score(Scoring.NEUTRAL);
  }

  private resolveGenderScore(): Score {
    const you = this.you;

    const yourGender = this.yourAnalysis.gender;
    const yourOrientation = this.yourAnalysis.orientation;
    let theirGender = this.theirAnalysis.gender;
    //Some people leave this field blank to imply their character is genderless too.
    //Should we keep this, or automatically assume that the person in question forgot to fill this in?
    if (theirGender === null) {
      theirGender = Gender.None;
    }

    //Now we check if there is a specific preference listed.
    const genderName = `${theirGender !== Gender.None ? Gender[theirGender].toLowerCase() : 'genderless'} characters`;
    const genderKinkScore = Matcher.getKinkGenderPreference(you, theirGender);

    if (genderKinkScore !== null) {
      //If there is, we return it.
      return Matcher.formatKinkScore(genderKinkScore, genderName);
    }

    //No preference listed? Then we return based on assumed preference from the orientation.
    let score = Matcher.scoreOrientationByGender(
      yourGender,
      yourOrientation,
      theirGender
    );
    return score;
  }

  private resolveBodyTypeScore(): Score {
    const theirBodyType = Matcher.getTagValueList(TagId.BodyType, this.them);

    if (theirBodyType && theirBodyType in bodyTypeKinkMapping) {
      const bodyTypePreference = Matcher.getKinkPreference(
        this.you,
        bodyTypeKinkMapping[theirBodyType]
      );

      if (bodyTypePreference !== null) {
        return Matcher.formatKinkScore(
          bodyTypePreference,
          `${BodyType[theirBodyType].toLowerCase()}s`
        );
      }
    }

    return new Score(Scoring.NEUTRAL);
  }

  private resolveSubDomScore(): Score {
    const you = this.you;
    const yourSubDomRole = this.yourAnalysis.subDomRole;
    const theirSubDomRole = this.theirAnalysis.subDomRole;
    const yourRoleReversalPreference = Matcher.getKinkPreference(
      you,
      Kink.RoleReversal
    );

    if (!yourSubDomRole || !theirSubDomRole) return new Score(Scoring.NEUTRAL);

    if (yourSubDomRole === SubDomRole.UsuallyDominant) {
      if (theirSubDomRole === SubDomRole.Switch)
        return new Score(Scoring.MATCH, `Loves <span>switches</span> (role)`);

      if (
        theirSubDomRole === SubDomRole.AlwaysSubmissive ||
        theirSubDomRole === SubDomRole.UsuallySubmissive
      )
        return new Score(Scoring.MATCH, `Loves <span>submissives</span>`);

      if (yourRoleReversalPreference === KinkPreference.Favorite)
        return new Score(Scoring.MATCH, `Loves <span>role reversal</span>`);

      if (yourRoleReversalPreference === KinkPreference.Yes)
        return new Score(Scoring.MATCH, `Likes <span>role reversal</span>`);

      return new Score(
        Scoring.WEAK_MISMATCH,
        'Hesitant about <span>dominants</span>'
      );
    }

    if (yourSubDomRole === SubDomRole.AlwaysDominant) {
      if (theirSubDomRole === SubDomRole.Switch)
        return new Score(
          Scoring.WEAK_MATCH,
          `Likes <span>switches</span> (role)`
        );

      if (
        theirSubDomRole === SubDomRole.AlwaysSubmissive ||
        theirSubDomRole === SubDomRole.UsuallySubmissive
      )
        return new Score(Scoring.MATCH, `Loves <span>submissives</span>`);

      if (yourRoleReversalPreference === KinkPreference.Favorite)
        return new Score(Scoring.MATCH, `Loves <span>role reversal</span>`);

      if (yourRoleReversalPreference === KinkPreference.Yes)
        return new Score(Scoring.MATCH, `Likes <span>role reversal</span>`);

      if (
        yourSubDomRole === SubDomRole.AlwaysDominant &&
        theirSubDomRole === SubDomRole.AlwaysDominant
      )
        return new Score(Scoring.MISMATCH, 'No <span>dominants</span>');

      return new Score(
        Scoring.WEAK_MISMATCH,
        'Hesitant about <span>dominants</span>'
      );
    }

    if (yourSubDomRole === SubDomRole.UsuallySubmissive) {
      if (theirSubDomRole === SubDomRole.Switch)
        return new Score(Scoring.MATCH, `Loves <span>switches</span> (role)`);

      if (
        theirSubDomRole === SubDomRole.AlwaysDominant ||
        theirSubDomRole === SubDomRole.UsuallyDominant
      )
        return new Score(Scoring.MATCH, `Loves <span>dominants</span>`);

      if (yourRoleReversalPreference === KinkPreference.Favorite)
        return new Score(Scoring.MATCH, `Loves <span>role reversal</span>`);

      if (yourRoleReversalPreference === KinkPreference.Yes)
        return new Score(Scoring.MATCH, `Likes <span>role reversal</span>`);

      return new Score(
        Scoring.WEAK_MISMATCH,
        'Hesitant about <span>submissives</span>'
      );
    }

    if (yourSubDomRole === SubDomRole.AlwaysSubmissive) {
      if (theirSubDomRole === SubDomRole.Switch)
        return new Score(
          Scoring.WEAK_MATCH,
          `Likes <span>switches</span> (role)`
        );

      if (
        theirSubDomRole === SubDomRole.AlwaysDominant ||
        theirSubDomRole === SubDomRole.UsuallyDominant
      )
        return new Score(Scoring.MATCH, `Loves <span>dominants</span>`);

      if (yourRoleReversalPreference === KinkPreference.Favorite)
        return new Score(Scoring.MATCH, `Loves <span>role reversal</span>`);

      if (yourRoleReversalPreference === KinkPreference.Yes)
        return new Score(Scoring.MATCH, `Likes <span>role reversal</span>`);

      if (
        yourSubDomRole === SubDomRole.AlwaysSubmissive &&
        theirSubDomRole === SubDomRole.AlwaysSubmissive
      )
        return new Score(Scoring.MISMATCH, 'No <span>submissives</span>');

      return new Score(
        Scoring.WEAK_MISMATCH,
        'Hesitant about <span>submissives</span>'
      );
    }

    // You must be a switch
    if (theirSubDomRole === SubDomRole.Switch)
      return new Score(Scoring.MATCH, `Loves <span>switches</span> (role)`);

    // if (yourRoleReversalPreference === KinkPreference.Favorite)
    //     return new Score(Scoring.MATCH, `Loves <span>role reversal</span>`);
    //
    // if (yourRoleReversalPreference === KinkPreference.Yes)
    //     return new Score(Scoring.MATCH, `Likes <span>role reversal</span>`);

    if (
      theirSubDomRole === SubDomRole.AlwaysDominant ||
      theirSubDomRole === SubDomRole.UsuallyDominant
    )
      return new Score(Scoring.MATCH, `Loves <span>dominants</span>`);

    if (
      theirSubDomRole === SubDomRole.AlwaysSubmissive ||
      theirSubDomRole === SubDomRole.UsuallySubmissive
    )
      return new Score(Scoring.MATCH, `Loves <span>submissives</span>`);

    return new Score(Scoring.NEUTRAL);
  }

  private resolvePositionScore(): Score {
    const yourPosition = this.yourAnalysis.position;
    const theirPosition = this.theirAnalysis.position;

    if (!yourPosition || !theirPosition) return new Score(Scoring.NEUTRAL);

    if (yourPosition === Position.UsuallyTop) {
      if (theirPosition === Position.Switch)
        return new Score(
          Scoring.MATCH,
          `Loves <span>switches</span> (position)`
        );

      if (
        theirPosition === Position.AlwaysBottom ||
        theirPosition === Position.UsuallyBottom
      )
        return new Score(Scoring.MATCH, `Loves <span>bottoms</span>`);

      return new Score(
        Scoring.WEAK_MISMATCH,
        'Hesitant about <span>tops</span>'
      );
    }

    if (yourPosition === Position.AlwaysTop) {
      if (theirPosition === Position.Switch)
        return new Score(
          Scoring.WEAK_MATCH,
          `Likes <span>switches</span> (position)`
        );

      if (
        theirPosition === Position.AlwaysBottom ||
        theirPosition === Position.UsuallyBottom
      )
        return new Score(Scoring.MATCH, `Loves <span>bottoms</span>`);

      if (
        yourPosition === Position.AlwaysTop &&
        theirPosition === Position.AlwaysTop
      )
        return new Score(Scoring.MISMATCH, 'No <span>tops</span>');

      return new Score(
        Scoring.WEAK_MISMATCH,
        'Hesitant about <span>tops</span>'
      );
    }

    if (yourPosition === Position.UsuallyBottom) {
      if (theirPosition === Position.Switch)
        return new Score(
          Scoring.MATCH,
          `Loves <span>switches</span> (position)`
        );

      if (
        theirPosition === Position.AlwaysTop ||
        theirPosition === Position.UsuallyTop
      )
        return new Score(Scoring.MATCH, `Loves <span>tops</span>`);

      return new Score(
        Scoring.WEAK_MISMATCH,
        'Hesitant about <span>bottoms</span>'
      );
    }

    if (yourPosition === Position.AlwaysBottom) {
      if (theirPosition === Position.Switch)
        return new Score(
          Scoring.WEAK_MATCH,
          `Likes <span>switches</span> (position)`
        );

      if (
        theirPosition === Position.AlwaysTop ||
        theirPosition === Position.UsuallyTop
      )
        return new Score(Scoring.MATCH, `Loves <span>tops</span>`);

      if (
        yourPosition === Position.AlwaysBottom &&
        theirPosition === Position.AlwaysBottom
      )
        return new Score(Scoring.MISMATCH, 'No <span>bottoms</span>');

      return new Score(
        Scoring.WEAK_MISMATCH,
        'Hesitant about <span>bottoms</span>'
      );
    }

    // You must be a switch
    if (theirPosition === Position.Switch)
      return new Score(Scoring.MATCH, `Loves <span>switches</span> (position)`);

    // if (yourRoleReversalPreference === KinkPreference.Favorite)
    //     return new Score(Scoring.MATCH, `Loves <span>role reversal</span>`);
    //
    // if (yourRoleReversalPreference === KinkPreference.Yes)
    //     return new Score(Scoring.MATCH, `Likes <span>role reversal</span>`);

    if (
      theirPosition === Position.AlwaysTop ||
      theirPosition === Position.UsuallyTop
    )
      return new Score(Scoring.MATCH, `Loves <span>tops</span>`);

    if (
      theirPosition === Position.AlwaysBottom ||
      theirPosition === Position.UsuallyBottom
    )
      return new Score(Scoring.MATCH, `Loves <span>bottoms</span>`);

    return new Score(Scoring.NEUTRAL);
  }

  private resolveKinkBucketScore(
    bucket:
      | 'all'
      | 'favorite'
      | 'yes'
      | 'maybe'
      | 'no'
      | 'positive'
      | 'negative'
  ): KinkBucketScore {
    const yourKinks = Matcher.getAllStandardKinks(this.you);
    const theirKinks = Matcher.getAllStandardKinks(this.them);

    // let missed = 0;

    const result: any = _.reduce(
      yourKinks,
      (accum, yourKinkValue: any, yourKinkId: any) => {
        const theirKinkId =
          yourKinkId in kinkComparisonSwaps
            ? kinkComparisonSwaps[yourKinkId]
            : yourKinkId;

        const isExcluded =
          yourKinkId in kinkComparisonExclusions ||
          (Store.shared.kinks[yourKinkId] &&
            Store.shared.kinks[yourKinkId].kink_group in
              kinkComparisonExclusionGroups);

        const isBucketMatch =
          yourKinkValue === bucket ||
          bucket === 'all' ||
          (bucket === 'negative' &&
            (yourKinkValue === 'no' || yourKinkValue === 'maybe')) ||
          (bucket === 'positive' &&
            (yourKinkValue === 'favorite' || yourKinkValue === 'yes'));

        if (isBucketMatch && !isExcluded) {
          accum.total += 1;
        }

        if (!(theirKinkId in theirKinks) || isExcluded) {
          return accum;
        }

        const theirKinkValue = theirKinks[theirKinkId] as any;

        if (isBucketMatch) {
          return {
            score:
              accum.score +
              this.getKinkMatchScore(yourKinkValue, theirKinkValue),
            count: accum.count + 1,
            total: accum.total
          };
        }

        return accum;
      },
      { score: 0, count: 0, total: 0 }
    );

    // const yourBucketCounts = this.countKinksByBucket(yourKinks);
    // const theirBucketCounts = this.countKinksByBucket(theirKinks);

    result.weighted =
      result.count === 0 || Math.abs(result.score) < 1
        ? 0
        : Math.log(result.total) *
          Math.log(Math.abs(result.score)) *
          Math.sign(result.score);
    // (Math.log(result.count) / Math.log(kinkMatchWeights.logBase)) // log 8 base
    // * (result.score / result.count)

    return result;
  }

  // private countKinksByBucket(kinks: { [key: number]: KinkChoice }): { favorite: number, yes: number, maybe: number, no: number } {
  //     return _.reduce(
  //       kinks,
  //       (accum, kinkValue) => {
  //         accum[kinkValue] += 1;
  //         return accum;
  //       },
  //       {
  //         favorite: 0,
  //         yes: 0,
  //         maybe: 0,
  //         no: 0
  //       }
  //     );
  // }

  static getAllStandardKinks(c: Character): { [key: number]: KinkChoice } {
    const kinks = _.pickBy(c.kinks, _.isString);

    // Avoid using _.forEach on c.customs because lodash thinks it is an array
    for (const custom of Object.values(c.customs)) {
      if (custom) {
        const children = (custom as any).children ?? {};

        _.each(children, child => (kinks[child] = custom.choice));
      }
    }

    return kinks as any;
  }

  static findKinkById(
    c: Character,
    kinkId: number
  ): KinkChoice | number | undefined {
    if (kinkId in c.kinks) {
      return c.kinks[kinkId];
    }

    for (const custom of Object.values(c.customs)) {
      if (custom) {
        const children = (custom as any).children ?? [];

        if (children.includes(kinkId)) {
          return custom.choice;
        }
      }
    }

    return undefined;
  }

  private getKinkMatchScore(aValue: string, bValue: string): number {
    return _.get(kinkMatchScoreMap, `${aValue}.${bValue}`, 0) * 7; // forces range above 1.0
  }

  static getTagValue(
    tagId: number,
    c: Character
  ): CharacterInfotag | undefined {
    return c.infotags[tagId];
  }

  static getTagValueList(tagId: number, c: Character): number | null {
    const t = Matcher.getTagValue(tagId, c);

    if (!t || !t.list) return null;

    return t.list;
  }

  static isCisGender(...genders: Gender[] | null[]): boolean {
    return _.every(
      genders,
      (g: Gender) => g === Gender.Female || g === Gender.Male
    );
  }

  static getKinkPreference(
    c: Character,
    kinkId: number
  ): KinkPreference | null {
    const kinkVal = Matcher.findKinkById(c, kinkId);

    if (kinkVal === undefined) {
      return null;
    }

    if (typeof kinkVal === 'string') {
      return kinkMapping[kinkVal];
    }

    const custom = c.customs[kinkVal];

    if (!custom) {
      return null;
    }

    return kinkMapping[custom.choice];
  }

  static getKinkGenderPreference(
    c: Character,
    gender: Gender
  ): KinkPreference | null {
    const pref = Matcher.getKinkPreference(c, genderKinkMapping[gender]);
    if (pref) return pref;

    //If we can't find the gender preference *and* the gender is a nonbinary one? We check
    //if the character in question has the nonbinary kink listed as a catch-all.
    if (!this.isCisGender(gender)) {
      return Matcher.getKinkPreference(c, Kink.Nonbinary);
    }
    //If we *really* can't find it, we return null, rather than a maybe value.
    //This function is strictly for checking if somebody has a kink listed. *Not* for the final match score.
    return null;
  }

  static getKinkSpeciesPreference(
    c: Character,
    species: Species
  ): KinkPreference | null {
    return Matcher.getKinkPreference(c, species);
  }

  static has(c: Character, kinkId: Kink): boolean {
    const r = Matcher.getKinkPreference(c, kinkId);

    return r !== null;
  }

  static isMammal(c: Character): boolean | null {
    const species = Matcher.species(c);

    if (species === null) return null;

    return mammalSpecies.indexOf(species) >= 0;
  }

  static isAnthro(c: Character): boolean | null {
    const bodyTypeId = Matcher.getTagValueList(TagId.BodyType, c);

    if (bodyTypeId === BodyType.Anthro) return true;

    const speciesId = Matcher.species(c);

    if (!speciesId) return null;

    return nonAnthroSpecies.indexOf(speciesId) < 0;
  }

  static isHuman(c: Character): boolean | null {
    const bodyTypeId = Matcher.getTagValueList(TagId.BodyType, c);

    if (bodyTypeId === BodyType.Human) return true;

    const speciesId = Matcher.species(c);

    return speciesId === Species.Human;
  }

  static species(c: Character): Species | null {
    const mySpecies = Matcher.getTagValue(TagId.Species, c);

    if (!mySpecies || !mySpecies.string) {
      log.debug('matcher.species.empty', {
        character: c.name
      });

      return null; // In this case, we won't guess. Just get marked as being specieless.
      //Fill in your profiles, people!
    }

    const s = Matcher.getMappedSpecies(mySpecies.string);

    if (!s) {
      log.debug('matcher.species.unknown', {
        character: c.name,
        species: mySpecies.string
      });
    }

    return s;
  }

  static generateSpeciesMappingCache(mapping: SpeciesMap): SpeciesMappingCache {
    return _.mapValues(mapping, (keywords: string[]) =>
      _.map(keywords, (keyword: string) => {
        const keywordPlural = `${keyword}s`; // this is weak: elf -> elves doesn't occur
        return {
          keyword,
          regexp: RegExp(`(^|\\b)(${keyword}|${keywordPlural})($|\\b)`)
        };
      })
    );
  }

  private static speciesMappingCache?: SpeciesMappingCache;
  private static likelyHumanCache?: SpeciesMappingCache;

  private static matchMappedSpecies(
    species: string,
    mapping: SpeciesMappingCache,
    skipAscii: boolean = false
  ): Species | null {
    let foundSpeciesId: Species | null = null;
    let match = '';

    const finalSpecies = (skipAscii ? species : anyAscii(species))
      .toLowerCase()
      .trim();

    _.each(mapping, (matchers, speciesId: string) => {
      _.each(matchers, matcher => {
        // finalSpecies.indexOf(k) >= 0)
        if (
          matcher.keyword.length > match.length &&
          matcher.regexp.test(finalSpecies)
        ) {
          match = matcher.keyword;
          foundSpeciesId = parseInt(speciesId, 10);
        }
      });
    });

    return foundSpeciesId;
  }

  static getMappedSpecies(species: string): Species | null {
    if (!Matcher.speciesMappingCache) {
      Matcher.speciesMappingCache =
        Matcher.generateSpeciesMappingCache(speciesMapping);
    }

    if (!Matcher.likelyHumanCache) {
      Matcher.likelyHumanCache =
        Matcher.generateSpeciesMappingCache(likelyHuman);
    }

    return (
      Matcher.matchMappedSpecies(species, Matcher.speciesMappingCache) ||
      Matcher.matchMappedSpecies(species, Matcher.speciesMappingCache, true) ||
      Matcher.matchMappedSpecies(species, Matcher.likelyHumanCache) ||
      Matcher.matchMappedSpecies(species, Matcher.likelyHumanCache, true)
    );
  }

  static getAllSpecies(c: Character): Species[] {
    const species = Matcher.getAllSpeciesAsStr(c);
    return _.filter(
      _.map(species, s => Matcher.getMappedSpecies(s)),
      s => s !== null
    ) as Species[];
  }

  static getAllSpeciesAsStr(c: Character): string[] {
    const mySpecies = Matcher.getTagValue(TagId.Species, c);

    if (!mySpecies || !mySpecies.string) {
      return [];
    }

    const speciesStr = mySpecies.string
      .toLowerCase()
      .replace(/optionally|alternatively/g, ',')
      .replace(/[)(]/g, ' ')
      .trim();
    const matches = speciesStr.split(/[,]? or |,/);

    return _.filter(
      _.map(matches, m => m.toLowerCase().trim()),
      m => m !== ''
    );
  }

  static strToGender(fchatGenderStr: string | undefined): Gender | null {
    if (fchatGenderStr === undefined) {
      return null;
    }

    if (fchatGenderStr in fchatGenderMap) {
      return fchatGenderMap[fchatGenderStr];
    }

    return null;
  }

  static countScoresAtLevel(
    m: MatchReport,
    scoreLevel: Scoring | null,
    skipYours: boolean = false,
    skipTheirs: boolean = false
  ): number | null {
    if (scoreLevel === null) {
      return null;
    }

    const yourScores = skipYours ? [] : _.values(m.you.scores);
    const theirScores = skipTheirs ? [] : _.values(m.them.scores);

    return _.reduce(
      _.concat(yourScores, theirScores),
      (accum: number, score: Score) =>
        accum + (score.score === scoreLevel ? 1 : 0),
      0
    );
  }

  static countScoresAboveLevel(
    m: MatchReport,
    scoreLevel: Scoring | null,
    skipYours: boolean = false,
    skipTheirs: boolean = false
  ): number {
    if (scoreLevel === null) {
      return 0;
    }

    const yourScores = skipYours ? [] : _.values(m.you.scores);
    const theirScores = skipTheirs ? [] : _.values(m.them.scores);

    return _.reduce(
      _.concat(yourScores, theirScores),
      (accum: number, score: Score) =>
        accum +
        (score.score > scoreLevel && score.score !== Scoring.NEUTRAL ? 1 : 0),
      0
    );
  }

  static countScoresTotal(m: MatchReport): number {
    return _.values(m.you.scores).length + _.values(m.them.scores).length;
  }

  static age(c: Character): number | null {
    const rawAge = Matcher.getTagValue(TagId.Age, c);

    if (!rawAge || !rawAge.string) {
      return null;
    }

    const ageStr = rawAge.string.toLowerCase().replace(/[,.]/g, '').trim();

    if (
      ageStr.indexOf('shota') >= 0 ||
      ageStr.indexOf('loli') >= 0 ||
      ageStr.indexOf('lolli') >= 0 ||
      ageStr.indexOf('pup') >= 0
    ) {
      return 10;
    }

    let age: number | null = null;

    const exactMatch = /^[0-9]+$/.exec(ageStr);
    const rangeMatch = exactMatch ? null : ageStr.match(/^([0-9]+)-([0-9]+)$/);

    if (exactMatch) {
      // '18'
      age = parseInt(rawAge.string, 10);
    } else if (rangeMatch) {
      // '18-22'
      const v1 = parseInt(rangeMatch[1], 10);
      const v2 = parseInt(rangeMatch[2], 10);

      age = Math.min(v1, v2);
    }

    return age && !Number.isNaN(age) && Number.isFinite(age) ? age : null;
  }

  static apparentAge(c: Character): { min: number; max: number } | null {
    const rawAge = Matcher.getTagValue(TagId.ApparentAge, c);

    if (!rawAge || !rawAge.string) {
      return null;
    }

    const ageStr = rawAge.string.toLowerCase().replace(/[,.]/g, '').trim();

    if (ageStr === '') {
      return null;
    }

    // '18'
    if (/^[0-9]+$/.exec(ageStr)) {
      const val = parseInt(rawAge.string, 10);

      return { min: val, max: val };
    }

    // '18-22'
    const rangeMatch = ageStr.match(/^([0-9]+)-([0-9]+)$/);

    if (rangeMatch) {
      const v1 = parseInt(rangeMatch[1], 10);
      const v2 = parseInt(rangeMatch[2], 10);

      return { min: Math.min(v1, v2), max: Math.max(v1, v2) };
    }

    if (
      ageStr.indexOf('shota') >= 0 ||
      ageStr.indexOf('loli') >= 0 ||
      ageStr.indexOf('lolli') >= 0 ||
      ageStr.indexOf('pup') >= 0
    ) {
      return { min: 10, max: 10 };
    }

    return null;
  }

  static calculateSearchScoreForMatch(
    score: Scoring,
    match: MatchReport,
    penalty: number
  ): number {
    const totalScoreDimensions = match ? Matcher.countScoresTotal(match) : 0;
    const dimensionsAtScoreLevel = match
      ? Matcher.countScoresAtLevel(match, score) || 0
      : 0;
    const dimensionsAboveScoreLevel = match
      ? Matcher.countScoresAboveLevel(
          match,
          Math.max(score, Scoring.WEAK_MATCH)
        )
      : 0;

    let atLevelScore = 0;
    let aboveLevelScore = 0;

    let theirAtLevelDimensions = 0;
    let atLevelMul = 0;
    let theirAboveLevelDimensions = 0;
    let aboveLevelMul = 0;

    if (dimensionsAtScoreLevel > 0 && totalScoreDimensions > 0) {
      const matchRatio = dimensionsAtScoreLevel / totalScoreDimensions;
      theirAtLevelDimensions =
        Matcher.countScoresAtLevel(match, score, true, false) || 0;

      // 1.0 == bad balance; 0.0 == ideal balance
      atLevelMul =
        Math.abs(theirAtLevelDimensions / dimensionsAtScoreLevel - 0.5) * 2;

      atLevelScore =
        (1 - atLevelMul * 0.5) * Math.pow(dimensionsAtScoreLevel, matchRatio);
    }

    if (dimensionsAboveScoreLevel > 0 && totalScoreDimensions > 0) {
      const matchRatio = dimensionsAboveScoreLevel / totalScoreDimensions;

      theirAboveLevelDimensions =
        Matcher.countScoresAboveLevel(match, score, true, false) || 0;

      // 1.0 == bad balance; 0.0 == ideal balance
      aboveLevelMul =
        Math.abs(theirAboveLevelDimensions / dimensionsAboveScoreLevel - 0.5) *
        2;

      aboveLevelScore =
        (1 - aboveLevelMul * 0.5) *
        Math.pow(dimensionsAboveScoreLevel, matchRatio);
    }

    // const kinkScore = match.you.kinkScore.weighted;

    log.debug('report.score.search', match.you.you.name, match.them.you.name, {
      you: match.you.you.name,
      them: match.them.you.name,
      searchScore: atLevelScore + aboveLevelScore,
      atLevelScore,
      aboveLevelScore,
      atLevelMul,
      aboveLevelMul,
      dimensionsAboveScoreLevel,
      dimensionsAtScoreLevel,
      theirAtLevelDimensions,
      theirAboveLevelDimensions,
      penalty
    });

    return atLevelScore + aboveLevelScore + penalty;
  }
}

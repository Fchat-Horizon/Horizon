import * as _ from 'lodash';
import { Matcher } from '../matcher';
import { BodyType, Build, Gender, Kink, Species, TagId } from '../matcher-types';
import { SmartFilterSelection, SmartFilterSettings } from './types';
import { Character } from '../../interfaces';
import log from 'electron-log';
import core from '../../chat/core';

export interface SmartFilterOpts {
  name: string;
  kinks?: Kink[];
  bodyTypes?: BodyType[];
  builds?: Build[];
  species?: Species[];
  genders?: Gender[];
  isAnthro?: boolean;
  isHuman?: boolean;
}

export interface SmartFilterTestResult {
  isFiltered: boolean;
  builds: boolean;
  bodyTypes: boolean;
  species: boolean;
  genders: boolean;
  isAnthro: boolean;
  isHuman: boolean;
  kinks: boolean;
}

function getBaseLog(base: number, x: number): number {
  return Math.log(x) / Math.log(base);
}

export class SmartFilter {
  constructor(private opts: SmartFilterOpts) {}

  test(c: Character): SmartFilterTestResult {
    const builds = this.testBuilds(c);
    const bodyTypes = this.testBodyTypes(c);
    const species = this.testSpecies(c);
    const isAnthro = this.testIsAnthro(c);
    const isHuman = this.testIsHuman(c);
    const kinks = this.testKinks(c);
    const genders = this.testGenders(c);

    const isFiltered = builds || bodyTypes || species || isAnthro || isHuman || kinks || genders;
    const result = { isFiltered, builds, bodyTypes, species, isAnthro, isHuman, kinks, genders };

    log.silly('smart-filter.test', { name: c.name, filterName: this.opts.name, result });

    return result;
  }

  testKinks(c: Character): boolean {
    if (!this.opts.kinks) {
      return false;
    }

    const score = _.reduce(
      this.opts.kinks,
      (curScore, kinkId) => {
        const pref = Matcher.getKinkPreference(c, kinkId);

        if (pref) {
          curScore.matches += 1;
          curScore.score += pref;
        }

        return curScore;
      },
      { score: 0, matches: 0 }
    );

    const baseLog = getBaseLog(5, (this.opts.kinks?.length || 0) + 1);
    const threshold = baseLog * baseLog + 1;

    return score.matches >= 1 && score.score >= threshold;
  }

  testBuilds(c: Character): boolean {
    if (!this.opts.builds) {
      return false;
    }

    const build = Matcher.getTagValueList(TagId.Build, c);

    return build !== null && _.findIndex(this.opts.builds || [], b => b === build) >= 0;
  }

  testGenders(c: Character): boolean {
    if (!this.opts.genders) {
      return false;
    }

    const gender = Matcher.getTagValueList(TagId.Gender, c);

    return gender !== null && _.findIndex(this.opts.genders || [], g => g === gender) >= 0;
  }

  testBodyTypes(c: Character): boolean {
    if (!this.opts.bodyTypes) {
      return false;
    }

    const bodyType = Matcher.getTagValueList(TagId.BodyType, c);

    return bodyType !== null && _.findIndex(this.opts.bodyTypes || [], b => b === bodyType) >= 0;
  }

  testSpecies(c: Character): boolean {
    if (!this.opts.species) {
      return false;
    }

    const species = Matcher.species(c);

    return species !== null && _.findIndex(this.opts.species || [], s => s === species) >= 0;
  }

  testIsHuman(c: Character): boolean {
    return !!this.opts.isHuman && (Matcher.isHuman(c) || false);
  }

  testIsAnthro(c: Character): boolean {
    return !!this.opts.isAnthro && (Matcher.isAnthro(c) || false);
  }
}

export type SmartFilterCollection = {
  [key in keyof SmartFilterSelection]: SmartFilter;
};

export const smartFilters: SmartFilterCollection = {
  ageplay: new SmartFilter({
    name: 'ageplay',
    kinks: [Kink.Ageplay, Kink.AgeProgression, Kink.AgeRegression, Kink.UnderageCharacters, Kink.Infantilism]
  }),

  anthro: new SmartFilter({
    name: 'anthro',
    isAnthro: true
  }),

  female: new SmartFilter({
    name: 'female',
    genders: [Gender.Female]
  }),

  feral: new SmartFilter({
    name: 'feral',
    bodyTypes: [BodyType.Feral]
  }),

  gore: new SmartFilter({
    name: 'gore',
    kinks: [
      Kink.Abrasions,
      Kink.Castration,
      Kink.Death,
      Kink.Emasculation,
      Kink.ExecutionMurder,
      Kink.Gore,
      Kink.Impalement,
      Kink.Mutilation,
      Kink.Necrophilia,
      Kink.NonsexualPain,
      Kink.NonsexualTorture,
      Kink.Nullification,
      Kink.ToothRemoval,
      Kink.WoundFucking,
      Kink.Cannibalism,
      Kink.GenitalTorture
    ]
  }),

  human: new SmartFilter({
    name: 'human',
    isHuman: true
  }),

  hyper: new SmartFilter({
    name: 'kinks',
    kinks: [
      Kink.HyperAsses,
      Kink.HyperBalls,
      Kink.HyperBreasts,
      Kink.HyperCocks,
      Kink.HyperFat,
      Kink.HyperMuscle,
      Kink.HyperVaginas,
      Kink.HyperVoluptous,
      Kink.HyperMuscleGrowth,
      Kink.MacroAsses,
      Kink.MacroBalls,
      Kink.MacroBreasts,
      Kink.MacroCocks
    ]
  }),

  incest: new SmartFilter({
    name: 'incest',
    kinks: [Kink.Incest, Kink.IncestParental, Kink.IncestSiblings, Kink.ParentChildPlay, Kink.ForcedIncest]
  }),

  intersex: new SmartFilter({
    name: 'intersex',
    genders: [Gender.Transgender, Gender.Herm, Gender.MaleHerm, Gender.Cuntboy, Gender.Shemale]
  }),

  male: new SmartFilter({
    name: 'male',
    genders: [Gender.Male]
  }),

  microMacro: new SmartFilter({
    name: 'microMacro',
    kinks: [
      Kink.MacroAsses,
      Kink.MacroBalls,
      Kink.MacroBreasts,
      Kink.MacroCocks,
      Kink.Macrophilia,
      Kink.MegaMacro,
      Kink.Microphilia,
      Kink.GrowthMacro,
      Kink.ShrinkingMicro,
      Kink.SizeDifferencesMicroMacro
    ]
  }),

  obesity: new SmartFilter({
    name: 'obesity',
    builds: [Build.Tubby, Build.Obese, Build.Chubby]
  }),

  pregnancy: new SmartFilter({
    name: 'pregnancy',
    kinks: [Kink.AlternativePregnancy, Kink.AnalPregnancy, Kink.Birthing, Kink.ExtremePregnancy, Kink.MalePregnancy, Kink.Pregnancy]
  }),

  pokemon: new SmartFilter({
    name: 'pokemon',
    species: [Species.Pokemon]
  }),

  rape: new SmartFilter({
    name: 'rape',
    kinks: [Kink.PseudoRape, Kink.DubConsensual, Kink.Nonconsensual]
  }),

  scat: new SmartFilter({
    name: 'scat',
    kinks: [Kink.HyperScat, Kink.Scat, Kink.ScatTorture, Kink.Soiling, Kink.SwallowingFeces]
  }),

  std: new SmartFilter({
    name: 'std',
    kinks: [Kink.STDs]
  }),

  taur: new SmartFilter({
    name: 'taur',
    bodyTypes: [BodyType.Taur]
  }),

  unclean: new SmartFilter({
    name: 'unclean',
    kinks: [
      Kink.BelchingBurping,
      Kink.DirtyFeet,
      Kink.ExtremeMusk,
      Kink.Farting,
      Kink.Filth,
      Kink.Slob,
      Kink.Smegma,
      Kink.SwallowingVomit,
      Kink.UnwashedMusk,
      Kink.Vomiting
    ]
  }),

  vore: new SmartFilter({
    name: 'vore',
    kinks: [
      Kink.Absorption,
      Kink.AlternativeVore,
      Kink.AnalVore,
      Kink.Cannibalism,
      Kink.CockVore,
      Kink.CookingVore,
      Kink.Digestion,
      Kink.Disposal,
      Kink.HardVore,
      Kink.RealisticVore,
      Kink.SoftVore,
      Kink.Unbirthing,
      Kink.UnrealisticVore,
      Kink.VoreBeingPredator,
      Kink.VoreBeingPrey
    ]
  }),

  watersports: new SmartFilter({
    name: 'watersports',
    kinks: [Kink.HyperWatersports, Kink.PissEnemas, Kink.SwallowingUrine, Kink.Watersports, Kink.Wetting]
  }),

  zoophilia: new SmartFilter({
    name: 'zoophilia',
    kinks: [Kink.Zoophilia, Kink.AnimalsFerals, Kink.Quadrupeds]
  })
};

export function testSmartFilters(
  c: Character,
  opts: SmartFilterSettings
): {
  ageCheck: { ageMin: boolean; ageMax: boolean };
  filters: { [key in keyof SmartFilterCollection]: SmartFilterTestResult };
} | null {
  if (c.name === core.characters.ownCharacter.name) {
    return null;
  }

  const coreCharacter = core.characters.get(c.name);

  if (coreCharacter?.isChatOp || coreCharacter?.isBookmarked || coreCharacter?.isFriend) {
    return null;
  }

  if (opts.exceptionNames.includes(c.name)) {
    log.debug('smart-filter.exception', { name: c.name });
    return null;
  }

  const ageCheck = { ageMin: false, ageMax: false };

  if (opts.minAge !== null || opts.maxAge !== null) {
    const age = Matcher.age(c) || Matcher.apparentAge(c)?.min || null;

    if (age !== null) {
      if (opts.minAge !== null && age < opts.minAge) {
        log.debug('smart-filter.age.min', { name: c.name, age, minAge: opts.minAge });
        ageCheck.ageMin = true;
      }

      if (opts.maxAge !== null && age > opts.maxAge) {
        log.debug('smart-filter.age.max', { name: c.name, age, maxAge: opts.maxAge });
        ageCheck.ageMax = true;
      }
    }
  }

  return {
    ageCheck,
    filters: _.mapValues(smartFilters, (f, k) => (opts.smartFilters as any)[k] && f.test(c))
  };
}

export function matchesSmartFilters(c: Character, opts: SmartFilterSettings): boolean {
  const match = testSmartFilters(c, opts);

  if (!match) {
    return false;
  }

  if (match.ageCheck.ageMax || match.ageCheck.ageMin) {
    return true;
  }

  return !_.every(match.filters, filterResult => !filterResult.isFiltered);
}

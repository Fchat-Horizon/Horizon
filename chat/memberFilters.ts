import { Channel, Character, AvailableSort } from './interfaces';
import { CharacterAnalysis, Matcher } from '../learn/matcher';
import { Gender, Scoring, fchatGenderMap } from '../learn/matcher-types';

const genderPreferredOrder: Gender[] = [
  Gender.Female,
  Gender.Male,
  Gender.Herm,
  Gender.Shemale,
  Gender.Cuntboy,
  Gender.Transgender,
  Gender.MaleHerm,
  Gender.None
];

function displayNameForGender(genderValue: number): string {
  const rev: { [key: number]: string } = {};
  Object.keys(fchatGenderMap).forEach(k => {
    const v = (fchatGenderMap as any)[k] as number | undefined;
    if (typeof v === 'number') rev[v] = k;
  });

  return rev[genderValue] || 'None';
}

export const genderOptions: string[] = genderPreferredOrder.map(gv =>
  displayNameForGender(gv as number)
);

export const statusSort: { [key: string]: number } = {
  crown: 0,
  looking: 1,
  online: 2,
  idle: 3,
  away: 4,
  busy: 5,
  dnd: 6,
  offline: 7
};

export const genderSort: { [key: string]: number } =
  genderPreferredOrder.reduce(
    (acc: { [key: string]: number }, gv: Gender, idx: number) => {
      acc[displayNameForGender(gv as number)] = idx;
      return acc;
    },
    {}
  );

function normalizeLabel(s: string | undefined): string {
  if (!s) return '';
  return s
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

const canonicalGenderByNormalized: { [key: string]: string } = {};
Object.keys(genderSort).forEach(k => {
  canonicalGenderByNormalized[normalizeLabel(k)] = k;
});

let cachedGenderPreferences: Map<Gender, Scoring> | null = null;

export function clearGenderPreferenceCache(): void {
  cachedGenderPreferences = null;
}

function getOrComputeGenderPreferences(
  profile: CharacterAnalysis
): Map<Gender, Scoring> {
  if (cachedGenderPreferences) {
    return cachedGenderPreferences;
  }

  cachedGenderPreferences = new Map<Gender, Scoring>();
  const c = profile.character as any;

  Object.values(Gender)
    .filter(v => typeof v === 'number')
    .forEach(gv => {
      let score: Scoring = Scoring.NEUTRAL;
      const kinkPref = Matcher.getKinkGenderPreference(c, gv as Gender);
      if (kinkPref === null) {
        score = Matcher.scoreOrientationByGender(
          profile.gender,
          profile.orientation,
          gv as Gender
        ).score;
      } else {
        score = Matcher.formatKinkScore(kinkPref, gv.toString()).score;
      }
      cachedGenderPreferences!.set(gv as Gender, score);
    });

  return cachedGenderPreferences;
}

export function computeGenderPreferenceBuckets(profile: CharacterAnalysis): {
  match: string[];
  weakMatch: string[];
  neutral: string[];
  weakMismatch: string[];
  mismatch: string[];
} {
  const preferences = getOrComputeGenderPreferences(profile);

  const matches: string[] = [];
  const weakMatches: string[] = [];
  const weakMismatches: string[] = [];
  const mismatches: string[] = [];
  const neutral: string[] = [];

  preferences.forEach((score, gender) => {
    const display = displayNameForGender(gender as number);
    switch (score) {
      case Scoring.MATCH:
        matches.push(display);
        break;
      case Scoring.WEAK_MATCH:
        weakMatches.push(display);
        break;
      case Scoring.NEUTRAL:
        neutral.push(display);
        break;
      case Scoring.WEAK_MISMATCH:
        weakMismatches.push(display);
        break;
      case Scoring.MISMATCH:
        mismatches.push(display);
        break;
    }
  });

  return {
    match: matches,
    weakMatch: weakMatches,
    neutral,
    weakMismatch: weakMismatches,
    mismatch: mismatches
  };
}

export function filterByName(
  members: ReadonlyArray<Channel.Member>,
  filterText: string
): ReadonlyArray<Channel.Member> {
  if (!filterText || filterText.length === 0) return members;
  const filter = new RegExp(filterText.replace(/[^\w]/gi, '\\$&'), 'i');
  return members.filter(member => filter.test(member.character.name));
}

export function filterCharactersByName(
  characters: ReadonlyArray<Character>,
  filterText: string
): ReadonlyArray<Character> {
  if (!filterText || filterText.length === 0) return characters;
  const filter = new RegExp(filterText.replace(/[^\w]/gi, '\\$&'), 'i');
  return characters.filter(character => filter.test(character.name));
}

export function filterByGender(
  members: ReadonlyArray<Channel.Member>,
  genderFilters: string[] | undefined
): ReadonlyArray<Channel.Member> {
  if (!genderFilters) return members;
  const effective = genderFilters
    .map(g => (typeof g === 'string' ? g.trim() : ''))
    .filter(g => g.length > 0);

  if (effective.length === 0) return members;

  const normalizedSet = new Set(effective.map(g => normalizeLabel(g)));

  return members.filter(m => {
    const raw = m.character.gender || 'None';
    const cand = canonicalGenderByNormalized[normalizeLabel(raw)] || raw;
    return normalizedSet.has(normalizeLabel(cand));
  });
}

export function filterCharactersByGender(
  characters: ReadonlyArray<Character>,
  genderFilters: string[] | undefined
): ReadonlyArray<Character> {
  if (!genderFilters) return characters;
  const effective = genderFilters
    .map(g => (typeof g === 'string' ? g.trim() : ''))
    .filter(g => g.length > 0);

  if (effective.length === 0) return characters;

  const normalizedSet = new Set(effective.map(g => normalizeLabel(g)));

  return characters.filter(character => {
    const raw = character.gender || 'None';
    const cand = canonicalGenderByNormalized[normalizeLabel(raw)] || raw;
    return normalizedSet.has(normalizeLabel(cand));
  });
}

export function filterByStatus(
  members: ReadonlyArray<Channel.Member>,
  selectedStatuses: string[] | undefined
): ReadonlyArray<Channel.Member> {
  if (!selectedStatuses || selectedStatuses.length === 0) return members;
  return members.filter(
    m => selectedStatuses.indexOf(m.character.status) !== -1
  );
}

export function filterCharactersByStatus(
  characters: ReadonlyArray<Character>,
  selectedStatuses: string[] | undefined
): ReadonlyArray<Character> {
  if (!selectedStatuses || selectedStatuses.length === 0) return characters;
  return characters.filter(
    character => selectedStatuses.indexOf(character.status) !== -1
  );
}

export function sortMembers(
  members: ReadonlyArray<Channel.Member>,
  sortType: AvailableSort
): ReadonlyArray<Channel.Member> {
  if (sortType === 'normal') return members;

  const sorted = [...members];
  switch (sortType) {
    case 'status':
      sorted.sort((a, b) => {
        const aVal = statusSort[a.character.status];
        const bVal = statusSort[b.character.status];
        if (aVal - bVal === 0) {
          return a.character.name.localeCompare(b.character.name);
        }
        return aVal - bVal;
      });
      break;

    case 'gender':
      sorted.sort((a, b) => {
        const aKey =
          canonicalGenderByNormalized[
            normalizeLabel(a.character.gender || 'None')
          ] ||
          a.character.gender ||
          'None';
        const bKey =
          canonicalGenderByNormalized[
            normalizeLabel(b.character.gender || 'None')
          ] ||
          b.character.gender ||
          'None';
        const aVal = genderSort[aKey];
        const bVal = genderSort[bKey];
        if (aVal - bVal === 0) {
          return a.character.name.localeCompare(b.character.name);
        }
        return aVal - bVal;
      });
      break;
  }

  return sorted;
}

export function sortCharacters(
  characters: ReadonlyArray<Character>,
  sortType: AvailableSort
): ReadonlyArray<Character> {
  if (sortType === 'normal') {
    return [...characters].sort((a, b) => a.name.localeCompare(b.name));
  }

  const sorted = [...characters];
  switch (sortType) {
    case 'status':
      sorted.sort((a, b) => {
        const aVal = statusSort[a.status];
        const bVal = statusSort[b.status];
        if (aVal - bVal === 0) {
          return a.name.localeCompare(b.name);
        }
        return aVal - bVal;
      });
      break;

    case 'gender':
      sorted.sort((a, b) => {
        const aKey =
          canonicalGenderByNormalized[normalizeLabel(a.gender || 'None')] ||
          a.gender ||
          'None';
        const bKey =
          canonicalGenderByNormalized[normalizeLabel(b.gender || 'None')] ||
          b.gender ||
          'None';
        const aVal = genderSort[aKey];
        const bVal = genderSort[bKey];
        if (aVal - bVal === 0) {
          return a.name.localeCompare(b.name);
        }
        return aVal - bVal;
      });
      break;
  }

  return sorted;
}

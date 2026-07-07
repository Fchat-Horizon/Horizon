'use strict';

// Function: validates chat/locales/*.json against en_us.json as the source
// of truth. Errors fail CI; warnings are informational only.

const fs = require('fs');
const path = require('path');

const LOCALE_DIR = path.join(__dirname, '..', 'chat', 'locales');
const SOURCE_FILE = 'en-US.json';

let errorCount = 0;
let warningCount = 0;

function error(file, message) {
  errorCount++;
  console.error(`[error] ${file}: ${message}`);
}

function warn(file, message) {
  warningCount++;
  console.warn(`[warn]  ${file}: ${message}`);
}

function placeholders(str) {
  return new Set(str.match(/\{\w+\}/g) ?? []);
}

const CLDR_SUFFIX = /^(.+)_(zero|one|two|few|many|other)$/;

function pluralCategories(file) {
  const code = path.basename(file, '.json');
  try {
    return new Intl.PluralRules(code).resolvedOptions().pluralCategories;
  } catch {
    warn(file, `${code} is not a valid BCP47 code, assuming one/other`);
    return ['one', 'other'];
  }
}

function pluralGroups(data) {
  const groups = new Map();
  for (const key of Object.keys(data)) {
    const match = CLDR_SUFFIX.exec(key);
    if (match === null) continue;
    if (!groups.has(match[1])) groups.set(match[1], new Set());
    groups.get(match[1]).add(match[2]);
  }
  return groups;
}

function keyPattern(raw) {
  return raw.matchAll(/^\s*"((?:[^"\\]|\\.)*)"\s*:/gm);
}

function loadLocale(file) {
  const raw = fs.readFileSync(path.join(LOCALE_DIR, file), 'utf8');

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    error(file, `invalid JSON: ${e.message}`);
    return null;
  }

  // ! JSON.parse silently keeps the last duplicate, so scan the raw text.
  const seen = new Set();
  for (const [, key] of keyPattern(raw)) {
    if (seen.has(key)) error(file, `duplicate key ${key}`);
    seen.add(key);
  }

  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== 'string') {
      error(file, `${key} is not a string (locale files must be flat)`);
      delete data[key];
    } else if (value === '') {
      warn(file, `${key} is an empty string`);
    }
  }

  const keys = Object.keys(data);
  const sorted = [...keys].sort();
  if (JSON.stringify(keys) !== JSON.stringify(sorted)) {
    const misplaced = keys.find((k, i) => k !== sorted[i]);
    warn(file, `keys are not sorted (first out of place: ${misplaced})`);
  }

  return data;
}

function checkSourcePlurals(source, sourceGroups) {
  for (const [base, cats] of sourceGroups) {
    // ^ The source stays English-shaped; other categories live in translations
    if ([...cats].sort().join(',') !== 'one,other')
      error(
        SOURCE_FILE,
        `plural group ${base} must have exactly _one and _other ` +
          `(has ${[...cats].map(c => `_${c}`).join(', ')})`
      );
    if (base in source)
      error(
        SOURCE_FILE,
        `${base} exists as both a bare key and a plural group`
      );
  }
}

function checkTranslation(file, data, source, sourceGroups) {
  const required = pluralCategories(file);
  const groups = new Map();

  for (const [key, value] of Object.entries(data)) {
    const match = CLDR_SUFFIX.exec(key);
    const base = match !== null && sourceGroups.has(match[1]) ? match[1] : null;
    const sourceValue =
      base !== null ? (source[key] ?? source[`${base}_other`]) : source[key];
    if (sourceValue === undefined) {
      error(file, `stale key ${key} (not in ${SOURCE_FILE})`);
      continue;
    }
    if (base !== null) {
      if (!groups.has(base)) groups.set(base, new Set());
      groups.get(base).add(match[2]);
    }

    const expected = placeholders(sourceValue);
    const actual = placeholders(value);
    for (const p of actual) {
      // {count} is optional in plural forms ("1 minute" vs "{count} minutes")
      if (base !== null && p === '{count}') continue;
      if (!expected.has(p))
        error(file, `${key} uses ${p}, which ${SOURCE_FILE} does not have`);
    }
    for (const p of expected) {
      if (base !== null && p === '{count}') continue;
      if (!actual.has(p))
        error(file, `${key} is missing placeholder ${p} from ${SOURCE_FILE}`);
    }
  }

  for (const [base, cats] of groups) {
    if (!cats.has('other'))
      error(file, `plural group ${base} is missing _other (the fallback form)`);
    for (const cat of required) {
      if (!cats.has(cat))
        warn(file, `plural group ${base} is missing _${cat} for this language`);
    }
    for (const cat of cats) {
      if (!required.includes(cat))
        warn(
          file,
          `plural group ${base} has _${cat}, which this language does not use`
        );
    }
  }
}

const source = loadLocale(SOURCE_FILE);
if (!source) {
  console.error(`${SOURCE_FILE} could not be parsed, aborting.`);
  process.exit(1);
}

const sourceGroups = pluralGroups(source);
checkSourcePlurals(source, sourceGroups);

const files = fs
  .readdirSync(LOCALE_DIR)
  .filter(f => f.endsWith('.json') && f !== SOURCE_FILE)
  .sort();

for (const file of files) {
  const data = loadLocale(file);
  if (data) checkTranslation(file, data, source, sourceGroups);
}

console.log(
  `Checked ${files.length + 1} locale files: ` +
    `${errorCount} error${errorCount === 1 ? '' : 's'}, ` +
    `${warningCount} warning${warningCount === 1 ? '' : 's'}.`
);
process.exit(errorCount ? 1 : 0);

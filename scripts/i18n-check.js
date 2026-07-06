'use strict';

// Function: validates chat/locales/*.json against en_us.json as the source
// of truth. Errors fail CI; warnings are informational only.

const fs = require('fs');
const path = require('path');

const LOCALE_DIR = path.join(__dirname, '..', 'chat', 'locales');
const SOURCE_FILE = 'en_us.json';

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
  return new Set(str.match(/\{\d+\}/g) ?? []);
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

function checkTranslation(file, data, source) {
  for (const [key, value] of Object.entries(data)) {
    const sourceValue = source[key];
    if (sourceValue === undefined) {
      error(file, `stale key ${key} (not in ${SOURCE_FILE})`);
      continue;
    }

    const expected = placeholders(sourceValue);
    const actual = placeholders(value);
    for (const p of actual) {
      if (!expected.has(p))
        error(file, `${key} uses ${p}, which ${SOURCE_FILE} does not have`);
    }
    for (const p of expected) {
      if (!actual.has(p))
        error(file, `${key} is missing placeholder ${p} from ${SOURCE_FILE}`);
    }
  }
}

const source = loadLocale(SOURCE_FILE);
if (!source) {
  console.error(`${SOURCE_FILE} could not be parsed, aborting.`);
  process.exit(1);
}

const files = fs
  .readdirSync(LOCALE_DIR)
  .filter(f => f.endsWith('.json') && f !== SOURCE_FILE)
  .sort();

for (const file of files) {
  const data = loadLocale(file);
  if (data) checkTranslation(file, data, source);
}

console.log(
  `Checked ${files.length + 1} locale files: ` +
    `${errorCount} error${errorCount === 1 ? '' : 's'}, ` +
    `${warningCount} warning${warningCount === 1 ? '' : 's'}.`
);
process.exit(errorCount ? 1 : 0);

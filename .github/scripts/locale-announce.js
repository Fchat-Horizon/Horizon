'use strict';

const { execFileSync } = require('child_process');
const path = require('path');

const LOCALE_DIR = 'chat/locales';
const SOURCE_FILE = 'en_us.json';
const WEBLATE_BASE = 'https://translate.horizn.moe';
const WEBLATE_COMPONENT = `${WEBLATE_BASE}/projects/horizon/User-Interface`;
const MAX_LISTED_KEYS = 15;
const MAX_SEARCH_KEYS = 30;

const LANGUAGE_NAMES = {
  en_us: 'English (US)',
  en_uwu: 'Cyute Engwish',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano',
  hu: 'Magyar',
  ru: 'Русский',
  ja: '日本語'
};

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' });
}

function readLocaleAt(sha, file) {
  try {
    return JSON.parse(git('show', `${sha}:${LOCALE_DIR}/${file}`));
  } catch {
    return null;
  }
}

function diffKeys(before, after) {
  const added = [];
  const changed = [];
  const removed = [];
  for (const key of Object.keys(after)) {
    if (!(key in before)) added.push(key);
    else if (before[key] !== after[key]) changed.push(key);
  }
  for (const key of Object.keys(before)) {
    if (!(key in after)) removed.push(key);
  }
  return { added, changed, removed };
}

function plural(n, noun) {
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

function repoUrl() {
  const server = process.env.GITHUB_SERVER_URL ?? 'https://github.com';
  const repo = process.env.GITHUB_REPOSITORY ?? 'Fchat-Horizon/Horizon';
  return `${server}/${repo}`;
}

function changesUrl(beforeSha, afterSha) {
  const count = Number(
    git('rev-list', '--count', `${beforeSha}..${afterSha}`).trim()
  );
  return count === 1
    ? `${repoUrl()}/commit/${afterSha}`
    : `${repoUrl()}/compare/${beforeSha}...${afterSha}`;
}

// Function: Weblate search across all languages, filtered to the given keys.
function searchUrl(keys) {
  const pattern = keys
    .slice(0, MAX_SEARCH_KEYS)
    .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const query = `key:r"^(${pattern})$"`;
  return `${WEBLATE_BASE}/search/horizon/User-Interface/?q=${encodeURIComponent(query)}`;
}

function listKeys(label, keys) {
  if (!keys.length) return null;
  const shown = keys.slice(0, MAX_LISTED_KEYS).map(k => `\`${k}\``);
  if (keys.length > MAX_LISTED_KEYS)
    shown.push(`...and ${keys.length - MAX_LISTED_KEYS} more`);
  return `**${label}:** ${shown.join(', ')}`;
}

function sourceEmbed(beforeSha, afterSha) {
  const after = readLocaleAt(afterSha, SOURCE_FILE);
  if (!after) return null;
  const before = readLocaleAt(beforeSha, SOURCE_FILE) ?? {};
  const { added, changed, removed } = diffKeys(before, after);
  if (!added.length && !changed.length && !removed.length) return null;

  const counts = [];
  if (added.length) counts.push(plural(added.length, 'new string'));
  if (changed.length) counts.push(plural(changed.length, 'changed string'));
  if (removed.length) counts.push(plural(removed.length, 'removed string'));

  const translatable = [...added, ...changed];
  const links = [];
  if (translatable.length)
    links.push(`[Translate the updated strings](${searchUrl(translatable)})`);
  links.push(`[View on Weblate](${WEBLATE_COMPONENT}/)`);
  links.push(`[View changes](${changesUrl(beforeSha, afterSha)})`);

  const description = [
    `\`${SOURCE_FILE}\` changed on \`development\` @ \`${afterSha.slice(0, 7)}\``,
    '',
    counts.join('\n'),
    '',
    listKeys('New', added),
    listKeys('Changed', changed),
    listKeys('Removed', removed),
    '',
    links.join(' • ')
  ]
    .filter(line => line !== null)
    .join('\n');

  return {
    title: 'Source strings updated',
    description,
    color: 0x5865f2,
    timestamp: new Date().toISOString()
  };
}

function translationsEmbed(beforeSha, afterSha, files) {
  const lines = [];
  for (const file of files) {
    const code = path.basename(file, '.json');
    const after = readLocaleAt(afterSha, path.basename(file));
    if (!after) continue;
    const before = readLocaleAt(beforeSha, path.basename(file));
    const name = `[${LANGUAGE_NAMES[code] ?? code}](${WEBLATE_COMPONENT}/${code}/)`;
    if (!before) {
      lines.push(
        `**${name}** - new language, ${plural(Object.keys(after).length, 'string')}`
      );
      continue;
    }
    const { added, changed, removed } = diffKeys(before, after);
    const updated = added.length + changed.length;
    const parts = [];
    if (updated) parts.push(plural(updated, 'string') + ' translated');
    if (removed.length)
      parts.push(plural(removed.length, 'string') + ' removed');
    if (parts.length) lines.push(`**${name}** - ${parts.join(', ')}`);
  }
  if (!lines.length) return null;

  const links = [
    `[View on Weblate](${WEBLATE_COMPONENT}/)`,
    `[View changes](${changesUrl(beforeSha, afterSha)})`
  ];

  return {
    title: 'New translations',
    description: [...lines, '', links.join(' • ')].join('\n'),
    color: 0x57f287,
    timestamp: new Date().toISOString()
  };
}

async function main() {
  const afterSha = process.env.AFTER_SHA;
  let beforeSha = process.env.BEFORE_SHA;
  // ! On force pushes or new branches the before SHA is all zeroes.
  if (!beforeSha || /^0+$/.test(beforeSha)) beforeSha = `${afterSha}^`;

  const changedFiles = git(
    'diff',
    '--name-only',
    beforeSha,
    afterSha,
    '--',
    `${LOCALE_DIR}/*.json`
  )
    .split('\n')
    .filter(Boolean);

  const sourceChanged = changedFiles.some(
    f => path.basename(f) === SOURCE_FILE
  );
  const translationFiles = changedFiles.filter(
    f => path.basename(f) !== SOURCE_FILE
  );

  const embeds = [];
  if (sourceChanged) {
    const embed = sourceEmbed(beforeSha, afterSha);
    if (embed) embeds.push(embed);
  }
  if (translationFiles.length) {
    const embed = translationsEmbed(beforeSha, afterSha, translationFiles);
    if (embed) embeds.push(embed);
  }

  if (!embeds.length) {
    console.log('No key-level locale changes detected, nothing to announce.');
    return;
  }

  const payload = { username: 'Translation Bot', embeds };

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('DISCORD_WEBHOOK_TRANSLATORS is not configured, dry run:');
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Discord webhook failed: ${response.status} ${response.statusText} - ${text}`
    );
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

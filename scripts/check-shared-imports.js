'use strict';

// Function: keeps the shared modules (everything a web or mobile build would
// reuse) free of Electron and Node.js dependencies. Any banned import or global
// that is not listed in shared-imports-baseline.json fails CI. The baseline
// only records the offenders that existed when this check was introduced; it
// is meant to shrink as files are migrated onto PlatformServices.
//
// Usage:
//   node scripts/check-shared-imports.js           check (CI)
//   node scripts/check-shared-imports.js --prune   drop baseline entries that
//                                                  have since been fixed

const fs = require('fs');
const path = require('path');
const { builtinModules } = require('module');

const ROOT = path.join(__dirname, '..');
const BASELINE_FILE = path.join(__dirname, 'shared-imports-baseline.json');
const SHARED_DIRS = [
  'bbcode',
  'chat',
  'components',
  'fchat',
  'helpers',
  'learn',
  'site'
];
const EXTENSIONS = new Set(['.ts', '.js', '.vue']);
const ELECTRON_DIR = path.join(ROOT, 'electron');

const BANNED_PACKAGES = [
  'electron',
  '@electron/remote',
  'electron-log',
  'adm-zip',
  'request',
  'request-promise'
];
const NODE_BUILTINS = new Set(builtinModules.filter(m => !m.startsWith('_')));

// Non-import couplings. Each `id` is what the baseline records.
const BANNED_PATTERNS = [
  { id: 'global:process.platform', regex: /\bprocess\.platform\b/ },
  { id: 'global:__dirname', regex: /\b__dirname\b/ },
  {
    id: 'global:window.require',
    regex: /\bwindow\s*(as\s+any\s*\))?\??\.require\b/
  },
  { id: 'type:Electron', regex: /\bElectron\.[A-Z]\w*/ },
  { id: 'tag:webview', regex: /<webview\b/ }
];

const IMPORT_REGEXES = [
  /\bimport\s+(?:type\s+)?[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]/g,
  /\bimport\s*['"]([^'"]+)['"]/g,
  /\bexport\s+[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]/g,
  /\brequire\s*\??\.?\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g
];

let errorCount = 0;

function error(message) {
  errorCount++;
  console.error(`[error] ${message}`);
}

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXTENSIONS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

// Blanks out comments while keeping line numbers intact. Strings are left
// alone so URLs such as 'https://…' are not mistaken for line comments.
function stripComments(source) {
  let out = '';
  let i = 0;
  let quote = null;
  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];
    if (quote) {
      out += c;
      if (c === '\\') {
        out += next ?? '';
        i += 2;
        continue;
      }
      if (c === quote || (c === '\n' && quote !== '`')) quote = null;
      i++;
    } else if (c === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i++;
    } else if (c === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      const stop = end === -1 ? source.length : end + 2;
      out += source.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop;
    } else {
      if (c === '"' || c === "'" || c === '`') quote = c;
      out += c;
      i++;
    }
  }
  return out;
}

// For .vue files only the <script> block is parsed as code; the template is
// still searched for banned tags such as <webview>.
function codeOf(file, source) {
  if (!file.endsWith('.vue')) return stripComments(source);
  return source.replace(
    /(<script\b[^>]*>)([\s\S]*?)(<\/script>)/g,
    (_, open, body, close) => open + stripComments(body) + close
  );
}

function bannedImport(file, specifier) {
  const bare = specifier.replace(/^node:/, '');
  if (NODE_BUILTINS.has(bare.split('/')[0]) || specifier.startsWith('node:'))
    return `module:${bare}`;
  for (const pkg of BANNED_PACKAGES)
    if (specifier === pkg || specifier.startsWith(pkg + '/'))
      return `module:${pkg}`;
  if (specifier.startsWith('.')) {
    const target = path.resolve(path.dirname(file), specifier);
    if (target === ELECTRON_DIR || target.startsWith(ELECTRON_DIR + path.sep))
      return `local:${path.relative(ROOT, target).split(path.sep).join('/')}`;
  }
  return null;
}

function lineOf(source, index) {
  return source.slice(0, index).split('\n').length;
}

function scan(file) {
  const code = codeOf(file, fs.readFileSync(file, 'utf8'));
  const found = new Map(); // id -> first line number

  const record = (id, index) => {
    if (!found.has(id)) found.set(id, lineOf(code, index));
  };

  for (const regex of IMPORT_REGEXES) {
    for (const match of code.matchAll(regex)) {
      const id = bannedImport(file, match[1]);
      if (id) record(id, match.index);
    }
  }
  for (const { id, regex } of BANNED_PATTERNS) {
    const match = regex.exec(code);
    if (match) record(id, match.index);
  }
  return found;
}

function main() {
  const prune = process.argv.includes('--prune');
  const baseline = fs.existsSync(BASELINE_FILE)
    ? JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'))
    : {};

  const files = SHARED_DIRS.flatMap(dir => walk(path.join(ROOT, dir), []));
  const current = {};
  for (const file of files) {
    const found = scan(file);
    if (found.size === 0) continue;
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    current[rel] = found;
    const allowed = new Set(baseline[rel] || []);
    for (const [id, line] of found) {
      if (!allowed.has(id))
        error(
          `${rel}:${line}: ${id} is not allowed in shared modules. ` +
            'Route it through PlatformServices (chat/platform.ts) instead.'
        );
    }
  }

  const pruned = {};
  let staleCount = 0;
  for (const [rel, ids] of Object.entries(baseline)) {
    const still = ids.filter(id => current[rel] && current[rel].has(id));
    staleCount += ids.length - still.length;
    if (!prune)
      for (const id of ids)
        if (!still.includes(id))
          error(
            `${rel}: baseline entry ${id} no longer occurs. ` +
              'Run `pnpm imports:check --prune` to remove it.'
          );
    if (still.length > 0) pruned[rel] = still;
  }

  if (prune && staleCount > 0) {
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(pruned, null, 2) + '\n');
    console.log(`Pruned ${staleCount} fixed entries from the baseline.`);
  }

  // List what is still left to migrate, at its current location.
  const known = [];
  for (const [rel, ids] of Object.entries(pruned))
    for (const id of ids)
      known.push({ where: `${rel}:${current[rel].get(id)}`, id });
  if (known.length > 0) {
    const width = Math.max(...known.map(k => k.where.length));
    console.log(
      `Known offenders (${known.length} in ${Object.keys(pruned).length} files):`
    );
    for (const { where, id } of known.sort(
      (a, b) =>
        a.where.localeCompare(b.where, undefined, { numeric: true }) ||
        a.id.localeCompare(b.id)
    ))
      console.log(`  ${where.padEnd(width)}  ${id}`);
    console.log();
  }

  const remaining = Object.values(prune ? pruned : baseline).reduce(
    (n, ids) => n + ids.length,
    0
  );
  console.log(
    `Checked ${files.length} shared files: ${errorCount} error(s), ` +
      `${remaining} known offender(s) left in the baseline.`
  );
  if (errorCount > 0) process.exitCode = 1;
}

main();

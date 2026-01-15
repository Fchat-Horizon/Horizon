#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const DEFAULT_CHANGELOG = 'CHANGELOG.md';
const DEFAULT_RELEASES_DIR = path.join('docs', 'releases');
const DEFAULT_PREAMBLE = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

# [Releases]`;

function usage() {
  return `
Usage:
  node scripts/changelog-tools.mjs split [--changelog CHANGELOG.md] [--releases docs/releases]
  node scripts/changelog-tools.mjs build [--changelog CHANGELOG.md] [--releases docs/releases]

Commands:
  split  Generate release note files from CHANGELOG.md
  build  Regenerate CHANGELOG.md from release note files
`;
}

function parseArgs(argv) {
  const args = [...argv];
  const cmd = args.shift();
  const opts = {
    changelog: DEFAULT_CHANGELOG,
    releases: DEFAULT_RELEASES_DIR
  };

  let argumentIndex = 0;
  while (argumentIndex < args.length) {
    const arg = args[argumentIndex];
    if (arg === '--changelog') {
      if (argumentIndex + 1 >= args.length) {
        throw new Error('Missing value for ' + arg);
      }
      opts.changelog = args[argumentIndex + 1];
      argumentIndex += 2;
      continue;
    }
    if (arg === '--releases') {
      if (argumentIndex + 1 >= args.length) {
        throw new Error('Missing value for ' + arg);
      }
      opts.releases = args[argumentIndex + 1];
      argumentIndex += 2;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      opts.help = true;
      argumentIndex += 1;
      continue;
    }
    throw new Error(`Unknown arg: ${arg}`);
  }

  return { cmd, opts };
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function extractVersion(headerLine) {
  const match = headerLine.match(/^## \[([^\]]+)\]/);
  return match ? match[1] : undefined;
}

function parseChangelog(content) {
  const lines = content.split(/\r?\n/);
  const firstReleaseIndex = lines.findIndex(line => /^## \[/.test(line));
  if (firstReleaseIndex === -1) {
    throw new Error('No release headings found in changelog.');
  }

  const preamble = lines.slice(0, firstReleaseIndex).join('\n').trimEnd();
  const sections = [];
  let current = [];

  for (
    let currentLineIndex = firstReleaseIndex;
    currentLineIndex < lines.length;
    currentLineIndex += 1
  ) {
    const line = lines[currentLineIndex];
    if (/^## \[/.test(line)) {
      if (current.length) {
        sections.push(current.join('\n').trimEnd());
      }
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) {
    sections.push(current.join('\n').trimEnd());
  }

  return { preamble, sections };
}

function normalizeVersion(version) {
  return version.startsWith('v') ? version.slice(1) : version;
}

function parseSemver(version) {
  const normalized = normalizeVersion(version);
  const [coreAndPre] = normalized.split('+');
  const [core, pre] = coreAndPre.split('-', 2);
  const coreParts = core.split('.').map(part => Number.parseInt(part, 10));
  if (coreParts.some(part => Number.isNaN(part))) {
    return null;
  }
  const preParts = pre ? pre.split('.') : null;
  return { coreParts, preParts };
}

function comparePrerelease(aParts, bParts) {
  const max = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < max; i += 1) {
    const aId = aParts[i];
    const bId = bParts[i];
    if (aId === undefined) return -1;
    if (bId === undefined) return 1;

    const aNum = Number.parseInt(aId, 10);
    const bNum = Number.parseInt(bId, 10);
    const aIsNum = !Number.isNaN(aNum) && String(aNum) === aId;
    const bIsNum = !Number.isNaN(bNum) && String(bNum) === bId;

    if (aIsNum && bIsNum) {
      if (aNum !== bNum) return aNum < bNum ? -1 : 1;
      continue;
    }
    if (aIsNum !== bIsNum) {
      return aIsNum ? -1 : 1;
    }
    if (aId !== bId) return aId < bId ? -1 : 1;
  }
  return 0;
}

function semverCompare(a, b) {
  const aParsed = parseSemver(a);
  const bParsed = parseSemver(b);
  if (!aParsed || !bParsed) {
    return a.localeCompare(b);
  }
  const max = Math.max(aParsed.coreParts.length, bParsed.coreParts.length);
  for (let i = 0; i < max; i += 1) {
    const aPart = aParsed.coreParts[i] || 0;
    const bPart = bParsed.coreParts[i] || 0;
    if (aPart !== bPart) return aPart < bPart ? -1 : 1;
  }
  if (!aParsed.preParts && !bParsed.preParts) return 0;
  if (!aParsed.preParts) return 1;
  if (!bParsed.preParts) return -1;
  return comparePrerelease(aParsed.preParts, bParsed.preParts);
}

function compareVersionsDesc(a, b) {
  return -semverCompare(a, b);
}

function writeReleaseFiles(changelogPath, releasesDir) {
  const content = readFile(changelogPath);
  const { sections } = parseChangelog(content);
  ensureDir(releasesDir);

  for (const section of sections) {
    const [headerLine] = section.split(/\r?\n/);
    const version = extractVersion(headerLine);
    if (!version) {
      console.warn(`Skipping section without version: ${headerLine}`);
      continue;
    }
    const outPath = path.join(releasesDir, `${normalizeVersion(version)}.md`);
    fs.writeFileSync(outPath, `${section.trimEnd()}\n`, 'utf8');
  }
}

function buildChangelog(changelogPath, releasesDir) {
  const existing = fs.existsSync(changelogPath)
    ? readFile(changelogPath)
    : null;
  const preamble = existing
    ? parseChangelog(existing).preamble
    : DEFAULT_PREAMBLE;

  if (!fs.existsSync(releasesDir)) {
    throw new Error(`Releases directory does not exist: ${releasesDir}`);
  }

  const files = fs
    .readdirSync(releasesDir)
    .filter(file => file.endsWith('.md') && file !== 'README.md')
    .map(file => path.join(releasesDir, file));

  const sections = files
    .map(filePath => {
      const content = readFile(filePath).trimEnd();
      const [headerLine] = content.split(/\r?\n/);
      const version = extractVersion(headerLine);
      const fileVersion = normalizeVersion(path.basename(filePath, '.md'));
      if (!version) {
        console.warn(`Skipping file without version header: ${filePath}`);
        return null;
      }
      const normalizedHeader = normalizeVersion(version);
      if (normalizedHeader !== fileVersion) {
        console.warn(
          `Version mismatch: ${filePath} (${fileVersion}) != ${version}`
        );
      }
      return { version: fileVersion, content };
    })
    .filter(Boolean);

  if (sections.length === 0) {
    throw new Error(`No release files found in ${releasesDir}`);
  }

  sections.sort((a, b) => compareVersionsDesc(a.version, b.version));

  const output =
    `${preamble.trimEnd()}\n\n` +
    sections.map(section => section.content.trimEnd()).join('\n\n') +
    '\n';

  fs.writeFileSync(changelogPath, output, 'utf8');
}

function main() {
  const { cmd, opts } = parseArgs(process.argv.slice(2));
  if (!cmd || opts.help) {
    console.log(usage());
    process.exit(0);
  }

  if (cmd === 'split') {
    writeReleaseFiles(opts.changelog, opts.releases);
    return;
  }

  if (cmd === 'build') {
    buildChangelog(opts.changelog, opts.releases);
    return;
  }

  console.error(
    `Unknown command: ${cmd}. Use --help to see available commands.`
  );
  console.log(usage());
  process.exit(1);
}

main();

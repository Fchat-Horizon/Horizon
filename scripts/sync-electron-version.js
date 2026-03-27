#!/usr/bin/env node
// Called by release-it after bumping the root package.json.
// Keeps electron/package.json at the same version.
const fs = require('fs');
const version = process.argv[2];
if (!version) throw new Error('Usage: sync-electron-version.js <version>');
const path = 'electron/package.json';
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
pkg.version = version;
fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');

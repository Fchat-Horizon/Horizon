import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const flakePath = new URL('../flake.nix', import.meta.url);
const original = readFileSync(flakePath, 'utf8');
const hashPattern =
  /(pnpmDeps\s*=\s*pkgs\.fetchPnpmDeps\s*\{[^}]*?\bhash\s*=\s*")([^"]*)(";)/g;
const matches = [...original.matchAll(hashPattern)];
if (matches.length !== 1) {
  throw new Error('Expected exactly one fetchPnpmDeps hash in flake.nix.');
}

const fakeHash = `sha256-${Buffer.alloc(32).toString('base64')}`;
const target = '.#horizon-electron.pnpmDeps';
const buildArgs = [
  'build',
  '--no-link',
  '--no-update-lock-file',
  '--print-build-logs',
  target
];

function nix(args) {
  const result = spawnSync('nix', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, NO_COLOR: '1' }
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.signal) throw new Error(`Nix terminated by ${result.signal}.`);
  return result;
}

function withHash(hash) {
  return original.replace(hashPattern, (_, prefix, _oldHash, suffix) => {
    return `${prefix}${hash}${suffix}`;
  });
}

let verified = false;
try {
  writeFileSync(flakePath, withHash(fakeHash));
  const derivation = nix([
    'eval',
    '--raw',
    '--no-update-lock-file',
    `${target}.drvPath`
  ]);
  if (derivation.status !== 0) throw new Error('Could not evaluate pnpmDeps.');

  const fetched = nix(buildArgs);
  const mismatches = [
    ...fetched.stderr.matchAll(
      /hash mismatch in fixed-output derivation '([^']+)':\s+specified:\s+(sha256-\S+)\s+got:\s+(sha256-[A-Za-z0-9+/]{43}=)/g
    )
  ];
  const mismatch = mismatches.find(
    match => match[1] === derivation.stdout.trim() && match[2] === fakeHash
  );
  if (fetched.status === 0 || !mismatch || mismatches.length !== 1) {
    throw new Error(
      'Expected a hash mismatch for pnpmDeps; refusing to update.'
    );
  }

  const hash = mismatch[3];
  writeFileSync(flakePath, withHash(hash));
  if (nix(buildArgs).status !== 0) {
    throw new Error('The regenerated pnpmDeps hash failed verification.');
  }
  verified = true;
  console.log(
    hash === matches[0][2]
      ? 'The Nix pnpm dependency hash is already current.'
      : `Updated Nix pnpm dependency hash to ${hash}`
  );
} finally {
  // Leave the original file intact after fetch, parsing, or verification errors.
  if (!verified) writeFileSync(flakePath, original);
}

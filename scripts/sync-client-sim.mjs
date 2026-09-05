#!/usr/bin/env node
/**
 * Dev-only fake Solstice client for testing the Horizon log sync server
 * without a phone (see docs/log-sync-protocol.md).
 *
 * Usage:
 *   node scripts/sync-client-sim.mjs --payload '<QR JSON>' [options]
 *   node scripts/sync-client-sim.mjs --payload-file payload.json [options]
 *
 * Options:
 *   --account <name>   Account to present in the handshake (default: from payload)
 *   --device <name>    Device name to present (default: "sync-client-sim")
 *   --out <file>       Where to save the received zip (default: ./sync-received.zip)
 *   --send <file>      Zip file to upload with POST /v1/logs (optional)
 *   --no-finish        Skip POST /v1/finish (keeps the session alive)
 *   --steps <list>     Comma-separated subset of: handshake,get,post,finish
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import http from 'http';

const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const flag = argv[i];
    if (!flag.startsWith('--')) continue;
    const name = flag.slice(2);
    if (name === 'no-finish') args[name] = true;
    else args[name] = argv[++i];
  }
  return args;
}

function encrypt(key, plain) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([iv, ciphertext, cipher.getAuthTag()]);
}

function decrypt(key, data) {
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(data.length - TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH, data.length - TAG_LENGTH);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function request(host, port, token, method, path, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host,
        port,
        method,
        path,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
          'Content-Length': body ? body.length : 0
        }
      },
      res => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () =>
          resolve({ status: res.statusCode, body: Buffer.concat(chunks) })
        );
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function decodeJson(key, response) {
  if (response.body.length === 0) return undefined;
  return JSON.parse(decrypt(key, response.body).toString('utf8'));
}

async function main() {
  const args = parseArgs(process.argv);
  const payloadText =
    args.payload ??
    (args['payload-file']
      ? readFileSync(args['payload-file'], 'utf8')
      : undefined);
  if (!payloadText) {
    console.error('Provide --payload or --payload-file. See --help in file.');
    process.exit(1);
  }
  const payload = JSON.parse(payloadText);
  const key = Buffer.from(payload.key, 'base64');
  const steps = (args.steps ?? 'handshake,get,post,finish')
    .split(',')
    .map(s => s.trim());
  const host = payload.addrs.includes('127.0.0.1')
    ? '127.0.0.1'
    : (payload.addrs[0] ?? '127.0.0.1');
  console.log(`session: ${host}:${payload.port} account=${payload.account}`);

  const call = (method, path, body) =>
    request(host, payload.port, payload.token, method, path, body);

  if (steps.includes('handshake')) {
    const handshake = {
      account: args.account ?? payload.account,
      deviceName: args.device ?? 'sync-client-sim',
      platform: process.platform,
      appVersion: 'sim'
    };
    const res = await call(
      'POST',
      '/v1/handshake',
      encrypt(key, Buffer.from(JSON.stringify(handshake)))
    );
    console.log('handshake:', res.status, decodeJson(key, res));
    if (res.status !== 200) process.exit(2);
  }

  if (steps.includes('get')) {
    const res = await call('GET', '/v1/logs');
    if (res.status !== 200) {
      console.log('get logs:', res.status, decodeJson(key, res));
      process.exit(2);
    }
    const zip = decrypt(key, res.body);
    const out = args.out ?? 'sync-received.zip';
    writeFileSync(out, zip);
    console.log(`get logs: 200, saved ${zip.length} bytes to ${out}`);
  }

  if (steps.includes('post')) {
    if (!args.send) {
      console.log('post logs: skipped (no --send <zip> given)');
    } else {
      const zip = readFileSync(args.send);
      const res = await call('POST', '/v1/logs', encrypt(key, zip));
      console.log('post logs:', res.status, decodeJson(key, res));
      if (res.status !== 200) process.exit(2);
    }
  }

  if (steps.includes('finish') && !args['no-finish']) {
    const res = await call(
      'POST',
      '/v1/finish',
      encrypt(key, Buffer.from('{}'))
    );
    console.log('finish:', res.status, decodeJson(key, res));
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

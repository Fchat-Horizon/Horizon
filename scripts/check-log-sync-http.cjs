#!/usr/bin/env node
// Live HTTP regressions for LAN log sync; no Electron or build artifacts.
// Run with: node scripts/check-log-sync-http.cjs
// Source TypeScript is transpiled in memory. All fixtures live in a temp folder.
const fs = require('fs'),
  path = require('path'),
  os = require('os'),
  http = require('http'),
  assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
require.extensions['.ts'] = (m, f) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(f, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true
      }
    }).outputText,
    f
  );
const { LogSyncServer } = require(
  path.join(root, 'electron/services/sync/server.ts')
);
const { encryptBody, decryptBody } = require(
  path.join(root, 'electron/services/sync/protocol.ts')
);
const AdmZip = require(path.join(root, 'node_modules/adm-zip'));
const { jsonLogToBinary } = require(
  path.join(root, 'electron/services/log-backup.ts')
);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'horizon-http-review-'));
const servers = [];
const wait = ms => new Promise(r => setTimeout(r, ms));
async function start(extra = {}) {
  let s = await LogSyncServer.start({
    dataDir: path.join(temp, 'data'),
    tempDir: path.join(temp, 'out'),
    account: 'Account',
    ...extra
  });
  servers.push(s);
  return s;
}
function encode(s, b) {
  return encryptBody(
    Buffer.from(s.payload.key, 'base64'),
    Buffer.isBuffer(b) ? b : Buffer.from(JSON.stringify(b))
  );
}
function request(s, method, p, b, token = s.payload.token) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: s.payload.port,
        path: p,
        method,
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Length': b?.length ?? 0
        },
        agent: false
      },
      res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('error', reject);
        res.on('end', () => {
          let b = Buffer.concat(chunks);
          resolve({
            status: res.statusCode,
            body: b.length
              ? decryptBody(Buffer.from(s.payload.key, 'base64'), b)
              : b
          });
        });
      }
    );
    req.on('error', reject);
    req.end(b);
  });
}
async function pair(s) {
  assert.equal(
    (
      await request(
        s,
        'POST',
        '/v1/handshake',
        encode(s, { account: 'ACCOUNT', deviceName: 'test' })
      )
    ).status,
    200
  );
}
function slow(s, p, b) {
  const req = http.request({
    host: '127.0.0.1',
    port: s.payload.port,
    path: p,
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + s.payload.token,
      'Content-Length': b.length
    },
    agent: false
  });
  const done = new Promise(resolve => {
    req.on('error', () => resolve({ error: true }));
    req.on('response', res => {
      res.resume();
      res.on('end', () => resolve({ status: res.statusCode }));
    });
  });
  req.write(b.subarray(0, 1));
  return { req, done, end: () => req.end(b.subarray(1)) };
}
(async () => {
  fs.mkdirSync(path.join(temp, 'data', 'Character', 'logs'), {
    recursive: true
  });
  fs.writeFileSync(
    path.join(temp, 'data', 'Character', 'logs', 'friend'),
    jsonLogToBinary([{ time: 1, type: 0, sender: 'Friend', text: 'Hello' }])
  );
  let s = await start();
  assert.equal((await request(s, 'GET', '/v1/logs')).status, 409);
  assert.equal(
    (await request(s, 'GET', '/v1/logs', undefined, 'bad')).status,
    401
  );
  assert.equal(
    (
      await request(
        s,
        'POST',
        '/v1/handshake',
        encode(s, { account: 'Other', deviceName: 'test' })
      )
    ).status,
    403
  );
  await pair(s);
  let response = await request(s, 'GET', '/v1/logs');
  assert.equal(response.status, 200);
  let zip = new AdmZip(response.body);
  assert(zip.getEntry('characters/Character/logs/friend.json'));
  response = await request(s, 'POST', '/v1/logs', encode(s, response.body));
  assert.equal(response.status, 200);
  assert.equal(JSON.parse(response.body).messagesAdded, 0);
  assert.equal(
    (await request(s, 'POST', '/v1/logs', Buffer.from('bad'))).status,
    400
  );
  assert.equal(s.state, 'paired');
  assert.equal((await request(s, 'POST', '/v1/finish')).status, 200);
  await wait(10);
  assert.equal(s.state, 'finished');
  assert.equal(s.server.listening, false);
  console.log(
    'PASS round trip, auth, account mismatch, invalid encryption, finish'
  );
  s = await start();
  let pending = slow(
    s,
    '/v1/handshake',
    encode(s, { account: 'Account', deviceName: 'slow' })
  );
  await wait(20);
  await pair(s);
  pending.end();
  assert.equal((await pending.done).status, 409);
  assert.equal(s.peerName, 'test');
  s.stop();
  console.log('PASS overlapping handshakes');
  s = await start();
  pending = slow(
    s,
    '/v1/handshake',
    encode(s, { account: 'Account', deviceName: 'slow' })
  );
  await wait(20);
  s.stop();
  await pending.done;
  await wait(20);
  assert.equal(s.state, 'stopped');
  assert.equal(s.idleTimer, undefined);
  console.log('PASS Stop during handshake stays stopped');
  s = await start();
  await pair(s);
  pending = slow(s, '/v1/logs', encode(s, zip.toBuffer()));
  await wait(20);
  assert.equal(s.state, 'receiving');
  assert.equal((await request(s, 'POST', '/v1/finish')).status, 409);
  pending.req.destroy();
  await pending.done;
  await wait(20);
  assert.equal(s.state, 'paired');
  assert.equal(s.busy, false);
  assert.equal((await request(s, 'GET', '/v1/logs')).status, 200);
  s.stop();
  console.log('PASS disconnected upload recovery and retry');
  s = await start();
  await pair(s);
  pending = slow(s, '/v1/logs', encode(s, zip.toBuffer()));
  await wait(20);
  s.stop();
  await pending.done;
  await wait(20);
  assert.equal(s.state, 'stopped');
  assert.equal(s.busy, false);
  assert.equal(s.idleTimer, undefined);
  console.log('PASS Stop during upload stays stopped');
  s = await start({
    onStateChange(server) {
      if (server.state === 'sending') setImmediate(() => server.stop());
    }
  });
  await pair(s);
  await request(s, 'GET', '/v1/logs').catch(() => {});
  await wait(100);
  assert.equal(s.state, 'stopped');
  assert.equal(s.busy, false);
  assert.equal(s.idleTimer, undefined);
  assert.deepEqual(fs.readdirSync(path.join(temp, 'out')), []);
  console.log('PASS Stop during archive export cancels and cleans temp files');
  // Exceed loopback TCP buffers so a reader that stops consuming actually
  // stalls the response, including on hosts with large receive windows.
  const crypto = require('crypto');
  fs.writeFileSync(
    path.join(temp, 'data', 'Character', 'logs', 'large'),
    jsonLogToBinary(
      Array.from({ length: 1600 }, (_, i) => ({
        time: i + 2,
        type: 0,
        sender: 'Friend',
        text: crypto.randomBytes(30000).toString('hex')
      }))
    )
  );
  const protocol = require(
    path.join(root, 'electron/services/sync/protocol.ts')
  );
  protocol.SYNC_ACTIVE_IDLE_TIMEOUT_MS = 250;
  s = await start();
  await pair(s);
  const net = require('net');
  const stalled = net.createConnection({
    host: '127.0.0.1',
    port: s.payload.port
  });
  stalled.on('error', () => {});
  await new Promise(resolve =>
    stalled.on('connect', () => {
      stalled.pause();
      stalled.write(
        'GET /v1/logs HTTP/1.1\r\nHost: localhost\r\nAuthorization: Bearer ' +
          s.payload.token +
          '\r\nConnection: close\r\n\r\n'
      );
      resolve();
    })
  );
  while (s.state === 'paired') await wait(5);
  for (let i = 0; i < 500 && s.busy; i++) await wait(20);
  assert.equal(s.busy, false);
  assert.equal(s.sentResult, undefined);
  assert.equal(s.state, 'paired');
  stalled.destroy();
  s.stop();
  assert.deepEqual(fs.readdirSync(path.join(temp, 'out')), []);
  console.log('PASS stalled download timeout and cleanup');
  protocol.SYNC_ACTIVE_IDLE_TIMEOUT_MS = 120000;
  s = await start();
  for (let i = 0; i < 5; i++)
    await request(s, 'GET', '/v1/logs', undefined, 'wrong').catch(() => {});
  assert.equal(s.state, 'error');
  assert.equal(s.server.listening, false);
  console.log('PASS authentication failure session cutoff');
})()
  .catch(e => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => {
    for (const s of servers) s.stop();
    fs.rmSync(temp, { recursive: true, force: true });
  });

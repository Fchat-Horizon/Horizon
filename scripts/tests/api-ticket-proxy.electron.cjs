// Run: node scripts/tests/api-ticket-proxy.electron.cjs (requires a display on Linux).
if (!process.versions.electron) {
  const { spawnSync } = require('node:child_process');
  const child = spawnSync(require('electron'), [__filename], {
    encoding: 'utf8',
    timeout: 30000
  });
  process.stdout.write(child.stdout || '');
  process.stderr.write(child.stderr || '');
  if (child.error) console.error(child.error);
  process.exit(child.status ?? 1);
}

const { app, session } = require('electron');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const axios = require('axios');
const { loadTypeScript } = require('./load-typescript.cjs');
const profile = fs.mkdtempSync(
  path.join(require('node:os').tmpdir(), 'horizon-proxy-')
);
app.setPath('userData', profile);
app.disableHardwareAcceleration();
const listen = server =>
  new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const close = server => new Promise(resolve => server.close(resolve));

app
  .whenReady()
  .then(async () => {
    let directHits = 0;
    let proxyHits = 0;
    const response = ticket =>
      JSON.stringify({
        ticket,
        characters: {},
        default_character: 0,
        error: ''
      });
    const origin = http.createServer((_req, res) => {
      directHits++;
      res.setHeader('Content-Type', 'application/json');
      res.end(response('direct'));
    });
    const proxy = http.createServer((_req, res) => {
      proxyHits++;
      res.setHeader('Content-Type', 'application/json');
      res.end(response('proxy'));
    });
    await listen(origin);
    await listen(proxy);
    const target = `http://127.0.0.1:${origin.address().port}/ticket`;
    const chat = session.fromPartition('persist:fchat');
    const api = loadTypeScript('electron/api-ticket.ts', {
      // Both transports target only the loopback fixture; no F-List call is made.
      axios: {
        post: (_url, body) => axios.post(target, body, { proxy: false })
      },
      electron: {
        session: {
          fromPartition(partition) {
            assert.equal(partition, 'persist:fchat');
            return { fetch: (_url, options) => chat.fetch(target, options) };
          }
        }
      },
      'electron-log': { debug() {}, error() {} }
    });
    const evidence = {};
    try {
      await chat.setProxy({
        mode: 'fixed_servers',
        proxyRules: `127.0.0.1:${proxy.address().port}`,
        proxyBypassRules: '<-loopback>'
      });
      const proxied = await api.getApiTicket(
        'proxy-test',
        'synthetic-password'
      );
      evidence.proxied = { ticket: proxied.ticket, directHits, proxyHits };
      const closedPort = proxy.address().port;
      await close(proxy);
      await chat.closeAllConnections();
      await chat.setProxy({
        mode: 'fixed_servers',
        proxyRules: `127.0.0.1:${closedPort}`,
        proxyBypassRules: '<-loopback>'
      });
      const denied = await api.getApiTicket(
        'closed-proxy-test',
        'synthetic-password'
      );
      evidence.unavailableProxy = {
        requestFailed: denied.request === true,
        directHits,
        proxyHits
      };
      await chat.setProxy({ mode: 'direct' });
      const direct = await api.getApiTicket(
        'direct-test',
        'synthetic-password'
      );
      evidence.direct = { ticket: direct.ticket, directHits, proxyHits };
      console.log(JSON.stringify(evidence, null, 2));
      assert.equal(evidence.proxied.ticket, 'proxy');
      assert.equal(evidence.proxied.directHits, 0);
      assert.equal(evidence.unavailableProxy.requestFailed, true);
      assert.equal(evidence.unavailableProxy.directHits, 0);
      assert.equal(evidence.direct.ticket, 'direct');
      assert.equal(evidence.direct.directHits, 1);
    } finally {
      await chat.closeAllConnections();
      if (proxy.listening) await close(proxy);
      await close(origin);
    }
  })
  .then(
    () => app.exit(0),
    error => {
      console.error(error);
      app.exit(1);
    }
  );

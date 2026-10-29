const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTypeScript } = require('./load-typescript.cjs');

function fixture(respond) {
  const calls = [];
  const { getApiTicket } = loadTypeScript('electron/api-ticket.ts', {
    electron: {
      session: {
        fromPartition(partition) {
          assert.equal(partition, 'persist:fchat');
          return {
            async fetch(url, options) {
              calls.push({ url, options });
              return respond(url, options);
            }
          };
        }
      }
    },
    axios: {
      post() {
        throw new Error('Direct Node transport must not be used');
      }
    },
    'electron-log': { debug() {}, error() {} }
  });
  return { calls, getApiTicket };
}

function ok(data) {
  return { ok: true, status: 200, json: async () => data };
}

function ticket(value = 'shared') {
  return { ticket: value, characters: {}, default_character: 0, error: '' };
}

test('tickets use the chat session and form-encoded credentials', async () => {
  const { getApiTicket, calls } = fixture(() => ok(ticket()));
  const result = await getApiTicket('test account', 'password & more');
  assert.equal(result.ticket, 'shared');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://www.f-list.net/json/getApiTicket.php');
  const options = calls[0].options;
  assert.equal(options.method, 'POST');
  assert.equal(
    options.headers['Content-Type'],
    'application/x-www-form-urlencoded'
  );
  const form = new URLSearchParams(options.body);
  assert.equal(form.get('account'), 'test account');
  assert.equal(form.get('password'), 'password & more');
  assert.equal(form.get('new_character_list'), 'true');
});

test('concurrent tabs and cached calls share one ticket request', async () => {
  let finish;
  const { getApiTicket, calls } = fixture(
    () =>
      new Promise(resolve => {
        finish = resolve;
      })
  );
  const first = getApiTicket('account', 'password');
  const second = getApiTicket('account', 'password');
  finish(ok(ticket()));
  assert.equal((await first).ticket, 'shared');
  assert.equal((await second).ticket, 'shared');
  assert.equal((await getApiTicket('account', 'password')).ticket, 'shared');
  assert.equal(calls.length, 1);
});

test('ticket replacement and fresh character lookups also use the session', async () => {
  let issued = 0;
  const { getApiTicket, calls } = fixture(url => {
    if (url.endsWith('getApiTicket.php'))
      return ok(ticket(`ticket-${++issued}`));
    if (url.endsWith('character-list.php'))
      return ok({ characters: ['New Character'], error: '' });
    return ok({ id: 42, error: '' });
  });
  await getApiTicket('account', 'password');
  const replaced = await getApiTicket('account', 'password', {
    invalidTicket: 'ticket-1'
  });
  assert.equal(replaced.ticket, 'ticket-2');
  const refreshed = await getApiTicket('account', 'password', { fresh: true });
  assert.equal(refreshed.ticket, 'ticket-2');
  assert.equal(refreshed.characters['New Character'], 42);
  assert.equal(calls.length, 4);
});

test('proxy failures return a network error without a direct retry', async () => {
  const { getApiTicket, calls } = fixture(() => {
    throw new Error('ERR_PROXY_CONNECTION_FAILED');
  });
  const result = await getApiTicket('account', 'password');
  assert.equal(result.request, true);
  assert.match(result.error, /ERR_PROXY_CONNECTION_FAILED/);
  assert.equal(result.ticket, '');
  assert.equal(calls.length, 1);
});

test('HTTP failures are not cached as successful login responses', async () => {
  let attempts = 0;
  const { getApiTicket } = fixture(() =>
    ++attempts === 1
      ? {
          ok: false,
          status: 503,
          json: async () => ticket('must not be cached')
        }
      : ok(ticket())
  );
  const failed = await getApiTicket('account', 'password');
  assert.equal(failed.request, true);
  assert.match(failed.error, /503/);
  assert.equal((await getApiTicket('account', 'password')).ticket, 'shared');
  assert.equal(attempts, 2);
});

test('an API rejection remains a login error rather than a transport error', async () => {
  const { getApiTicket } = fixture(() => ok({ error: 'Invalid password' }));
  const result = await getApiTicket('account', 'wrong password');
  assert.equal(result.error, 'Invalid password');
  assert.notEqual(result.request, true);
});

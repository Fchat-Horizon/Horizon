const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTypeScript } = require('./load-typescript.cjs');

const flush = () => new Promise(resolve => setImmediate(resolve));

async function fixture(t) {
  let now = 1700000000000;
  let nextTimer = 0;
  let onChannel;
  const timers = new Map();
  const ipcRequests = [];
  const posts = [];
  const logger = { debug() {}, info() {}, warn() {}, error() {} };
  const core = {
    connection: {
      character: 'Review',
      vars: { lfrp_flood: 600 },
      onEvent() {},
      onMessage() {},
      send(command, data) {
        posts.push({ command, ...data });
      }
    },
    channels: {
      onEvent(handler) {
        onChannel = handler;
      }
    },
    characters: { ownCharacter: { name: 'Review' } },
    state: { settings: {} },
    logs: {
      async getBacklog() {
        return [];
      }
    },
    settingsStore: { async get() {}, async set() {} },
    watch() {},
    cache: {
      getLastPost: () => new Date(now - 10000),
      markLastPostTime() {},
      conversationDraftCache: {
        async loadCache() {},
        async resetCacheIfNeeded() {}
      },
      migrateConversationDraft() {},
      getConversationDraft: () => ''
    }
  };
  const ipc = {
    on() {},
    send(channel, id) {
      ipcRequests.push({ channel, id });
    }
  };
  const mocks = {
    './core': core,
    '../core': core,
    electron: { ipcRenderer: ipc },
    'electron-log': logger,
    './localize': key => key,
    '../fchat/channels': { queuedJoin() {} },
    './preview/event-bus': { EventBus: { $emit() {} } },
    './slash_commands': { CommandContext: {} },
    './common': {
      Message: class {
        constructor(type, sender, text, time) {
          Object.assign(this, { type, sender, text, time });
        }
      },
      ConversationSettings: class {}
    }
  };
  const globals = {
    setTimeout(fn, ms) {
      const id = ++nextTimer;
      timers.set(id, { fn, ms });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    setInterval() {
      return 1;
    },
    clearInterval() {},
    window: { addEventListener() {} },
    document: { hasFocus: () => true },
    Date: class extends Date {
      static now() {
        return now;
      }
    },
    Math: Object.assign(Object.create(Math), { random: () => 0 })
  };
  const { AdCoordinatorGuest } = loadTypeScript(
    'chat/ads/ad-coordinator-guest.ts',
    mocks,
    globals
  );
  core.adCoordinator = new AdCoordinatorGuest();
  const createConversations = loadTypeScript(
    'chat/conversations.ts',
    mocks,
    globals
  ).default;
  core.conversations = createConversations();
  await core.conversations.reloadSettings();
  const makeChannel = async id => {
    await onChannel('join', { id, name: id, description: '', mode: 'both' });
    const conversation = core.conversations.channelConversations.at(-1);
    conversation.settings = {
      adSettings: { ads: ['automated'], randomOrder: false, lastAdTimestamp: 0 }
    };
    conversation.addMessage = async () => {};
    return conversation;
  };
  const conversation = await makeChannel('first');
  await flush();
  const pending = () => Object.keys(core.adCoordinator.pendingAds);
  const grant = id => core.adCoordinator.processPendingAd(id);
  const fire = () => {
    const [id, timer] = timers.entries().next().value;
    timers.delete(id);
    now += timer.ms;
    const promise = Promise.resolve(timer.fn());
    void promise.catch(() => {});
    return promise;
  };
  t.after(async () => {
    for (const c of core.conversations.channelConversations) c.adManager.stop();
    // Resolve stale requests too, so a failing regression does not leave promises behind.
    for (const id of pending()) grant(id);
    await flush();
  });
  return {
    core,
    conversation,
    makeChannel,
    timers,
    ipcRequests,
    posts,
    pending,
    grant,
    fire
  };
}

test('stopping while awaiting permission cancels the post and its next timer', async t => {
  const f = await fixture(t);
  f.conversation.adManager.start();
  const posting = f.fire();
  await flush();
  assert.equal(f.pending().length, 1);
  const [oldId] = f.pending();
  f.conversation.adManager.stop();
  await flush();
  assert.equal(f.pending().length, 0);
  f.grant(oldId);
  await posting;
  assert.equal(f.posts.length, 0);
  assert.equal(f.timers.size, 0);
});

test('a stopped campaign cannot resume after an immediate restart', async t => {
  const f = await fixture(t);
  f.conversation.adManager.start();
  const oldPost = f.fire();
  await flush();
  const [oldId] = f.pending();
  f.conversation.adManager.stop();
  f.conversation.settings.adSettings.ads = ['new campaign'];
  f.conversation.adManager.start();
  const newPost = f.fire();
  await flush();
  const currentIds = f.pending().filter(id => id !== oldId);
  assert.equal(currentIds.length, 1);
  f.grant(oldId);
  f.grant(currentIds[0]);
  await Promise.all([oldPost, newPost]);
  assert.deepEqual(
    f.posts.map(p => p.message),
    ['new campaign']
  );
  assert.equal(f.timers.size, 1);
  assert.equal(f.conversation.adManager.isActive(), true);
});

test('a stopped channel queued behind another channel never requests a turn', async t => {
  const f = await fixture(t);
  const second = await f.makeChannel('second');
  f.conversation.adManager.start();
  const firstPost = f.fire();
  await flush();
  second.adManager.start();
  const secondPost = f.fire();
  await flush();
  second.adManager.stop();
  f.grant(f.pending()[0]);
  await flush();
  assert.equal(f.ipcRequests.length, 1);
  await Promise.all([firstPost, secondPost]);
  assert.deepEqual(
    f.posts.map(p => p.channel),
    ['first']
  );
});

test('stopping while queued behind a manual post does not cancel the manual post', async t => {
  const f = await fixture(t);
  const manualPost = f.conversation.sendAd('manual');
  await flush();
  f.conversation.adManager.start();
  const automatedPost = f.fire();
  await flush();
  f.conversation.adManager.stop();
  f.grant(f.pending()[0]);
  await flush();
  assert.equal(f.ipcRequests.length, 1);
  await Promise.all([manualPost, automatedPost]);
  assert.deepEqual(
    f.posts.map(p => p.message),
    ['manual']
  );
});

test('normal campaigns keep posting and schedule only one next timer', async t => {
  const f = await fixture(t);
  f.conversation.adManager.start();
  for (let i = 0; i < 2; i++) {
    const posting = f.fire();
    await flush();
    f.grant(f.pending()[0]);
    await posting;
    assert.equal(f.posts.length, i + 1);
    assert.equal(f.timers.size, 1);
    assert.equal(f.pending().length, 0);
  }
});

test('stopping during the spacing delay prevents the queued send', async t => {
  const f = await fixture(t);
  f.core.cache.getLastPost = () => new Date(1700000000000 - 500);
  f.conversation.adManager.start();
  const posting = f.fire();
  await flush();
  assert.equal(f.ipcRequests.length, 0);
  f.conversation.adManager.stop();
  await f.fire();
  await posting;
  assert.equal(f.ipcRequests.length, 0);
  assert.equal(f.posts.length, 0);
  assert.equal(f.timers.size, 0);
});

test('stopping after transmission prevents rescheduling while bookkeeping finishes', async t => {
  const f = await fixture(t);
  let finishMessage;
  f.conversation.addMessage = () =>
    new Promise(resolve => {
      finishMessage = resolve;
    });
  f.conversation.adManager.start();
  const posting = f.fire();
  await flush();
  f.grant(f.pending()[0]);
  await flush();
  assert.equal(f.posts.length, 1);
  f.conversation.adManager.stop();
  finishMessage();
  await posting;
  assert.equal(f.posts.length, 1);
  assert.equal(f.timers.size, 0);
  assert.equal(f.conversation.adManager.getNextPostDue(), undefined);
});

test('disconnect cleanup rejects remaining manual requests', async t => {
  const f = await fixture(t);
  const posting = f.conversation.sendAd('manual');
  const rejected = assert.rejects(posting, /Pending ad cleared/);
  await flush();
  f.core.adCoordinator.clear();
  await rejected;
  assert.equal(f.posts.length, 0);
});

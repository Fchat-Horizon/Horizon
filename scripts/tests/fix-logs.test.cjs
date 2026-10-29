const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { loadTypeScript } = require('./load-typescript.cjs');

const { jsonLogToBinary, buildLogIndexBuffer, binaryLogToJson } =
  loadTypeScript('electron/services/log-backup.ts');

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'horizon-fix-logs-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const logs = path.join(directory, 'Review', 'logs');
  fs.mkdirSync(logs, { recursive: true });
  const file = path.join(logs, 'alice');
  const { fixLogs } = loadTypeScript('electron/filesystem.ts', {
    '@electron/remote': {},
    '../chat/core': { state: { generalSettings: { logDirectory: directory } } },
    '../chat/localize': key => key,
    '../chat/common': {
      Message: class {
        constructor(type, sender, text, time) {
          Object.assign(this, { type, sender, text, time });
        }
      }
    }
  });
  return { file, fix: () => fixLogs('Review') };
}

function message(text, time = 1700000000) {
  return { type: 0, sender: 'Alice', text, time };
}

test('repair preserves long Unicode records and all following messages', t => {
  const { file, fix } = fixture(t);
  const binary = jsonLogToBinary([
    message('before'),
    message('\u20ac'.repeat(20000)),
    message('after')
  ]);
  fs.writeFileSync(file, binary);
  fs.writeFileSync(file + '.idx', buildLogIndexBuffer('Alice', binary));
  fix();
  assert.ok(fs.readFileSync(file).equals(binary), 'log bytes changed');
  assert.deepEqual(
    fs.readFileSync(file + '.idx'),
    buildLogIndexBuffer('Alice', binary)
  );
});

test('repair preserves the largest representable record without an index', t => {
  const { file, fix } = fixture(t);
  const binary = jsonLogToBinary([message('x'.repeat(65535 - 8 - 5))]);
  assert.equal(binary.length, 65537);
  fs.writeFileSync(file, binary);
  fix();
  assert.ok(
    fs.readFileSync(file).equals(binary),
    'maximum-size record changed'
  );
  assert.deepEqual(
    fs.readFileSync(file + '.idx'),
    buildLogIndexBuffer('alice', binary)
  );
});

for (const damage of ['truncated header', 'truncated text', 'bad trailer']) {
  test(`repair drops only the damaged tail: ${damage}`, t => {
    const { file, fix } = fixture(t);
    const prefix = jsonLogToBinary([message('keep this')]);
    const tail = jsonLogToBinary([message('damaged', 1700086400)]);
    const broken =
      damage === 'truncated header'
        ? tail.subarray(0, 5)
        : damage === 'truncated text'
          ? tail.subarray(0, -4)
          : Buffer.from(tail);
    if (damage === 'bad trailer') broken.writeUInt16LE(0, broken.length - 2);
    const binary = Buffer.concat([prefix, broken]);
    fs.writeFileSync(file, binary);
    fs.writeFileSync(file + '.idx', buildLogIndexBuffer('Alice', prefix));
    fix();
    const repaired = fs.readFileSync(file);
    assert.deepEqual(repaired, prefix);
    assert.equal(binaryLogToJson(repaired, true).length, 1);
    assert.deepEqual(
      fs.readFileSync(file + '.idx'),
      buildLogIndexBuffer('Alice', prefix)
    );
  });
}

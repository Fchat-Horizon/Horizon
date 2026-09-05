// Run with node scripts/check-log-sync.cjs. Transpile in memory only: no build.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');
const AdmZip = require('adm-zip');

require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true
    },
    fileName: filename
  });
  module._compile(outputText, filename);
};

const {
  binaryLogToJson,
  jsonLogToBinary,
  buildLogIndexBuffer
} = require('../electron/services/log-backup.ts');
const {
  isValidLogMessage,
  mergeLogFile,
  mergeLogsZip
} = require('../electron/services/sync/log-merge.ts');
const { buildLogsZip } = require('../electron/services/sync/logs-zip.ts');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'horizon-sync-check-'));
let count = 0;
const message = (text, time = 1700000000) => ({
  time,
  type: 0,
  sender: 'Alice',
  text
});
const run = async (name, test) => {
  await test();
  count++;
  console.log(`PASS ${name}`);
};
const seed = (name, bytes) => {
  const dir = path.join(root, name);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'bob');
  fs.writeFileSync(file, bytes);
  const index = buildLogIndexBuffer('Bob', bytes);
  if (index) fs.writeFileSync(`${file}.idx`, index);
  return { dir, file, index };
};

(async () => {
  await run(
    'merge is a stable union and retry leaves log/index untouched',
    () => {
      const local = message('local');
      const remote = message('remote');
      const older = message('older', local.time - 10);
      const { dir, file } = seed('union', jsonLogToBinary([local]));
      assert.equal(
        mergeLogFile(dir, 'bob', [remote, local, older, remote]).added,
        2
      );
      assert.deepEqual(binaryLogToJson(fs.readFileSync(file)), [
        older,
        local,
        remote
      ]);
      const before = [fs.readFileSync(file), fs.readFileSync(`${file}.idx`)];
      assert.equal(mergeLogFile(dir, 'bob', [remote, older]).added, 0);
      assert.deepEqual(
        [fs.readFileSync(file), fs.readFileSync(`${file}.idx`)],
        before
      );
    }
  );
  await run(
    'damaged records and trailing bytes preserve the entire original pair',
    () => {
      const valid = jsonLogToBinary([message('before')]);
      const later = jsonLogToBinary([message('after')]);
      for (const [i, original] of [
        Buffer.concat([valid, Buffer.from([1, 2, 3]), later]),
        Buffer.concat([valid, Buffer.from([1])]),
        valid.subarray(0, valid.length - 1)
      ].entries()) {
        const { dir, file, index } = seed(`damaged-${i}`, original);
        assert.equal(
          mergeLogFile(dir, 'bob', [message('incoming')]).skipped,
          true
        );
        assert.deepEqual(fs.readFileSync(file), original);
        if (index) assert.deepEqual(fs.readFileSync(`${file}.idx`), index);
      }
    }
  );
  await run(
    'invalid local UTF-8 is skipped even when replacement bytes exceed record limits',
    () => {
      const original = Buffer.alloc(265);
      original.writeUInt32LE(1700000000, 0);
      original[5] = 255;
      original.fill(0xff, 6, 261);
      original.writeUInt16LE(263, 263);
      const { dir, file } = seed('invalid-utf8', original);
      assert.equal(
        mergeLogFile(dir, 'bob', [message('incoming')]).skipped,
        true
      );
      assert.deepEqual(fs.readFileSync(file), original);
    }
  );
  await run(
    'zero-size log and names headers never reach the ZIP inflater',
    () => {
      const zip = new AdmZip();
      for (const name of [
        'characters/Alice/logs/empty.json',
        'characters/Alice/logs-names.json'
      ]) {
        zip.addFile(name, Buffer.from('compressed data'));
        const entry = zip.getEntry(name);
        entry.header.size = 0;
        entry.getData = () => {
          throw new Error('Zero-size entry was decompressed');
        };
      }
      zip.addFile(
        'characters/Alice/logs/normal.json',
        Buffer.from(JSON.stringify([message('hello')]))
      );
      let inflated = 0;
      for (const entry of zip.getEntries()) {
        if (entry.header.size !== 0) continue;
        entry.getData = () => {
          inflated++;
          throw new Error('unsafe inflate');
        };
      }
      assert.equal(
        mergeLogsZip(path.join(root, 'zero-size'), zip).conversationsCreated,
        1
      );
      assert.equal(inflated, 0);
    }
  );
  await run(
    'record-size bounds match the binary trailer and invalid Unicode is rejected',
    () => {
      const valid = { ...message(''), sender: 'A', text: 'x'.repeat(65526) };
      assert.equal(isValidLogMessage(valid), true);
      assert.doesNotThrow(() => jsonLogToBinary([valid]));
      assert.equal(
        isValidLogMessage({ ...valid, text: valid.text + 'x' }),
        false
      );
      assert.equal(isValidLogMessage(message('\ud800')), false);
      assert.equal(isValidLogMessage({ ...message('ok'), type: 7 }), false);
      assert.equal(
        isValidLogMessage({ ...message('ok'), sender: 'é'.repeat(128) }),
        false
      );
    }
  );
  await run(
    'deduplication distinguishes embedded NULs in sender and text',
    () => {
      const messages = [
        { ...message('B\0C'), sender: 'A' },
        { ...message('C'), sender: 'A\0B' }
      ];
      const dir = path.join(root, 'nul');
      assert.equal(mergeLogFile(dir, 'bob', messages).added, 2);
      assert.deepEqual(
        binaryLogToJson(fs.readFileSync(path.join(dir, 'bob'))),
        messages
      );
    }
  );
  await run(
    'epoch timestamps and long UTF-8 display names do not fail after replacement',
    () => {
      const dir = path.join(root, 'bounds');
      assert.equal(
        mergeLogFile(
          dir,
          'bob',
          [message('epoch', 0), message('today')],
          'é'.repeat(300)
        ).added,
        2
      );
      const bytes = fs.readFileSync(path.join(dir, 'bob'));
      assert.deepEqual(
        fs.readFileSync(path.join(dir, 'bob.idx')),
        buildLogIndexBuffer('é'.repeat(300), bytes)
      );
    }
  );
  await run(
    'index installation failure restores the original log/index and retry works',
    () => {
      const original = jsonLogToBinary([message('original')]);
      const { dir, file, index } = seed('rollback', original);
      const rename = fs.renameSync;
      fs.renameSync = (from, to) => {
        if (path.basename(from) === 'new-index')
          throw new Error('injected index failure');
        return rename(from, to);
      };
      try {
        assert.throws(
          () => mergeLogFile(dir, 'bob', [message('incoming')]),
          /injected/
        );
      } finally {
        fs.renameSync = rename;
      }
      assert.deepEqual(fs.readFileSync(file), original);
      assert.deepEqual(fs.readFileSync(`${file}.idx`), index);
      assert.equal(mergeLogFile(dir, 'bob', [message('incoming')]).added, 1);
    }
  );
  await run('index staging failure leaves originals untouched', () => {
    const original = jsonLogToBinary([message('original')]);
    const { dir, file, index } = seed('stage-failure', original);
    const write = fs.writeFileSync;
    fs.writeFileSync = (file, ...args) => {
      if (path.basename(String(file)) === 'new-index')
        throw new Error('injected write failure');
      return write(file, ...args);
    };
    try {
      assert.throws(
        () => mergeLogFile(dir, 'bob', [message('incoming')]),
        /injected/
      );
    } finally {
      fs.writeFileSync = write;
    }
    assert.deepEqual(fs.readFileSync(file), original);
    assert.deepEqual(fs.readFileSync(`${file}.idx`), index);
  });
  await run(
    'incoming sidecars, artifacts and platform path aliases are ignored',
    () => {
      const zip = new AdmZip();
      for (const key of [
        'general.IDX',
        'general.idx ',
        'Thumbs.db',
        'bob:stream',
        'NUL',
        'normal'
      ])
        zip.addFile(
          `characters/Alice/logs/${key}.json`,
          Buffer.from(JSON.stringify([message('incoming')]))
        );
      const dataDir = path.join(root, 'paths');
      const stats = mergeLogsZip(dataDir, zip);
      assert.equal(stats.conversationsCreated, 1);
      assert.deepEqual(
        fs.readdirSync(path.join(dataDir, 'Alice/logs')).sort(),
        ['normal', 'normal.idx']
      );
    }
  );
  await run(
    'ZIP merge reports a damaged conversation while merging healthy conversations',
    () => {
      const dataDir = path.join(root, 'mixed');
      const dir = path.join(dataDir, 'Alice', 'logs');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'damaged'), Buffer.from('bad'));
      const zip = new AdmZip();
      for (const key of ['damaged', 'healthy'])
        zip.addFile(
          `characters/Alice/logs/${key}.json`,
          Buffer.from(JSON.stringify([message('incoming')]))
        );
      const result = mergeLogsZip(dataDir, zip);
      assert.equal(result.conversationsSkipped, 1);
      assert.equal(result.conversationsCreated, 1);
      assert.equal(fs.readFileSync(path.join(dir, 'damaged'), 'utf8'), 'bad');
    }
  );
  await run(
    'outgoing ZIP permissions, content filtering and cancellation',
    async () => {
      const dataDir = path.join(root, 'outgoing');
      const dir = path.join(dataDir, 'Alice', 'logs');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, 'bob'),
        jsonLogToBinary([message('hello')])
      );
      fs.writeFileSync(path.join(dir, 'Thumbs.db'), 'artifact');
      fs.writeFileSync(path.join(dir, 'bob.IDX'), 'sidecar');
      const out = path.join(root, 'output.zip');
      assert.equal((await buildLogsZip(dataDir, out)).conversations, 1);
      if (process.platform !== 'win32')
        assert.equal(fs.statSync(out).mode & 0o777, 0o600);
      const zip = new AdmZip(out);
      assert.deepEqual(
        JSON.parse(zip.getEntry('characters/Alice/logs/bob.json').getData()),
        [message('hello')]
      );
      const controller = new AbortController();
      const pending = buildLogsZip(
        dataDir,
        path.join(root, 'cancelled.zip'),
        controller.signal
      );
      controller.abort();
      await assert.rejects(pending);
    }
  );
  console.log(`${count} log-sync regression checks passed.`);
})()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => fs.rmSync(root, { recursive: true, force: true }));

import AdmZip from 'adm-zip';
import * as fs from 'fs';
import { parentPort, workerData } from 'worker_threads';
import type { ArchiveJob, ArchiveJobResult } from './archive-job';
import { mergeLogsZip } from './log-merge';
import { buildLogsBatchZip, buildLogsZip } from './logs-zip';
import type { LogsZipPosition, LogsZipResult } from './logs-zip';
import { decryptBody, encryptBody } from './protocol';

const { job } = workerData as { job: ArchiveJob };
const flag = new Int32Array(new SharedArrayBuffer(4));
const controller = new AbortController();
const checkCancelled = (): void => {
  if (Atomics.load(flag, 0)) throw new Error('Sync cancelled');
};
const ready = new Promise<void>(resolve => {
  parentPort!.on('message', message => {
    if (message === 'start') resolve();
    else if (message === 'abort') controller.abort();
  });
});
parentPort!.postMessage({ cancelled: flag.buffer });

async function run(): Promise<ArchiveJobResult> {
  checkCancelled();
  const key = Buffer.from(job.key);
  if (job.kind === 'export') {
    let result: LogsZipResult;
    let next: LogsZipPosition | undefined;
    if (job.batch !== undefined) {
      const built = await buildLogsBatchZip(
        job.dataDir,
        job.outFile,
        job.batch.start,
        job.batch.index,
        job.batch.budget,
        job.batch.maxRecords,
        job.batch.nextCursor,
        controller.signal
      );
      result = built.result;
      next = built.next;
    } else {
      result = await buildLogsZip(job.dataDir, job.outFile, controller.signal);
    }
    checkCancelled();
    const encrypted = encryptBody(key, fs.readFileSync(job.outFile));
    checkCancelled();
    return {
      kind: 'export',
      result,
      next,
      encrypted: encrypted.buffer.slice(
        encrypted.byteOffset,
        encrypted.byteOffset + encrypted.byteLength
      ) as ArrayBuffer
    };
  }
  let plain: Buffer;
  try {
    plain = decryptBody(key, Buffer.from(job.encrypted));
  } catch {
    throw { status: 400, code: 'bad-encryption' };
  }
  checkCancelled();
  let zip: AdmZip;
  try {
    zip = new AdmZip(plain);
  } catch {
    throw { status: 400, code: 'bad-zip' };
  }
  const report = mergeLogsZip(job.dataDir, zip, checkCancelled);
  return { kind: 'merge', report };
}

void ready
  .then(run)
  .then(result => {
    parentPort!.postMessage(
      { result },
      result.kind === 'export' ? [result.encrypted] : []
    );
  })
  .catch(error => {
    parentPort!.postMessage({
      error: {
        message: error?.message ?? String(error),
        status: error?.status,
        code: error?.code
      }
    });
  })
  .finally(() => parentPort!.close());

import * as path from 'path';
import { Worker } from 'worker_threads';
import type { LogMergeStats } from './protocol';
import type { LogsZipResult } from './logs-zip';

export type ArchiveJob =
  | { kind: 'export'; dataDir: string; outFile: string; key: Uint8Array }
  | { kind: 'merge'; dataDir: string; encrypted: ArrayBuffer; key: Uint8Array };
export type ArchiveJobResult =
  | { kind: 'export'; result: LogsZipResult; encrypted: ArrayBuffer }
  | { kind: 'merge'; stats: LogMergeStats };

let nextJobId = 0;

async function runRendererJob(
  job: ArchiveJob,
  signal: AbortSignal
): Promise<ArchiveJobResult> {
  // The renderer's V8 platform cannot construct Node workers. Main owns the
  // worker and can also finish cleanup if the renderer disappears.
  const { ipcRenderer } = require('electron') as typeof import('electron');
  const id = ++nextJobId;
  const abort = (): void => ipcRenderer.send('sync-archive-job-cancel', id);
  signal.addEventListener('abort', abort, { once: true });
  try {
    const reply = await ipcRenderer.invoke('sync-archive-job', id, job);
    signal.throwIfAborted();
    if (reply.error)
      throw Object.assign(new Error(reply.error.message), reply.error);
    return reply.result;
  } finally {
    signal.removeEventListener('abort', abort);
  }
}

/** Run CPU/file work off the renderer. Cancellation never kills a file commit:
 * the worker observes a shared flag before installing each log/index pair.
 * Resolve/reject only after worker exit, so releasing the data lease is safe. */
export function runArchiveJob(
  job: ArchiveJob,
  signal: AbortSignal
): Promise<ArchiveJobResult> {
  signal.throwIfAborted();
  if (process.type === 'renderer') return runRendererJob(job, signal);
  const workerScript = path.join(
    __dirname.endsWith('.asar') ? `${__dirname}.unpacked` : __dirname,
    'sync-worker.js'
  );
  const worker = new Worker(workerScript, {
    workerData: { job },
    transferList: job.kind === 'merge' ? [job.encrypted] : []
  });
  return new Promise((resolve, reject) => {
    let cancelled: Int32Array | undefined;
    let result: ArchiveJobResult | undefined;
    let error: unknown;
    const abort = (): void => {
      if (cancelled) Atomics.store(cancelled, 0, 1);
      worker.postMessage('abort');
    };
    signal.addEventListener('abort', abort, { once: true });
    worker.on('message', message => {
      if (message.cancelled) {
        // Allocate in the Node worker: Chromium does not expose the
        // SharedArrayBuffer constructor in a non-isolated renderer.
        cancelled = new Int32Array(message.cancelled);
        if (signal.aborted) Atomics.store(cancelled, 0, 1);
        worker.postMessage('start');
        return;
      }
      if (message.error) error = message.error;
      else result = message.result;
    });
    worker.on('error', failure => {
      error = failure;
    });
    worker.once('exit', code => {
      signal.removeEventListener('abort', abort);
      if (signal.aborted) reject(signal.reason);
      else if (error) reject(error);
      else if (code !== 0 || !result)
        reject(new Error('Sync worker exited without a result'));
      else resolve(result);
    });
  });
}

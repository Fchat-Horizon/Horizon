import { app, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { runArchiveJob } from './archive-job';
import type { ArchiveJob, ArchiveJobResult } from './archive-job';

interface SerializedJobError {
  message: string;
  status: number;
  code: string;
}

interface RunningJob {
  id: number;
  controller: AbortController;
  promise: Promise<ArchiveJobResult>;
  exportDir?: string;
}

type JobReply = { result: ArchiveJobResult } | { error: SerializedJobError };

const jobs = new Map<number, RunningJob>();

function jobError(message: string, status: number, code: string): Error {
  return Object.assign(new Error(message), { status, code });
}

function serializeError(error: unknown): SerializedJobError {
  const details =
    error && typeof error === 'object'
      ? (error as { message?: unknown; status?: unknown; code?: unknown })
      : undefined;
  return {
    message:
      typeof details?.message === 'string'
        ? details.message
        : error instanceof Error
          ? error.message
          : String(error),
    status: typeof details?.status === 'number' ? details.status : 500,
    code:
      typeof details?.code === 'string' ? details.code : 'archive-job-failed'
  };
}

function isByteArray(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array && value.byteLength === 32;
}

function validateJob(value: unknown): ArchiveJob {
  if (!value || typeof value !== 'object')
    throw jobError('Invalid sync archive job', 400, 'invalid-job');
  const job = value as Partial<ArchiveJob>;
  if (typeof job.dataDir !== 'string' || !job.dataDir)
    throw jobError('Invalid sync archive data directory', 400, 'invalid-job');
  if (!isByteArray(job.key))
    throw jobError('Invalid sync archive encryption key', 400, 'invalid-job');
  if (job.kind === 'export' && typeof job.outFile === 'string') {
    return job as ArchiveJob;
  }
  if (job.kind === 'merge' && job.encrypted instanceof ArrayBuffer) {
    return job as ArchiveJob;
  }
  throw jobError('Invalid sync archive job', 400, 'invalid-job');
}

/** Validate the only plaintext archive path accepted from a renderer. */
function getExportDir(job: ArchiveJob): string | undefined {
  if (job.kind !== 'export') return undefined;
  const syncRoot = path.resolve(app.getPath('temp'), 'horizon-sync');
  const outFile = path.resolve(job.outFile);
  const relative = path.relative(syncRoot, outFile);
  const parts = relative.split(path.sep);
  if (
    path.isAbsolute(relative) ||
    parts.length !== 2 ||
    !/^session-[^/\\]+$/.test(parts[0]) ||
    parts[1] !== 'logs.zip'
  ) {
    throw jobError(
      'Invalid sync archive output path',
      400,
      'invalid-output-path'
    );
  }
  return path.dirname(outFile);
}

function abortJob(job: RunningJob): void {
  if (job.controller.signal.aborted) return;
  job.controller.abort(
    jobError('Sync archive job cancelled', 499, 'job-cancelled')
  );
}

export function hasSyncJobs(owner: number): boolean {
  return jobs.has(owner);
}

/** Abort an owner's job, wait for its worker, then remove its private folder. */
export async function cancelSyncJobs(owner: number): Promise<void> {
  const job = jobs.get(owner);
  if (!job) return;
  abortJob(job);
  try {
    await job.promise;
  } catch {
    // The renderer is gone; cancellation errors have no receiver.
  }
  if (job.exportDir) {
    await fs.promises.rm(job.exportDir, { recursive: true, force: true });
  }
}

/** Register the main-process archive worker broker. */
export function registerSyncJobHandlers(
  canStart: (owner: number) => boolean
): void {
  ipcMain.handle(
    'sync-archive-job',
    async (event, id: number, value: unknown): Promise<JobReply> => {
      const owner = event.sender.id;
      try {
        if (!canStart(owner))
          throw jobError(
            'A Data Manager session is required',
            403,
            'data-session-required'
          );
        if (!Number.isSafeInteger(id) || id < 0)
          throw jobError('Invalid sync archive job ID', 400, 'invalid-job-id');
        if (jobs.has(owner))
          throw jobError(
            'A sync archive job is already running',
            409,
            'job-in-progress'
          );

        const job = validateJob(value);
        const exportDir = getExportDir(job);
        const controller = new AbortController();
        const promise = (async () => {
          try {
            return await runArchiveJob(job, controller.signal);
          } finally {
            if (job.kind === 'export') {
              await fs.promises.rm(job.outFile, { force: true });
            }
          }
        })();
        const running: RunningJob = {
          id,
          controller,
          promise,
          exportDir
        };
        jobs.set(owner, running);
        try {
          return { result: await promise };
        } finally {
          if (jobs.get(owner) === running) jobs.delete(owner);
        }
      } catch (error) {
        return { error: serializeError(error) };
      }
    }
  );

  ipcMain.on('sync-archive-job-cancel', (event, id: number) => {
    const job = jobs.get(event.sender.id);
    if (job?.id === id) abortJob(job);
  });
}

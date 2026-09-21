/**
 * @license MPL-2.0
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * @copyright 2024-2026 Sylvia Roselie & Respective Horizon Contributors
 * @version 1.0
 * @see {@link https://github.com/Fchat-Horizon/Horizon|GitHub repo}
 *
 * The desktop side of the Horizon <-> Solstice log sync: a short-lived
 * HTTP server for a single sync session, secured by the bearer token and
 * AES-256-GCM key that only ever leave this machine via the QR code.
 * See docs/log-sync-protocol.md for the protocol.
 */

import * as fs from 'fs';
import * as http from 'http';
import type { AddressInfo } from 'net';
import type { Socket } from 'net';
import * as os from 'os';
import * as path from 'path';
import { runArchiveJob } from './archive-job';
import type { LogsZipResult } from './logs-zip';
import {
  buildSessionPayload,
  decryptBody,
  encryptBody,
  generateSessionSecrets,
  tokensMatch,
  SYNC_ACTIVE_IDLE_TIMEOUT_MS,
  SYNC_MAX_AUTH_FAILURES,
  SYNC_MAX_BODY_BYTES,
  SYNC_PROTOCOL_VERSION,
  SYNC_SESSION_TIMEOUT_MS
} from './protocol';
import type {
  LogMergeStats,
  SyncHandshakeRequest,
  SyncSessionPayload,
  SyncSessionSecrets
} from './protocol';

export type SyncServerState =
  | 'waiting'
  | 'paired'
  | 'sending'
  | 'receiving'
  | 'merging'
  | 'finished'
  | 'error'
  | 'stopped';

export interface LogSyncServerOptions {
  /** The log directory holding the per-character folders. */
  dataDir: string;
  /** Account name the peer must match. */
  account: string;
  /** Directory for the temporary outgoing zip. */
  tempDir: string;
  onStateChange?: (server: LogSyncServer) => void;
}

interface SyncError {
  status: number;
  code: string;
}

function syncError(status: number, code: string): SyncError {
  return { status, code };
}

export class LogSyncServer {
  readonly payload: SyncSessionPayload;

  state: SyncServerState = 'waiting';
  peerName: string | undefined = undefined;
  /** What was sent to the peer, once GET /v1/logs has completed. */
  sentResult: LogsZipResult | undefined = undefined;
  /** Merge outcome, once POST /v1/logs has completed. */
  mergeStats: LogMergeStats | undefined = undefined;
  /** Set when the session ends abnormally. */
  errorCode: string | undefined = undefined;

  private readonly secrets: SyncSessionSecrets;
  private readonly server: http.Server;
  private readonly options: LogSyncServerOptions;
  private readonly sockets = new Set<Socket>();
  private idleTimer: NodeJS.Timeout | undefined;
  private authFailures = 0;
  private busy = false;
  private readonly cancellation = new AbortController();
  private readonly requests = new Set<Promise<void>>();

  /** Resolves after pending file jobs and temporary-file cleanup have finished. */
  async whenIdle(): Promise<void> {
    await Promise.allSettled(Array.from(this.requests));
  }

  private get ended(): boolean {
    return (
      this.state === 'finished' ||
      this.state === 'error' ||
      this.state === 'stopped'
    );
  }

  private ensureActive(): void {
    if (this.ended) throw syncError(410, 'session-ended');
  }

  private constructor(
    options: LogSyncServerOptions,
    secrets: SyncSessionSecrets,
    server: http.Server,
    port: number
  ) {
    this.options = options;
    this.secrets = secrets;
    this.server = server;
    this.payload = buildSessionPayload(secrets, port, options.account);
  }

  static start(options: LogSyncServerOptions): Promise<LogSyncServer> {
    const secrets = generateSessionSecrets();
    const server = http.createServer();
    // Bound a peer that opens a connection and then stalls mid-request
    // without closing it: the abort-safe body reads and the idle timer only
    // cover a socket that actually closes or a session that goes idle
    // between requests. headersTimeout catches a slow-header client;
    // requestTimeout caps the whole request while still leaving room for a
    // large but legitimate upload (bodies are capped at SYNC_MAX_BODY_BYTES).
    server.headersTimeout = 60 * 1000;
    server.requestTimeout = 10 * 60 * 1000;
    return new Promise<LogSyncServer>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '0.0.0.0', () => {
        server.removeListener('error', reject);
        const port = (server.address() as AddressInfo).port;
        const instance = new LogSyncServer(options, secrets, server, port);
        server.on('connection', socket => {
          instance.sockets.add(socket);
          socket.on('close', () => instance.sockets.delete(socket));
        });
        server.on('request', (req, res) => {
          const request = instance.handleRequest(req, res);
          instance.requests.add(request);
          void request
            .finally(() => instance.requests.delete(request))
            .catch(() => {});
        });
        instance.bumpIdleTimer();
        resolve(instance);
      });
    });
  }

  /** Ends the session; safe to call repeatedly. */
  stop(finalState: SyncServerState = 'stopped'): Promise<void> {
    if (this.state === 'stopped' || this.state === 'error')
      return this.whenIdle();
    if (this.state !== 'finished') this.state = finalState;
    this.clearIdleTimer();
    this.cancellation.abort();
    this.server.close();
    for (const socket of this.sockets) socket.destroy();
    this.sockets.clear();
    this.notify();
    return this.whenIdle();
  }

  private fail(code: string): void {
    if (this.ended) return;
    this.errorCode = code;
    this.clearIdleTimer();
    this.state = 'error';
    this.cancellation.abort();
    this.server.close();
    for (const socket of this.sockets) socket.destroy();
    this.sockets.clear();
    this.notify();
  }

  /** The idle window for the current state: long before pairing, short once
   * a session is live so an abandoned peer is cleaned up quickly. */
  private currentIdleTimeout(): number {
    return this.state === 'waiting'
      ? SYNC_SESSION_TIMEOUT_MS
      : SYNC_ACTIVE_IDLE_TIMEOUT_MS;
  }

  /** (Re)arms the rolling idle timeout for the current state. No-op once the
   * session has reached a terminal state so a late transfer `finally` can't
   * resurrect a timer after stop()/fail(). */
  private bumpIdleTimer(): void {
    this.clearIdleTimer();
    if (
      this.state === 'finished' ||
      this.state === 'stopped' ||
      this.state === 'error'
    )
      return;
    this.idleTimer = setTimeout(() => {
      this.idleTimer = undefined;
      if (
        this.state === 'finished' ||
        this.state === 'stopped' ||
        this.state === 'error'
      )
        return;
      this.fail(this.state === 'waiting' ? 'expired' : 'timed-out');
    }, this.currentIdleTimeout());
  }

  private clearIdleTimer(): void {
    if (this.idleTimer !== undefined) clearTimeout(this.idleTimer);
    this.idleTimer = undefined;
  }

  private notify(): void {
    this.options.onStateChange?.(this);
  }

  private setState(state: SyncServerState): void {
    if (this.ended) return;
    this.state = state;
    this.notify();
  }

  /** Returns a failed transfer to the paired state so the peer can retry. */
  private recoverToPaired(): void {
    if (
      this.state === 'sending' ||
      this.state === 'receiving' ||
      this.state === 'merging'
    )
      this.setState('paired');
  }

  private authorize(req: http.IncomingMessage): boolean {
    const header = req.headers.authorization;
    const presented =
      typeof header === 'string' && header.startsWith('Bearer ')
        ? header.slice('Bearer '.length).trim()
        : '';
    if (presented.length > 0 && tokensMatch(this.secrets.token, presented))
      return true;
    this.authFailures++;
    if (this.authFailures >= SYNC_MAX_AUTH_FAILURES)
      this.fail('too-many-auth-failures');
    return false;
  }

  private readBody(req: http.IncomingMessage): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      let total = 0;
      let settled = false;
      const settle = (run: () => void): void => {
        if (settled) return;
        settled = true;
        run();
      };
      req.on('data', (chunk: Buffer) => {
        total += chunk.length;
        if (total > SYNC_MAX_BODY_BYTES) {
          req.destroy();
          settle(() => reject(syncError(413, 'body-too-large')));
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', () => settle(() => resolve(Buffer.concat(chunks))));
      req.on('error', () =>
        settle(() => reject(syncError(400, 'read-failed')))
      );
      // A peer that dies mid-upload never emits 'end'; without these the
      // promise would hang forever and wedge busy=true / state='receiving'.
      req.on('aborted', () =>
        settle(() => reject(syncError(400, 'read-aborted')))
      );
      req.on('close', () => {
        if (req.complete) return;
        settle(() => reject(syncError(400, 'read-aborted')));
      });
    });
  }

  private respondJson(
    res: http.ServerResponse,
    status: number,
    body: object
  ): void {
    const encrypted = encryptBody(
      this.secrets.key,
      Buffer.from(JSON.stringify(body), 'utf8')
    );
    res.writeHead(status, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': encrypted.length
    });
    res.end(encrypted);
  }

  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    try {
      if (
        this.state === 'finished' ||
        this.state === 'stopped' ||
        this.state === 'error'
      )
        throw syncError(410, 'session-ended');
      if (!this.authorize(req)) throw syncError(401, 'unauthorized');

      const route = `${req.method} ${(req.url ?? '').split('?')[0]}`;
      if (route === 'POST /v1/handshake') await this.handleHandshake(req, res);
      else if (route === 'GET /v1/logs') await this.handleGetLogs(res);
      else if (route === 'POST /v1/logs') await this.handlePostLogs(req, res);
      else if (route === 'POST /v1/finish') this.handleFinish(res);
      else throw syncError(404, 'not-found');
    } catch (error) {
      const known =
        error !== null &&
        typeof error === 'object' &&
        typeof (error as SyncError).status === 'number';
      const status = known ? (error as SyncError).status : 500;
      const code = known ? (error as SyncError).code : 'internal-error';
      if (!res.headersSent) {
        if (status === 401) {
          // No session proof, so no encrypted channel to answer on.
          res.writeHead(status, { 'Content-Length': 0 });
          res.end();
        } else {
          this.respondJson(res, status, { error: code });
        }
      } else {
        res.destroy();
      }
    }
  }

  private async readEncryptedBody(req: http.IncomingMessage): Promise<Buffer> {
    const raw = await this.readBody(req);
    this.ensureActive();
    try {
      return decryptBody(this.secrets.key, raw);
    } catch {
      // Valid token but no valid key: treat like an auth failure so a
      // token-sniffing attacker gets cut off quickly.
      this.authFailures++;
      if (this.authFailures >= SYNC_MAX_AUTH_FAILURES)
        this.fail('too-many-auth-failures');
      throw syncError(400, 'bad-encryption');
    }
  }

  private async handleHandshake(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    if (this.state !== 'waiting') throw syncError(409, 'already-paired');
    const body = await this.readEncryptedBody(req);
    // A second slow request may have passed the initial check before the
    // first handshake finished. Claim pairing only after the await.
    this.ensureActive();
    if (this.state !== 'waiting') throw syncError(409, 'already-paired');
    let handshake: SyncHandshakeRequest;
    try {
      handshake = JSON.parse(body.toString('utf8')) as SyncHandshakeRequest;
    } catch {
      throw syncError(400, 'bad-json');
    }
    if (
      handshake === null ||
      typeof handshake !== 'object' ||
      typeof handshake.account !== 'string' ||
      typeof handshake.deviceName !== 'string'
    )
      throw syncError(400, 'bad-handshake');
    if (
      handshake.account.trim().toLowerCase() !==
      this.options.account.trim().toLowerCase()
    )
      throw syncError(403, 'account-mismatch');

    this.peerName = handshake.deviceName;
    this.setState('paired');
    // Switch from the long pre-handshake window to the short paired-session
    // idle window now that a peer is actively driving the session.
    this.bumpIdleTimer();
    this.respondJson(res, 200, {
      ok: true,
      deviceName: os.hostname(),
      account: this.options.account,
      protocolVersion: SYNC_PROTOCOL_VERSION
    });
  }

  private async handleGetLogs(res: http.ServerResponse): Promise<void> {
    if (this.busy) throw syncError(409, 'busy');
    if (this.state !== 'paired') throw syncError(409, 'not-paired');
    this.busy = true;
    // Suspend the idle timeout for the duration of the transfer; a large log
    // set may legitimately take longer than the paired-session idle window.
    this.clearIdleTimer();
    this.setState('sending');
    // A client that vanishes mid-download makes the response stream emit
    // ECONNRESET/EPIPE; swallow it so an unhandled 'error' can't crash us.
    res.on('error', () => {});
    const transfer = new AbortController();
    const cancel = (): void => transfer.abort();
    const disconnected = (): void => {
      if (!res.writableFinished) cancel();
    };
    this.cancellation.signal.addEventListener('abort', cancel, { once: true });
    res.on('close', disconnected);
    let tempDir: string | undefined;
    try {
      this.ensureActive();
      fs.mkdirSync(this.options.tempDir, { recursive: true });
      tempDir = fs.mkdtempSync(path.join(this.options.tempDir, 'session-'));
      const zipFile = path.join(tempDir, 'logs.zip');
      const completed = await runArchiveJob(
        {
          kind: 'export',
          dataDir: this.options.dataDir,
          outFile: zipFile,
          key: this.secrets.key
        },
        transfer.signal
      );
      this.ensureActive();
      transfer.signal.throwIfAborted();
      if (completed.kind !== 'export')
        throw new Error('Unexpected sync worker result');
      const result = completed.result;
      const encrypted = Buffer.from(completed.encrypted);
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': encrypted.length
      });
      await new Promise<void>((resolve, reject) => {
        const cleanup = (): void => {
          res.removeListener('finish', finished);
          res.removeListener('close', closed);
          res.removeListener('error', failed);
          res.setTimeout(0);
        };
        const finished = (): void => {
          // Node may emit finish after a destroyed response drops buffered
          // bytes. Only an intact response counts as a completed download.
          if (res.destroyed) {
            failed();
            return;
          }
          cleanup();
          resolve();
        };
        const failed = (): void => {
          cleanup();
          reject(syncError(400, 'send-failed'));
        };
        const closed = (): void => {
          if (!res.writableFinished) failed();
        };
        res.once('finish', finished);
        res.once('close', closed);
        res.once('error', failed);
        // Socket inactivity, not total transfer duration: a slow but moving
        // download can take longer than the paired-session idle window.
        res.setTimeout(SYNC_ACTIVE_IDLE_TIMEOUT_MS, () => {
          failed();
          res.destroy();
        });
        res.end(encrypted);
      });
      this.ensureActive();
      this.sentResult = result;
      this.setState('paired');
    } catch (error) {
      this.recoverToPaired();
      throw error;
    } finally {
      this.cancellation.signal.removeEventListener('abort', cancel);
      res.removeListener('close', disconnected);
      this.busy = false;
      this.bumpIdleTimer();
      try {
        if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {}
    }
  }

  private async handlePostLogs(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    if (this.busy) throw syncError(409, 'busy');
    if (this.state !== 'paired') throw syncError(409, 'not-paired');
    this.busy = true;
    // Suspend the idle timeout for the duration of the transfer; a large
    // upload may legitimately take longer than the paired-session window.
    this.clearIdleTimer();
    this.setState('receiving');
    try {
      const raw = await this.readBody(req);
      this.ensureActive();
      this.setState('merging');
      const encrypted = raw.buffer.slice(
        raw.byteOffset,
        raw.byteOffset + raw.byteLength
      ) as ArrayBuffer;
      const completed = await runArchiveJob(
        {
          kind: 'merge',
          dataDir: this.options.dataDir,
          encrypted,
          key: this.secrets.key
        },
        this.cancellation.signal
      );
      this.ensureActive();
      if (completed.kind !== 'merge')
        throw new Error('Unexpected sync worker result');
      this.mergeStats = completed.stats;
      this.respondJson(res, 200, { ok: true, ...this.mergeStats });
      this.setState('paired');
    } catch (error) {
      if ((error as SyncError)?.code === 'bad-encryption') {
        this.authFailures++;
        if (this.authFailures >= SYNC_MAX_AUTH_FAILURES)
          this.fail('too-many-auth-failures');
      }
      this.recoverToPaired();
      throw error;
    } finally {
      this.busy = false;
      this.bumpIdleTimer();
    }
  }

  private handleFinish(res: http.ServerResponse): void {
    if (this.busy) throw syncError(409, 'busy');
    if (this.state !== 'paired') throw syncError(409, 'not-paired');
    this.setState('finished');
    this.respondJson(res, 200, { ok: true });
    res.on('finish', () => this.stop('finished'));
  }
}

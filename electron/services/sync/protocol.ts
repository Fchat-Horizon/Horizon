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
 * Shared types, constants and crypto helpers for the Horizon <-> Solstice
 * LAN log sync protocol. The full protocol is documented in
 * `docs/log-sync-protocol.md`; this module is the reference implementation
 * of the wire-level primitives (session secrets, body encryption, QR
 * payload). Pure Node - safe to use from both main and renderer processes.
 */

import * as crypto from 'crypto';
import * as os from 'os';

/** Protocol version spoken by this implementation. */
export const SYNC_PROTOCOL_VERSION = 1;

/** Application identifier embedded in the QR payload. */
export const SYNC_APP_ID = 'horizon-log-sync';

/** AES-256-GCM parameters used for all request/response bodies. */
export const SYNC_IV_LENGTH = 12;
export const SYNC_TAG_LENGTH = 16;
export const SYNC_KEY_LENGTH = 32;
export const SYNC_TOKEN_LENGTH = 32;

/** Upper bound for any (encrypted) HTTP body, to bound memory usage. */
export const SYNC_MAX_BODY_BYTES = 512 * 1024 * 1024;

/**
 * Upper bound on the total *uncompressed* size of a received sync archive.
 * The encrypted HTTP body is already capped at SYNC_MAX_BODY_BYTES, but a
 * compressed zip can expand far beyond that once inflated. AdmZip allocates
 * each entry's buffer from its declared uncompressed size, so the sum of the
 * entry header sizes bounds how much memory the merge will allocate; anything
 * larger is rejected before any entry is read. Must match Solstice's limit.
 */
export const SYNC_MAX_UNCOMPRESSED_BYTES = 2 * 1024 * 1024 * 1024;

/**
 * Uncompressed JSON one version 2 batch aims for. Counted on the serialized
 * JSON rather than the binary log because JSON escaping is what the receiver
 * has to allocate. A batch is cut after the record that crosses this, so it
 * overshoots by at most one record rather than splitting one.
 */
export const SYNC_BATCH_TARGET_BYTES = 16 * 1024 * 1024;

/** Records one batch may carry, so tiny messages cannot swamp the receiver. */
export const SYNC_BATCH_MAX_RECORDS = 150000;

/**
 * Batch budget to actually use, honouring HORIZON_SYNC_BATCH_BYTES when it is
 * set to something sane. Testing the split path otherwise needs a conversation
 * larger than the real budget; a small override turns a few megabytes of logs
 * into dozens of batches, which exercises slicing, cursor chaining and the
 * in-place extension without a multi-gigabyte fixture.
 */
export function batchTargetBytes(): number {
  const override = Number(process.env.HORIZON_SYNC_BATCH_BYTES);
  return Number.isSafeInteger(override) &&
    override > 0 &&
    override <= SYNC_MAX_BODY_BYTES
    ? override
    : SYNC_BATCH_TARGET_BYTES;
}

/**
 * Cursor value a peer sends to ask for the first batch. Any other value is an
 * opaque token minted by the server; the parameter being present at all is the
 * capability signal, so a peer that never sends one keeps the whole archive.
 */
export const SYNC_CURSOR_START = 'start';

/** Batches one direction may take, so a cursor bug cannot loop forever. */
export const SYNC_MAX_BATCHES = 1024;

/**
 * Root entry naming a batch's place in the sequence. Receivers that predate
 * version 2 skip it: both sides ignore any entry that is not a four-segment
 * `characters/{char}/logs/{key}.json` path.
 */
export const SYNC_BATCH_ENTRY = 'sync-batch.json';

export interface SyncBatchInfo {
  /** Zero-based position of this batch in the sequence. */
  index: number;
  /** True when no further batch follows in this direction. */
  done: boolean;
  /** Token to request the next batch with. Absent once `done`. */
  cursor?: string;
}

/** A session that has not completed a handshake expires after this long. */
export const SYNC_SESSION_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Once a session is paired (or otherwise active) it is torn down after this
 * long without a request, so a peer that disappears mid-session cannot leave
 * the server running indefinitely. Suspended while a transfer is actually in
 * flight, which may legitimately take longer than this.
 *
 * It is re-armed between batches, so it also bounds how long the peer may
 * spend merging one batch before asking for the next. A phone merging a large
 * conversation needs more than the two minutes a single transfer allowed.
 */
export const SYNC_ACTIVE_IDLE_TIMEOUT_MS = 5 * 60 * 1000;

/** The session aborts after this many failed authorization attempts. */
export const SYNC_MAX_AUTH_FAILURES = 5;

/**
 * The JSON document encoded into the QR code. `key` is the base64-encoded
 * AES-256-GCM key; it is only ever exchanged visually via the QR code (or
 * the copy-paste fallback), never over the network.
 */
export interface SyncSessionPayload {
  v: number;
  app: typeof SYNC_APP_ID;
  addrs: string[];
  port: number;
  token: string;
  key: string;
  account: string;
}

export interface SyncHandshakeRequest {
  account: string;
  deviceName: string;
  platform?: string;
  appVersion?: string;
}

export interface SyncHandshakeResponse {
  ok: true;
  deviceName: string;
  account: string;
  protocolVersion: number;
}

/** Result of merging a received log set into the local store. */
export interface LogMergeStats {
  conversationsCreated: number;
  conversationsUpdated: number;
  messagesAdded: number;
  charactersTouched: number;
  /** Damaged local conversations left untouched; run Fix Logs before retrying. */
  conversationsSkipped: number;
}

export interface SyncSessionSecrets {
  /** Hex string presented as the bearer token. */
  token: string;
  /** Raw AES-256-GCM key. */
  key: Buffer;
}

export function generateSessionSecrets(): SyncSessionSecrets {
  return {
    token: crypto.randomBytes(SYNC_TOKEN_LENGTH).toString('hex'),
    key: crypto.randomBytes(SYNC_KEY_LENGTH)
  };
}

/**
 * Encrypts a body as `IV (12) || ciphertext || GCM tag (16)`.
 */
export function encryptBody(key: Buffer, plain: Buffer): Buffer {
  const iv = crypto.randomBytes(SYNC_IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([iv, ciphertext, cipher.getAuthTag()]);
}

/**
 * Decrypts an `IV || ciphertext || tag` body. Throws if the body is too
 * short or fails GCM authentication (i.e. was tampered with or encrypted
 * with a different key).
 */
export function decryptBody(key: Buffer, data: Buffer): Buffer {
  if (data.length < SYNC_IV_LENGTH + SYNC_TAG_LENGTH)
    throw new Error('Encrypted body too short');
  const iv = data.subarray(0, SYNC_IV_LENGTH);
  const tag = data.subarray(data.length - SYNC_TAG_LENGTH);
  const ciphertext = data.subarray(
    SYNC_IV_LENGTH,
    data.length - SYNC_TAG_LENGTH
  );
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/** Constant-time comparison of the presented token against the session's. */
export function tokensMatch(expected: string, presented: string): boolean {
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(presented, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Non-internal IPv4 addresses the phone can reach this machine on. */
export function getLanAddresses(): string[] {
  const result: string[] = [];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const info of interfaces[name] ?? []) {
      if (info.internal) continue;
      if (info.family !== 'IPv4' && <unknown>info.family !== 4) continue;
      result.push(info.address);
    }
  }
  return result;
}

export function buildSessionPayload(
  secrets: SyncSessionSecrets,
  port: number,
  account: string
): SyncSessionPayload {
  return {
    v: SYNC_PROTOCOL_VERSION,
    app: SYNC_APP_ID,
    addrs: getLanAddresses(),
    port,
    token: secrets.token,
    key: secrets.key.toString('base64'),
    account
  };
}

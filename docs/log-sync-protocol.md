# Horizon <-> Solstice Log Sync Protocol (v1)

This document is the canonical specification of the LAN log sync protocol between Horizon (desktop) and Solstice (mobile). Horizon's reference implementation lives in `electron/services/sync/`. The Data Manager renderer serves HTTP; a main-process broker runs archive and merge work in a Node worker so the UI stays responsive.

The goal: a user logged into the **same F-List account** on both devices scans a QR code shown by Horizon, and the two clients exchange chat logs so that **both end up with the union of all messages**. Only chat logs are transferred. Global settings, character settings, drafts, pins, recents and hidden lists are never touched.

## Roles

- **Horizon** acts as the HTTP server for exactly one single-use session.
- **Solstice** acts as the HTTP client and drives the whole exchange.

## Session establishment

When the user starts a sync session, Horizon:

1. Acquires the main-process Data Manager lease, excluding other sync/import/export operations and character connections. The account comes from the most recent successful login in this application session, including logins with Save Login disabled.
2. Generates a random 32-byte **session token** (hex-encoded) and a random 32-byte **AES-256-GCM key**.
3. Starts an HTTP server on `0.0.0.0` with an ephemeral port.
4. Displays a QR code encoding the following JSON document (also available as copyable text for manual entry):

```json
{
  "v": 1,
  "app": "horizon-log-sync",
  "addrs": ["192.168.1.5"],
  "port": 51234,
  "token": "<64 hex chars>",
  "key": "<base64, 32 bytes>",
  "account": "AccountName"
}
```

- `addrs` lists every non-internal IPv4 address of the desktop; the client should try them in order until one connects.
- `account` lets the client check it is signed into the right account _before_ attempting a handshake and show a friendly error otherwise.

The session ends when: the user stops it, the window closes, `/v1/finish` completes, 10 minutes pass without a successful handshake, 2 minutes pass with no request once the session is paired (so a peer that disappears mid-session does not leave the server running, though this idle timer is suspended while a transfer is actually in flight), or 5 requests fail authorization/decryption. Sessions and their secrets are never reused; every sync shows a fresh QR code.

## Transport security

The transport is plain HTTP; all security comes from the two QR secrets, which are exchanged visually and never cross the network:

- **Authentication**: every request carries `Authorization: Bearer <token>`. Horizon compares in constant time and answers `401` (empty body) on mismatch.
- **Confidentiality and integrity**: every non-empty request and response body is encrypted as:

  ```
  IV (12 bytes) || AES-256-GCM ciphertext || auth tag (16 bytes)
  ```

  with a fresh random IV per message and the QR `key`. `Content-Type` is always `application/octet-stream`. A body that fails GCM authentication is rejected with `400` and counts toward the failed-attempt limit.

Because the token travels in a plaintext header, a LAN sniffer can replay it, but without the key it can neither read any payload, forge a valid handshake or upload, nor tamper with responses. The worst an attacker on the local network can do is disrupt the session (denial of service), which the user resolves by starting a new one on a trusted network.

Error responses to _authorized_ requests are encrypted JSON of the form `{"error": "<code>"}`.

## Endpoints

All bodies described below are the **plaintext** content, i.e. what you get after decryption / what you encrypt before sending. JSON is UTF-8.

### 1. `POST /v1/handshake`

Request:

```json
{
  "account": "AccountName",
  "deviceName": "Pixel 9",
  "platform": "android",
  "appVersion": "1.4.0"
}
```

`account` and `deviceName` are required. `account` must match the QR payload's account case-insensitively, otherwise Horizon answers `403 {"error": "account-mismatch"}` and the session stays unpaired.

Response `200`:

```json
{
  "ok": true,
  "deviceName": "desktop-hostname",
  "account": "AccountName",
  "protocolVersion": 1
}
```

A second handshake on an already-paired session yields `409 {"error": "already-paired"}`. All other endpoints answer `409 {"error": "not-paired"}` until a handshake has succeeded.

### 2. `GET /v1/logs`

No request body. The response body (after decryption) is a **zip archive** containing Horizon's logs, in the _sync zip format_ described below. The client merges it into its own store using the merge semantics below.

With no query string the archive holds **every** local character's logs, and a log set that exceeds the outgoing size cap answers `413 {"error": "archive-too-large"}` instead; this is not retryable within the session. That is the original behaviour and remains the default, so a client written before batching existed is unaffected.

**Batched transfers.** A client that passes a `cursor` query parameter receives one bounded batch at a time instead. The parameter being present is the capability signal, so a client that cannot reassemble batches never receives one:

```
GET /v1/logs?cursor=start          -> first batch
GET /v1/logs?cursor=<token>        -> the batch that token names
```

Each batch is a complete, valid sync archive carrying a slice of the log set, plus a root `sync-batch.json` entry:

```json
{ "index": 0, "done": false, "cursor": "<token for the next batch>" }
```

The client requests the batch named by `cursor` until it receives one with `"done": true`, which carries no `cursor`. Batches together hold exactly what the unbatched archive would, so merging all of them in order is equivalent to merging the whole archive.

A conversation larger than one batch is split across consecutive batches, each carrying the same `characters/<Character>/logs/<key>.json` entry path with a different, ascending run of messages. No extra machinery is needed to reassemble it: the merge below is a union, so the pieces simply merge in turn.

Tokens are opaque and meaningful only within the session. Horizon keeps the cursor that produced the batch just sent valid alongside the one naming the next, so a client whose download failed can request the same batch again. Requesting an unknown cursor answers `409 {"error": "unknown-cursor"}`, and exceeding the per-direction batch limit answers `409 {"error": "too-many-batches"}`.

**All downloads must finish before the first upload.** A cursor is a position within Horizon's log files, and merging an upload rewrites those files. Horizon invalidates every outstanding cursor once it has merged an upload and answers `409 {"error": "cursor-stale"}`, rather than letting a client interleave the two directions and silently skip messages.

### 3. `POST /v1/logs`

The request body (before encryption) is a zip archive in the same format, containing the client's logs. A client may upload in several batches by simply calling this endpoint more than once; no signal is needed, and Horizon accumulates the totals across them. The response reports the running session total, so a single upload reads exactly as it did before. If the archive's total uncompressed size exceeds the cap (see _Constraints for Horizon_), Horizon answers `413 {"error": "archive-too-large"}` before merging and leaves its logs untouched. Otherwise Horizon merges it into its local store and responds `200`:

```json
{
  "ok": true,
  "conversationsCreated": 3,
  "conversationsUpdated": 17,
  "messagesAdded": 2941,
  "charactersTouched": 2,
  "conversationsSkipped": 0
}
```

`conversationsSkipped` counts damaged local conversations that were left untouched. Horizon tells the user to run Fix Logs before retrying those conversations. Other conversations can still merge.

### 4. `POST /v1/finish`

Empty (or `{}`) request body. Response: `200 {"ok": true}`. Horizon shows the sync summary to the user and shuts the session down; the token and key become invalid.

### Suggested client flow

```
scan QR -> verify account matches locally -> POST /v1/handshake
        -> GET /v1/logs   (merge into local store)
        -> POST /v1/logs  (desktop merges)
        -> POST /v1/finish
```

Batched, which is the same flow with the two transfers looped:

```
POST /v1/handshake
GET  /v1/logs?cursor=start                  -> merge, note next cursor
GET  /v1/logs?cursor=<token>  ... repeat until "done": true
POST /v1/logs                 ... repeat until the local log set is sent
POST /v1/finish
```

Transfers are sequential; Horizon answers `409 {"error": "busy"}` if a transfer endpoint is called while another is still running.

## Sync zip format

The layout is the standard Horizon export format (which Solstice already imports) restricted to logs:

```
manifest.json
characters/<Character Name>/logs/<conversation key>.json
characters/<Character Name>/logs-names.json
```

- `manifest.json` is a Horizon export manifest with `includes: { logs: true, jsonLogs: true, ... }` (all other includes false). See `electron/services/exporter/manifest.ts`. In a batched transfer it describes that batch alone.
- `sync-batch.json` is present only in a batched transfer, and is described under `GET /v1/logs`. Receivers ignore any root entry they do not recognise, so it is safe to send to a peer that predates batching.
- `<conversation key>` is the conversation's storage key: the lower-cased character name for private conversations, or `#` followed by the channel id for channels.
- Each `logs/*.json` file is a JSON array of messages **sorted ascending by time**:

  ```json
  [{ "time": 1719772800, "type": 0, "sender": "Some Character", "text": "Hi!" }]
  ```

  - `time`: unix epoch **seconds** (unsigned 32-bit).
  - `type`: `Conversation.Message.Type` enum value (0 Message, 1 Action, 2 Ad, 3 Roll, 4 Warn, 5 Event, 6 Bcast). Only values 0 through 6 are supported.
  - `sender`: character name; empty string for `Event` messages. Max 255 UTF-8 bytes.
  - `text`: message text. The combined UTF-8 size of `sender` and `text` plus 8 bytes of record overhead must not exceed 65535 bytes.

  Messages violating these bounds or containing invalid Unicode are skipped by the receiver.

- `logs-names.json` maps conversation keys to display names (channels have ids as keys, so this is how the channel _title_ survives to a device that has never seen the channel):

  ```json
  { "#abc123": "Some Channel Name", "some character": "Some Character" }
  ```

  It is optional and cosmetic; senders should include it when they have display names available.

  In a batched transfer it covers **only the conversations carried by that batch**. Both sides take a conversation's display name when they create it and never revisit it, so a name arriving in a later batch than the conversation it names would arrive too late to be used.

## Merge semantics

Both sides apply the same merge, per conversation:

1. Deduplicate on the exact tuple `(time, type, sender, text)`; messages already present locally are ignored.
2. Insert the remaining messages sorted by `time` (stable: on equal timestamps, locally-stored messages come first, then incoming ones in their original order).
3. A conversation that does not exist locally is created; its display name comes from `logs-names.json`, falling back to the conversation key.
4. If a local binary log has a malformed record or trailing data, skip that conversation in its entirety and ask the user to run Fix Logs. Never rewrite a parsed prefix over a damaged log.
5. If nothing is new, the conversation's storage must not be rewritten.

The merge is idempotent: syncing twice adds nothing the second time.

When a conversation arrives across several batches, Horizon extends it in place rather than rewriting it once per batch, appending to the log and continuing the day index. It does this only when the conversation's one full parse proved the log undamaged and in time order, the index matched a rebuild from that log, the file has not changed since, and the incoming batch is ascending and starts at or after the last stored message. Any of those failing falls back to the full rewrite below, so the result is identical either way. An extension grows the log and flushes it before the index, the opposite order to a rewrite: a crash leaving the log grown and the index short only costs a day marker until Fix Logs runs, whereas an index entry pointing past the end of a short log would be read as garbage messages.

On Horizon, merged conversations are otherwise rewritten in the binary log format of `electron/filesystem.ts` and the `.idx` day index is rebuilt in the same pass (`electron/services/sync/log-merge.ts`). Both replacements are prepared before changing the original files. If installation fails, Horizon restores the original pair. The old index is removed before replacing the log so stale offsets cannot accompany a new log. This is not a filesystem transaction across two files: interruption by a process or machine crash can leave a missing index requiring Fix Logs; recovery copies remain in a hidden `.sync-*` directory if installation or rollback is interrupted.

## Constraints for Horizon

- Device sync, ZIP import, vanilla import and manual export share an exclusive main-process lease. These operations and a connected character are mutually exclusive: a session cannot start while any character is connected, and while a session holds the lock the main process refuses every character connection until the session ends. Both checks run synchronously on the main-process thread, so there is no window in which a character could connect during a merge and race the chat renderer's append-only log writes and in-memory day index.
- A paired session is torn down after 5 minutes without a request. That timer is re-armed between batches, so it also bounds how long a peer may spend merging one batch before requesting the next.
- Encrypted bodies are capped at 512 MiB, in either direction (the outgoing `GET /v1/logs` archive is bounded to the same limit before it is read into memory).
- A batch targets 16 MiB of uncompressed JSON, cut after the record that crosses that, and at most 150000 records. The budget is counted on serialized JSON rather than binary log bytes, because JSON escaping is what the receiver has to allocate. Each sender picks its own batch size; nothing requires the two to agree.
- The whole uncompressed archive is capped at 2 GiB. Oversized archives reject the upload with `413 {"error": "archive-too-large"}` before any conversation is changed. Incoming sizes are checked from the ZIP central directory before decompression; entries declaring zero size are skipped without inflating them. Outgoing JSON sizes are counted as each entry is prepared, and entries are compressed sequentially to avoid queuing the entire archive in memory. Solstice must apply the same limit for the two sides to agree.

Outgoing archives use a private temporary directory and owner-only ZIP permissions. Stop cancels archive generation and requests merge cancellation before the next file commit. A log/index replacement already in progress finishes or rolls back before cancellation completes. The UI shows a stopping state and retains the main-process lease until the worker exits and temporary-file cleanup finishes; window close waits for the same drain. Main also cancels and drains a worker if its renderer crashes. A cancelled operation cannot return a terminal session to `paired`. Download state and the suspended session idle timer last until the response finishes sending. A stalled download socket is closed after 2 minutes of inactivity, while a progressing transfer can take longer.

## Manual verification

Batched transfers add these to the pass: a client built before batching (one that sends no `cursor`) still receives its whole archive and syncs completely, which is the single most important check, since the opt-in is all that stands between an older client and silent truncation; a batching client against a Horizon that predates it receives one archive and no `sync-batch.json`; a conversation larger than one batch reassembles with every day present **and every message within the day that straddles a batch boundary**, checked by opening that day in the log viewer rather than by comparing totals, because a duplicate day index entry hides messages without changing any count; a deliberately damaged log is reported as skipped exactly once rather than once per batch; and stopping mid-run releases the lease with no `.sync-*` directories left behind.

For the manual Electron/Solstice pass, verify that signing in with Save Login disabled permits sync after disconnecting the character; that a second Data Manager window cannot import or start another sync during the session; and that Stop, window close and interrupted phone connections cleanly allow a fresh session. Include a real transfer in both directions and check the merged history in each client.

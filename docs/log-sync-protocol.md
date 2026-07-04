# Horizon <-> Solstice Log Sync Protocol (v1)

This document is the canonical specification of the LAN log sync protocol
between Horizon (desktop) and Solstice (mobile). Horizon's reference
implementation lives in `electron/services/sync/`.

The goal: a user logged into the **same F-List account** on both devices
scans a QR code shown by Horizon, and the two clients exchange chat logs so
that **both end up with the union of all messages**. Only chat logs are
transferred. Global settings, character settings, drafts, pins, recents and
hidden lists are never touched.

## Roles

- **Horizon** acts as the HTTP server for exactly one single-use session.
- **Solstice** acts as the HTTP client and drives the whole exchange.

## Session establishment

When the user starts a sync session, Horizon:

1. Generates a random 32-byte **session token** (hex-encoded) and a random
   32-byte **AES-256-GCM key**.
2. Starts an HTTP server on `0.0.0.0` with an ephemeral port.
3. Displays a QR code encoding the following JSON document (also available
   as copyable text for manual entry):

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

- `addrs` lists every non-internal IPv4 address of the desktop; the client
  should try them in order until one connects.
- `account` lets the client check it is signed into the right account
  _before_ attempting a handshake and show a friendly error otherwise.

The session ends when: the user stops it, the window closes, `/v1/finish`
completes, 10 minutes pass without a successful handshake, or 5 requests
fail authorization/decryption. Sessions and their secrets are never reused;
every sync shows a fresh QR code.

## Transport security

The transport is plain HTTP; all security comes from the two QR secrets,
which are exchanged visually and never cross the network:

- **Authentication**: every request carries `Authorization: Bearer <token>`.
  Horizon compares in constant time and answers `401` (empty body) on
  mismatch.
- **Confidentiality and integrity**: every non-empty request and response
  body is encrypted as:

  ```
  IV (12 bytes) || AES-256-GCM ciphertext || auth tag (16 bytes)
  ```

  with a fresh random IV per message and the QR `key`. `Content-Type` is
  always `application/octet-stream`. A body that fails GCM authentication
  is rejected with `400` and counts toward the failed-attempt limit.

Because the token travels in a plaintext header, a LAN sniffer can replay
it, but without the key it can neither read any payload, forge a valid
handshake or upload, nor tamper with responses. The worst an attacker on
the local network can do is disrupt the session (denial of service), which
the user resolves by starting a new one on a trusted network.

Error responses to _authorized_ requests are encrypted JSON of the form
`{"error": "<code>"}`.

## Endpoints

All bodies described below are the **plaintext** content, i.e. what you
get after decryption / what you encrypt before sending. JSON is UTF-8.

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

`account` and `deviceName` are required. `account` must match the QR
payload's account case-insensitively, otherwise Horizon answers
`403 {"error": "account-mismatch"}` and the session stays unpaired.

Response `200`:

```json
{
  "ok": true,
  "deviceName": "desktop-hostname",
  "account": "AccountName",
  "protocolVersion": 1
}
```

A second handshake on an already-paired session yields
`409 {"error": "already-paired"}`. All other endpoints answer
`409 {"error": "not-paired"}` until a handshake has succeeded.

### 2. `GET /v1/logs`

No request body. The response body (after decryption) is a **zip archive**
containing Horizon's logs for all local characters, in the _sync zip
format_ described below. The client merges it into its own store using the
merge semantics below.

### 3. `POST /v1/logs`

The request body (before encryption) is a zip archive in the same format,
containing the client's logs. Horizon merges it into its local store and
responds `200`:

```json
{
  "ok": true,
  "conversationsCreated": 3,
  "conversationsUpdated": 17,
  "messagesAdded": 2941,
  "charactersTouched": 2
}
```

### 4. `POST /v1/finish`

Empty (or `{}`) request body. Response: `200 {"ok": true}`. Horizon shows
the sync summary to the user and shuts the session down; the token and key
become invalid.

### Suggested client flow

```
scan QR -> verify account matches locally -> POST /v1/handshake
        -> GET /v1/logs   (merge into local store)
        -> POST /v1/logs  (desktop merges)
        -> POST /v1/finish
```

Transfers are sequential; Horizon answers `409 {"error": "busy"}` if a
transfer endpoint is called while another is still running.

## Sync zip format

The layout is the standard Horizon export format (which Solstice already
imports) restricted to logs:

```
manifest.json
characters/<Character Name>/logs/<conversation key>.json
characters/<Character Name>/logs-names.json
```

- `manifest.json` is a Horizon export manifest with
  `includes: { logs: true, jsonLogs: true, ... }` (all other includes
  false). See `electron/services/exporter/manifest.ts`.
- `<conversation key>` is the conversation's storage key: the lower-cased
  character name for private conversations, or `#` followed by the channel
  id for channels.
- Each `logs/*.json` file is a JSON array of messages **sorted ascending by
  time**:

  ```json
  [{ "time": 1719772800, "type": 0, "sender": "Some Character", "text": "Hi!" }]
  ```

  - `time`: unix epoch **seconds** (unsigned 32-bit).
  - `type`: `Conversation.Message.Type` enum value (0 Message, 1 Action,
    2 Ad, 3 Roll, 4 Warn, 5 Event, 6 Bcast). Must fit in one byte.
  - `sender`: character name; empty string for `Event` messages. Max 255
    UTF-8 bytes.
  - `text`: message text, max 65535 UTF-8 bytes.

  Messages violating these bounds are skipped by the receiver.

- `logs-names.json` maps conversation keys to display names (channels have
  ids as keys, so this is how the channel _title_ survives to a device that
  has never seen the channel):

  ```json
  { "#abc123": "Some Channel Name", "some character": "Some Character" }
  ```

  It is optional and cosmetic; senders should include it when they have
  display names available.

## Merge semantics

Both sides apply the same merge, per conversation:

1. Deduplicate on the exact tuple `(time, type, sender, text)`; messages
   already present locally are ignored.
2. Insert the remaining messages sorted by `time` (stable: on equal
   timestamps, locally-stored messages come first, then incoming ones in
   their original order).
3. A conversation that does not exist locally is created; its display name
   comes from `logs-names.json`, falling back to the conversation key.
4. If nothing is new, the conversation's storage must not be rewritten.

The merge is idempotent: syncing twice adds nothing the second time.

On Horizon, merged conversations are rewritten in the binary log format of
`electron/filesystem.ts` and the `.idx` day index is rebuilt in the same
pass (`electron/services/sync/log-merge.ts`).

## Constraints for Horizon

- Sync is only available while **no character is connected** to chat; a
  running session is aborted if a character connects. This avoids racing
  the chat renderer's append-only log writes and in-memory day index.
- Encrypted bodies are capped at 512 MiB.

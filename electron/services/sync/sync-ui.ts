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
 * Data Manager glue for the device sync section: session lifecycle, QR
 * rendering and mapping server state onto the Vue view model. Runs in the
 * exporter window's renderer, like the other import/export services.
 */

import * as remote from '@electron/remote';
import { clipboard, ipcRenderer } from 'electron';
import log from 'electron-log';
import * as path from 'path';
import QRCode from 'qrcode';
import l from '../../../chat/localize';
import type { ExporterVm } from '../exporter-vm';
import { LogSyncServer } from './server';

let activeServer: LogSyncServer | undefined;

/**
 * Releases the main-process device-sync lock so characters can connect again.
 * Idempotent: releasing when the lock is not held is a no-op in the main
 * process, so it is safe to call on every session-end path.
 */
function releaseSyncLock(): void {
  ipcRenderer.send('sync-lock-release');
}

function resetSyncViewState(vm: ExporterVm): void {
  vm.syncActive = false;
  vm.syncState = 'idle';
  vm.syncQrDataUrl = undefined;
  vm.syncPayloadText = undefined;
  vm.syncAddressText = undefined;
  vm.syncPeerName = undefined;
}

function describeError(code: string | undefined): string {
  switch (code) {
    case 'expired':
      return l('sync.error.expired');
    case 'timed-out':
      return l('sync.error.timedOut');
    case 'too-many-auth-failures':
      return l('sync.error.authFailures');
    default:
      return l('sync.error.generic', { reason: code ?? 'unknown' });
  }
}

function buildSummary(server: LogSyncServer): string {
  const peer = server.peerName ?? l('sync.unknownDevice');
  const received = server.mergeStats;
  const sent = server.sentResult;
  const parts: string[] = [];
  if (received !== undefined)
    parts.push(
      l('sync.summary.received', {
        messages: received.messagesAdded,
        conversations:
          received.conversationsUpdated + received.conversationsCreated,
        created: received.conversationsCreated
      })
    );
  if (sent !== undefined)
    parts.push(
      l('sync.summary.sent', {
        conversations: sent.conversations,
        characters: sent.characters.length
      })
    );
  if (parts.length === 0) parts.push(l('sync.summary.nothing'));
  return l('sync.summary', { device: peer, details: parts.join(' ') });
}

function applyServerState(vm: ExporterVm, server: LogSyncServer): void {
  if (server !== activeServer) return;
  vm.syncState = server.state;
  vm.syncPeerName = server.peerName;
  switch (server.state) {
    case 'finished':
      vm.syncSummary = buildSummary(server);
      activeServer = undefined;
      releaseSyncLock();
      resetSyncViewState(vm);
      break;
    case 'error':
      vm.syncError = describeError(server.errorCode);
      activeServer = undefined;
      releaseSyncLock();
      resetSyncViewState(vm);
      break;
    case 'stopped':
      activeServer = undefined;
      releaseSyncLock();
      resetSyncViewState(vm);
      break;
    default:
      break;
  }
}

/**
 * Starts a sync session: spins up the single-use server and shows its QR
 * code. Concurrency is guarded by the authoritative main-process lock, not the
 * renderer-local `activeServer`: the lock is taken synchronously before the
 * first await below, so a rapid double-click or a second Data Manager window
 * cannot open two servers. A start that finds a session already running is a
 * silent no-op.
 */
export async function startSyncSession(vm: ExporterVm): Promise<void> {
  vm.syncError = undefined;
  vm.syncSummary = undefined;

  const account = (vm.settings.account ?? '').trim();
  if (account.length === 0) {
    vm.syncError = l('sync.error.accountMissing');
    return;
  }
  const dataDir = vm.settings.logDirectory;
  if (!dataDir) {
    vm.syncError = l('sync.error.generic', {
      reason: 'no log directory configured'
    });
    return;
  }

  // Take the main-process lock before opening the server. This is the
  // authoritative, cross-window guard: acquired synchronously (before the first
  // await below), it atomically refuses if a character is connected and, once
  // held, blocks any character from connecting for the whole session so a merge
  // can never race the chat renderer's log writes. Placed after the early
  // returns above so the lock is never acquired and then leaked by one.
  const lock = ipcRenderer.sendSync('sync-lock-acquire');
  if (lock === 'in-progress') return;
  if (lock !== 'ok') {
    vm.syncError = l('sync.error.lockedWhileConnected');
    return;
  }

  try {
    const server = await LogSyncServer.start({
      dataDir,
      account,
      tempDir: path.join(remote.app.getPath('temp'), 'horizon-sync'),
      onStateChange: changed => applyServerState(vm, changed)
    });
    activeServer = server;

    const payloadText = JSON.stringify(server.payload);
    vm.syncQrDataUrl = await QRCode.toDataURL(payloadText, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 280
    });
    vm.syncPayloadText = payloadText;
    vm.syncAddressText = server.payload.addrs
      .map(address => `${address}:${server.payload.port}`)
      .join(', ');
    vm.syncActive = true;
    vm.syncState = server.state;
  } catch (error) {
    log.error('sync.session.start.error', error);
    stopSyncSession(vm);
    vm.syncError = l('sync.error.generic', {
      reason: error instanceof Error ? error.message : String(error)
    });
  }
}

/** Stops the running session, if any, and clears the QR from the screen. */
export function stopSyncSession(vm: ExporterVm): void {
  const server = activeServer;
  activeServer = undefined;
  if (server !== undefined) server.stop();
  releaseSyncLock();
  resetSyncViewState(vm);
}

/**
 * Ends a running session because a character connected mid-sync; merging
 * while logs are being appended to would corrupt them.
 */
export function abortSyncForConnectedCharacter(vm: ExporterVm): void {
  if (activeServer === undefined) return;
  stopSyncSession(vm);
  vm.syncError = l('sync.error.lockedWhileConnected');
}

export function copySyncPayload(vm: ExporterVm): void {
  if (vm.syncPayloadText !== undefined) clipboard.writeText(vm.syncPayloadText);
}

/** Localized progress line for the current session state. */
export function describeSyncState(vm: ExporterVm): string {
  const peer = vm.syncPeerName ?? l('sync.unknownDevice');
  switch (vm.syncState) {
    case 'waiting':
      return l('sync.state.waiting');
    case 'paired':
      return l('sync.state.paired', { device: peer });
    case 'sending':
      return l('sync.state.sending', { device: peer });
    case 'receiving':
      return l('sync.state.receiving', { device: peer });
    case 'merging':
      return l('sync.state.merging');
    default:
      return '';
  }
}

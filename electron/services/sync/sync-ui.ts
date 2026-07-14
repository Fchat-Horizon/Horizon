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
    case 'too-many-auth-failures':
      return l('sync.error.authFailures');
    default:
      return l('sync.error.generic', code ?? 'unknown');
  }
}

function buildSummary(server: LogSyncServer): string {
  const peer = server.peerName ?? l('sync.unknownDevice');
  const received = server.mergeStats;
  const sent = server.sentResult;
  const parts: string[] = [];
  if (received !== undefined)
    parts.push(
      l(
        'sync.summary.received',
        received.messagesAdded,
        received.conversationsUpdated + received.conversationsCreated,
        received.conversationsCreated
      )
    );
  if (sent !== undefined)
    parts.push(
      l('sync.summary.sent', sent.conversations, sent.characters.length)
    );
  if (parts.length === 0) parts.push(l('sync.summary.nothing'));
  return l('sync.summary', peer, parts.join(' '));
}

function applyServerState(vm: ExporterVm, server: LogSyncServer): void {
  if (server !== activeServer) return;
  vm.syncState = server.state;
  vm.syncPeerName = server.peerName;
  switch (server.state) {
    case 'finished':
      vm.syncSummary = buildSummary(server);
      activeServer = undefined;
      resetSyncViewState(vm);
      break;
    case 'error':
      vm.syncError = describeError(server.errorCode);
      activeServer = undefined;
      resetSyncViewState(vm);
      break;
    case 'stopped':
      activeServer = undefined;
      resetSyncViewState(vm);
      break;
    default:
      break;
  }
}

async function anyCharactersConnected(): Promise<boolean> {
  try {
    const connected: string[] = await ipcRenderer.invoke(
      'get-connected-characters'
    );
    return Array.isArray(connected) && connected.length > 0;
  } catch {
    return false;
  }
}

/**
 * Starts a sync session: spins up the single-use server and shows its QR
 * code. No-op if a session is already running.
 */
export async function startSyncSession(vm: ExporterVm): Promise<void> {
  if (activeServer !== undefined) return;
  vm.syncError = undefined;
  vm.syncSummary = undefined;

  const account = (vm.settings.account ?? '').trim();
  if (account.length === 0) {
    vm.syncError = l('sync.error.accountMissing');
    return;
  }
  if (await anyCharactersConnected()) {
    vm.syncError = l('sync.error.lockedWhileConnected');
    return;
  }
  const dataDir = vm.settings.logDirectory;
  if (!dataDir) {
    vm.syncError = l('sync.error.generic', 'no log directory configured');
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
    vm.syncError = l(
      'sync.error.generic',
      error instanceof Error ? error.message : String(error)
    );
  }
}

/** Stops the running session, if any, and clears the QR from the screen. */
export function stopSyncSession(vm: ExporterVm): void {
  const server = activeServer;
  activeServer = undefined;
  if (server !== undefined) server.stop();
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
      return l('sync.state.paired', peer);
    case 'sending':
      return l('sync.state.sending', peer);
    case 'receiving':
      return l('sync.state.receiving', peer);
    case 'merging':
      return l('sync.state.merging');
    default:
      return '';
  }
}

/*
 * Slimcat importer (Windows-specific). The XML parsing stays here in the
 * renderer because it relies on DOMParser; all file access and the text-log
 * conversion live in the main process (electron/services/import-host.ts).
 */

import { ipcRenderer } from 'electron';
import { Settings } from '@horizon/shared/chat/common';
import { GeneralSettings } from '@horizon/shared/common';
import { SettingsStore } from '../../filesystem';

/** Whether Slimcat general settings exist (%LOCALAPPDATA%/slimCat). */
export function canImportGeneral(): boolean {
  return ipcRenderer.sendSync('slimcat-can-import-general-sync') === true;
}

/** Whether the character has Slimcat settings (APPDATA, else !Defaults). */
export function canImportCharacter(character: string): boolean {
  return (
    ipcRenderer.sendSync('slimcat-can-import-character-sync', character) ===
    true
  );
}

/** Extracts account/host from Slimcat's XML config into `data`, in place. */
export function importGeneral(data: GeneralSettings): void {
  const config = <{ file: string; content: string } | null>(
    ipcRenderer.sendSync('slimcat-read-general-config-sync')
  );
  if (config === null) return;
  let elm = new DOMParser().parseFromString(
    config.content,
    'application/xml'
  ).firstElementChild;
  if (config.file.slice(-3) === 'xml') {
    if (elm === null) return;
    let elements;
    if ((elements = elm.getElementsByTagName('Username')).length > 0)
      data.account = <string>elements[0].textContent;
    if ((elements = elm.getElementsByTagName('Host')).length > 0)
      data.host = <string>elements[0].textContent;
  } else {
    if (elm !== null) elm = elm.firstElementChild;
    if (elm !== null) elm = elm.firstElementChild;
    if (elm === null) return;
    const config2 = elm.getElementsByTagName('setting');
    for (const element of config2) {
      if (
        element.firstElementChild === null ||
        element.firstElementChild.textContent === null
      )
        continue;
      if (element.getAttribute('name') === 'UserName')
        data.account = element.firstElementChild.textContent;
      else if (element.getAttribute('name') === 'Host')
        data.host = element.firstElementChild.textContent;
    }
  }
}

async function importSettings(ownCharacter: string): Promise<void> {
  const settings = new Settings();
  const settingsStore = new SettingsStore();
  const content = <string | null>(
    ipcRenderer.sendSync('slimcat-read-settings-xml-sync', ownCharacter)
  );
  if (content === null) return;
  const config = new DOMParser().parseFromString(
    content,
    'application/xml'
  ).firstElementChild;
  if (config === null) return;

  function getValue(name: string): string | undefined {
    if (config === null) return;
    const elm = <Element | undefined>config.getElementsByTagName(name)[0];
    return elm !== undefined && elm.textContent !== null
      ? elm.textContent
      : undefined;
  }

  if (getValue('AllowColors') === 'false')
    settings.disallowedTags.push('color');
  if (getValue('AllowIcons') === 'false')
    settings.disallowedTags.push('icon', 'eicon');
  if (getValue('AllowSound') === 'false') settings.playSound = false;
  if (getValue('CheckForOwnName') === 'false') settings.highlight = false;
  const idleTime = getValue('AutoIdleTime');
  if (getValue('AllowAutoIdle') === 'true' && idleTime !== undefined)
    settings.idleTimer = parseInt(idleTime, 10);
  const highlightWords = getValue('GlobalNotifyTerms');
  if (highlightWords !== undefined)
    settings.highlightWords = highlightWords
      .split(',')
      .map(x => x.trim())
      .filter(x => x.length);
  if (getValue('ShowNotificationsGlobal') === 'false')
    settings.notifications = false;
  if (getValue('ShowAvatars') === 'false') settings.showAvatars = false;
  if (getValue('PlaySoundEvenWhenTabIsFocused') === 'true')
    settings.alwaysNotify = true;
  await settingsStore.set('settings', settings);

  const pinned = { channels: <string[]>[], private: [] };
  const elements = config
    .getElementsByTagName('SavedChannels')[0]
    .getElementsByTagName('channel');
  for (const element of elements) {
    const item = element.textContent;
    if (item !== null && pinned.channels.indexOf(item) === -1)
      pinned.channels.push(item);
  }
  await settingsStore.set('pinned', pinned);
}

/**
 * Imports a character's Slimcat settings and converts their logs to the
 * binary format, reporting progress as a 0-1 fraction.
 */
export async function importCharacter(
  ownCharacter: string,
  progress: (progress: number) => void
): Promise<void> {
  if (!canImportCharacter(ownCharacter)) return;
  await importSettings(ownCharacter);

  const onProgress = (_e: Electron.IpcRendererEvent, value: number): void =>
    progress(value);
  ipcRenderer.on('slimcat-import-progress', onProgress);
  try {
    await ipcRenderer.invoke('slimcat-import-logs', ownCharacter);
  } finally {
    ipcRenderer.removeListener('slimcat-import-progress', onProgress);
  }
}

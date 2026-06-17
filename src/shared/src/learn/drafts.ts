import { ipcRenderer } from 'electron';
import core from '@/chat/core';

/**
 * Reads the persisted conversation draft cache as parsed JSON, scoped to the
 * current character. Returns null when nothing is stored or parsing fails.
 * @internal
 */
export function getDrafts(): any {
  const raw = <string | null>(
    ipcRenderer.sendSync('drafts-get-sync', core.connection.character)
  );
  //tslint:disable-next-line:no-null-keyword
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error encountered when parsing drafts: ${e}`);
    return null; //tslint:disable-line:no-null-keyword
  }
}

/** Persists the conversation draft cache as raw JSON. @internal */
export async function saveDrafts(drafts: any): Promise<void> {
  ipcRenderer.send(
    'drafts-set',
    core.connection.character,
    JSON.stringify(drafts)
  );
}

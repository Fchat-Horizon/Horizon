import { ipc } from '@/platform/ipc';
import core from '@/chat/core';
import { createLogger } from '@/logger';
const log = createLogger('drafts');

/**
 * Reads the persisted conversation draft cache as parsed JSON, scoped to the
 * current character. Returns null when nothing is stored or parsing fails.
 * @internal
 */
export function getDrafts(): any {
  const raw = <string | null>(
    ipc.sendSync('drafts-get-sync', core.connection.character)
  );
  //tslint:disable-next-line:no-null-keyword
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    log.error(`Error encountered when parsing drafts: ${e}`);
    return null; //tslint:disable-line:no-null-keyword
  }
}

/** Persists the conversation draft cache as raw JSON. @internal */
export async function saveDrafts(drafts: any): Promise<void> {
  ipc.send('drafts-set', core.connection.character, JSON.stringify(drafts));
}

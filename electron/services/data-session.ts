import { ipcRenderer } from 'electron';
import l from '../../chat/localize';

/** Acquire before the first write/await; release only the lease we acquired. */
export function acquireDataSession(): () => void {
  const result = ipcRenderer.sendSync('data-session-acquire') as {
    token?: number;
    error?: string;
  };
  if (typeof result?.token !== 'number')
    throw new Error(
      l(
        result?.error === 'connected'
          ? 'settings.dataManager.lockedWhileConnected'
          : 'settings.dataManager.operationInProgress'
      )
    );
  const token = result.token;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    ipcRenderer.sendSync('data-session-release', token);
  };
}

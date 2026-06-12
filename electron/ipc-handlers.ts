/**
 * @module ipc-handlers
 * Main-process IPC endpoints that replace the deprecated `@electron/remote`
 * module. Renderers call these through `ipcRenderer` instead of reaching into
 * main-process objects directly.
 *
 * * Channels suffixed with `-sync` answer `ipcRenderer.sendSync` and must set
 * * `event.returnValue`; everything else is either `invoke` or fire-and-forget.
 */

import AdmZip from 'adm-zip';
import * as electron from 'electron';
import * as os from 'os';
import { hostWindowFor } from './tab-manager';

/**
 * A context menu item as sent by a renderer. Items that carry an `id` are
 * reported back over `context-menu-action` when clicked; items with a `role`
 * are handled entirely by Electron.
 */
interface SerializedMenuItem {
  id?: string;
  label?: string;
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio' | 'header';
  role?: string;
  accelerator?: string;
  enabled?: boolean;
}

let initialized = false;

/**
 * Registers all generic renderer-facing IPC endpoints. Call once during app
 * startup, before any renderer loads.
 */
export function initIpcHandlers(): void {
  if (initialized) return;
  initialized = true;

  const ipc = electron.ipcMain;
  const dialog = electron.dialog;

  /* App/environment lookups. These are synchronous because renderers need
     them during module initialization, where the old remote calls were also
     blocking. */
  ipc.on('app-version-sync', e => {
    e.returnValue = electron.app.getVersion();
  });
  ipc.on(
    'app-path-sync',
    (e, name: Parameters<typeof electron.app.getPath>[0]) => {
      e.returnValue = electron.app.getPath(name);
    }
  );
  ipc.on('native-theme-dark-sync', e => {
    e.returnValue = electron.nativeTheme.shouldUseDarkColors;
  });
  ipc.on('spellcheck-languages-sync', e => {
    e.returnValue =
      electron.session.defaultSession.availableSpellCheckerLanguages;
  });
  ipc.on('window-is-maximized-sync', e => {
    e.returnValue = hostWindowFor(e.sender)?.isMaximized() ?? false;
  });
  ipc.on('os-info-sync', e => {
    e.returnValue = {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      versions: {
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node
      }
    };
  });

  /* Clipboard writes; sandboxed renderers have no clipboard module. */
  ipc.on('clipboard-write-text', (_e, text: string) => {
    electron.clipboard.writeText(text);
  });
  ipc.on('clipboard-write-bookmark', (_e, title: string, url: string) => {
    electron.clipboard.writeBookmark(title, url);
  });

  /* Zips rendered text/HTML log exports; renderers cannot zip without Node. */
  ipc.handle('zip-create', (_e, files: { name: string; content: string }[]) => {
    const zip = new AdmZip();
    for (const file of files)
      zip.addFile(file.name, Buffer.from(file.content, 'utf-8'));
    return zip.toBuffer();
  });

  /* Dialogs, parented to the sender's window whenever one can be resolved. */
  ipc.on(
    'dialog-message-box-sync',
    (e, options: electron.MessageBoxSyncOptions) => {
      const win = hostWindowFor(e.sender);
      e.returnValue = win
        ? dialog.showMessageBoxSync(win, options)
        : dialog.showMessageBoxSync(options);
    }
  );
  ipc.on('dialog-open-sync', (e, options: electron.OpenDialogSyncOptions) => {
    const win = hostWindowFor(e.sender);
    e.returnValue = win
      ? dialog.showOpenDialogSync(win, options)
      : dialog.showOpenDialogSync(options);
  });
  ipc.handle('dialog-open', (e, options: electron.OpenDialogOptions) => {
    const win = hostWindowFor(e.sender);
    return win
      ? dialog.showOpenDialog(win, options)
      : dialog.showOpenDialog(options);
  });
  ipc.handle('dialog-save', (e, options: electron.SaveDialogOptions) => {
    const win = hostWindowFor(e.sender);
    return win
      ? dialog.showSaveDialog(win, options)
      : dialog.showSaveDialog(options);
  });
  ipc.on('show-message-box', (e, options: electron.MessageBoxOptions) => {
    const win = hostWindowFor(e.sender);
    void (win
      ? dialog.showMessageBox(win, options)
      : dialog.showMessageBox(options));
  });
  ipc.on('show-error-box', (_e, title: string, content: string) => {
    dialog.showErrorBox(title, content);
  });

  /* safeStorage proxies for the renderer-side SecureStore. The encrypted
     payload keeps the legacy `binary` string encoding so existing saved
     credentials remain readable. */
  ipc.handle('safe-storage-available', () =>
    electron.safeStorage.isEncryptionAvailable()
  );
  ipc.handle('safe-storage-encrypt', (_e, text: string) =>
    electron.safeStorage.encryptString(text).toString('binary')
  );
  ipc.handle('safe-storage-decrypt', (_e, data: string) =>
    electron.safeStorage.decryptString(Buffer.from(data, 'binary'))
  );

  ipc.handle('session-set-proxy', (e, config: electron.ProxyConfig) =>
    e.sender.session.setProxy(config)
  );

  /* Window controls for frameless windows and notifications. */
  ipc.on('window-minimize', e => hostWindowFor(e.sender)?.minimize());
  ipc.on('window-maximize-toggle', e => {
    const win = hostWindowFor(e.sender);
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  ipc.on('window-close', e => hostWindowFor(e.sender)?.close());
  ipc.on('window-hide', e => hostWindowFor(e.sender)?.hide());
  ipc.on('window-flash', e => hostWindowFor(e.sender)?.flashFrame(true));

  ipc.on('toggle-devtools', e => e.sender.toggleDevTools());
  ipc.on('replace-misspelling', (e, word: string) =>
    e.sender.replaceMisspelling(word)
  );

  ipc.on('popup-app-menu', e => {
    const menu = electron.Menu.getApplicationMenu();
    if (!menu) return;
    const win = hostWindowFor(e.sender);
    menu.popup(win ? { window: win } : {});
  });

  /* Context menus: the renderer sends a serializable template; clicks on
     items that carry an id are routed back over `context-menu-action`. */
  ipc.on('show-context-menu', (e, template: SerializedMenuItem[]) => {
    const items = template.map(item => {
      const option = { ...item } as electron.MenuItemConstructorOptions;
      if (item.id !== undefined && item.role === undefined)
        option.click = () => {
          if (!e.sender.isDestroyed())
            e.sender.send('context-menu-action', item.id);
        };
      return option;
    });
    const win = hostWindowFor(e.sender);
    electron.Menu.buildFromTemplate(items).popup(win ? { window: win } : {});
  });

  electron.nativeTheme.on('updated', () => {
    for (const contents of electron.webContents.getAllWebContents())
      contents.send(
        'native-theme-updated',
        electron.nativeTheme.shouldUseDarkColors
      );
  });
}

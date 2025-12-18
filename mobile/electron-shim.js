// Minimal electron shim for browser/WebView
// Provides stubs for Electron APIs that don't exist in WebView

console.log('[electron-shim] Loading electron shim module');

// EventEmitter-like stub
class EventEmitterStub {
  constructor() {
    this.listeners = {};
  }
  
  on(channel, listener) {
    if (!this.listeners[channel]) {
      this.listeners[channel] = [];
    }
    this.listeners[channel].push(listener);
    return this;
  }
  
  once(channel, listener) {
    const onceWrapper = (...args) => {
      this.removeListener(channel, onceWrapper);
      listener(...args);
    };
    return this.on(channel, onceWrapper);
  }
  
  removeListener(channel, listener) {
    if (this.listeners[channel]) {
      this.listeners[channel] = this.listeners[channel].filter(l => l !== listener);
    }
    return this;
  }
  
  removeAllListeners(channel) {
    if (channel) {
      delete this.listeners[channel];
    } else {
      this.listeners = {};
    }
    return this;
  }
  
  listenerCount(channel) {
    return this.listeners[channel] ? this.listeners[channel].length : 0;
  }
  
  emit(channel, ...args) {
    if (this.listeners[channel]) {
      this.listeners[channel].forEach(listener => listener(...args));
    }
    return this;
  }
  
  send(channel, ...args) {
    // IPC send - no-op in mobile
    console.log('[electron-shim] ipcRenderer.send:', channel, args);
  }
  
  sendSync(channel, ...args) {
    // IPC sendSync - no-op in mobile
    console.log('[electron-shim] ipcRenderer.sendSync:', channel, args);
    return undefined;
  }
  
  invoke(channel, ...args) {
    // IPC invoke - no-op in mobile
    console.log('[electron-shim] ipcRenderer.invoke:', channel, args);
    return Promise.resolve(undefined);
  }
}

// App stub with common Electron app methods
const appStub = new EventEmitterStub();
appStub.getName = () => 'Horizon Mobile';
appStub.getVersion = () => '1.0.0';
appStub.getPath = (name) => '/';
appStub.isPackaged = true;
appStub.name = 'Horizon Mobile';
appStub.version = '1.0.0';

// Stub for remote APIs
const remoteStub = {
  nativeTheme: new EventEmitterStub(),
  getCurrentWindow: () => new EventEmitterStub(),
  getCurrentWebContents: () => new EventEmitterStub(),
  app: appStub,
  require: (module) => {
    console.log('[electron-shim] remote.require called for:', module);
    return {};
  },
};

const electronShim = {
  ipcRenderer: new EventEmitterStub(),
  ipcMain: new EventEmitterStub(),
  remote: remoteStub,
  app: appStub,
  BrowserWindow: function() { return new EventEmitterStub(); },
  dialog: {
    showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
    showSaveDialog: () => Promise.resolve({ canceled: true, filePath: undefined }),
    showMessageBox: () => Promise.resolve({ response: 0 }),
    showErrorBox: () => {},
  },
  Menu: function() {},
  MenuItem: function() {},
  Notification: function() {},
  protocol: {},
  screen: {},
  session: {},
  shell: {
    openExternal: (url) => {
      console.log('[electron-shim] shell.openExternal:', url);
      return Promise.resolve();
    },
  },
  systemPreferences: {},
  Tray: function() {},
  webContents: new EventEmitterStub(),
};

console.log('[electron-shim] Exporting electron shim, app:', electronShim.app);
module.exports = electronShim;

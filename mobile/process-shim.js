// process shim for browser/WebView
var listeners = {};

var processShim = {
  env: { NODE_ENV: 'development' },
  type: 'renderer', // Must be 'renderer' for @electron/remote
  execPath: '',
  argv: [],
  version: 'v16.0.0', // process.version (different from process.versions.node)
  versions: {
    electron: '13.0.0', // Mock Electron version to satisfy library checks
    node: '16.0.0' // Mock Node.js version for adm-zip and other libraries
  },
  platform: 'android',
  browser: true, // Indicate we're in a browser environment
  cwd: function() { return '/'; },
  contextId: 'mobile-context-id',
  // Provide getElectronBinding to avoid sandboxed renderer error
  getElectronBinding: function(name) {
    if (name === 'v8_util') {
      return {
        getHiddenValue: function(obj, key) {
          return processShim.contextId;
        }
      };
    }
    return null;
  },
  // EventEmitter methods
  on: function(event, handler) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);
    return this;
  },
  once: function(event, handler) {
    var onceWrapper = function() {
      processShim.removeListener(event, onceWrapper);
      handler.apply(processShim, arguments);
    };
    return processShim.on(event, onceWrapper);
  },
  removeListener: function(event, handler) {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter(function(h) { return h !== handler; });
    }
    return this;
  },
  emit: function(event) {
    if (listeners[event]) {
      var args = Array.prototype.slice.call(arguments, 1);
      listeners[event].forEach(function(handler) {
        handler.apply(processShim, args);
      });
    }
    return this;
  },
};

// Add setImmediate and clearImmediate (Node.js functions needed for async operations)
if (typeof window !== 'undefined' && typeof window.setImmediate === 'undefined') {
  window.setImmediate = function(fn, ...args) {
    return setTimeout(() => fn(...args), 0);
  };
}
if (typeof window !== 'undefined' && typeof window.clearImmediate === 'undefined') {
  window.clearImmediate = function(id) {
    clearTimeout(id);
  };
}

module.exports = processShim;

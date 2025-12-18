// Shim for WorkerStore to use IndexedStore (browser IndexedDB) instead
// WorkerStore uses Web Workers which don't work in WebView file:// protocol
// IndexedStore uses IndexedDB which works in any browser context

const { IndexedStore } = require('../learn/store/indexed.ts');

// Re-export IndexedStore as WorkerStore to replace it seamlessly
module.exports = {
  WorkerStore: IndexedStore
};

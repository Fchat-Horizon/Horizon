// Shim for Electron's dialog in mobile environment
// Uses browser's native confirm dialog

export class Dialog {
  static confirmDialog(message) {
    console.log('[dialog-shim] confirmDialog called with message:', message);
    const result = confirm(message);
    console.log('[dialog-shim] confirm returned:', result);
    return result;
  }
}

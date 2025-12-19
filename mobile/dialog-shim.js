// Shim for Electron's dialog in mobile environment
// Uses browser's native confirm dialog

export class Dialog {
  static confirmDialog(message) {
    const result = confirm(message);
    return result;
  }
}

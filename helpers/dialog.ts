import * as remote from '@electron/remote';

export class Dialog {
  static confirmDialog(message: string): boolean {
    const result = remote.dialog.showMessageBoxSync({
      message,
      title: 'Horizon',
      type: 'question',
      buttons: ['Yes', 'No'],
      defaultId: 1,
      cancelId: 1
    });

    return result === 0;
  }
}

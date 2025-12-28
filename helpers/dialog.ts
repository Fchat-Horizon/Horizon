import * as remote from '@electron/remote';

import l from '../chat/localize';

export class Dialog {
  static confirmDialog(message: string, defaultNo: boolean = false): boolean {
    const result = remote.dialog.showMessageBoxSync({
      message,
      title: l('title'),
      type: 'question',
      buttons: [l('confirmYes'), l('confirmNo')],
      defaultId: defaultNo ? 1 : 0,
      cancelId: 1
    });

    return result === 0;
  }
}

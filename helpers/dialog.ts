import { ipcRenderer } from 'electron';

import l from '../chat/localize';

export class Dialog {
  static confirmDialog(message: string, defaultNo: boolean = false): boolean {
    const result = <number>ipcRenderer.sendSync('dialog-message-box-sync', {
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

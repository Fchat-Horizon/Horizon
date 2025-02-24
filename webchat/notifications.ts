import core from '../chat/core';
import { Conversation } from '../chat/interfaces';
//tslint:disable-next-line:match-default-export-name
import BaseNotifications from '../chat/notifications';

export default class Notifications extends BaseNotifications {
  async notify(conversation: Conversation, title: string, body: string, icon: string, sound: string): Promise<void> {
    if (!this.shouldNotify(conversation)) return;
    try {
      await super.notify(conversation, title, body, icon, sound);
    } catch {
      //tslint:disable-next-line:no-require-imports no-submodule-imports
      await navigator.serviceWorker.register(<string>require('file-loader!./sw.js'));
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, this.getOptions(conversation, body, icon));
      navigator.serviceWorker.onmessage = e => {
        const conv = core.conversations.byKey((<{ key: string }>e.data).key);
        if (conv !== undefined) conv.show();
        window.focus();
      };
    }
  }
}

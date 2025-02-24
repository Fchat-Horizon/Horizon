import * as remote from '@electron/remote';
import core from '../chat/core';
import { Conversation } from '../chat/interfaces';
//tslint:disable-next-line:match-default-export-name
import BaseNotifications from '../chat/notifications';

const browserWindow = remote.getCurrentWindow();

export default class Notifications extends BaseNotifications {
  async notify(conversation: Conversation, title: string, body: string, icon: string, sound: string): Promise<void> {
    if (!this.shouldNotify(conversation)) return;
    this.playSound(sound);
    browserWindow.flashFrame(true);
    if (core.state.settings.notifications) {
      const notification = new Notification(title, this.getOptions(conversation, body, icon));
      notification.onclick = () => {
        browserWindow.webContents.send('show-tab', remote.getCurrentWebContents().id);
        conversation.show();
        browserWindow.focus();
        notification.close();
      };
    }
  }
}

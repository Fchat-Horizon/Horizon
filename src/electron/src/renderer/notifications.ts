import { ipcRenderer } from 'electron';
import core from '@horizon/shared/chat/core';
import type { Conversation } from '@horizon/shared/chat/interfaces';
//tslint:disable-next-line:match-default-export-name
import BaseNotifications from '@horizon/shared/chat/notifications';
import l from '@horizon/shared/chat/localize';
import { getPlatform } from '@horizon/shared/platform/platform';

export default class Notifications extends BaseNotifications {
  async notify(
    conversation: Conversation,
    title: string,
    body: string,
    icon: string,
    sound: string
  ): Promise<void> {
    if (!this.shouldNotify(conversation)) return;
    this.playSound(sound);
    body = body
      .replace(/\[spoiler\][\s\S]*?\[\/spoiler\]/gi, '██████')
      .replace(/\[eicon\](.*?)\[\/eicon\]/gi, ':$1:')
      .replace(/\[url=([^\]]+)\]\[\/url\]/gi, '$1')
      .replace(/\[\/?[a-zA-Z][a-zA-Z0-9]*(?:=[^\]]*)?\]/g, '');
    //! Skip on macOS: since Electron >=31 window-flash makes the dock icon bounce endlessly, far worse than the Windows taskbar flash.
    if (getPlatform() !== 'darwin' && core.state.generalSettings?.flashWindow)
      ipcRenderer.send('window-flash');
    if (core.state.settings.notifications) {
      const notification = new Notification(
        title,
        this.getOptions(conversation, body, icon)
      );
      notification.onclick = () => {
        //^ Main process raises our tab and restores/focuses the host window.
        ipcRenderer.send('tab-notification-clicked');
        conversation.show();
        notification.close();
      };
    }
  }

  alert(message: string) {
    ipcRenderer.send('show-message-box', {
      title: l('title'),
      message
    });
  }
}

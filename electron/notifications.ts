import * as remote from '@electron/remote';
import core from '../chat/core';
import { Conversation } from '../chat/interfaces';
//tslint:disable-next-line:match-default-export-name
import BaseNotifications from '../chat/notifications';
import l from '../chat/localize';

const browserWindow = remote.getCurrentWindow();

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
    //Since Electron >=31.0.0 this makes the dock icon bounce like crazy on MacOS, which is a million times more annoying (and not the intended use case of the dock bounce anyway) than the flashing taskbar icon on Windows.
    if (
      process.platform !== 'darwin' &&
      core.state.generalSettings?.flashWindow
    )
      browserWindow.flashFrame(true);
    if (core.state.settings.notifications) {
      const notification = new Notification(
        title,
        this.getOptions(conversation, body, icon)
      );
      notification.onclick = () => {
        browserWindow.webContents.send(
          'show-tab',
          remote.getCurrentWebContents().id
        );
        conversation.show();
        if (browserWindow.isMinimized()) browserWindow.restore();
        browserWindow.focus();
        notification.close();
      };
    }
  }

  //My bad this also uses Electron remote (for now). We will have to restructure it to use IPC messaging later, but for now at least you can be glad it's only a single reference I added
  alert(message: string) {
    remote.dialog.showMessageBox(browserWindow, {
      title: l('title'),
      message
    });
  }
}

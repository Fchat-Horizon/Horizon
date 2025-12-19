import core from '../chat/core';
import { Conversation } from '../chat/interfaces';
import BaseNotifications from '../chat/notifications'; //tslint:disable-line:match-default-export-name

declare global {
  const NativeNotification: {
    notify(
      notify: boolean,
      title: string,
      text: string,
      icon: string,
      sound: string | null,
      data: string
    ): void;
    requestPermission(): void;
  };
}

document.addEventListener('notification-clicked', (e: Event) => {
  const conv = core.conversations.byKey(
    (<Event & { detail: { data: string } }>e).detail.data
  );
  if (conv !== undefined) conv.show();
});

export default class Notifications extends BaseNotifications {
  async notify(
    conversation: Conversation,
    title: string,
    body: string,
    icon: string,
    sound: string
  ): Promise<void> {
    if (!this.shouldNotify(conversation)) return;
    NativeNotification.notify(
      core.state.settings.notifications && this.isInBackground,
      title,
      body,
      icon,
      core.state.settings.playSound ? sound : null,
      conversation.key
    ); //tslint:disable-line:no-null-keyword
  }

  async requestPermission(): Promise<void> {
    return NativeNotification.requestPermission();
  }
}

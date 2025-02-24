// import path from 'path';

import core from './core';
import { Conversation, Notifications as Interface } from './interfaces';

const codecs: { [key: string]: string } = { mpeg: 'mp3', wav: 'wav', ogg: 'ogg' };

export default class Notifications implements Interface {
  isInBackground = false;

  protected shouldNotify(conversation: Conversation): boolean {
    return (
      core.characters.ownCharacter.status !== 'dnd' &&
      (this.isInBackground || conversation !== core.conversations.selectedConversation || core.state.settings.alwaysNotify)
    );
  }

  async notify(conversation: Conversation, title: string, body: string, icon: string, sound: string): Promise<void> {
    if (!this.shouldNotify(conversation)) return;
    this.playSound(sound);
    if (
      core.state.settings.notifications &&
      (<{ Notification?: object }>window).Notification !== undefined &&
      Notification.permission === 'granted'
    ) {
      const notification = new Notification(title, this.getOptions(conversation, body, icon));
      notification.onclick = () => {
        conversation.show();
        window.focus();
        if ('close' in notification) notification.close();
      };
      if ('close' in notification) window.setTimeout(() => notification.close(), 5000);
    }
  }

  getOptions(
    conversation: Conversation,
    body: string,
    icon: string
  ): NotificationOptions & { badge: string; silent: boolean; renotify: boolean } {
    //tslint:disable-next-line:no-require-imports no-unsafe-any
    const badge = <string>require(`./assets/ic_notification.png`).default;

    return {
      body,
      icon: core.state.settings.showAvatars ? icon : undefined,
      badge,
      silent: true,
      data: { key: conversation.key },
      tag: conversation.key,
      renotify: true
    };
  }

  playSound(sound: string): void {
    if (!core.state.settings.playSound) return;
    const audio = <HTMLAudioElement>document.getElementById(`soundplayer-${sound}`);
    audio.volume = 1;
    audio.muted = false;
    const promise = audio.play();
    if (promise instanceof Promise) promise.catch(e => console.error(e));
  }

  async initSounds(sounds: ReadonlyArray<string>): Promise<void> {
    const promises = [];
    for (const sound of sounds) {
      const id = `soundplayer-${sound}`;
      if (document.getElementById(id) !== null) continue;
      const audio = document.createElement('audio');
      audio.preload = 'auto';
      audio.id = id;
      for (const name in codecs) {
        const src = document.createElement('source');
        src.type = `audio/${name}`;
        src.src = <string>require(`./assets/${sound}.${codecs[name]}`).default; // tslint:disable-line: no-unsafe-any
        audio.appendChild(src);
      }
      document.body.appendChild(audio);
      audio.volume = 0;
      audio.muted = true;

      const promise = audio.play();
      if (promise instanceof Promise) promises.push(promise.catch(e => console.error(e)));
    }
    return <any>Promise.all(promises); //tslint:disable-line:no-any
  }

  async requestPermission(): Promise<void> {
    if ((<{ Notification?: object }>window).Notification !== undefined) await Notification.requestPermission();
  }
}

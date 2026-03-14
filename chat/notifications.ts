import core from './core';
import { Conversation, Notifications as Interface } from './interfaces';

const SUPPORTED_AUDIO_CODECS: { [key: string]: string } = {
  ogg: 'ogg',
  mpeg: 'mp3',
  wav: 'wav'
};

interface SoundTheme {
  name: string;
  version: string;
  description: string;
  author: string;
  characterName?: string;
  website?: string;
  source?: string;
  license?: string;
  sounds: {
    [key: string]: string;
  };
  formats: {
    preferred: string;
    fallback: string[];
  };
}

export default class Notifications implements Interface {
  isInBackground = false;
  hasInitialized = false;
  audioElements: HTMLAudioElement[] = [];

  protected shouldNotify(conversation: Conversation): boolean {
    return (
      core.characters.ownCharacter.status !== 'dnd' &&
      (this.isInBackground ||
        conversation !== core.conversations.selectedConversation ||
        core.state.settings.alwaysNotify)
    );
  }

  async notify(
    conversation: Conversation,
    title: string,
    body: string,
    icon: string,
    sound: string
  ): Promise<void> {
    if (!this.shouldNotify(conversation)) return;

    this.playSound(sound);

    if (
      core.state.settings.notifications &&
      window.Notification &&
      Notification.permission === 'granted'
    ) {
      const notification = new Notification(
        title,
        this.getOptions(conversation, body, icon)
      );
      notification.onclick = () => {
        conversation.show();
        window.focus();
        notification.close?.();
      };
      setTimeout(() => notification.close?.(), 5000);
    }
  }

  getOptions(conversation: Conversation, body: string, icon: string) {
    const badge = require(`./assets/ic_notification.png`).default;

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

    const audio = document.getElementById(
      `soundplayer-${sound}`
    ) as HTMLAudioElement;
    if (!audio) return;

    // Determine volume override (per-theme per-sound) if present
    const soundTheme = this.getSoundTheme();
    const volume = this.getSoundVolume(soundTheme, sound);

    audio.volume = volume;
    audio.muted = false;
    audio.play().catch(e => console.error(e));
  }

  async initSounds(sounds: ReadonlyArray<string>): Promise<void> {
    const soundTheme = this.getSoundTheme();
    const loaded = await this.loadSoundTheme(soundTheme);
    const theme = loaded?.theme ?? null;
    const themeDir = loaded?.themeDir ?? null;
    const preloadPromises: Promise<void>[] = [];

    if (this.hasInitialized) {
      //If this isn't the first time we've called this method, we want to clean up our sources.
      this.audioElements.forEach((element: HTMLAudioElement) => {
        element.remove();
      });
    }

    for (const sound of sounds) {
      const audio = this.createAudioElement(sound);
      if (!audio) continue;

      this.setupAudioSources(audio, theme, themeDir, sound);
      // Apply saved volume if available before preloading
      const volume = this.getSoundVolume(soundTheme, sound);
      audio.volume = volume;
      document.body.appendChild(audio);

      const playPromise = this.preloadAudio(audio);
      if (playPromise) preloadPromises.push(playPromise);
      this.audioElements.push(audio);
    }

    await Promise.all(preloadPromises);
    this.hasInitialized = true;
  }

  alert(message: string): void {
    alert(message);
  }

  private getSoundTheme(): string {
    return (
      (core.state as any).generalSettings?.soundTheme ||
      core.state.settings.soundTheme ||
      'default'
    );
  }

  private getUserSoundThemesPath(): string | null {
    try {
      const remote = (window as any).require?.('@electron/remote');
      const nodePath = (window as any).require?.('path');
      const userData = remote?.app?.getPath?.('userData');
      if (!userData || !nodePath) return null;
      return nodePath.join(userData, 'sound-themes');
    } catch {
      return null;
    }
  }

  private async loadSoundTheme(
    soundTheme: string
  ): Promise<{ theme: SoundTheme; themeDir: string } | null> {
    try {
      const fs = (window as any).require?.('fs');
      const path = (window as any).require?.('path');

      if (!fs || !path) return null;

      // Check user themes directory first
      const userThemesPath = this.getUserSoundThemesPath();
      if (userThemesPath) {
        const userThemeDir = path.join(userThemesPath, soundTheme);
        const userJsonPath = path.join(userThemeDir, 'sound.json');
        if (fs.existsSync(userJsonPath)) {
          const theme = JSON.parse(
            fs.readFileSync(userJsonPath, 'utf8')
          ) as SoundTheme;
          return { theme, themeDir: userThemeDir };
        }
      }

      // Fall back to built-in themes
      const builtinThemeDir = path.join(__dirname, 'sound-themes', soundTheme);
      const builtinJsonPath = path.join(builtinThemeDir, 'sound.json');
      if (fs.existsSync(builtinJsonPath)) {
        const theme = JSON.parse(
          fs.readFileSync(builtinJsonPath, 'utf8')
        ) as SoundTheme;
        return { theme, themeDir: builtinThemeDir };
      }

      return null;
    } catch (error) {
      console.warn(`Failed to load sound theme "${soundTheme}":`, error);
      return null;
    }
  }

  private createAudioElement(sound: string): HTMLAudioElement | null {
    const id = `soundplayer-${sound}`;
    if (document.getElementById(id)) return null;

    const audio = document.createElement('audio');
    audio.preload = 'auto';
    audio.id = id;
    return audio;
  }

  private setupAudioSources(
    audio: HTMLAudioElement,
    theme: SoundTheme | null,
    themeDir: string | null,
    sound: string
  ): void {
    // Try themed sound first
    if (theme?.sounds[sound] && themeDir) {
      const soundPath = theme.sounds[sound];
      const formats = [theme.formats.preferred, ...theme.formats.fallback];
      const path = (window as any).require?.('path');

      for (const format of formats) {
        if (SUPPORTED_AUDIO_CODECS[format]) {
          const src = document.createElement('source');
          src.type = `audio/${format}`;
          const ext = SUPPORTED_AUDIO_CODECS[format];
          if (path) {
            src.src = `file://${path.join(themeDir, `${soundPath}.${ext}`)}`;
          } else {
            src.src = `./sound-themes/${soundPath}.${ext}`;
          }
          audio.appendChild(src);
        }
      }
      return;
    }

    // Fallback to default sounds
    for (const [format, extension] of Object.entries(SUPPORTED_AUDIO_CODECS)) {
      try {
        const src = document.createElement('source');
        src.type = `audio/${format}`;
        src.src = require(`./assets/${sound}.${extension}`).default;
        audio.appendChild(src);
      } catch (error) {
        console.warn(
          `Failed to load fallback sound: ${sound}.${extension}`,
          error
        );
      }
    }
  }

  private preloadAudio(audio: HTMLAudioElement): Promise<void> | null {
    // Mute briefly to allow preload without audible output. volume is restored when played.
    audio.muted = true;

    const promise = audio.play();
    if (promise instanceof Promise) {
      return promise
        .catch(e => console.error('Audio preload failed:', e))
        .finally(() => {
          // Keep element muted until actual playback to avoid noise during preload
        });
    }
    return null;
  }

  private getSoundVolume(themeName: string, sound: string): number {
    try {
      const gen = (core.state as any).generalSettings;
      const perTheme =
        gen?.soundThemeSoundVolumes ||
        core.state.settings.soundThemeSoundVolumes;
      const themeVolumes = perTheme?.[themeName];
      if (themeVolumes && typeof themeVolumes[sound] === 'number') {
        const v = themeVolumes[sound];
        // Clamp between 0 and 1
        if (isFinite(v)) return Math.max(0, Math.min(1, v));
      }
    } catch (err) {
      // ignore
    }
    return 1;
  }

  async requestPermission(): Promise<void> {
    if (window.Notification) {
      await Notification.requestPermission();
    }
  }
}

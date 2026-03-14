import * as fs from 'fs';
import * as path from 'path';

export interface SoundTheme {
  name: string;
  version: string;
  description: string;
  author: string;
  characterName?: string;
  website?: string;
  source?: string;
  sounds: {
    [key: string]: string;
  };
  formats: {
    preferred: string;
    fallback: string[];
  };
}

export class SoundThemeManager {
  private static themesPath = path.join(__dirname, '../chat/sound-themes');

  static getAvailableThemes(): string[] {
    try {
      const themes = fs
        .readdirSync(this.themesPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(name => {
          const soundJsonPath = path.join(this.themesPath, name, 'sound.json');
          return fs.existsSync(soundJsonPath);
        });
      return themes;
    } catch (error) {
      console.error('Error reading sound themes:', error);
      return ['default'];
    }
  }

  static loadTheme(themeName: string): SoundTheme | null {
    try {
      const themePath = path.join(this.themesPath, themeName, 'sound.json');
      const themeData = fs.readFileSync(themePath, 'utf8');
      return JSON.parse(themeData) as SoundTheme;
    } catch (error) {
      console.error(`Error loading sound theme "${themeName}":`, error);
      return null;
    }
  }

  static getSoundPath(themeName: string, soundName: string): string | null {
    const theme = this.loadTheme(themeName);
    if (!theme || !theme.sounds[soundName]) {
      return null;
    }

    const basePath = path.join(
      this.themesPath,
      themeName,
      theme.sounds[soundName]
    );

    // Try preferred format first
    const preferredPath = `${basePath}.${theme.formats.preferred}`;
    if (fs.existsSync(preferredPath)) {
      return preferredPath;
    }

    // Try fallback formats
    for (const format of theme.formats.fallback) {
      const fallbackPath = `${basePath}.${format}`;
      if (fs.existsSync(fallbackPath)) {
        return fallbackPath;
      }
    }

    return null;
  }
}

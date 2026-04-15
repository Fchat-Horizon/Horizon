/**
 * @license MPL-2.0
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * @copyright 2024-2026 Sylvia Roselie & Respective Horizon Contributors
 * @version 1.0
 * @see {@link https://github.com/Fchat-Horizon/Horizon|GitHub repo}
 */

import Vue, { WatchHandler } from 'vue';
import { CacheManager } from '../learn/cache-manager';
import { Channels, Characters } from '../fchat';
import BBCodeParser from './bbcode';
import { Settings as SettingsImpl } from './common';
import Conversations from './conversations';
import {
  Channel,
  Character,
  Connection,
  Conversation,
  Logs,
  Notifications,
  PartialSettings,
  Settings,
  State as StateInterface
} from './interfaces';
import { AdCoordinatorGuest } from './ads/ad-coordinator-guest';
import { AdCenter } from './ads/ad-center';
import { GeneralSettings } from '../electron/common';
import { SiteSession } from '../site/site-session';
import _ from 'lodash';
import { preloadTeamData } from './profile_api';

function createBBCodeParser(): BBCodeParser {
  const parser = new BBCodeParser();
  for (const tag of state.settings.disallowedTags) parser.removeTag(tag);
  return parser;
}

/**
 * Creates a Proxy that merges global settings with character overrides.
 * Character settings take precedence; undefined values fall back to global.
 * @param global The global settings object (from '_' character).
 * @param character The character-specific overrides (partial settings).
 * @returns A Proxy object that provides merged access to settings.
 */
function createMergedSettingsProxy(
  global: Settings,
  character: PartialSettings
): Settings {
  return new Proxy(global, {
    get(target, prop: keyof Settings) {
      if (prop in character && character[prop] !== undefined) {
        return character[prop];
      }
      return target[prop];
    },
    set(_target, prop: keyof Settings, value) {
      // Setting a property updates the character overrides
      (character as any)[prop] = value;
      return true;
    }
  }) as Settings;
}

class State implements StateInterface {
  generalSettings?: GeneralSettings | undefined;
  _settings: Settings | undefined = undefined;
  _globalSettings: Settings | undefined = undefined;
  _characterSettings: PartialSettings = {};
  needsSettingsMigration: boolean = false;
  hiddenUsers: string[] = [];
  favoriteEIcons: Record<string, boolean> = {};
  recentEIcons: string[] = [];

  get settings(): Settings {
    if (this._settings === undefined) throw new Error('Settings load failed.');
    return this._settings;
  }

  set settings(value: Settings) {
    //For backward compatibility, setting settings updates the merged proxy and saves character settings
    this._settings = value;
    //tslint:disable-next-line:no-floating-promises
    if (data.settingsStore !== undefined)
      data.settingsStore.set('settings', this._characterSettings);
    //Why do we need to this again?
    //It was in the original version, but I'm afraid of removing it in any of the copy-paste setters.
    data.bbCodeParser = createBBCodeParser();
  }

  get globalSettings(): Settings {
    if (this._globalSettings === undefined)
      throw new Error('Global settings load failed.');
    return this._globalSettings;
  }

  set globalSettings(value: Settings) {
    this._globalSettings = value;

    this._settings = createMergedSettingsProxy(value, this._characterSettings);
    //tslint:disable-next-line:no-floating-promises
    if (data.settingsStore !== undefined)
      data.settingsStore.set('settings', value, '_');
    data.bbCodeParser = createBBCodeParser();
  }

  get characterSettings(): PartialSettings {
    return this._characterSettings;
  }

  set characterSettings(value: PartialSettings) {
    this._characterSettings = value;

    if (this._globalSettings !== undefined) {
      this._settings = createMergedSettingsProxy(this._globalSettings, value);
    }
    //tslint:disable-next-line:no-floating-promises
    if (data.settingsStore !== undefined)
      data.settingsStore.set('settings', value);
    data.bbCodeParser = createBBCodeParser();
  }
}

interface VueState {
  readonly channels: Channel.State;
  readonly characters: Character.State;
  readonly conversations: Conversation.State;
  readonly state: StateInterface;
}

const state = new State();

const vue = <Vue & VueState>new Vue({
  data: {
    channels: undefined,
    characters: undefined,
    conversations: undefined,
    state
  }
});

const data = {
  connection: <Connection | undefined>undefined,
  logs: <Logs | undefined>undefined,
  settingsStore: <Settings.Store | undefined>undefined,
  state: vue.state,
  bbCodeParser: new BBCodeParser(),
  conversations: <Conversation.State | undefined>undefined,
  channels: <Channel.State | undefined>undefined,
  characters: <Character.State | undefined>undefined,
  notifications: <Notifications | undefined>undefined,
  cache: <CacheManager | undefined>undefined,
  adCoordinator: <AdCoordinatorGuest | undefined>undefined,
  adCenter: <AdCenter | undefined>undefined,
  siteSession: <SiteSession | undefined>undefined,

  register<K extends 'characters' | 'conversations' | 'channels'>(
    module: K,
    subState: VueState[K]
  ): void {
    Vue.set(vue, module, subState);
    (<VueState[K]>data[module]) = subState;
  },
  watch<T>(
    getter: (this: VueState) => T,
    callback: (n: any, o: any) => void
  ): void {
    vue.$watch(getter, callback);
  },
  async reloadSettings(): Promise<void> {
    // Load global settings from '_' character
    const globalRaw = await core.settingsStore.get('settings', '_');

    const needsMigration = globalRaw === undefined;

    const globalSettings = _.mergeWith(
      new SettingsImpl(),
      globalRaw,
      (oVal, sVal) => {
        if (_.isArray(oVal) && _.isArray(sVal)) {
          return sVal;
        }
      }
    );
    state._globalSettings = globalSettings;

    // Load character-specific overrides
    const characterRaw = await core.settingsStore.get('settings');
    const characterSettings: PartialSettings =
      characterRaw !== undefined ? (characterRaw as PartialSettings) : {};
    state._characterSettings = characterSettings;

    // Create merged settings proxy
    state._settings = createMergedSettingsProxy(
      globalSettings,
      characterSettings
    );

    const hiddenUsers = await core.settingsStore.get('hiddenUsers');
    state.hiddenUsers = hiddenUsers !== undefined ? hiddenUsers : [];

    const favoriteEIcons = await core.settingsStore.get('favoriteEIcons');
    state.favoriteEIcons = favoriteEIcons !== undefined ? favoriteEIcons : {};

    const recentEIcons = await core.settingsStore.get('recentEIcons');
    state.recentEIcons = recentEIcons !== undefined ? recentEIcons : [];

    //If migration needed, check for existing character settings to migrate
    if (needsMigration && characterRaw !== undefined) {
      //Existing character has settings but no global exists...
      //set flag for UI to prompt user for migration choice
      state.needsSettingsMigration = true;
    } else if (needsMigration) {
      //No existing settings at all, just use defaults as global
      await core.settingsStore.set('settings', globalSettings, '_');
      state.needsSettingsMigration = false;
    } else {
      state.needsSettingsMigration = false;
    }
  },

  /**
   * Migrate character settings to global settings.
   * @param useCurrentAsGlobal If true, current character settings become global defaults.
   *                          If false, start fresh with default settings.
   */
  async migrateToGlobalSettings(useCurrentAsGlobal: boolean): Promise<void> {
    if (useCurrentAsGlobal) {
      // Use current character's settings as the global settings
      const currentSettings = state._settings!;
      await core.settingsStore.set('settings', currentSettings, '_');
      state._globalSettings = currentSettings;
      // Clear character overrides since they're now global
      state._characterSettings = {};
      await core.settingsStore.set('settings', {});
    } else {
      const defaults = new SettingsImpl();
      await core.settingsStore.set('settings', defaults, '_');
      state._globalSettings = defaults;
      // Keep current character settings as overrides (they're already loaded)
    }
    // Mark migration as complete
    state.needsSettingsMigration = false;
    // Recreate merged proxy
    state._settings = createMergedSettingsProxy(
      state._globalSettings!,
      state._characterSettings
    );
  }
};

export function init(
  this: any,
  connection: Connection,
  settings: GeneralSettings,
  logsClass: new () => Logs,
  settingsClass: new () => Settings.Store,
  notificationsClass: new () => Notifications
): void {
  data.connection = connection;
  data.logs = new logsClass();
  data.settingsStore = new settingsClass();
  data.notifications = new notificationsClass();
  data.cache = new CacheManager();
  data.adCoordinator = new AdCoordinatorGuest();
  data.adCenter = new AdCenter();
  data.siteSession = new SiteSession();

  (data.state as any).generalSettings = settings;

  data.register('characters', Characters(connection));
  data.register('channels', Channels(connection, core.characters));
  data.register('conversations', Conversations());

  data.watch(
    () => state.hiddenUsers,
    async newValue => {
      if (data.settingsStore !== undefined)
        await data.settingsStore.set('hiddenUsers', newValue);
    }
  );

  connection.onEvent('connecting', async () => {
    await data.reloadSettings();
    data.bbCodeParser = createBBCodeParser();
    preloadTeamData().catch(() => {});
  });
}

export interface Core {
  readonly connection: Connection;
  readonly logs: Logs;
  readonly state: StateInterface;
  readonly settingsStore: Settings.Store;
  readonly conversations: Conversation.State;
  readonly characters: Character.State;
  readonly channels: Channel.State;
  readonly bbCodeParser: BBCodeParser;
  readonly notifications: Notifications;
  readonly cache: CacheManager;
  readonly adCoordinator: AdCoordinatorGuest;
  readonly adCenter: AdCenter;
  readonly siteSession: SiteSession;

  watch<T>(getter: (this: VueState) => T, callback: WatchHandler<T>): void;
  migrateToGlobalSettings(useCurrentAsGlobal: boolean): Promise<void>;
}

const core = <Core>(<any>data); /*tslint:disable-line:no-any*/ //hack

export default core;

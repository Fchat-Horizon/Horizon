<template>
  <div
    style="display: flex; flex-direction: column; height: 100%"
    :class="getThemeClass()"
    @auxclick.prevent
  >
    <div v-html="styling"></div>
    <div
      style="display: flex; align-items: stretch; border-bottom-width: 1px"
      class="border-bottom"
      id="window-tabs"
    >
      <h4 style="padding: 2px 0">F-Chat</h4>
      <div
        class="btn"
        :class="'btn-' + (hasUpdate ? 'warning' : 'light')"
        @click="openMenu"
        id="settings"
      >
        <i class="fa fa-cog"></i>
      </div>
      <div
        class="btn btn-outline-success"
        :class="'btn-snowflake-' + (hasUpdate ? 'ready' : 'unavailable')"
        id="update-darwin"
        @click="openUpdatePage"
      >
        <i class="fa fa-arrow-down"></i>
      </div>
      <ul
        class="nav nav-tabs"
        style="border-bottom: 0; margin-bottom: -1px; margin-top: 1px"
        ref="tabs"
      >
        <li
          v-for="(tab, index) in tabs"
          :key="'tab-' + index"
          class="nav-item"
          @click.middle="remove(tab)"
        >
          <a
            href="#"
            @click.prevent="show(tab)"
            class="nav-link tab"
            :class="{
              active: tab === activeTab,
              hasNew: tab.hasNew && tab !== activeTab
            }"
          >
            <img v-if="tab.user || tab.avatarUrl" :src="getAvatarImage(tab)" />
            <span class="d-sm-inline d-none">{{
              tab.user || l('window.newTab')
            }}</span>
            <a
              href="#"
              :aria-label="l('action.close')"
              style="
                margin-left: 10px;
                padding: 0;
                color: inherit;
                text-decoration: none;
              "
              @click.stop="remove(tab)"
              ><i class="fa fa-times"></i>
            </a>
          </a>
        </li>
        <li
          v-show="canOpenTab && hasCompletedUpgrades"
          class="addTab nav-item"
          id="addTab"
        >
          <a href="#" @click.prevent="addTab()" class="nav-link"
            ><i class="fa fa-plus"></i
          ></a>
        </li>
      </ul>
      <div
        style="
          flex: 1;
          display: flex;
          justify-content: flex-end;
          -webkit-app-region: drag;
        "
        class="btn-group"
        id="windowButtons"
      >
        <i
          class="far fa-window-minimize btn btn-light"
          @click.stop="minimize()"
        ></i>
        <i
          class="far btn btn-light"
          :class="'fa-window-' + (isMaximized ? 'restore' : 'maximize')"
          @click="maximize()"
        ></i>
        <span class="btn btn-light" @click.stop="close()">
          <i class="fa fa-times fa-lg"></i>
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import Sortable from 'sortablejs';
  import _ from 'lodash';

  import { Component, Hook } from '@f-list/vue-ts';
  import * as electron from 'electron';
  import * as remote from '@electron/remote';

  import * as fs from 'fs';
  import * as path from 'path';
  import * as url from 'url';
  import Vue from 'vue';
  import l from '../chat/localize';
  import { GeneralSettings } from './common';
  import { getSafeLanguages, updateSupportedLanguages } from './language';
  import log from 'electron-log';

  const browserWindow = remote.getCurrentWindow();

  // void browserWindow.webContents.setVisualZoomLevelLimits(1, 5);

  function getWindowBounds(): Electron.Rectangle {
    const bounds = browserWindow.getContentBounds();
    const height = document.body.offsetHeight;
    return {
      x: 0,
      y: height,
      width: bounds.width,
      height: bounds.height - height
    };
  }

  function destroyTab(tab: Tab): void {
    if (tab.user !== undefined)
      electron.ipcRenderer.send('disconnect', tab.user);
    tab.tray.destroy();

    tab.view.webContents.stop();
    tab.view.webContents.stopPainting();

    try {
      if ((tab.view.webContents as any).destroy) {
        (tab.view.webContents as any).destroy();
      }
    } catch (err) {
      console.log(err);
    }

    try {
      if ((tab.view.webContents as any).close) {
        (tab.view.webContents as any).close();
      }
    } catch (err) {
      console.log(err);
    }

    try {
      if ((tab.view as any).destroy) {
        (tab.view as any).destroy();
      }
    } catch (err) {
      console.log(err);
    }

    try {
      if ((tab.view as any).close) {
        (tab.view as any).close();
      }
    } catch (err) {
      console.log(err);
    }

    // tab.view.destroy();
    electron.ipcRenderer.send('tab-closed');
  }

  interface Tab {
    user: string | undefined;
    view: Electron.BrowserView;
    hasNew: boolean;
    tray: Electron.Tray;
    avatarUrl?: string;
  }

  // console.log(require('./build/tray.png').default);

  //tslint:disable-next-line:no-require-imports no-unsafe-any
  const trayIcon = path.join(
    __dirname,
    <string>require('./build/tray.png').default
  );
  //path.join(__dirname, <string>require('./build/tray.png').default);

  @Component
  export default class Window extends Vue {
    settings!: GeneralSettings;
    tabs: Tab[] = [];
    activeTab: Tab | undefined;
    tabMap: { [key: number]: Tab } = {};
    isMaximized = false;
    canOpenTab = true;
    l = l;
    hasUpdate = false;
    platform = process.platform;
    lockTab = false;
    hasCompletedUpgrades = false;

    @Hook('mounted')
    async mounted(): Promise<void> {
      log.debug('init.window.mounting');
      // top bar devtools
      // browserWindow.webContents.openDevTools({ mode: 'detach' });

      if (remote.process.argv.includes('--devtools')) {
        browserWindow.webContents.openDevTools({ mode: 'detach' });
      }

      updateSupportedLanguages(
        browserWindow.webContents.session.availableSpellCheckerLanguages
      );

      log.debug('init.window.languages.supported');
      // console.log('MOUNT DICTIONARIES', getSafeLanguages(this.settings.spellcheckLang), this.settings.spellcheckLang);

      browserWindow.webContents.session.setSpellCheckerLanguages(
        getSafeLanguages(this.settings.spellcheckLang)
      );

      log.debug('init.window.languages');

      electron.ipcRenderer.on(
        'settings',
        (_e: Electron.IpcRendererEvent, settings: GeneralSettings) => {
          log.debug('settings.update.window');

          this.settings = settings;

          log.transports.file.level = settings.risingSystemLogLevel;
          log.transports.console.level = settings.risingSystemLogLevel;
        }
      );

      electron.ipcRenderer.on('rising-upgrade-complete', () => {
        // console.log('RISING COMPLETE RECV');
        this.hasCompletedUpgrades = true;
      });
      electron.ipcRenderer.on(
        'allow-new-tabs',
        (_e: Electron.IpcRendererEvent, allow: boolean) =>
          (this.canOpenTab = allow)
      );
      electron.ipcRenderer.on('open-tab', () => this.addTab());
      electron.ipcRenderer.on(
        'update-available',
        (_e: Electron.IpcRendererEvent, available: boolean) =>
          (this.hasUpdate = available)
      );
      electron.ipcRenderer.on('fix-logs', () =>
        this.activeTab!.view.webContents.send('fix-logs')
      );
      electron.ipcRenderer.on('quit', () => this.destroyAllTabs());
      electron.ipcRenderer.on('reopen-profile', () =>
        this.activeTab!.view.webContents.send('reopen-profile')
      );
      electron.ipcRenderer.on(
        'update-dictionaries',
        (_e: Electron.IpcRendererEvent, langs: string[]) => {
          // console.log('UPDATE DICTIONARIES', langs);

          browserWindow.webContents.session.setSpellCheckerLanguages(langs);

          for (const t of this.tabs) {
            t.view.webContents.session.setSpellCheckerLanguages(langs);
          }
        }
      );

      // electron.ipcRenderer.on('update-zoom', (_e: Event, zoomLevel: number) => {
      //   // log.info('WINDOWVUE ZOOM UPDATE', zoomLevel);
      //   // browserWindow.webContents.setZoomLevel(zoomLevel);
      // });

      electron.ipcRenderer.on(
        'connect',
        (_e: Electron.IpcRendererEvent, id: number, name: string) => {
          const tab = this.tabMap[id];
          tab.user = name;
          tab.tray.setToolTip(`${l('title')} - ${tab.user}`);
          const menu = this.createTrayMenu(tab);
          menu.unshift(
            { label: tab.user, enabled: false },
            { type: 'separator' }
          );
          tab.tray.setContextMenu(remote.Menu.buildFromTemplate(menu));
        }
      );
      electron.ipcRenderer.on(
        'update-avatar-url',
        (_e: Electron.IpcRendererEvent, characterName: string, url: string) => {
          const tab = this.tabs.find(tab => tab.user === characterName);

          if (!tab) {
            return;
          }

          Vue.set(tab, 'avatarUrl', url);
          // tab.avatarUrl = url;
        }
      );
      electron.ipcRenderer.on(
        'disconnect',
        (_e: Electron.IpcRendererEvent, id: number) => {
          const tab = this.tabMap[id];
          if (tab.hasNew) {
            tab.hasNew = false;
            electron.ipcRenderer.send(
              'has-new',
              this.tabs.reduce((cur, t) => cur || t.hasNew, false)
            );
          }
          tab.user = undefined;
          tab.tray.setToolTip(l('title'));
          tab.tray.setContextMenu(
            remote.Menu.buildFromTemplate(this.createTrayMenu(tab))
          );
        }
      );
      electron.ipcRenderer.on(
        'has-new',
        (_e: Electron.IpcRendererEvent, id: number, hasNew: boolean) => {
          const tab = this.tabMap[id];
          tab.hasNew = hasNew;
          electron.ipcRenderer.send(
            'has-new',
            this.tabs.reduce((cur, t) => cur || t.hasNew, false)
          );
        }
      );
      browserWindow.on('maximize', () => (this.isMaximized = true));
      browserWindow.on('unmaximize', () => (this.isMaximized = false));
      electron.ipcRenderer.on('switch-tab', (_e: Electron.IpcRendererEvent) => {
        const index = this.tabs.indexOf(this.activeTab!);
        this.show(this.tabs[index + 1 === this.tabs.length ? 0 : index + 1]);
      });
      electron.ipcRenderer.on(
        'previous-tab',
        (_e: Electron.IpcRendererEvent) => {
          const index = this.tabs.indexOf(this.activeTab!);
          this.show(
            this.tabs[index - 1 < 0 ? this.tabs.length - 1 : index - 1]
          );
        }
      );
      electron.ipcRenderer.on(
        'show-tab',
        (_e: Electron.IpcRendererEvent, id: number) => {
          this.show(this.tabMap[id]);
        }
      );
      document.addEventListener('click', () =>
        this.activeTab!.view.webContents.focus()
      );
      window.addEventListener('focus', () =>
        this.activeTab!.view.webContents.focus()
      );

      log.debug('init.window.listeners');

      await this.addTab();

      log.debug('init.window.tab');

      // console.log('SORTABLE', Sortable);

      Sortable.create(<HTMLElement>this.$refs['tabs'], {
        animation: 50,
        onEnd: e => {
          // log.debug('ONEND', e);
          if (e.oldIndex === e.newIndex) return;

          // log.debug('PRE', this.tabs);
          //
          // const tab = this.tabs.splice(e.oldIndex!, 1)[0];
          // this.tabs.splice(e.newIndex!, 0, tab);
          //
          // log.debug('POST', this.tabs);
        },
        onMove: (e: { related: HTMLElement }) => e.related.id !== 'addTab',
        filter: '.addTab'
      });

      window.onbeforeunload = () => {
        const isConnected = this.tabs.reduce(
          (cur, tab) => cur || tab.user !== undefined,
          false
        );
        if (process.env.NODE_ENV !== 'production' || !isConnected) {
          this.destroyAllTabs();
          return;
        }
        if (!this.settings.closeToTray)
          return setImmediate(() => {
            if (confirm(l('chat.confirmLeave'))) {
              this.destroyAllTabs();
              browserWindow.close();
            }
          });
        browserWindow.hide();
        return false;
      };
      this.isMaximized = browserWindow.isMaximized();

      log.debug('init.window.mounted');
    }

    getAvatarImage(tab: Tab) {
      if (tab.avatarUrl) {
        return tab.avatarUrl;
      }

      return (
        'https://static.f-list.net/images/avatar/' +
        (tab.user || '').toLowerCase() +
        '.png'
      );
    }

    destroyAllTabs(): void {
      browserWindow.setBrowserView(null!); //tslint:disable-line:no-null-keyword
      this.tabs.forEach(destroyTab);
      this.tabs = [];
    }

    get styling(): string {
      try {
        return `<style>${fs.readFileSync(path.join(__dirname, `themes/${this.settings.theme}.css`), 'utf8').toString()}</style>`;
      } catch (e) {
        if (
          (<Error & { code: string }>e).code === 'ENOENT' &&
          this.settings.theme !== 'default'
        ) {
          this.settings.theme = 'default';
          return this.styling;
        }
        throw e;
      }
    }

    trayClicked(tab: Tab): void {
      browserWindow.show();
      if (this.isMaximized) browserWindow.maximize();
      this.show(tab);
    }

    createTrayMenu(tab: Tab): Electron.MenuItemConstructorOptions[] {
      return [
        { label: l('action.open'), click: () => this.trayClicked(tab) },
        { label: l('action.quit'), click: () => this.remove(tab, false) }
      ];
    }

    async addTab(): Promise<void> {
      log.debug('init.window.tab.add.start');

      if (this.lockTab) return;
      const tray = new remote.Tray(trayIcon);
      tray.setToolTip(l('title'));
      tray.on('click', _e => this.trayClicked(tab));

      log.debug('init.window.tab.add.tray');

      const view = new remote.BrowserView({
        webPreferences: {
          webviewTag: true,
          nodeIntegration: true,
          nodeIntegrationInWorker: true,
          spellcheck: true,
          contextIsolation: false,
          partition: 'persist:fchat'
        }
      });

      log.debug('init.window.tab.add.view');

      const remoteMain = require('@electron/remote/main');
      remoteMain.enable(view.webContents);

      log.debug('init.window.tab.add.remote');

      // tab devtools
      // view.webContents.openDevTools();

      if (remote.process.argv.includes('--devtools')) {
        view.webContents.openDevTools({ mode: 'detach' });
      }

      log.debug('init.window.tab.add.devtools');

      // console.log('ADD TAB LANGUAGES', getSafeLanguages(this.settings.spellcheckLang), this.settings.spellcheckLang);
      view.webContents.session.setSpellCheckerLanguages(
        getSafeLanguages(this.settings.spellcheckLang)
      );

      log.debug('init.window.tab.add.spellcheck');

      view.setAutoResize({ width: true, height: true });
      electron.ipcRenderer.send('tab-added', view.webContents.id);

      log.debug('init.window.tab.add.notify');

      const tab = { active: false, view, user: undefined, hasNew: false, tray };
      tray.setContextMenu(
        remote.Menu.buildFromTemplate(this.createTrayMenu(tab))
      );
      this.tabs.push(tab);
      this.tabMap[view.webContents.id] = tab;

      log.debug('init.window.tab.add.context');

      this.show(tab);
      this.lockTab = true;

      log.debug('init.window.tab.add.show');

      const indexUrl = url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true,
        query: {
          settings: JSON.stringify(this.settings),
          hasCompletedUpgrades: JSON.stringify(this.hasCompletedUpgrades)
        }
      });

      log.debug('init.window.tab.add.load-index.start', indexUrl);

      await view.webContents.loadURL(indexUrl);

      log.debug('init.window.tab.add.load-index.complete', indexUrl);

      tab.view.setBounds(getWindowBounds());
      this.lockTab = false;

      log.debug('init.window.tab.add.done');
    }

    show(tab: Tab): void {
      if (this.lockTab) return;
      this.activeTab = tab;
      browserWindow.setBrowserView(tab.view);
      tab.view.setBounds(getWindowBounds());
      tab.view.webContents.focus();

      // tab.view.webContents.send('active-tab', { webContentsId: tab.view.webContents.id });
      _.each(this.tabs, t =>
        t.view.webContents.send(t === tab ? 'active-tab' : 'inactive-tab')
      );

      // electron.ipcRenderer.send('active-tab', { webContentsId: tab.view.webContents.id });
    }

    remove(tab: Tab, shouldConfirm: boolean = true): void {
      if (
        this.lockTab ||
        (shouldConfirm &&
          tab.user !== undefined &&
          !confirm(l('chat.confirmLeave')))
      )
        return;
      this.tabs.splice(this.tabs.indexOf(tab), 1);
      electron.ipcRenderer.send(
        'has-new',
        this.tabs.reduce((cur, t) => cur || t.hasNew, false)
      );
      delete this.tabMap[tab.view.webContents.id];
      if (this.tabs.length === 0) {
        browserWindow.setBrowserView(null!); //tslint:disable-line:no-null-keyword
        if (process.env.NODE_ENV === 'production') browserWindow.close();
      } else if (this.activeTab === tab) this.show(this.tabs[0]);
      destroyTab(tab);
    }

    minimize(): void {
      browserWindow.minimize();
    }

    maximize(): void {
      if (browserWindow.isMaximized()) browserWindow.unmaximize();
      else browserWindow.maximize();
    }

    close(): void {
      browserWindow.close();
    }

    openMenu(): void {
      remote.Menu.getApplicationMenu()!.popup({});
    }

    openUpdatePage(): void {
      electron.ipcRenderer.send(
        'open-url-externally',
        'https://github.com/Fchat-Horizon/Horizon/releases'
      );
    }

    getThemeClass() {
      // console.log('getThemeClassWindow', this.settings?.risingDisableWindowsHighContrast);

      try {
        // Hack!
        if (process.platform === 'win32') {
          if (this.settings?.risingDisableWindowsHighContrast) {
            document
              .querySelector('html')
              ?.classList.add('disableWindowsHighContrast');
          } else {
            document
              .querySelector('html')
              ?.classList.remove('disableWindowsHighContrast');
          }
        }

        return {
          ['platform-' + this.platform]: true,
          disableWindowsHighContrast:
            this.settings?.risingDisableWindowsHighContrast || false
        };
      } catch (err) {
        return {
          ['platform-' + this.platform]: true
        };
      }
    }
  }
</script>

<style lang="scss">
  #window-tabs {
    user-select: none;
    .btn {
      border: 0;
      border-radius: 0;
      padding: 0 18px;
      display: flex;
      align-items: center;
      line-height: 1;
      -webkit-app-region: no-drag;
      flex-grow: 0;
    }

    .btn-default {
      background: transparent;
    }

    li {
      height: 100%;
      a {
        display: flex;
        padding: 2px 10px;
        height: 100%;
        align-items: center;
        &:first-child {
          border-top-left-radius: 0;
        }
      }

      img {
        height: 28px;
        width: 28px;
        margin: -5px 3px -5px -5px;
      }
    }

    h4 {
      margin: 0 10px;
      user-select: none;
      cursor: default;
      align-self: center;
      -webkit-app-region: drag;
    }

    .fa {
      line-height: inherit;
    }
  }

  #windowButtons .btn {
    border-top: 0;
    font-size: 14px;
  }

  #window-tabs .btn-snowflake-ready,
  #window-tabs .btn-snowflake-unavailable {
    display: none;
  }

  .platform-darwin {
    #windowButtons .btn,
    #settings {
      display: none;
    }

    #window-tabs .btn-snowflake-ready {
      display: flex;
    }

    #window-tabs {
      h4 {
        margin: 0 15px 0 77px;
      }

      .btn,
      li a {
        padding-top: 6px;
        padding-bottom: 6px;
      }
    }
  }

  .disableWindowsHighContrast,
  .disableWindowsHighContrast * {
    forced-color-adjust: none;
  }
</style>

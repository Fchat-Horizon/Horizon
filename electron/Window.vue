<template>
  <div
    style="display: flex; flex-direction: column; height: 100%"
    :class="getThemeClass()"
    @auxclick.prevent
  >
    <div v-html="styling()"></div>
    <div
      style="display: flex; align-items: stretch; border-bottom-width: 1px"
      class="border-bottom"
      id="window-tabs"
    >
      <h4 style="padding: 2px 0">{{ l('title') }}</h4>
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
        ref="tabsElement"
      >
        <li
          v-for="(tab, index) in tabs"
          :key="'tab-' + index"
          class="nav-item"
          :data-id="index"
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
            <span
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
            </span>
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
  import {
    defineComponent,
    ref,
    reactive,
    useTemplateRef,
    onMounted,
    toRaw
  } from 'vue';
  import * as electron from 'electron';
  import * as remote from '@electron/remote';
  import * as fs from 'fs';
  import * as path from 'path';
  import * as url from 'url';
  import l from '../chat/localize';
  import { GeneralSettings } from './common';
  import { getSafeLanguages, updateSupportedLanguages } from './language';
  import log from 'electron-log';

  const browserWindow = remote.getCurrentWindow();

  export default defineComponent({
    name: 'Window',
    props: {
      settings: {
        type: Object as () => GeneralSettings,
        required: true
      }
    },
    setup(props) {
      const settings = ref(props.settings);
      let tabs = ref<Tab[]>([]);
      const activeTab = ref<any>();
      const tabMap = reactive<{ [key: number]: Tab }>({});
      const isMaximized = ref(false);
      const canOpenTab = ref(true);
      const hasUpdate = ref(false);
      const platform = process.platform;
      let lockTab = false;
      const hasCompletedUpgrades = ref(false);
      const tabsElement = useTemplateRef('tabsElement');

      function minimize() {
        browserWindow.minimize();
      }
      function maximize() {
        if (browserWindow.isMaximized()) browserWindow.unmaximize();
        else browserWindow.maximize();
      }
      function close() {
        browserWindow.close();
      }
      function openMenu() {
        remote.Menu.getApplicationMenu()!.popup({});
      }
      function openUpdatePage() {
        electron.ipcRenderer.send(
          'open-url-externally',
          'https://github.com/Fchat-Horizon/Horizon/releases'
        );
      }

      async function addTab(): Promise<void> {
        log.debug('init.window.tab.add.start');

        if (lockTab) return;

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
          getSafeLanguages(settings.value.spellcheckLang)
        );

        log.debug('init.window.tab.add.spellcheck');

        view.setAutoResize({ width: true, height: true });
        electron.ipcRenderer.send('tab-added', view.webContents.id);

        log.debug('init.window.tab.add.notify');

        let tab: Tab = {
          view: view,
          user: undefined,
          hasNew: false
        };

        log.debug('init.window.tab.add.created');
        tabs.value.push(tab);
        tabMap[view.webContents.id] = tab;

        log.debug('init.window.tab.add.context');

        show(tab);
        lockTab = true;

        log.debug('init.window.tab.add.show');

        const indexUrl = url.format({
          pathname: path.join(__dirname, 'index.html'),
          protocol: 'file:',
          slashes: true,
          query: {
            settings: JSON.stringify(settings.value),
            hasCompletedUpgrades: JSON.stringify(hasCompletedUpgrades.value)
          }
        });

        log.debug('init.window.tab.add.load-index.start', indexUrl);

        await view.webContents.loadURL(indexUrl);

        log.debug('init.window.tab.add.load-index.complete', indexUrl);

        tab.view.setBounds(getWindowBounds());
        lockTab = false;

        log.debug('init.window.tab.add.done');
      }
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

      function destroyAllTabs(): void {
        browserWindow.setBrowserView(null!); //tslint:disable-line:no-null-keyword
        tabs.value.forEach(destroyTab);
        tabs.value = [];
      }

      interface Tab {
        user: string | undefined;
        view: Electron.BrowserView;
        hasNew: boolean;
        avatarUrl?: string;
      }

      function show(tab: Tab): void {
        if (lockTab) return;

        // Ensure we are working with the raw object, not a reactive one.
        // Electron does not play nice with reactive objects like that.
        let rawTab = toRaw(tab);

        activeTab.value = rawTab;
        browserWindow.setBrowserView(rawTab.view);
        tab.view.setBounds(getWindowBounds());
        tab.view.webContents.focus();

        // tab.view.webContents.send('active-tab', { webContentsId: tab.view.webContents.id });
        _.each(tabs.value, t =>
          t.view.webContents.send(t === tab ? 'active-tab' : 'inactive-tab')
        );

        // electron.ipcRenderer.send('active-tab', { webContentsId: tab.view.webContents.id });
      }

      function remove(tab: Tab, shouldConfirm: boolean = true): void {
        //tab = toRaw(tab); // Ensure we are working with the raw object, not a reactive one.
        log.debug('window.tab.remove');
        if (
          lockTab ||
          (shouldConfirm &&
            tab.user !== undefined &&
            !confirm(l('chat.confirmLeave')))
        )
          return;
        tabs.value.splice(tabs.value.indexOf(tab), 1);
        electron.ipcRenderer.send(
          'has-new',
          tabs.value.reduce((cur, t) => cur || t.hasNew, false)
        );
        delete tabMap[tab.view.webContents.id];
        if (tabs.value.length === 0) {
          browserWindow.setBrowserView(null!); //tslint:disable-line:no-null-keyword
          if (process.env.NODE_ENV === 'production') browserWindow.close();
        } else if (activeTab.value === tab) show(tabs.value[0]);
        destroyTab(tab);
      }

      function getThemeClass() {
        try {
          if (process.platform === 'win32') {
            if (settings.value?.risingDisableWindowsHighContrast) {
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
            ['platform-' + platform]: true,
            disableWindowsHighContrast:
              settings.value?.risingDisableWindowsHighContrast || false
          };
        } catch (err) {
          return {
            ['platform-' + platform]: true
          };
        }
      }

      function styling(): string {
        try {
          return `<style>${fs.readFileSync(path.join(__dirname, `themes/${settings.value?.theme}.css`), 'utf8').toString()}</style>`;
        } catch (e) {
          log.error('Failed to load theme', e);
          if (
            (<Error & { code: string }>e).code === 'ENOENT' &&
            settings.value?.theme !== 'default'
          ) {
            settings.value.theme = 'default';
            return styling();
          }
          throw e;
        }
      }
      function getAvatarImage(tab: Tab) {
        if (tab.avatarUrl) {
          return tab.avatarUrl;
        }

        return (
          'https://static.f-list.net/images/avatar/' +
          (tab.user || '').toLowerCase() +
          '.png'
        );
      }

      onMounted(async () => {
        log.debug('init.window.mounting');

        if (remote.process.argv.includes('--devtools')) {
          browserWindow.webContents.openDevTools({ mode: 'detach' });
        }

        updateSupportedLanguages(
          browserWindow.webContents.session.availableSpellCheckerLanguages
        );

        log.debug('init.window.languages.supported');

        browserWindow.webContents.session.setSpellCheckerLanguages(
          getSafeLanguages(settings.value?.spellcheckLang)
        );

        log.debug('init.window.languages');

        electron.ipcRenderer.on(
          'settings',
          (_e: Electron.IpcRendererEvent, newSettings: GeneralSettings) => {
            log.debug('settings.update.window');

            settings.value = newSettings;

            log.transports.file.level = newSettings.risingSystemLogLevel;
            log.transports.console.level = newSettings.risingSystemLogLevel;
          }
        );

        electron.ipcRenderer.on('rising-upgrade-complete', () => {
          hasCompletedUpgrades.value = true;
        });
        electron.ipcRenderer.on(
          'allow-new-tabs',
          (_e: Electron.IpcRendererEvent, allow: boolean) =>
            (canOpenTab.value = allow)
        );
        electron.ipcRenderer.on('open-tab', () => addTab());
        electron.ipcRenderer.on(
          'update-available',
          (_e: Electron.IpcRendererEvent, available: boolean) =>
            (hasUpdate.value = available)
        );
        electron.ipcRenderer.on('fix-logs', () =>
          activeTab.value!.view.webContents.send('fix-logs')
        );
        electron.ipcRenderer.on('quit', () => destroyAllTabs());
        electron.ipcRenderer.on('reopen-profile', () =>
          activeTab.value!.view.webContents.send('reopen-profile')
        );
        electron.ipcRenderer.on(
          'update-dictionaries',
          (_e: Electron.IpcRendererEvent, langs: string[]) => {
            browserWindow.webContents.session.setSpellCheckerLanguages(langs);

            for (const t of tabs.value) {
              t.view.webContents.session.setSpellCheckerLanguages(langs);
            }
          }
        );

        electron.ipcRenderer.on(
          'connect',
          (_e: Electron.IpcRendererEvent, id: number, name: string) => {
            const tab = tabMap[id];
            tab.user = name;
          }
        );
        electron.ipcRenderer.on(
          'update-avatar-url',
          (
            _e: Electron.IpcRendererEvent,
            characterName: string,
            url: string
          ) => {
            const tab = tabs.value.find(tab => tab.user === characterName);

            if (!tab) {
              return;
            }

            tab.avatarUrl = url;
          }
        );
        electron.ipcRenderer.on(
          'disconnect',
          (_e: Electron.IpcRendererEvent, id: number) => {
            const tab = tabMap[id];
            if (tab.hasNew) {
              tab.hasNew = false;
              electron.ipcRenderer.send(
                'has-new',
                tabs.value.reduce((cur, t) => cur || t.hasNew, false)
              );
            }
            tab.user = undefined;
            tab.avatarUrl = undefined;
          }
        );
        electron.ipcRenderer.on(
          'has-new',
          (_e: Electron.IpcRendererEvent, id: number, hasNew: boolean) => {
            const tab = tabMap[id];
            tab.hasNew = hasNew;
            electron.ipcRenderer.send(
              'has-new',
              tabs.value.reduce((cur, t) => cur || t.hasNew, false)
            );
          }
        );
        browserWindow.on('maximize', () => {
          isMaximized.value = true;
          if (activeTab.value !== undefined)
            activeTab.value.view.setBounds(getWindowBounds());
        });
        browserWindow.on('unmaximize', () => {
          isMaximized.value = false;
          if (activeTab.value !== undefined)
            activeTab.value.view.setBounds(getWindowBounds());
        });
        electron.ipcRenderer.on(
          'switch-tab',
          (_e: Electron.IpcRendererEvent) => {
            const index = tabs.value.indexOf(activeTab.value!);
            show(tabs.value[index + 1 === tabs.value.length ? 0 : index + 1]);
          }
        );
        electron.ipcRenderer.on(
          'previous-tab',
          (_e: Electron.IpcRendererEvent) => {
            const index = tabs.value.indexOf(activeTab.value!);
            show(tabs.value[index - 1 < 0 ? tabs.value.length - 1 : index - 1]);
          }
        );
        electron.ipcRenderer.on(
          'show-tab',
          (_e: Electron.IpcRendererEvent, id: number) => {
            show(tabMap[id]);
          }
        );
        document.addEventListener('click', () =>
          activeTab.value!.view.webContents.focus()
        );
        window.addEventListener('focus', () => {
          if (!browserWindow.isMinimized())
            activeTab.value!.view.webContents.focus();
        });

        log.debug('init.window.listeners');

        await addTab();

        log.debug('init.window.tab');

        let tabsorder: string[];
        const sortable = Sortable.create(<HTMLElement>tabsElement.value, {
          animation: 50,
          onStart: () => {
            tabsorder = sortable.toArray();
          },
          onEnd: e => {
            if (e.oldIndex === e.newIndex) return;
            const elem = tabs.value[e.oldIndex!];
            tabs.value.splice(e.oldIndex!, 1);
            tabs.value.splice(e.newIndex!, 0, elem);
            sortable.sort(tabsorder, false);
          },
          onMove: (e: { related: HTMLElement }) => e.related.id !== 'addTab',
          filter: '.addTab'
        });

        window.onbeforeunload = () => {
          const isConnected = tabs.value.reduce(
            (cur, tab) => cur || tab.user !== undefined,
            false
          );
          if (process.env.NODE_ENV !== 'production' || !isConnected) {
            destroyAllTabs();
            return;
          }
          if (!settings.value?.closeToTray)
            return setImmediate(() => {
              if (confirm(l('chat.confirmLeave'))) {
                destroyAllTabs();
                browserWindow.close();
              }
            });
          browserWindow.hide();
          return false;
        };
        isMaximized.value = browserWindow.isMaximized();

        log.debug('init.window.mounted');
      });

      return {
        settings,
        tabs,
        activeTab,
        tabMap,
        isMaximized,
        canOpenTab,
        hasUpdate,
        platform,
        lockTab,
        hasCompletedUpgrades,
        addTab,
        remove,
        show,
        minimize,
        maximize,
        close,
        openMenu,
        openUpdatePage,
        l,
        getThemeClass,
        getAvatarImage,
        styling
      };
    }
  });
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

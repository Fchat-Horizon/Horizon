<template>
  <div
    style="display: flex; flex-direction: column; height: 100%"
    :class="getThemeClass()"
    @auxclick.prevent
  >
    <div v-html="styling"></div>
    <div
      :style="`
        display: ${!(hideWindowControls && !hideSingleTab) || tabs.length > 1 ? 'flex' : 'none'};
        align-items: stretch;
        border-bottom-width: 1px;
        min-height: 31px;
      `"
      class="border-bottom"
      id="window-tabs"
    >
      <h4
        style="padding: 2px 0"
        class="d-md-block d-none"
        v-if="!hideWindowControls"
      >
        {{ l(windowTitleKey) }}
      </h4>
      <div
        class="btn btn-light"
        @click="openMenu"
        id="settings"
        v-if="!hideWindowControls"
      >
        <i class="fas fa-bars"></i>
      </div>
      <div
        class="btn-update-wrapper"
        :class="{
          'btn-update-visible':
            hasUpdate || updateDownloading || updateDownloaded
        }"
      >
        <div
          v-if="updateDownloading"
          class="btn btn-outline-info btn-update-progress"
          :title="l('update.titlebar.downloading', updateDownloadPercent)"
        >
          <div
            class="btn-update-progress-fill"
            :style="{ width: updateDownloadPercent + '%' }"
          ></div>
          <span class="btn-update-progress-label"
            >{{ updateDownloadPercent }}%</span
          >
        </div>
        <div
          v-else-if="updateDownloaded"
          class="btn btn-success btn-update-done"
          @click="installUpdate"
          :title="l('update.titlebar.ready')"
        >
          <i class="fa fa-check"></i>
        </div>
        <div v-else class="btn btn-outline-success" @click="openUpdatePage">
          <i class="fa fa-arrow-down"></i>
        </div>
      </div>
      <ul
        class="nav nav-tabs"
        style="border-bottom: 0; margin-bottom: -1px; margin-top: 1px"
        ref="tabs"
      >
        <!-- Individual tab transitions with appear hooks 
          :css="!isClosing" - Disables CSS transitions during window cleanup
          JavaScript hooks (@before-enter, @enter, etc.) take priority over CSS
          appear - Enables animations for tabs present on initial page load 
          
          We wound up doing it this way because working with a <transition-grou> element
          would be cleaner for the actual template, it wound up giving too many problems
          because of things relying on the <ul> element being directly referenced through
          the "tabs" reference
        -->
        <transition
          name="tab"
          appear
          :css="!isClosing"
          @before-enter="onTabBeforeEnter"
          @enter="onTabEnter"
          @leave="onTabLeave"
          @before-appear="onTabBeforeEnter"
          @appear="onTabEnter"
          v-for="(tab, index) in tabs"
          :key="'tab-' + tab.id"
        >
          <li class="nav-item" :data-id="index" @click.middle="remove(tab)">
            <a
              href="#"
              @click.prevent="show(tab)"
              class="nav-link tab"
              :class="{
                active: tab === activeTab,
                hasNew: tab.hasNew > 0 && tab !== activeTab
              }"
            >
              <img
                v-if="tab.user || tab.avatarUrl"
                :src="getAvatarImage(tab)"
              />
              <span class="d-sm-inline d-none">{{
                tab.user || l('window.newTab')
              }}</span>
              <span
                class="badge rounded-pill text-bg-danger ms-1"
                v-if="shouldShowNotificationBadge(tab)"
              >
                {{ tab.hasNew }}</span
              >
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
        </transition>
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
        id="windowButtons"
        class="btn-group"
        v-if="!hideWindowControls"
      >
        <span
          @click.stop="openSettingsMenu()"
          class="d-none d-md-flex btn btn-light"
        >
          <i class="fa fa-cog"> </i>
        </span>

        <span class="btn btn-light" @click.stop="minimize()">
          <i class="far fa-window-minimize"></i>
        </span>
        <span class="btn btn-light" @click="maximize()">
          <i
            class="far"
            :class="'fa-window-' + (isMaximized ? 'restore' : 'maximize')"
          ></i>
        </span>
        <span class="btn btn-light" @click.stop="close()">
          <i class="fa fa-times fa-lg"></i>
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import Sortable from 'sortablejs';

  import * as electron from 'electron';

  import { defineComponent } from 'vue';
  import l from '@horizon/shared/chat/localize';
  import { GeneralSettings } from '@horizon/shared/common';
  import { getPlatform } from '@horizon/shared/platform/platform';
  import { createLogger } from '@horizon/shared/logger';
  const log = createLogger('window-view');
  import { applySharedLogLevel } from './logging';
  import { Dialog } from '@horizon/shared/helpers/dialog';

  /*
   * The actual tab content views (WebContentsView) live in the main process
   * (electron/tab-manager.ts); this component only renders the tab strip and
   * drives the views over IPC, keyed by their webContents id.
   */
  interface Tab {
    id: number;
    user: string | undefined;
    hasNew: number;
    avatarUrl?: string;
    title: string;
  }

  export default defineComponent({
    props: {
      initialSettings: {
        type: Object as () => GeneralSettings,
        required: true
      },
      importHint: { type: String, default: undefined }
    },
    data() {
      return {
        settings: this.initialSettings,
        tabs: [] as Tab[],
        activeTab: undefined as Tab | undefined,
        tabMap: {} as { [key: number]: Tab },
        isMaximized: electron.ipcRenderer.sendSync(
          'window-is-maximized-sync'
        ) as boolean,
        osIsDark: electron.ipcRenderer.sendSync(
          'native-theme-dark-sync'
        ) as boolean,
        canOpenTab: true,
        l,
        hasUpdate: false,
        updateVersion: '',
        updateDownloading: false,
        updateDownloadPercent: 0,
        updateDownloaded: false,
        platform: getPlatform(),
        lockTab: false,
        hasCompletedUpgrades: false,
        windowTitleKey: (import.meta.env.PROD
          ? 'title'
          : 'title.dev') as string,
        isClosing: false,
        hideWindowControls: false,
        hideSingleTab: true,
        // ~ Last tab strip height reported to the main process for view bounds.
        lastBarHeight: -1
      };
    },
    computed: {
      styling(): string {
        return this.readThemeCss();
      }
    },
    updated(): void {
      this.sendTabBarHeight();
    },
    async mounted(): Promise<void> {
      log.debug('init.window.mounting');

      //double check for MacOS here because I don't want to deal with issues caused by imported settings
      this.hideWindowControls =
        this.settings.forceNativeWindowControls && this.platform !== 'darwin';
      this.hideSingleTab = this.settings.nativeWindowShowSingleTab;

      electron.ipcRenderer.on(
        'settings',
        (_e: Electron.IpcRendererEvent, settings: GeneralSettings) => {
          log.debug('settings.update.window');

          this.settings = settings;

          applySharedLogLevel(settings.risingSystemLogLevel);
        }
      );

      electron.ipcRenderer.on('rising-upgrade-complete', () => {
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
        (
          _e: Electron.IpcRendererEvent,
          updateAvailable: boolean,
          version?: string
        ) => {
          this.hasUpdate = updateAvailable;
          if (updateAvailable) {
            if (version) this.updateVersion = version;
          } else {
            this.updateVersion = '';
            this.updateDownloading = false;
            this.updateDownloaded = false;
            this.updateDownloadPercent = 0;
          }
        }
      );
      electron.ipcRenderer.on(
        'update-download-progress',
        (_e: Electron.IpcRendererEvent, percent: number, done: boolean) => {
          this.updateDownloading = !done;
          this.updateDownloadPercent = Math.round(percent);
          this.updateDownloaded = done;
        }
      );
      electron.ipcRenderer.on('fix-logs', () =>
        this.forwardToActiveTab('fix-logs')
      );
      electron.ipcRenderer.on('ui-test', () =>
        this.forwardToActiveTab('ui-test')
      );
      electron.ipcRenderer.on('quit', () => this.destroyAllTabs());
      electron.ipcRenderer.on('reopen-profile', () =>
        this.forwardToActiveTab('reopen-profile')
      );

      electron.ipcRenderer.on(
        'connect',
        (_e: Electron.IpcRendererEvent, id: number, name: string) => {
          const tab = this.tabMap[id];
          if (!tab) return;
          tab.user = name;
          tab.title = l('title.connected', name);
          this.refreshWindowTitle();
        }
      );
      electron.ipcRenderer.on(
        'update-avatar-url',
        (_e: Electron.IpcRendererEvent, characterName: string, url: string) => {
          const tab = this.tabs.find(tab => tab.user === characterName);

          if (!tab) {
            return;
          }

          tab.avatarUrl = url;
        }
      );
      electron.ipcRenderer.on(
        'disconnect',
        (_e: Electron.IpcRendererEvent, id: number) => {
          const tab = this.tabMap[id];
          // ~ The tab may already be gone if it was closed while connected.
          if (!tab) return;
          if (tab.hasNew > 0) {
            tab.hasNew = 0;
            electron.ipcRenderer.send(
              'has-new',

              this.tabs.reduce((cur, t) => cur + t.hasNew, 0),
              this.settings.horizonShowNotificationBadge
            );
          }
          tab.user = undefined;
          tab.title = l('title');
          this.refreshWindowTitle();
          tab.avatarUrl = undefined;
        }
      );
      electron.ipcRenderer.on(
        'has-new',
        (_e: Electron.IpcRendererEvent, id: number, hasNew: number) => {
          const tab = this.tabMap[id];
          if (!tab) return;
          tab.hasNew = hasNew;
          electron.ipcRenderer.send(
            'has-new',
            this.tabs.reduce((cur, t) => cur + t.hasNew, 0),
            this.settings.horizonShowNotificationBadge
          );
        }
      );
      electron.ipcRenderer.on(
        'native-theme-updated',
        (_e: Electron.IpcRendererEvent, isDark: boolean) => {
          this.osIsDark = isDark;
        }
      );
      electron.ipcRenderer.on(
        'window-maximized',
        (_e: Electron.IpcRendererEvent, maximized: boolean) => {
          this.isMaximized = maximized;
        }
      );
      electron.ipcRenderer.on(
        'tab-ready',
        (_e: Electron.IpcRendererEvent, _id: number) => {
          this.lockTab = false;
          this.sendTabBarHeight();
        }
      );
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
      document.addEventListener('click', () => {
        if (this.activeTab !== undefined)
          electron.ipcRenderer.send('focus-active-tab');
      });

      log.debug('init.window.listeners');

      this.sendTabBarHeight();
      await this.addTab();

      log.debug('init.window.tab');

      let tabsorder: string[];
      const sortable = Sortable.create(<HTMLElement>this.$refs['tabs'], {
        animation: 50,
        onStart: () => {
          tabsorder = sortable.toArray();
        },
        onEnd: e => {
          if (e.oldIndex === e.newIndex) return;
          const elem = this.tabs[e.oldIndex!];
          this.tabs.splice(e.oldIndex!, 1);
          this.tabs.splice(e.newIndex!, 0, elem);
          sortable.sort(tabsorder, false);
        },
        onMove: (e: { related: HTMLElement }) => e.related.id !== 'addTab',
        filter: '.addTab'
      });

      window.onbeforeunload = () => {
        const isConnected = this.tabs.reduce(
          (cur, tab) => cur || tab.user !== undefined,
          false
        );
        if (import.meta.env.DEV || !isConnected) {
          this.destroyAllTabs();
          return;
        }
        if (!this.settings.closeToTray)
          return setTimeout(() => {
            if (Dialog.confirmDialog(l('chat.confirmLeave'))) {
              this.destroyAllTabs();
              this.close();
            }
          }, 0);
        electron.ipcRenderer.send('window-hide');
        return false;
      };

      log.debug('init.window.mounted');
    },
    methods: {
      getSyncedTheme() {
        if (!this.settings.themeSync) return this.settings.theme;
        return this.osIsDark
          ? this.settings.themeSyncDark
          : this.settings.themeSyncLight;
      },
      // ~ Recovers from a deleted theme by falling back to default and re-reading.
      readThemeCss(): string {
        const css = <string | null>(
          electron.ipcRenderer.sendSync(
            'themes-read-sync',
            this.getSyncedTheme()
          )
        );
        if (css === null) {
          if (this.settings.theme !== 'default') {
            this.settings.theme = 'default';
            return this.readThemeCss();
          }
          throw new Error('Default theme is missing');
        }
        return `<style>${css}</style>`;
      },
      getAvatarImage(tab: Tab) {
        if (tab.avatarUrl) {
          return tab.avatarUrl;
        }

        return (
          'https://static.f-list.net/images/avatar/' +
          (tab.user || '').toLowerCase() +
          '.png'
        );
      },
      sendTabBarHeight(): void {
        const height = document.body.offsetHeight;
        if (height === this.lastBarHeight) return;
        this.lastBarHeight = height;
        electron.ipcRenderer.send('tab-bar-height', height);
      },
      forwardToActiveTab(channel: string): void {
        if (this.activeTab !== undefined)
          electron.ipcRenderer.send('tab-forward', this.activeTab.id, channel);
      },
      destroyAllTabs(): void {
        // Disable animations before cleanup to prevent dangling references
        this.isClosing = true;
        this.$nextTick(() => {
          for (const tab of this.tabs)
            if (tab.user !== undefined)
              electron.ipcRenderer.send('disconnect', tab.user);
          electron.ipcRenderer.send('tabs-destroy-all');
          this.tabs = [];
        });
      },
      refreshWindowTitle() {
        document.title =
          this.settings.horizonWindowTitleCharacter && this.activeTab
            ? this.activeTab.title
            : l('title');
      },
      async addTab(): Promise<void> {
        log.debug('init.window.tab.add.start');

        if (this.lockTab) return;
        this.lockTab = true;
        this.sendTabBarHeight();

        const id = (await electron.ipcRenderer.invoke(
          'tab-create',
          document.body.offsetHeight
        )) as number | undefined;

        if (id === undefined) {
          this.lockTab = false;
          return;
        }

        log.debug('init.window.tab.add.view', id);

        const tab: Tab = {
          id,
          user: undefined,
          hasNew: 0,
          title: l('title')
        };
        this.tabs.push(tab);
        this.tabMap[id] = tab;
        this.activeTab = tab;
        this.refreshWindowTitle();

        // ~ lockTab is released by the 'tab-ready' event once the view loaded.
        log.debug('init.window.tab.add.done', id);
      },
      show(tab: Tab): void {
        if (this.lockTab || !tab) return;
        this.activeTab = tab;
        electron.ipcRenderer.send('tab-show', tab.id);
        this.refreshWindowTitle();
      },
      async remove(tab: Tab, shouldConfirm: boolean = true): Promise<void> {
        if (
          this.lockTab ||
          (shouldConfirm &&
            tab.user !== undefined &&
            !Dialog.confirmDialog(l('chat.confirmLeave')))
        )
          return;
        this.tabs.splice(this.tabs.indexOf(tab), 1);
        electron.ipcRenderer.send(
          'has-new',
          this.tabs.reduce((cur, t) => cur + t.hasNew, 0),
          this.settings.horizonShowNotificationBadge
        );
        delete this.tabMap[tab.id];
        if (tab.user !== undefined)
          electron.ipcRenderer.send('disconnect', tab.user);
        electron.ipcRenderer.send('tab-close', tab.id);
        if (this.tabs.length === 0) {
          if (import.meta.env.PROD) this.close();
        } else {
          await this.$nextTick();

          if (this.activeTab === tab) {
            this.show(this.tabs[0]);
          }
        }
      },
      minimize(): void {
        electron.ipcRenderer.send('window-minimize');
      },
      maximize(): void {
        electron.ipcRenderer.send('window-maximize-toggle');
      },
      close(): void {
        electron.ipcRenderer.send('window-close');
      },
      openMenu(): void {
        electron.ipcRenderer.send('popup-app-menu');
      },
      openUpdatePage(): void {
        electron.ipcRenderer.send('open-update-changelog', this.updateVersion);
      },
      installUpdate(): void {
        electron.ipcRenderer.send('install-update');
      },
      openSettingsMenu(): void {
        log.debug('settings clicked');
        electron.ipcRenderer.send('open-settings-menu');
      },
      onTabBeforeEnter(el: HTMLElement): void {
        if (this.isClosing) return;
        el.style.opacity = '0';
        el.style.transform = 'translateX(-100%)';
      },
      onTabEnter(el: HTMLElement, done: () => void): void {
        if (this.isClosing) {
          done();
          return;
        }

        // Use requestAnimationFrame for smooth animation
        requestAnimationFrame(() => {
          el.style.transition = 'all 0.15s ease-out';
          el.style.opacity = '1';
          el.style.transform = 'translateX(0)';

          setTimeout(done, 150);
        });
      },
      onTabLeave(el: HTMLElement, done: () => void): void {
        if (this.isClosing) {
          done();
          return;
        }

        el.style.transition = 'opacity 0.1s ease-in';
        el.style.opacity = '0';

        setTimeout(done, 100);
      },
      getThemeClass() {
        try {
          // Hack!
          if (getPlatform() === 'win32') {
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
            'force-reduced-motion': this.settings?.reducedMotion || false,
            bbcodeGlow: this.settings?.horizonBbcodeGlow || false,
            disableWindowsHighContrast:
              this.settings?.risingDisableWindowsHighContrast || false
          };
        } catch (err) {
          return {
            ['platform-' + this.platform]: true
          };
        }
      },
      shouldShowNotificationBadge(tab: Tab): boolean {
        return (
          this.settings.horizonShowWindowAndChatNotificationBadge !== false &&
          tab.hasNew > 0
        );
      }
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

    .btn-default,
    .btn-light:not(:hover) {
      background: transparent;
    }

    li {
      height: 100%;

      a {
        display: flex;
        padding: 2px 10px;
        height: 100%;
        align-items: center;
      }

      img {
        height: 28px;
        width: 28px;
        margin: -5px 3px -5px -5px;
        object-fit: contain;
      }
    }

    h4 {
      font-size: 1.5rem;
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

  #window-tabs .btn-update-wrapper {
    display: none;
    align-items: stretch;
  }

  #window-tabs .btn-update-visible {
    display: flex;
  }

  #window-tabs .btn-update-progress {
    position: relative;
    overflow: hidden;
    min-width: 48px;
    cursor: default;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  #window-tabs .btn-update-progress-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: rgba(var(--bs-info-rgb, 13, 202, 240), 0.25);
    transition: width 0.3s ease;
    pointer-events: none;
  }

  #window-tabs .btn-update-progress-label {
    position: relative;
    z-index: 1;
    font-size: 11px;
    font-weight: 600;
  }

  #window-tabs .btn-update-done {
    animation: pulse-success 1.5s ease-in-out infinite;
  }

  @keyframes pulse-success {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }

  .platform-darwin {
    #windowButtons .btn,
    #settings {
      display: none;
    }

    #window-tabs {
      padding-left: 77px;

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

  @media (prefers-reduced-motion: reduce) {
    .tab-enter-active,
    .tab-appear-active,
    .tab-leave-active {
      transition: none !important;
    }

    .tab-enter-from,
    .tab-appear-from {
      transform: none !important;
    }
  }
</style>

<template>
  <div class="card-full" style="display: flex; flex-direction: column; height: 100%" :class="getThemeClass()" @auxclick.prevent>
    <div v-html="styling"></div>
    <div style="display: flex; align-items: stretch; border-bottom-width: 1px" class="border-bottom" id="window-browser-settings">
      <h4 style="padding: 2px 0">{{ l('settings.browserOptionHeader') }}</h4>
      <div style="flex: 1; display: flex; justify-content: flex-end; -webkit-app-region: drag" class="btn-group" id="windowButtons">
        <i class="far fa-window-minimize btn btn-light" @click.stop="minimize()"></i>
        <!--        <i class="far btn btn-light" :class="'fa-window-' + (isMaximized ? 'restore' : 'maximize')" @click="maximize()"></i>-->
        <span class="btn btn-light" @click.stop="close()">
          <i class="fa fa-times fa-lg"></i>
        </span>
      </div>
    </div>
    <div class="bg-light" style="display: flex; flex-direction: column; height: 100%; justify-content: center; margin: 0">
      <div class="card bg-light" style="height: 100%; width: 100%">
        <div class="card-body row" style="height: 100%; width: 100%">
          <h4 class="card-title">{{ l('settings.browserOptionTitle') }}</h4>
          <div class="form-group col-12">
            <div class="row">
              <div class="col-12">
                <div class="warning">
                  <h5>Danger Zone!</h5>
                  <div>
                    This is an advanced setting. By changing this setting to an unsupported program (i.e. not a browser), you might not be
                    able to open links from F-Chat anymore.
                  </div>

                  <div v-if="isMac">
                    <hr />
                    <p>Mac User: As of writing, MacOS has a bug in how it handles opening links.</p>
                    <p>
                      When your default browser is something other than Safari and you select Safari in this settings window, links might be
                      opened twice.
                    </p>
                    <p>
                      Once in Safari and a second time in your default browser. This tends to happen when Safari is not running when
                      clicking a link.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="form-group col-12">
            <label class="control-label" for="browserPath">{{ l('settings.browserOptionPath') }}</label>
            <div class="row">
              <div class="col-10">
                <input class="form-control" id="browserPath" v-model="browserPath" />
              </div>
              <div class="col-2">
                <button class="btn btn-primary" @click.prevent.stop="browseForPath()">{{ l('settings.browserOptionBrowse') }}</button>
              </div>
            </div>
          </div>
          <div class="form-group col-12">
            <label class="control-label" for="browserArgs">{{ l('settings.browserOptionArguments') }}</label>
            <div class="row">
              <div class="col-12">
                <input class="form-control" id="browserArgs" v-model="browserArgs" />
              </div>
            </div>
            <div class="row">
              <div class="col-12">
                <small class="form-text text-muted">{{ l('settings.browserOptionArgumentsHelp') }}</small>
              </div>
            </div>
          </div>
          <div class="form-group col-12">
            <div class="row no-gutters">
              <div class="col-4">
                <button class="btn btn-danger" style="float: right" @click.prevent.stop="resetToDefault()">
                  {{ l('settings.browserOptionReset') }}
                </button>
              </div>
              <div class="col"></div>
              <div class="col-2">
                <button class="btn btn-primary" @click.prevent.stop="submit()">{{ l('settings.browserOptionSave') }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import * as electron from 'electron';
  import { Component, Hook } from '@f-list/vue-ts';
  import * as remote from '@electron/remote';
  import Vue from 'vue';
  import l from '../chat/localize';
  import { GeneralSettings } from './common';
  import fs from 'fs';
  import path from 'path';
  import { ipcRenderer } from 'electron';
  import log from 'electron-log';

  const browserWindow = remote.getCurrentWindow();
  @Component({
    components: {}
  })
  export default class BrowserOption extends Vue {
    settings!: GeneralSettings;
    isMaximized = false;
    l = l;
    platform = process.platform;
    hasCompletedUpgrades = false;
    browserPath = '';
    browserArgs = '';
    isMac = process.platform === 'darwin';

    get styling(): string {
      try {
        return `<style>${fs.readFileSync(path.join(__dirname, `themes/${this.settings.theme}.css`), 'utf8').toString()}</style>`;
      } catch (e) {
        if ((<Error & { code: string }>e).code === 'ENOENT' && this.settings.theme !== 'default') {
          this.settings.theme = 'default';
          return this.styling;
        }
        throw e;
      }
    }

    @Hook('mounted')
    async mounted(): Promise<void> {
      this.browserPath = this.settings.browserPath;
      this.browserArgs = this.settings.browserArgs;
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

    getThemeClass() {
      // console.log('getThemeClassWindow', this.settings?.risingDisableWindowsHighContrast);

      try {
        // Hack!
        if (process.platform === 'win32') {
          if (this.settings?.risingDisableWindowsHighContrast) {
            document.querySelector('html')?.classList.add('disableWindowsHighContrast');
          } else {
            document.querySelector('html')?.classList.remove('disableWindowsHighContrast');
          }
        }

        return {
          ['platform-' + this.platform]: true,
          disableWindowsHighContrast: this.settings?.risingDisableWindowsHighContrast || false
        };
      } catch (err) {
        return {
          ['platform-' + this.platform]: true
        };
      }
    }

    submit(): void {
      ipcRenderer.send('browser-option-update', this.browserPath, this.browserArgs);
      this.close();
    }

    resetToDefault(): void {
      this.browserPath = '';
      this.browserArgs = '';
    }

    browseForPath(): void {
      ipcRenderer.invoke('browser-option-browse').then(result => {
        this.browserPath = result;
      });
    }
  }
</script>

<style lang="scss">
  .card-full {
    height: 100%;
    left: 0;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 100;
  }

  #windowButtons .btn {
    border-top: 0;
    font-size: 14px;
  }

  #window-browser-settings {
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

  .warning {
    border: 1px solid var(--warning);
    padding: 10px;
    margin-bottom: 20px;
    border-radius: 3px;

    div {
      margin-top: 10px;
    }
  }

  .disableWindowsHighContrast,
  .disableWindowsHighContrast * {
    forced-color-adjust: none;
  }
</style>

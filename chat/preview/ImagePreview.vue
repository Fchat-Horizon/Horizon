<template>
  <!-- hiding elements instead of using 'v-if' is used here as an optimization -->
  <div
    class="image-preview-wrapper"
    :class="{ interactive: sticky, visible: visible }"
  >
    <div class="image-preview-toolbar" v-show="sticky || debug">
      <a
        @click="toggleDevMode()"
        :class="{ toggled: debug }"
        :title="l('imagePreview.debug')"
        ><i class="fa fa-terminal"></i
      ></a>
      <a @click="reloadUrl()" :title="l('imagePreview.reload')"
        ><i class="fa fa-redo-alt"></i
      ></a>
      <a @click="reset()" :title="l('imagePreview.reset')"
        ><i class="fa fa-recycle"></i
      ></a>
      <a
        @click="toggleStickyMode()"
        :class="{ toggled: sticky }"
        :title="l('imagePreview.toggleSticky')"
        ><i class="fa fa-thumbtack"></i
      ></a>
    </div>

    <webview
      src="about:blank"
      webpreferences="contextIsolation,sandbox,disableDialogs,webSecurity,javascript=no"
      enableremotemodule="false"
      partition="persist:adblocked"
      id="image-preview-ext"
      ref="imagePreviewExt"
      class="image-preview-external"
      :style="previewStyles.ExternalImagePreviewHelper"
    >
    </webview>

    <div
      class="image-preview-local"
      :style="previewStyles.LocalImagePreviewHelper"
    ></div>

    <character-preview
      :style="previewStyles.CharacterPreviewHelper"
      ref="characterPreview"
    ></character-preview>

    <i
      id="preview-spinner"
      class="fas fa-circle-notch fa-spin"
      v-show="shouldShowSpinner"
    ></i>
    <i id="preview-error" class="fas fa-times" v-show="shouldShowError"></i>
  </div>
</template>

<script lang="ts">
  import * as _ from 'lodash';
  import Vue from 'vue';
  import core from '../core';
  import { normalizeCharacterName } from '../common';
  import { EventBus, EventBusEvent } from './event-bus';
  import { domain } from '../../bbcode/core';

  import {
    ExternalImagePreviewHelper,
    LocalImagePreviewHelper,
    PreviewManager,
    CharacterPreviewHelper,
    RenderStyle
  } from './helper';

  import CharacterPreview from './CharacterPreview.vue';
  import l from '../localize';

  type TimerHandle = ReturnType<typeof setTimeout>;

  const FLIST_PROFILE_MATCH = _.cloneDeep(
    /https?:\/\/(www.)?f-list.net\/c\/([a-zA-Z0-9+%_.!~*'()-]+)\/?/
  );

  interface DidFailLoadEvent extends Event {
    errorCode: number;
    errorDescription: string;
  }

  export default Vue.extend({
    components: {
      'character-preview': CharacterPreview
    },
    data() {
      return {
        l: l,
        MinTimePreviewVisible: 100,
        visible: false,
        previewManager: new PreviewManager(this as any, [
          new ExternalImagePreviewHelper(this as any),
          new LocalImagePreviewHelper(this as any),
          new CharacterPreviewHelper(this as any)
          // new ChannelPreviewHelper(this)
        ]),
        url: null as string | null,
        domain: undefined as string | undefined,
        sticky: false,
        debug: false,
        state: 'hidden',
        shouldShowSpinner: false,
        shouldShowError: true,
        interval: null as TimerHandle | null,
        exitInterval: null as TimerHandle | null,
        exitUrl: null as string | null,
        initialMouseMoveToken: null as number | null,
        mouseMoveToken: 0,
        pointerMoveListener: null as EventListener | null,
        shouldDismiss: false,
        visibleSince: 0,
        previewStyles: {} as Record<string, RenderStyle>
      };
    },
    async mounted(): Promise<void> {
      console.info('Mounted ImagePreview');

      EventBus.$on('imagepreview-dismiss', (eventData: EventBusEvent) => {
        this.dismiss(this.negotiateUrl((eventData.url as string) || ''));
      });

      EventBus.$on('imagepreview-show', (eventData: EventBusEvent) => {
        const url = this.negotiateUrl((eventData.url as string) || '');
        const isInternalPreview =
          CharacterPreviewHelper.FLIST_CHARACTER_PROTOCOL_TESTER.test(url);

        if (
          (!core.state.settings.risingCharacterPreview && isInternalPreview) ||
          (!core.state.settings.risingLinkPreview && !isInternalPreview)
        ) {
          return;
        }

        this.show(url);
      });

      EventBus.$on(
        'imagepreview-toggle-stickyness',
        (eventData: EventBusEvent) => {
          if (!core.state.settings.risingLinkPreview) {
            return;
          }

          const eventUrl = this.negotiateUrl((eventData.url as string) || '');

          if (
            (eventData.force === true || this.url === eventUrl) &&
            this.visible
          ) {
            this.sticky = !this.sticky;

            if (eventData.force) {
              this.hide();
            }
          }
        }
      );

      const webview = this.getWebview();

      webview.addEventListener('dom-ready', () => this.setState('loaded'));

      webview.addEventListener('did-fail-load', (event: Event) => {
        const e = event as DidFailLoadEvent;

        if (e.errorCode !== -3) {
          this.setState('error');
        }
      });

      setInterval(() => {
        if (
          (this.visible && !this.exitInterval && !this.shouldDismiss) ||
          this.interval
        )
          this.initialMouseMoveToken = this.mouseMoveToken;

        if (
          this.visible &&
          this.shouldDismiss &&
          this.hasMouseMovedSince() &&
          !this.exitInterval &&
          !this.interval
        ) {
          this.debugLog('ImagePreview: call hide from interval');

          this.hide();
        }

        this.shouldShowSpinner = this.testSpinner();
        this.shouldShowError = this.testError();
      }, 50);

      this.pointerMoveListener = () => {
        this.mouseMoveToken += 1;
      };

      window.addEventListener('pointermove', this.pointerMoveListener, {
        passive: true
      });
    },
    beforeDestroy(): void {
      this.cancelExitTimer();
      this.cancelTimer();

      if (!this.pointerMoveListener) {
        return;
      }

      window.removeEventListener('pointermove', this.pointerMoveListener);
      this.pointerMoveListener = null;
    },
    methods: {
      setMouseMovementBaseline(): void {
        this.initialMouseMoveToken = this.mouseMoveToken;
      },
      reRenderStyles(): void {
        this.previewStyles = this.previewManager.renderStyles();
      },
      negotiateUrl(url: string): string {
        const match = url.match(FLIST_PROFILE_MATCH);

        if (!match) {
          return url;
        }

        const characterName = decodeURIComponent(
          match[2].replace(/\+/g, '%20')
        );
        return `flist-character://${normalizeCharacterName(characterName)}`;
      },
      isMediaUrl(url: string): boolean {
        const cleanUrl = url.split('?')[0].toLowerCase();
        const mediaExtensions = [
          '.jpg',
          '.jpeg',
          '.png',
          '.gif',
          '.webp',
          '.svg',
          '.bmp',
          '.ico',
          '.mp4',
          '.webm',
          '.mov',
          '.avi',
          '.mkv',
          '.flv',
          '.wmv',
          '.m4v',
          '.3gp',
          '.ogv'
        ];

        return (
          mediaExtensions.some(ext => cleanUrl.endsWith(ext)) ||
          cleanUrl.includes('blob:') ||
          cleanUrl.includes('data:image') ||
          cleanUrl.includes('data:video')
        );
      },
      updatePreviewSize(width: number, height: number): void {
        const helper = this.previewManager.getVisiblePreview();

        if (!helper || !helper.reactsToSizeUpdates()) {
          return;
        }

        if (width && height) {
          this.debugLog(
            'ImagePreview: updatePreviewSize',
            width,
            height,
            width / height
          );

          helper.setRatio(width / height);
          this.reRenderStyles();
        }
      },
      hide(): void {
        this.cancelExitTimer();

        this.url = null;
        this.visible = false;

        this.previewManager.hide();

        this.exitUrl = null;
        this.exitInterval = null;

        this.shouldDismiss = false;

        this.sticky = false;

        this.setState('hidden');

        this.reRenderStyles();
      },
      dismiss(initialUrl: string): void {
        const url = initialUrl;

        this.debugLog('ImagePreview: dismiss', url);

        if (this.url !== url) return; // simply ignore

        // if (this.debug)
        //    return;

        if (this.sticky) return;

        const due = this.visible
          ? this.MinTimePreviewVisible -
            Math.min(this.MinTimePreviewVisible, Date.now() - this.visibleSince)
          : 0;

        this.cancelTimer();

        if (this.exitInterval) return;

        this.exitUrl = this.url;
        this.shouldDismiss = true;

        this.debugLog(
          'ImagePreview: dismiss.exec',
          due,
          this.previewManager.getVisibilityStatus(),
          url
        );

        // This timeout makes the preview window disappear with a slight delay, which helps UX
        // when dealing with situations such as quickly scrolling text that moves the cursor away
        // from the link
        // tslint:disable-next-line no-unnecessary-type-assertion
        this.exitInterval = setTimeout(() => this.hide(), due) as TimerHandle;
      },
      show(initialUrl: string): void {
        const url = initialUrl;

        this.debugLog(
          'ImagePreview: show',
          this.previewManager.getVisibilityStatus(),
          this.visible,
          this.hasMouseMovedSince(),
          !!this.interval,
          this.sticky,
          url
        );

        if (this.visible && !this.exitInterval && !this.hasMouseMovedSince()) {
          this.debugLog('ImagePreview: show cancel: visible & not moved');
          return;
        }

        if (this.url === url && (this.visible || this.interval)) {
          this.debugLog('ImagePreview: same url', url, this.url);
          return;
        }

        if (this.url && this.sticky && this.visible) {
          this.debugLog('ImagePreview: sticky visible');
          return;
        }

        this.debugLog('ImagePreview: show.exec', url);

        const due = url === this.exitUrl && this.exitInterval ? 0 : 200;

        this.url = url;
        this.domain = domain(url);

        this.cancelExitTimer();
        this.cancelTimer();

        // This timer makes sure that just by accidentally brushing across a link won't show (blink) the preview
        // -- you actually have to pause on it
        // tslint:disable-next-line no-unnecessary-type-assertion
        this.interval = setTimeout(() => {
          this.debugLog('ImagePreview: show.timeout', this.url);

          const helper = this.previewManager.show(
            this.url || undefined,
            this.domain
          );

          this.interval = null;
          this.visible = true;
          this.visibleSince = Date.now();
          this.shouldDismiss = false;

          this.setMouseMovementBaseline();

          this.reRenderStyles();

          if (helper) {
            this.setState(helper.shouldTrackLoading() ? 'loading' : 'loaded');
          } else {
            this.setState('loaded');
          }
        }, due) as TimerHandle;
      },
      hasMouseMovedSince(): boolean {
        if (this.initialMouseMoveToken === null) return true;

        return this.mouseMoveToken !== this.initialMouseMoveToken;
      },
      cancelTimer(): void {
        if (this.interval) clearTimeout(this.interval);

        this.interval = null;
      },
      cancelExitTimer(): void {
        if (this.exitInterval) clearTimeout(this.exitInterval);

        this.exitInterval = null;
      },
      isVisible(): boolean {
        return this.visible;
      },
      getUrl(): string | null {
        return this.url;
      },
      /* isExternalUrl(): boolean {
              // 'f-list.net' is tested here on purpose, because keeps the character URLs from being previewed
              return !((this.domain === 'f-list.net') || (this.domain === 'static.f-list.net'));
          }

          isInternalUrl(): boolean {
              return !this.isExternalUrl();
          }*/
      toggleDevMode(): void {
        this.debug = !this.debug;

        this.previewManager.setDebug(this.debug);

        if (this.debug) {
          const webview = this.getWebview();

          webview.openDevTools();
        }
      },
      debugLog(...args: any[]): void {
        if (this.debug) {
          console.log(...args);
        }
      },
      toggleStickyMode(): void {
        this.sticky = !this.sticky;

        if (!this.sticky) this.hide();
      },
      reloadUrl(): void {
        const helper = this.previewManager.getVisiblePreview();

        if (!helper || !helper.usesWebView()) {
          return;
        }

        // helper.reload();
        this.getWebview().reload();
      },
      getWebview(): Electron.WebviewTag {
        return this.$refs.imagePreviewExt as Electron.WebviewTag;
      },
      getCharacterPreview(): any {
        return this.$refs.characterPreview as any;
      },
      reset(): void {
        this.previewManager = new PreviewManager(this as any, [
          new ExternalImagePreviewHelper(this as any),
          new LocalImagePreviewHelper(this as any),
          new CharacterPreviewHelper(this as any)
          // new ChannelPreviewHelper(this)
        ]);

        this.url = null;
        this.domain = undefined;

        this.sticky = false;
        this.debug = false;

        this.cancelExitTimer();
        this.cancelTimer();

        this.exitUrl = null;

        this.initialMouseMoveToken = null;
        this.mouseMoveToken = 0;
        this.shouldDismiss = false;
        this.visibleSince = 0;
        this.shouldShowSpinner = false;
        this.shouldShowError = false;

        this.setState('hidden');

        this.reRenderStyles();
      },
      setState(state: string): void {
        this.debugLog(
          'ImagePreview set-state',
          state,
          this.visibleSince > 0
            ? `${(Date.now() - this.visibleSince) / 1000}s`
            : ''
        );

        this.state = state;
        this.shouldShowSpinner = this.testSpinner();
        this.shouldShowError = this.testError();
      },
      testSpinner(): boolean {
        return this.visibleSince > 0
          ? this.state === 'loading' && Date.now() - this.visibleSince > 1000
          : false;
      },
      testError(): boolean {
        const helper = this.previewManager.getVisiblePreview();

        if (!helper || !helper.usesWebView()) {
          return false;
        }

        return this.state === 'error';
      }
    }
  });
</script>

<style lang="scss">
  @import '../../node_modules/bootstrap/scss/functions';
  @import '../../node_modules/bootstrap/scss/variables';
  @import '../../node_modules/bootstrap/scss/mixins/breakpoints';

  .image-preview-wrapper {
    z-index: 10000;
    display: none;
    position: absolute;
    left: 0;
    top: 0;
    width: 50%;
    height: 70%;
    pointer-events: none;
    overflow: visible;

    &.visible {
      display: block;
    }

    &.interactive {
      pointer-events: none;

      .image-preview-toolbar,
      .image-preview-external,
      .image-preview-local,
      .character-preview {
        pointer-events: auto;
      }
    }

    .image-preview-external {
      /* position: absolute;
            width: 50%;
            height: 70%;
            top: 0;
            left: 0; */
      width: 100%;
      height: 100%;
      // pointer-events: none;
      background-color: black;
    }

    .image-preview-local {
      /* position: absolute;
            width: 50%;
            height: 70%;
            top: 0;
            left: 0; */
      width: 100%;
      height: 100%;
      // pointer-events: none;
      background-size: contain;
      background-position: top left;
      background-repeat: no-repeat;
      // background-color: black;
    }

    .image-preview-toolbar {
      position: absolute;
      /* background-color: green; */
      left: 0;
      top: 0;
      margin: 1rem;
      height: 3.5rem;
      display: flex;
      -webkit-backdrop-filter: blur(10px);
      backdrop-filter: blur(10px);
      flex-direction: row;
      width: 15rem;
      flex-wrap: nowrap;
      border-radius: 3px;
      padding: 0.5rem;
      box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.2);
      z-index: 1000;

      a i.fa {
        font-size: 1.25rem;
        top: 50%;
        position: relative;
        transform: translateY(-50%);
      }

      a {
        flex: 1;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 3px;
        margin-right: 0.5rem;
        background-color: rgba(0, 0, 0, 0.1);
      }

      a:last-child {
        margin-right: 0;
      }

      .toggled {
        background-color: rgba(255, 255, 255, 0.2);
        box-shadow: 0 0 1px 0px rgba(255, 255, 255, 0.6);
      }
    }

    #preview-spinner {
      color: white;
      opacity: 0.5;
      transition:
        visibility 0.25s,
        opacity 0.25s;
      font-size: 30pt;
      position: absolute;
      left: 1rem;
      top: 1rem;
      transform: translateX(-50%), translateY(-50%);
      text-shadow: 0 0 2px #b3b3b3;
    }

    #preview-error {
      color: red;
      transition: all 0.25s;
      font-size: 180pt;
      position: absolute;
      left: 2rem;
      top: 0;
      opacity: 0.8;
    }
  }
</style>

<template>
  <div class="definition-wrapper">
    <webview
      :src="getWebUrl()"
      webpreferences="autoplayPolicy=no-user-gesture-required,contextIsolation,sandbox,disableDialogs,disableHtmlFullScreenWindowResize,webSecurity,enableWebSQL=no,nodeIntegration=no,nativeWindowOpen=no,nodeIntegrationInWorker=no,nodeIntegrationInSubFrames=no,webviewTag=no"
      enableremotemodule="false"
      allowpopups="false"
      nodeIntegration="false"
      partition="persist:adblocked"
      id="defintion-preview"
      ref="definitionPreview"
      class="definition-preview"
    ></webview>
  </div>
</template>
<script lang="ts">
  import Vue from 'vue';
  import { Component, Hook, Prop } from '@f-list/vue-ts';
  import { EventBusEvent } from '../../chat/preview/event-bus';

  import anyAscii from 'any-ascii';
  import log from 'electron-log'; //tslint:disable-line:match-default-export-name

  // tslint:disable-next-line:ban-ts-ignore
  // @ts-ignore
  // tslint:disable-next-line:no-submodule-imports ban-ts-ignore match-default-export-name
  import mutatorScript from '!!raw-loader!./assets/mutator.raw.js';

  const scripts: Record<string, string> = {
    mutator: mutatorScript
  };

  @Component({})
  export default class WordDefinition extends Vue {
    mode: 'dictionary' | 'thesaurus' | 'urbandictionary' | 'wikipedia' = 'dictionary';

    @Prop
    readonly expression?: string;

    @Hook('mounted')
    async mounted(): Promise<void> {
      const webview = this.getWebview();

      const eventProcessor = async (event: EventBusEvent): Promise<void> => {
        const js = this.wrapJs(this.getMutator(this.mode));

        return this.executeJavaScript(js, event);
      };

      webview.addEventListener('update-target-url', eventProcessor);
      webview.addEventListener('dom-ready', eventProcessor);

      // await remote.webContents.fromId(webview.getWebContentsId()).session.clearStorageData({storages: ['cookies', 'indexdb']});
    }

    setMode(mode: 'dictionary' | 'thesaurus' | 'urbandictionary' | 'wikipedia'): void {
      this.mode = mode;
    }

    getWebUrl(): string {
      if (!this.expression) {
        return 'about:blank';
      }

      switch (this.mode) {
        case 'dictionary':
          return `https://www.dictionary.com/browse/${encodeURI(this.getCleanedWordDefinition())}`;

        case 'thesaurus':
          return `https://www.thesaurus.com/browse/${encodeURI(this.getCleanedWordDefinition())}`;

        case 'urbandictionary':
          return `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(this.getCleanedWordDefinition())}`;

        case 'wikipedia':
          return `https://en.m.wikipedia.org/wiki/${encodeURI(this.getCleanedWordDefinition())}`;
      }
    }

    getCleanedWordDefinition(expression = this.expression): string {
      return anyAscii(expression || '')
        .toLowerCase()
        .replace(/[^a-z0-9\-]/g, ' ')
        .replace(/  +/g, ' ')
        .trim();
    }

    protected getWebview(): Electron.WebviewTag {
      return this.$refs.definitionPreview as Electron.WebviewTag;
    }

    protected async executeJavaScript(js: string | undefined, logDetails?: any): Promise<any> {
      const webview = this.getWebview();

      if (!js) {
        log.debug('word-definition.execute-js.missing', { logDetails });
        return;
      }

      try {
        const result = await (webview.executeJavaScript(js) as unknown as Promise<any>);

        log.debug('word-definition.execute-js.result', result);

        return result;
      } catch (err) {
        log.debug('word-definition.execute-js.error', err);
      }
    }

    protected wrapJs(mutatorJs: string): string {
      return `(() => { try { ${mutatorJs} } catch (err) { console.error('Mutator error', err); } })();`;
    }

    protected getMutator(mode: string): string {
      const js = scripts.mutator; // ./assets/mutator.raw.js

      return js.replace(/## SITE ##/g, mode);
    }
  }
</script>

<style lang="scss">
  .word-definition-viewer {
    ul {
      margin-left: 0;
      padding-left: 0;

      li {
        list-style: none;
        padding-left: 0;
        margin-left: 0;

        p {
          margin-bottom: 0.1em;
          color: var(--input-color);
        }

        small {
          display: block;
          margin-bottom: 1.2em;
          color: var(--secondary);
        }
      }
    }
  }
</style>

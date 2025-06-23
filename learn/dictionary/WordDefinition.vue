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
  import { defineComponent, ref, onMounted, PropType } from 'vue';
  import anyAscii from 'any-ascii';
  import log from 'electron-log';
  import mutatorScript from '!!raw-loader!./assets/mutator.raw.js';
  import type { EventBusEvent } from '../../chat/preview/event-bus';

  const scripts: Record<string, string> = {
    mutator: mutatorScript
  };

  export default defineComponent({
    name: 'WordDefinition',
    props: {
      expression: String as PropType<string | undefined>
    },
    setup(props) {
      const mode = ref<
        'dictionary' | 'thesaurus' | 'urbandictionary' | 'wikipedia'
      >('dictionary');
      const definitionPreview = ref<Electron.WebviewTag | null>(null);

      function setMode(
        newMode: 'dictionary' | 'thesaurus' | 'urbandictionary' | 'wikipedia'
      ) {
        mode.value = newMode;
      }

      function getCleanedWordDefinition(expression = props.expression): string {
        return anyAscii(expression || '')
          .toLowerCase()
          .replace(/[^a-z0-9\-]/g, ' ')
          .replace(/  +/g, ' ')
          .trim();
      }

      function getWebUrl(): string {
        if (!props.expression) {
          return 'about:blank';
        }
        switch (mode.value) {
          case 'dictionary':
            return `https://www.dictionary.com/browse/${encodeURI(getCleanedWordDefinition())}`;
          case 'thesaurus':
            return `https://www.thesaurus.com/browse/${encodeURI(getCleanedWordDefinition())}`;
          case 'urbandictionary':
            return `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(getCleanedWordDefinition())}`;
          case 'wikipedia':
            return `https://en.m.wikipedia.org/wiki/${encodeURI(getCleanedWordDefinition())}`;
        }
      }

      function getWebview(): Electron.WebviewTag | null {
        return definitionPreview.value;
      }

      async function executeJavaScript(
        js: string | undefined,
        logDetails?: any
      ): Promise<any> {
        const webview = getWebview();
        if (!webview || !js) {
          log.debug('word-definition.execute-js.missing', { logDetails });
          return;
        }
        try {
          const result = await (webview.executeJavaScript(
            js
          ) as unknown as Promise<any>);
          log.debug('word-definition.execute-js.result', result);
          return result;
        } catch (err) {
          log.debug('word-definition.execute-js.error', err);
        }
      }

      function wrapJs(mutatorJs: string): string {
        return `(() => { try { ${mutatorJs} } catch (err) { console.error('Mutator error', err); } })();`;
      }

      function getMutator(mode: string): string {
        const js = scripts.mutator;
        return js.replace(/## SITE ##/g, mode);
      }

      onMounted(() => {
        const webview = getWebview();
        if (!webview) return;

        const eventProcessor = async (event: EventBusEvent): Promise<void> => {
          const js = wrapJs(getMutator(mode.value));
          return executeJavaScript(js, event);
        };

        webview.addEventListener('update-target-url', eventProcessor as any);
        webview.addEventListener('dom-ready', eventProcessor as any);

        // await remote.webContents.fromId(webview.getWebContentsId()).session.clearStorageData({storages: ['cookies', 'indexdb']});
      });

      return {
        mode,
        definitionPreview,
        setMode,
        getWebUrl,
        getCleanedWordDefinition
      };
    }
  });
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

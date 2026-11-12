import { ImageUrlMutator } from '../image-url-mutator';
import { ImagePreviewHelper } from './helper';
import * as _ from 'lodash';
import { ipcRenderer } from 'electron';
import log from 'electron-log'; //tslint:disable-line:match-default-export-name

export class ExternalImagePreviewHelper extends ImagePreviewHelper {
  protected urlMutator = new ImageUrlMutator(this.parent.debug);

  protected getOpenGraphMediaUrl(
    html: string,
    sourceUrl: string
  ): string | undefined {
    const document = new DOMParser().parseFromString(html, 'text/html');
    const videoType = document
      .querySelector('meta[property="og:video:type"]')
      ?.getAttribute('content');
    // * YouTube and others publish an embed page as og:video (type text/html)
    const videoIsMedia = !videoType || videoType.startsWith('video/');
    const selectors = [
      ...(videoIsMedia
        ? [
            'meta[property="og:video:secure_url"]',
            'meta[property="og:video:url"]',
            'meta[property="og:video"]'
          ]
        : []),
      'meta[property="og:image"]',
      'meta[name="twitter:image"]'
    ];

    for (const selector of selectors) {
      const content = document.querySelector(selector)?.getAttribute('content');

      if (!content) continue;

      try {
        const mediaUrl = new URL(content, sourceUrl);

        if (mediaUrl.protocol === 'http:' || mediaUrl.protocol === 'https:') {
          return mediaUrl.href;
        }
      } catch (err) {
        if (this.debug) log.warn('imagePreview.url.invalid', content);
      }
    }

    return undefined;
  }

  private static readonly RESOLVED_CACHE_LIMIT = 200;

  private resolvedMediaUrls = new Map<string, string>();

  protected async resolveMediaUrl(url: string): Promise<string> {
    const cached = this.resolvedMediaUrls.get(url);

    if (cached !== undefined) return cached;

    const mediaUrl = await this.resolvePreviewMediaUrl(
      await this.urlMutator.resolve(url)
    );

    if (
      this.resolvedMediaUrls.size >=
      ExternalImagePreviewHelper.RESOLVED_CACHE_LIMIT
    ) {
      const oldest = this.resolvedMediaUrls.keys().next().value;

      if (oldest !== undefined) this.resolvedMediaUrls.delete(oldest);
    }

    this.resolvedMediaUrls.set(url, mediaUrl);

    return mediaUrl;
  }

  protected async resolvePreviewMediaUrl(url: string): Promise<string> {
    if (this.parent.isMediaUrl(url)) return url;

    const html: string = await ipcRenderer.invoke('preview-fetch-page', url);
    const mediaUrl = this.getOpenGraphMediaUrl(html, url);

    if (!mediaUrl) {
      throw new Error('No OpenGraph media found');
    }

    return mediaUrl;
  }

  hide(): void {
    const wasVisible = this.visible;

    if (this.parent.debug) log.debug('imagePreview.webview.hide');

    if (wasVisible) {
      const webview = this.parent.getWebview();

      // tslint:disable-next-line:no-floating-promises
      webview.stop();

      webview.loadURL('about:blank').catch((err: any) => {
        log.warn('imagePreview.webview.hide.loadFailed', err);
      });

      this.visible = false;
    }
  }

  getName(): string {
    return 'ExternalImagePreviewHelper';
  }

  reactsToSizeUpdates(): boolean {
    return true;
  }

  shouldTrackLoading(): boolean {
    return true;
  }

  usesWebView(): boolean {
    return true;
  }

  setDebug(debug: boolean): void {
    this.debug = debug;

    this.urlMutator.setDebug(debug);
  }

  show(url: string | undefined): void {
    const webview = this.parent.getWebview();

    if (!this.parent) {
      throw new Error('Empty parent v2');
    }

    if (!webview) {
      throw new Error('Empty webview!');
    }

    if (!url) {
      throw new Error('Empty URL!');
    }

    this.url = url;
    this.visible = true;

    try {
      this.ratio = null;

      webview.stop();
      webview.setAudioMuted(true);

      // Broken promise chain on purpose
      // tslint:disable-next-line:no-floating-promises
      void this.resolveMediaUrl(url)
        .then(async (mediaUrl: string) => {
          if (this.url !== url || !this.visible) return;

          if (this.debug)
            log.debug(
              'imagePreview.webview.load',
              mediaUrl,
              this.url,
              webview.getURL()
            );

          webview.stop();

          try {
            // * Some image hosts (gelbooru etc.) redirect hotlinks without a same-site referer
            await webview.loadURL(mediaUrl, {
              httpReferrer: new URL(mediaUrl).origin
            });
          } catch (err) {
            const previewLoaded = this.parent.state === 'loaded';

            if (previewLoaded) {
              log.debug('imagePreview.webview.loadCancelled', err);
            } else {
              log.warn('imagePreview.webview.loadFailed', err);
            }

            if (this.url === url && this.visible && !previewLoaded) {
              this.parent.setState('error');
            }

            return;
          }

          webview.setAudioMuted(true);
        })
        .catch((err: any) => {
          log.warn('imagePreview.url.resolveFailed', err);

          if (this.url === url && this.visible) {
            this.parent.setState('error');
          }
        });

      // }
    } catch (err) {
      log.error('imagePreview.webview.reuseFailed', err);
    }
  }

  match(domainName: string | undefined, url: string | undefined): boolean {
    if (!domainName || !url) {
      return false;
    }

    return (
      ImagePreviewHelper.HTTP_TESTER.test(url) &&
      !(domainName === 'f-list.net' || domainName === 'static.f-list.net')
    );
  }

  renderStyle(): Record<string, any> {
    return this.isVisible()
      ? _.merge({ display: 'flex' }, this.determineScalingRatio())
      : { display: 'none' };
  }
}

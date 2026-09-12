import { ImageUrlMutator } from '../image-url-mutator';
import { ImagePreviewHelper } from './helper';
import * as _ from 'lodash';
import Axios from 'axios';

export class ExternalImagePreviewHelper extends ImagePreviewHelper {
  protected urlMutator = new ImageUrlMutator(this.parent.debug);

  protected getOpenGraphMediaUrl(
    html: string,
    sourceUrl: string
  ): string | undefined {
    const document = new DOMParser().parseFromString(html, 'text/html');
    const selectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'meta[property="og:video:secure_url"]',
      'meta[property="og:video:url"]',
      'meta[property="og:video"]'
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
        if (this.debug)
          console.warn('ImagePreview: invalid media URL', content);
      }
    }

    return undefined;
  }

  protected async resolvePreviewMediaUrl(url: string): Promise<string> {
    if (this.parent.isMediaUrl(url)) return url;

    const response = await Axios.get<string>(url, {
      responseType: 'text',
      transformResponse: [(data: string) => data]
    });
    const mediaUrl = this.getOpenGraphMediaUrl(response.data, url);

    if (!mediaUrl) {
      throw new Error('No OpenGraph media found');
    }

    return mediaUrl;
  }

  hide(): void {
    const wasVisible = this.visible;

    if (this.parent.debug) console.log('ImagePreview: exec hide mutator');

    if (wasVisible) {
      const webview = this.parent.getWebview();

      // tslint:disable-next-line:no-floating-promises
      webview.stop();

      webview.loadURL('about:blank').catch((err: any) => {
        console.warn('webview.loadURL() in hide()', err);
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
      void this.urlMutator
        .resolve(url)
        .then(async (finalUrl: string) => {
          const mediaUrl = await this.resolvePreviewMediaUrl(finalUrl);

          if (this.url !== url || !this.visible) return;

          if (this.debug)
            console.log(
              'ImagePreview: must load',
              mediaUrl,
              this.url,
              webview.getURL()
            );

          webview.stop();

          await webview.loadURL(mediaUrl);

          webview.setAudioMuted(true);
        })
        .catch((err: any) => {
          console.warn('ImagePreview: unable to resolve preview media', err);

          if (this.url === url && this.visible) {
            this.parent.setState('error');
          }
        });

      // }
    } catch (err) {
      console.error('ImagePreview: Webview reuse error', err);
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

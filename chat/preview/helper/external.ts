import { ImageUrlMutator } from '../image-url-mutator';
import { ImagePreviewHelper } from './helper';
import * as _ from 'lodash';

export class ExternalImagePreviewHelper extends ImagePreviewHelper {
    protected lastExternalUrl: string | null = null;

    protected allowCachedUrl = true;

    protected urlMutator = new ImageUrlMutator(this.parent.debug);

    protected ratio: number | null = null;

    hide(): void {
        const wasVisible = this.visible;

        if (this.parent.debug)
            console.log('ImagePreview: exec hide mutator');

        if (wasVisible) {
            const webview = this.parent.getWebview();

            // if (this.allowCachedUrl) {
            //     // tslint:disable-next-line:no-floating-promises
            //     webview.executeJavaScript(this.parent.jsMutator.getHideMutator());
            // } else {

            // tslint:disable-next-line:no-floating-promises
            webview.loadURL('about:blank');

            //}

            this.visible = false;
        }
    }


    setRatio(ratio: number): void {
        this.ratio = ratio;
    }


    setDebug(debug: boolean): void {
        this.debug = debug;

        this.urlMutator.setDebug(debug);
    }


    show(url: string): void {
        const webview = this.parent.getWebview();

        if (!this.parent) {
            throw new Error('Empty parent v2');
        }

        if (!webview) {
            throw new Error('Empty webview!');
        }

        // const oldUrl = this.url;
        // const oldLastExternalUrl = this.lastExternalUrl;

        this.url = url;
        this.lastExternalUrl = url;
        this.visible = true;

        try {
            // if ((this.allowCachedUrl) && ((webview.getURL() === url) || (url === oldLastExternalUrl))) {
            //     if (this.debug)
            //         console.log('ImagePreview: exec re-show mutator');
            //
            //     // tslint:disable-next-line:no-floating-promises
            //     webview.executeJavaScript(this.parent.jsMutator.getReShowMutator());
            // } else {
            //     if (this.debug)
            //         console.log('ImagePreview: must load; skip re-show because urls don\'t match', this.url, webview.getURL());

            this.ratio = null;

            webview.stop();

            // Broken promise chain on purpose
            // tslint:disable-next-line:no-floating-promises
            this.urlMutator.resolve(url)
                .then(
                    async(finalUrl: string) => {
                        if (this.debug)
                            console.log('ImagePreview: must load', finalUrl, this.url, webview.getURL());

                        webview.stop();

                        return webview.loadURL(finalUrl);
                    }
                );

            // }
        } catch (err) {
            console.error('ImagePreview: Webview reuse error', err);
        }
    }


    match(domainName: string): boolean {
        return !((domainName === 'f-list.net') || (domainName === 'static.f-list.net'));
    }


    determineScalingRatio(): Record<string, any> {
        // ratio = width / height
        const ratio = this.ratio;

        if (!ratio) {
            return {};
        }

        const ww = window.innerWidth;
        const wh = window.innerHeight;

        const maxWidth = Math.round(ww * 0.5);
        const maxHeight = Math.round(wh * 0.7);

        if (ratio >= 1) {
            const presumedWidth = maxWidth;
            const presumedHeight = presumedWidth / ratio;

            return {
                width: `${presumedWidth}px`,
                height: `${presumedHeight}px`
            };
        // tslint:disable-next-line:unnecessary-else
        } else {
            const presumedHeight = maxHeight;
            const presumedWidth = presumedHeight * ratio;

            return {
                width: `${presumedWidth}px`,
                height: `${presumedHeight}px`
            };
        }
    }

    renderStyle(): Record<string, any> {
        return this.isVisible()
            ? _.merge({ display: 'flex' }, this.determineScalingRatio())
            : { display: 'none' };
    }
}


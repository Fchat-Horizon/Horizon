import ImagePreview from '../ImagePreview.vue';

export abstract class ImagePreviewHelper {
  static readonly HTTP_TESTER = /^https?:\/\//;

  protected visible = false;
  protected url: string | undefined = 'about:blank';
  protected parent: ImagePreview;
  protected debug: boolean;

  abstract show(url: string | undefined): void;
  abstract hide(): void;
  abstract match(domainName: string | undefined, url: string | undefined): boolean;
  abstract renderStyle(): Record<string, any>;
  abstract getName(): string;

  abstract reactsToSizeUpdates(): boolean;
  abstract setRatio(ratio: number): void;
  abstract shouldTrackLoading(): boolean;
  abstract usesWebView(): boolean;

  constructor(parent: ImagePreview) {
    if (!parent) {
      throw new Error('Empty parent!');
    }

    this.parent = parent;
    this.debug = parent.debug;
  }

  isVisible(): boolean {
    return this.visible;
  }

  getUrl(): string | undefined {
    return this.url;
  }

  setDebug(debug: boolean): void {
    this.debug = debug;
  }
}

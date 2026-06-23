import ImagePreview from '../ImagePreview.vue';

export abstract class ImagePreviewHelper {
  static readonly HTTP_TESTER = /^https?:\/\//;

  protected visible = false;
  protected url: string | undefined = 'about:blank';
  protected parent: ImagePreview;
  protected debug: boolean;
  protected ratio: number | null = null;

  abstract show(url: string | undefined): void;
  abstract hide(): void;
  abstract match(
    domainName: string | undefined,
    url: string | undefined
  ): boolean;
  abstract renderStyle(): Record<string, any>;
  abstract getName(): string;

  abstract reactsToSizeUpdates(): boolean;
  abstract shouldTrackLoading(): boolean;
  abstract usesWebView(): boolean;

  setRatio(ratio: number): void {
    this.ratio = ratio;
  }

  determineScalingRatio(): Record<string, any> {
    if (!this.ratio) {
      return {};
    }

    const ww = window.innerWidth;
    const wh = window.innerHeight;

    const maxWidth = Math.round(ww * 0.5);
    const maxHeight = Math.round(wh * 0.7);

    if (this.ratio >= 1) {
      const presumedWidth = Math.min(maxWidth, maxHeight * this.ratio);
      const presumedHeight = presumedWidth / this.ratio;
      return {
        width: `${Math.round(presumedWidth)}px`,
        height: `${Math.round(presumedHeight)}px`
      };
    } else {
      const presumedHeight = Math.min(maxHeight, maxWidth / this.ratio);
      const presumedWidth = presumedHeight * this.ratio;
      return {
        width: `${Math.round(presumedWidth)}px`,
        height: `${Math.round(presumedHeight)}px`
      };
    }
  }

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

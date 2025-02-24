import { ImagePreviewHelper } from './helper';

export class LocalImagePreviewHelper extends ImagePreviewHelper {
  hide(): void {
    this.visible = false;
    this.url = undefined;
  }

  getName(): string {
    return 'LocalImagePreviewHelper';
  }

  show(url: string | undefined): void {
    this.visible = true;
    this.url = url;
  }

  setRatio(_ratio: number): void {
    // do nothing
  }

  reactsToSizeUpdates(): boolean {
    return false;
  }

  shouldTrackLoading(): boolean {
    return false;
  }

  usesWebView(): boolean {
    return false;
  }

  match(domainName: string | undefined, url: string | undefined): boolean {
    if (!domainName || !url) {
      return false;
    }

    return ImagePreviewHelper.HTTP_TESTER.test(url) && (domainName === 'f-list.net' || domainName === 'static.f-list.net');
  }

  renderStyle(): Record<string, any> {
    return this.isVisible() ? { backgroundImage: `url(${this.getUrl()})`, display: 'block' } : { display: 'none' };
  }
}

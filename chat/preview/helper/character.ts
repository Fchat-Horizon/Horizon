import { ImagePreviewHelper } from './helper';

export class CharacterPreviewHelper extends ImagePreviewHelper {
  static readonly FLIST_CHARACTER_PROTOCOL_TESTER = /^flist-character:\/\/(.+)/;

  hide(): void {
    this.visible = false;
    this.url = undefined;
  }

  getName(): string {
    return 'CharacterPreviewHelper';
  }

  show(url: string | undefined): void {
    this.visible = true;
    this.url = url;

    if (!url) {
      return;
    }

    const match = url.match(CharacterPreviewHelper.FLIST_CHARACTER_PROTOCOL_TESTER);

    if (!match) {
      return;
    }

    const characterName = match[1];

    // tslint:disable-next-line no-floating-promises
    this.parent.getCharacterPreview().load(characterName);
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

  match(_domainName: string | undefined, url: string | undefined): boolean {
    if (!url) {
      return false;
    }

    return CharacterPreviewHelper.FLIST_CHARACTER_PROTOCOL_TESTER.test(url);
  }

  renderStyle(): Record<string, any> {
    return this.isVisible() ? { display: 'block' } : { display: 'none' };
  }
}

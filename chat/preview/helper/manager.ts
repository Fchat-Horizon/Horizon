import _ from 'lodash';
import { ImagePreviewHelper } from './helper';
import ImagePreview from '../ImagePreview.vue';

export type RenderStyle = Record<string, any>;

export interface PreviewManagerHelper {
  helper: ImagePreviewHelper;
  renderStyle: RenderStyle;
}

export class PreviewManager {
  private parent: ImagePreview;

  private helpers: PreviewManagerHelper[];

  private debugMode = false;

  constructor(parent: ImagePreview, helperInstances: ImagePreviewHelper[]) {
    this.parent = parent;
    this.helpers = _.map(helperInstances, helper => ({ helper, renderStyle: {} }));
  }

  match(domain: string | undefined, url: string | undefined): PreviewManagerHelper | undefined {
    return _.find(this.helpers, h => h.helper.match(domain, url));
  }

  matchIndex(domain: string | undefined, url: string | undefined): number {
    return _.findIndex(this.helpers, h => h.helper.match(domain, url));
  }

  renderStyles(): Record<string, RenderStyle> {
    _.each(this.helpers, h => {
      h.renderStyle = h.helper.renderStyle();

      this.debugLog('ImagePreview: pm.renderStyles()', h.helper.constructor.name, JSON.parse(JSON.stringify(h.renderStyle)));
    });

    return _.fromPairs(_.map(this.helpers, h => [h.helper.getName(), h.renderStyle]));
  }

  getVisiblePreview(): ImagePreviewHelper | undefined {
    const found = _.find(this.helpers, h => h.helper.isVisible());

    return found ? found.helper : undefined;
  }

  show(url: string | undefined, domain: string | undefined): ImagePreviewHelper | undefined {
    const matchedHelper = this.match(domain, url);

    _.each(
      _.filter(this.helpers, h => h !== matchedHelper),
      h => h.helper.hide()
    );

    if (!matchedHelper) {
      this.debugLog('ImagePreview: pm.show()', 'Unmatched helper', url, domain);
      return undefined;
    }

    matchedHelper.helper.show(url);
    return matchedHelper.helper;
  }

  hide(): void {
    _.each(this.helpers, h => {
      this.debugLog('ImagePreview: pm.hide()', h.helper.constructor.name, h.helper.isVisible());
      h.helper.hide();
    });
  }

  getVisibilityStatus(): Record<string, boolean> {
    return _.fromPairs(_.map(this.helpers, h => [h.helper.constructor.name, h.helper.isVisible()]));
  }

  setDebug(debugMode: boolean): void {
    _.each(this.helpers, h => h.helper.setDebug(debugMode));

    this.debugMode = debugMode;
  }

  debugLog(...messages: any[]): void {
    if (this.debugMode) {
      this.parent.debugLog(...messages);
    }
  }
}

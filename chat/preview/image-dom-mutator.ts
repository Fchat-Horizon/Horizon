/* tslint:disable:quotemark */

import * as _ from 'lodash';
import * as urlHelper from 'url';

import { domain as extractDomain } from '../../bbcode/core';

// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
// tslint:disable-next-line:no-submodule-imports ban-ts-ignore match-default-export-name
import processorScript from '!!raw-loader!./assets/browser.processor.raw.js';

export interface DomMutator {
  match: string | RegExp;
  injectJs: string;
  eventName: string;

  urlMutator?(url: string): string;
}

// tslint:disable-next-line:max-line-length
const imgurOuterStyle =
  'z-index: 1000000; position: absolute; bottom: 0.75rem; right: 0.75rem; background: rgba(0, 128, 0, 0.8); border: 2px solid rgba(144, 238, 144, 0.5); width: 3rem; height: 3rem; font-size: 15pt; font-weight: normal; color: white; border-radius: 3rem; margin: 0; font-family: Helvetica,Arial,sans-serif; box-shadow: 2px 2px 2px rgba(0,0,0,0.5)';
// tslint:disable-next-line:max-line-length
const imgurInnerStyle =
  'position: absolute; top: 50%; left: 50%; transform: translateY(-50%) translateX(-50%); text-shadow: 1px 1px 2px rgba(0,0,0,0.4);';

export interface DomMutatorScripts {
  processor: string;
}

export class ImageDomMutator {
  // tslint:disable: prefer-function-over-method
  private hostMutators: Record<string, DomMutator> = {};
  private regexMutators: DomMutator[] = [];
  private debug: boolean;
  private scripts: DomMutatorScripts = { processor: '' };

  constructor(debug: boolean) {
    // this.debug = debug;
    this.debug = debug || true;
  }

  setDebug(debug: boolean): void {
    this.debug = debug;
  }

  mutateUrl(url: string): string {
    const mutator = this.matchMutator(url);

    if (!mutator || !mutator.urlMutator) return url;

    return mutator.urlMutator(url);
  }

  getMutatorJsForSite(url: string, eventName: string): string | undefined {
    let mutator = this.matchMutator(url);

    if (!mutator) {
      mutator = this.hostMutators['default'];
    }

    if (!mutator || mutator.eventName !== eventName) return;

    // console.log(`Mutator match: ${mutator.match}`, (mutator === this.hostMutators['default']), url);

    return this.wrapJs(mutator.injectJs) + this.getReShowMutator();
  }

  matchMutator(url: string): DomMutator | undefined {
    if (url === 'about:blank') {
      return this.hostMutators['about:blank'];
    }

    const urlDomain = extractDomain(url);

    if (!urlDomain) return;

    if (urlDomain in this.hostMutators) return this.hostMutators[urlDomain];

    return _.find(this.regexMutators, (m: DomMutator) => {
      const match = m.match;

      return match instanceof RegExp ? urlDomain.match(match) !== null : match === urlDomain;
    });
  }

  protected wrapJs(mutatorJs: string): string {
    return `(() => { try { ${mutatorJs} } catch (err) { console.error('Mutator error', err); } })();`;
  }

  protected add(
    domain: string | RegExp,
    mutatorJs: string,
    urlMutator?: (url: string) => string,
    eventName: string = 'update-target-url'
  ): void {
    if (domain instanceof RegExp) {
      this.regexMutators.push({
        match: domain,
        injectJs: mutatorJs,
        urlMutator,
        eventName
      });

      return;
    }

    this.hostMutators[domain] = {
      match: domain,
      injectJs: mutatorJs,
      urlMutator,
      eventName
    };
  }

  protected async loadScripts(): Promise<void> {
    this.scripts = {
      processor: processorScript
    };
  }

  async init(): Promise<void> {
    await this.loadScripts();

    /* tslint:disable max-line-length */
    this.add('default', this.getBaseJsMutatorScript(['.content video', '.content img', '#video, video', '#image, img']));
    this.add('about:blank', '');
    this.add('e621.net', this.getBaseJsMutatorScript(['video', '#image']));
    this.add('e-hentai.org', this.getBaseJsMutatorScript(['video', '#img']));
    this.add('gelbooru.com', this.getBaseJsMutatorScript(['video.gelcomVPlayer', '.post-view video', '.contain-push video', '#image']));
    this.add('gyazo.com', this.getBaseJsMutatorScript(['.image-view video', '.image-view img']));
    this.add('chan.sankakucomplex.com', this.getBaseJsMutatorScript(['video', '#image']));
    this.add('danbooru.donmai.us', this.getBaseJsMutatorScript(['video', '#image']));
    this.add('gfycat.com', this.getBaseJsMutatorScript(['video'], true, [], true));
    this.add('gfycatporn.com', this.getBaseJsMutatorScript(['video'], true, [], true));
    this.add('instantfap.com', this.getBaseJsMutatorScript(['#post video', '#post img']));
    this.add('webmshare.com', this.getBaseJsMutatorScript(['video']));
    this.add('vimeo.com', this.getBaseJsMutatorScript(['#video, video', '#image, img']));
    this.add('sex.com', this.getBaseJsMutatorScript(['.image_frame video', '.image_frame img']), undefined, 'dom-ready');
    // this.add('redirect.media.tumblr.com', this.getBaseJsMutatorScript(['picture video', 'picture img']));
    this.add(
      /^[a-zA-Z0-9-]+\.media\.tumblr\.com$/,
      this.getBaseJsMutatorScript([
        '.photoset video',
        '.photoset img',
        'img:not([role="img"]):not([alt="Avatar"])',
        '#base-container video',
        '#base-container img',
        'picture video',
        'picture img',
        'video',
        'img'
      ]),
      undefined,
      'dom-ready'
    );
    this.add(
      /^[a-zA-Z0-9-]+\.tumblr\.com$/,
      this.getBaseJsMutatorScript([
        '.photoset iframe',
        '.photoset video',
        '.photoset img',
        'img:not([role="img"]):not([alt="Avatar"])',
        'picture video',
        'picture img',
        'video',
        'img'
      ]),
      undefined,
      'dom-ready'
    );
    this.add('postimg.cc', this.getBaseJsMutatorScript(['video', '#main-image']));
    this.add('gifsauce.com', this.getBaseJsMutatorScript(['video']));
    // this.add('motherless.com', this.getBaseJsMutatorScript(['.content video', '.content img']));
    this.add(/^media[0-9]\.giphy\.com$/, this.getBaseJsMutatorScript(['video', 'img[alt]']));
    this.add('giphy.com', this.getBaseJsMutatorScript(['video', 'a > div > img']));
    this.add(/^media[0-9]\.tenor\.com$/, this.getBaseJsMutatorScript(['#view .file video', '#view .file img']));
    this.add('tenor.com', this.getBaseJsMutatorScript(['#view video', '#view img']));
    this.add('hypnohub.net', this.getBaseJsMutatorScript(['video', '#image', 'img']));
    this.add('derpibooru.org', this.getBaseJsMutatorScript(['video', '#image-display', 'img']));
    this.add('sexbot.gallery', this.getBaseJsMutatorScript(['video.hero', 'video']));
    this.add('imagefap.com', this.getBaseJsMutatorScript(['.image-wrapper img', 'video', 'img']));
    this.add('myhentaicomics.com', this.getBaseJsMutatorScript(['#entire_image img', 'video', 'img']));
    this.add('redgifs.com', this.getBaseJsMutatorScript(['video'])); // , true, [], false, true));
    this.add('furaffinity.net', this.getBaseJsMutatorScript(['#submissionImg', 'video', 'img']));
    this.add('rule34.paheal.net', this.getBaseJsMutatorScript(['#main_image', 'video', 'img']));
    this.add('xhamster.com', this.getBaseJsMutatorScript(['#photo_slider video', '#photo_slider img', 'video', 'img']));
    this.add('shadbase.com', this.getBaseJsMutatorScript(['#comic video', '#comic img', 'video', 'img']));
    this.add('instagram.com', this.getBaseJsMutatorScript(['article video', 'article img', 'video', 'img']));
    this.add('rule34video.com', this.getBaseJsMutatorScript(['video'], true, [], false, true));
    this.add('rule34.us', this.getBaseJsMutatorScript(['.content_push video', '.content_push img']));

    this.add(
      'pornhub.com',
      this.getBaseJsMutatorScript([/*'#__flistCore', '#player', */ '#photoImageSection img', 'video', 'img', '#player'], false)
    );

    this.add('tiktokstalk.com', this.getBaseJsMutatorScript(['video'], false, [], true, true));

    this.add(
      'gifmixxx.com',
      `
                const bgImage = document.querySelector('.gif.fit');
                const bgImageStyle = bgImage.style.backgroundImage;
                ${this.getBaseJsMutatorScript(['.gif.fit', '.gif', 'video', 'img'])};
                bgImage.style.backgroundImage = bgImageStyle;
                bgImage.style.backgroundSize = 'contain';
                bgImage.style.backgroundRepeat = 'no-repeat';
                bgImage.style.color = 'transparent';
            `
    );

    this.add(
      'i.imgur.com',
      `
                const imageCount = (new URL(window.location.href)).searchParams.get('flist_gallery_image_count');

                ${this.getBaseJsMutatorScript(['video', 'img'])}

                if(imageCount > 1) {
                    ${this.injectHtmlJs(`<div id="imageCount" style="${imgurOuterStyle}"><div id="imageCountInner" style="${imgurInnerStyle}"></div></div>`)}

                    const imageCountEl = document.getElementById('imageCountInner');

                    if (imageCountEl) {
                        imageCountEl.innerHTML = '' + (imageCount);
                    }
                }
            `
    );

    this.add(
      'imgur.com',
      `
                const imageCount = $('.post-container video, .post-container img').length;

                ${this.getBaseJsMutatorScript(['.post-container video', '.post-container img'], true)}

                if(imageCount > 1)
                    $('#flistWrapper').append('<div id="imageCount" style="${imgurOuterStyle}"><div style="${imgurInnerStyle}">+' + (imageCount - 1) + '</div></div>');
            `
    );

    this.add(
      'rule34.xxx',
      `${this.getBaseJsMutatorScript(['video', '#image'])}
                const content = document.querySelector('#content');

                if (content) content.remove();
            `,
      undefined,
      'dom-ready'
    );

    this.add('hentai-foundry.com', this.getBaseJsMutatorScript(['#picBox video', '#picBox img']), (url: string): string => {
      const u = urlHelper.parse(url, true);

      if (!u) return url;

      // tslint:disable-next-line no-any
      (u.query as any).enterAgree = 1;

      u.search = null;

      return urlHelper.format(u);
    });

    this.add(
      'twitter.com',
      `
            const finalizer = (counter) => {
                if (counter <= 0) {
                    return;
                }

                setTimeout(
                    () => {
                        const e = document.querySelector('#flistWrapper img');

                        if (e) {
                            const src = e.getAttribute('src');

                            if (src) {
                                e.setAttribute('src', src.replace(/name\=[a-z0-9\-\_]+/, 'name=large'));
                            }
                        }

                        const v = document.querySelector('#flistWrapper video');

                        if (v) {
                            v.play();
                        }

                        finalizer(counter - 1);
                    },
                    100
                );
            };

            const scheduler = () => {
                setTimeout(
                    () => {
                        // skip content warning
                        document.querySelectorAll('article article div[tabindex="0"] *').forEach(e => e.click());

                        if (!document.querySelector('article video, div[aria-label="Image"] img')) {
                            console.log('NOT FOUND');
                            scheduler();
                            return;
                        }

                        ${this.getBaseJsMutatorScript(['article video', "div[aria-label='Image'] img"])}

                        finalizer(25);
                    },
                    200
                );
            };

            scheduler();
            `
    );
  }

  protected getBaseJsMutatorScript(
    elSelector: string[],
    skipElementRemove: boolean = false,
    safeTags: string[] = [],
    delayPreprocess: boolean = false,
    scheduled: boolean = false
  ): string {
    const js = this.scripts.processor; // ./assets/browser.processor.raw.js

    const settings = {
      skipElementRemove,
      safeTags,
      delayPreprocess,
      selectors: elSelector,
      schedule: scheduled,
      debug: this.debug
    };

    const settingsJson = JSON.stringify(settings, null, 0);

    return js.replace(/\/\* ## SETTINGS_START[^]*SETTINGS_END ## \*\//m, `this.settings = ${settingsJson};`);
  }

  getErrorMutator(code: number, description: string): string {
    const errorHtml = `
            <div id="flistError" style="
                width: 100% !important;
                height: 100% !important;
                background-color: black !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                z-index: 200000 !important;
                margin: 0 !important;
                padding: 0 !important;
                line-height: 100% !important;
                border: 0 !important;
                opacity: 1 !important;
                text-align: center !important;
            "><h1 style="
                color: #FF4444 !important;
                font-size: 45pt !important;
                margin: 0 !important;
                margin-top: 10pt !important;
                line-height: 100% !important;
                padding: 0 !important;
                border: 0 !important;
                background: none !important;
                font-family: Helvetica, Arial, sans-serif !important;
                font-weight: bold !important;
            ">${code}</h1><p style="
                max-width: 400px !important;
                color: #ededed !important;
                display: inline-block !important;
                font-size: 15pt !important;
                font-family: Helvetica, Arial, sans-serif !important;
                font-weight: 300 !important;
                border: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                margin-top: 5pt !important;
                line-height: 130% !important;
            ">${description}</p></div>
        `;

    return this.injectHtmlJs(errorHtml);
  }

  protected injectHtmlJs(html: string): string {
    return this.wrapJs(`
            const range = document.createRange();

            range.selectNode(document.body);

            const error = range.createContextualFragment(\`${html}\`);

            document.body.appendChild(error);
        `);
  }

  getHideMutator(): string {
    return (
      this.injectHtmlJs(`
            <div id="flistHider" style="
                width: 100% !important;
                height: 100% !important;
                background-color: black !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                z-index: 300000 !important;
                margin: 0 !important;
                padding: 0 !important;
                line-height: 100% !important;
                border: 0 !important;
                opacity: 1 !important;
                text-align: center !important;
            "></div>
        `) +
      this.wrapJs(
        `
                window.__flistUnhide = () => {
                    const elements = document.querySelectorAll('#flistHider');

                    if (elements) {
                        elements.forEach( (el) => el.remove() );
                    }
                };
            `
      )
    );
  }

  getReShowMutator(): string {
    return this.wrapJs(
      `
            const elements = document.querySelectorAll('#flistHider');

            if (elements) {
                elements.forEach( (el) => el.remove() );
            }
            `
    );
  }
}

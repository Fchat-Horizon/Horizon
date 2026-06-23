/*
    This script is MUTATED and EXECUTED after DOM has loaded
    It is wrapped into a `(() => {})();` to prevent it from polluting its surroundings.

    Avoid using array functions, such as `arr.forEach`, as some websites override them with incompatible functions

    Do not remove the `SETTINGS_START` and `SETTINGS_END` markers below,
    they are used for dynamically injecting settings from Electron.
*/

const sizePairs = [
  ['naturalWidth', 'naturalHeight'],
  ['videoWidth', 'videoHeight'],
  ['width', 'height']
];

class FListImagePreviewDomMutator {
  constructor(settings) {
    /* ## SETTINGS_START ## */
    this.settings = settings || {
      selectors: ['video', 'img'],
      debug: true,
      skipElementRemove: false,
      safeTags: [],
      injectStyle: false,
      delayPreprocess: false,
      schedule: false
    };
    /* ## SETTINGS_END ## */

    // this.settings.debug = true;

    this.startTime = Date.now();

    this.selectors = this.settings.selectors;
    this.skipElementRemove = this.settings.skipElementRemove;
    this.safeTags = this.settings.safeTags;
    this.delayPreprocess = this.settings.delayPreprocess;

    this.body = document.querySelector('body');
    this.html = document.querySelector('html');

    this.ipcRenderer = {
      sendToHost:
        window && window.rising && window.rising.sendToHost
          ? window.rising.sendToHost
          : (...args) => this.debug('MOCK.ipc.sendToHost', ...args)
    };

    if (!this.delayPreprocess) {
      this.preprocess();
    }

    this.img = this.detectImage(this.selectors, this.body);
    this.wrapper = this.createWrapperElement();
    this.style = this.createStyleElement();
  }

  preprocess() {
    for (const el of document.querySelectorAll(
      'header, .header, nav, .nav, .navbar, .navigation'
    )) {
      try {
        el.remove();
      } catch (err) {
        this.error('preprocess', err);
      }
    }
  }

  isVideoUrl(url) {
    const cleanUrl = url.split('?')[0].toLowerCase();
    const videoExtensions = [
      '.mp4',
      '.webm',
      '.mov',
      '.avi',
      '.mkv',
      '.flv',
      '.wmv',
      '.m4v',
      '.3gp',
      '.ogv'
    ];

    return videoExtensions.some(ext => cleanUrl.endsWith(ext));
  }

  detectImage(selectors, body) {
    if (this.settings.useOpenGraph !== false) {
      const imageMeta =
        document.querySelector('meta[property="og:image"]') ||
        document.querySelector('meta[name="twitter:image"]');

      if (imageMeta) {
        const imageUrl = imageMeta.getAttribute('content');
        if (imageUrl) {
          const isVideoUrl = this.isVideoUrl(imageUrl);

          if (isVideoUrl) {
            const video = document.createElement('video');
            video.src = imageUrl;
            video.autoplay = false;
            video.controls = true;
            video.loop = true;
            video.preload = 'metadata';
            video.muted = true;

            video.onerror = () => {
              this.debug(
                'detectImage.ogVideoError',
                imageUrl,
                'falling back to selectors'
              );
              // Note: We can't easily fall back here since we're in detectImage,
              // but the error will be logged for debugging
            };

            this.debug('detectImage.ogFoundVideo', imageUrl);
            return video;
          } else {
            const img = document.createElement('img');
            img.src = imageUrl;
            this.debug('detectImage.ogFoundImage', imageUrl);
            return img;
          }
        }
      }
    }

    // Fallback to original behavior (First image found)
    let selected = [];

    for (const selector of selectors) {
      const selectedElements = Array.from(
        document.querySelectorAll(selector)
      ).filter(i => i.width !== 1 && i.height !== 1);
      selected = selected.concat(selectedElements);
    }

    this.debug('detectImage.selected', selectors, selected);

    const img = selected.filter(el => el !== body).shift();

    this.debug('detectImage.found', !!img, img, body);

    return img;
  }

  run() {
    if (!this.img) {
      return;
    }

    if (this.delayPreprocess) {
      this.preprocess();
    }

    this.updateImgSize(this.img, 'pre');

    this.attachImgToWrapper(this.img, this.wrapper);
    this.attachWrapperToBody(this.wrapper, this.body);
    this.attachStyleToWrapper(this.style, this.wrapper);

    this.forceElementStyling(this.html, this.body, this.wrapper, this.img);

    this.resolveVideoSrc(this.img);

    this.setEventListener('DOMContentLoaded', this.img);
    this.setEventListener('load', this.img);
    this.setEventListener('loadstart', this.img);

    this.attemptPlay(this.img, true);

    this.updateImgSizeTimer(this.img);

    this.cleanDom(this.body);

    this.finalize();
  }

  cleanDom(body) {
    if (this.skipElementRemove) {
      return;
    }

    const removeList = [];
    const safeIds = ['flistWrapper', 'flistError', 'flistHider', 'flistStyle'];
    const safeTags = this.safeTags;

    for (const el of body.childNodes) {
      try {
        if (
          safeIds.indexOf(el.id) < 0 &&
          (!el.tagName || safeTags.indexOf(el.tagName.toLowerCase()) < 0)
        ) {
          removeList.push(el);
        }
      } catch (err) {
        this.error('cleanDom find nodes', err);
      }
    }

    for (const el of removeList) {
      try {
        el.remove();
      } catch (err) {
        this.error('cleanDom remove element', err);
      }
    }
  }

  updateImgSizeTimer(img) {
    const result = this.updateImgSize(img, 'timer');

    if (!result) {
      setTimeout(() => this.updateImgSizeTimer(img), 100);
    }
  }

  resolveVideoSrc(img) {
    if (
      img.src ||
      !img.tagName ||
      (img.tagName && img.tagName.toUpperCase() !== 'VIDEO')
    ) {
      return;
    }

    this.debug('resolveVideoSrc', 'Needs a content URL', img);

    const contentUrls = document.querySelectorAll(
      'meta[itemprop="contentURL"]'
    );

    if (contentUrls && contentUrls.length > 0) {
      this.debug('Found content URLs', contentUrls);

      const cu = contentUrls[0];

      if (
        cu.attributes &&
        cu.attributes.content &&
        cu.attributes.content.value
      ) {
        this.debug('Content URL', cu.attributes.content.value);

        img.src = cu.attributes.content.value;
      }
    }
  }

  setEventListener(eventName, img) {
    document.addEventListener(eventName, event => {
      this.debug('event', eventName, event);

      this.updateImgSize(img, `event.${eventName}`);
      this.attemptPlay(img, false);
    });
  }

  async attemptPlay(img, lessStrict) {
    this.debug('attemptPlay', img, lessStrict);

    try {
      if (
        img.play &&
        (lessStrict || (!lessStrict && !img.ended && !(img.currentTime > 0)))
      ) {
        img.onpause = () => {
          img.muted = true;
          img.loop = true;
          img.play();
        };

        img.muted = true;
        img.loop = true;

        const result = await img.play();

        img.muted = true;
        img.loop = true;

        this.debug('attemptPlay result', result);
      } else {
        this.debug('attemptPlay skip', img.ended, img.currentTime);
      }
    } catch (err) {
      this.error('attemptPlay', err, img, lessStrict);
    }
  }

  forceElementStyling(html, body, wrapper, img) {
    try {
      body.class = '';
      img.class = '';
      wrapper.class = '';
      html.class = '';

      body.removeAttribute('class');
      img.removeAttribute('class');
      wrapper.removeAttribute('class');
      html.removeAttribute('class');

      img.removeAttribute('width');
      img.removeAttribute('height');
    } catch (err) {
      this.error('forceElementStyling remove class', err);
    }

    html.style = this.getWrapperStyleOverrides();
    body.style = this.getWrapperStyleOverrides();
    img.style = this.getImageStyleOverrides();
  }

  attachWrapperToBody(wrapper, body) {
    body.append(wrapper);
  }

  attachStyleToWrapper(style, wrapper) {
    try {
      wrapper.append(style);
    } catch (err) {
      this.error('attach style', err);
    }
  }

  attachImgToWrapper(img, wrapper) {
    try {
      img.remove();
    } catch (err) {
      this.error('attachImgToWrapper', 'remove()', err);

      try {
        img.parentNode.removeChild(img);
      } catch (err2) {
        this.error('attachImgToWrapper', 'removeChild()', err2);
      }
    }

    wrapper.append(img);
  }

  createWrapperElement() {
    const el = document.createElement('div');
    el.id = 'flistWrapper';

    el.style =
      this.getWrapperStyleOverrides() +
      'z-index: 100000 !important;' +
      'background-color: black !important;' +
      'background-size: contain !important;' +
      'background-repeat: no-repeat !important;' +
      'background-position: top left !important;';

    return el;
  }

  createStyleElement() {
    if (!!this.settings.skipInjectStyle) {
      return document.createElement('i');
    }

    const el = document.createElement('style');

    el.id = 'flistStyle';

    el.textContent = `
            html {
                ${this.getWrapperStyleOverrides()}
            }
            
            body {
                ${this.getWrapperStyleOverrides()}
            }
        
            #flistWrapper img, #flistWrapper video {
                ${this.getImageStyleOverrides()}
            }
        `;

    return el;
  }

  resolveImgSize(img) {
    const solved = {};

    for (let ri = 0; ri < sizePairs.length; ri++) {
      const val = sizePairs[ri];

      if (img[val[0]] && img[val[1]]) {
        solved.width = img[val[0]];
        solved.height = img[val[1]];
        break;
      }
    }

    return solved;
  }

  updateImgSize(img, stage) {
    const imSize = this.resolveImgSize(img);

    if (imSize.width && imSize.height) {
      this.debug('IPC webview.img', imSize, stage);

      this.ipcRenderer.sendToHost(
        'webview.img',
        imSize.width,
        imSize.height,
        stage
      );
      return true;
    }

    return false;
  }

  getBasicStyleOverrides() {
    return (
      'border: 0 !important;' +
      'padding: 0 !important;' +
      'margin: 0 !important;' +
      'width: 100% !important;' +
      'height: 100% !important;' +
      'opacity: 1 !important;' +
      'min-width: initial !important;' +
      'min-height: initial !important;' +
      'max-width: initial !important;' +
      'max-height: initial !important;' +
      'display: block !important;' +
      'visibility: visible !important;'
    );
  }

  getWrapperStyleOverrides() {
    return (
      this.getBasicStyleOverrides() +
      'overflow: hidden !important;' +
      'top: 0 !important;' +
      'left: 0 !important;' +
      'position: absolute !important;'
    );
  }

  getImageStyleOverrides() {
    return (
      this.getBasicStyleOverrides() +
      'object-position: top left !important;' +
      'object-fit: contain !important;'
    );
  }

  debug(...args) {
    if (this.settings.debug) {
      console.log(
        'DOM Mutator:',
        ...args,
        `${(Date.now() - this.startTime) / 1000}s`
      );
    }
  }

  error(...args) {
    console.error(
      'DOM Mutator:',
      ...args,
      `${(Date.now() - this.startTime) / 1000}s`
    );
  }

  finalize(counter) {
    if (counter <= 0) {
      return;
    }

    setTimeout(() => {
      if (this.img) {
        this.attemptPlay(this.img);
      }

      this.finalize(counter - 1);
    }, 100);
  }

  scheduler() {
    setTimeout(() => {
      this.img = this.detectImage(this.selectors, this.body);

      if (!this.img) {
        this.scheduler();
        return;
      }

      this.run();
    }, 200);
  }

  execute() {
    if (this.settings.schedule) {
      this.scheduler();
      return;
    }

    this.run();
  }
}

/* ## EXECUTION_START ## */
const flistImagePreviewMutator = new FListImagePreviewDomMutator();
flistImagePreviewMutator.execute();
/* ## EXECUTION_END ## */

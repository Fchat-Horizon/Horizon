/***
 * This script is injected on every web page ImagePreview loads
 */

const { ipcRenderer, contextBridge } = require('electron');

function cleanValue(val) {
  // overkill, contextBridge already does this; just here to throw
  return JSON.parse(JSON.stringify(val));
}

contextBridge.exposeInMainWorld('rising', {
  sendToHost: (channel, ...args) => {
    const cleanedArgs = args.map(v => cleanValue(v));
    const cleanedChannel = cleanValue(channel);

    // console.log('REAL.IPC', cleanedChannel, cleanedArgs);

    ipcRenderer.sendToHost(cleanedChannel, ...cleanedArgs);
  }
});

const previewInitiationTime = Date.now();

// window.onload = () => console.log('window.onload', `${(Date.now() - previewInitiationTime)/1000}s`);
// window.onloadstart = () => console.log('window.onloadstart', `${(Date.now() - previewInitiationTime)/1000}s`);
// window.onloadend = () => console.log('window.onloadend', `${(Date.now() - previewInitiationTime)/1000}s`);
// window.addEventListener('DOMContentLoaded', () => (console.log('window.DOMContentLoaded', `${(Date.now() - previewInitiationTime)/1000}s`)));
// setTimeout(() => (console.log('Timeout', `${(Date.now() - previewInitiationTime)/1000}s`)), 0); // ---- Note that clear() below could break this

(() => {
  try {
    if (window.location.href.match(/^https?:\/\/(www.)?pornhub.com/)) {
      // Inject JQuery
      const el = document.createElement('script');
      el.type = 'text/javascript';
      el.text = "console.log('JQuery Injection'); window.$ = window.jQuery = require('jquery');";
      document.appendChild(el);

      if (!window.zest) {
        window.zest = q => document.querySelectorAll(q);
      }
    }
  } catch (err) {
    console.error('PornHub integration', err);
  }
})();

(() => {
  try {
    const clear = () => {
      if (window.location.href.match(/^https?:\/\/(www\.)?redgifs\.com/)) {
        return;
      }

      if (window.location.href.match(/^https?:\/\/(www\.)?rule34video\.com/)) {
        return;
      }

      if (window.location.href.match(/^https?:\/\/[a-zA-Z0-9-]+\.tumblr\.com/)) {
        // Because Tumblr sucks with their iframes
        const og = document.querySelectorAll('meta[property="og:image"]:not([content=""])');

        if (og.length > 0) {
          window.location.href = og[0].content;
        }

        // Must return anyway because... Tumblr sucks with their iframes
        return;
      }

      try {
        const frameCount = window.frames.length;

        for (let i = 0; i < frameCount; i++) {
          window.frames[i].location = 'about:blank';
        }
      } catch (e) {
        console.error('Frame location', e);
      }

      try {
        const scriptCount = document.scripts.length;

        for (let i = 0; i < scriptCount; i++) {
          delete document.scripts[i].src;
        }
      } catch (e) {
        console.error('Script location', e);
      }

      try {
        document.querySelectorAll('iframe, script' /*, style, head' */).forEach(e => e.remove());
      } catch (e) {
        console.error('Element remove', e);
      }

      const intervalCount = setInterval(() => {}, 10000);

      for (let i = 0; i <= intervalCount; i++) {
        try {
          clearInterval(i);
        } catch (e) {
          console.error('Clear interval', i, e);
        }
      }

      const timeoutCount = setTimeout(() => {}, 10000);

      for (let i = 0; i <= timeoutCount; i++) {
        try {
          clearTimeout(i);
        } catch (e) {
          console.error('Clear timeout', i, e);
        }
      }
    };

    console.log('Document loading', Date.now());
    clear();

    window.addEventListener('DOMContentLoaded', event => {
      console.log('DOM fully loaded and parsed', Date.now());
      clear();

      // const ipcRenderer = require('electron').ipcRenderer;
      // ipcRenderer.sendToHost('state.dom-loaded');
    });
  } catch (e) {
    console.error('browser.pre', e);
    console.trace();
  }
})();

try {
  if (!!window.location.toString().match(/__x-suppress__/)) {
    document.write("<script type='application/x-suppress'>");
  }
} catch (err) {
  console.error('X-Suppress', err);
}

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

//Block external navigation
(() => {
  try {
    //Helper function to check if URL should be blocked
    function isBlockedUrl(url) {
      const blockedProtocols = [
        'discord://',
        'steam://',
        'skype:',
        'mailto:',
        'tel:',
        'sms:',
        'facetime:',
        'facetime-audio:',
        'zoom:',
        'teams:',
        'slack:',
        'whatsapp:',
        'telegram:',
        'spotify:',
        'itunes:',
        'itunesmusic:',
        'app:',
        'x-apple:',
        'com.apple.',
        'com.microsoft.',
        'com.spotify.',
        'vscode:',
        'vscode-insiders:',
        'github-desktop:',
        'unity:',
        'blender:',
        'obsidian:',
        'notion:'
      ];

      const blockedDomains = [
        'discord.gg/',
        'discord.com/invite/',
        'discordapp.com/invite/',
        'steamcommunity.com/groups/',
        'steamcommunity.com/chat/',
        'web.whatsapp.com',
        'web.telegram.org',
        'teams.microsoft.com/l/chat',
        'zoom.us/j/',
        'meet.google.com/',
        'whereby.com/'
      ];

      const lowerUrl = url.toLowerCase();

      if (blockedProtocols.some(protocol => lowerUrl.startsWith(protocol))) {
        return true;
      }

      if (blockedDomains.some(domain => lowerUrl.includes(domain))) {
        return true;
      }

      const urlShorteners = [
        'bit.ly',
        'tinyurl.com',
        't.co',
        'short.link',
        'ow.ly',
        'is.gd',
        'buff.ly',
        'adf.ly',
        'goo.gl',
        'shor.by',
        'cutt.ly',
        'rebrandly.com',
        'tiny.cc',
        'link.ly',
        'shortened.link',
        'shorturl.at',
        'clck.ru',
        'v.gd',
        'x.co',
        'po.st'
      ];

      return urlShorteners.some(shortener => lowerUrl.includes(shortener));
    }

    //Override window.open to prevent external apps from opening
    window.open = function (url, target, features) {
      console.log('ImagePreview: Blocked window.open to', url);
      return null;
    };

    const originalLocationAssign = window.location.assign;
    const originalLocationReplace = window.location.replace;
    const originalLocationReload = window.location.reload;

    let originalHref = window.location.href;
    Object.defineProperty(window.location, 'href', {
      get: function () {
        return originalHref;
      },
      set: function (url) {
        if (typeof url === 'string' && isBlockedUrl(url)) {
          console.log('ImagePreview: Blocked location.href redirect to', url);
          return;
        }
        originalHref = url;
        //Allow setting for legitimate URLs
        return url;
      }
    });

    window.location.assign = function (url) {
      if (typeof url === 'string' && isBlockedUrl(url)) {
        console.log('ImagePreview: Blocked location.assign to', url);
        return;
      }
      return originalLocationAssign.call(this, url);
    };

    window.location.replace = function (url) {
      if (typeof url === 'string' && isBlockedUrl(url)) {
        console.log('ImagePreview: Blocked location.replace to', url);
        return;
      }
      return originalLocationReplace.call(this, url);
    };

    //Monitor for programmatic redirects via setTimeout/setInterval
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;

    window.setTimeout = function (callback, delay, ...args) {
      //Wrap callback to check for redirects
      const wrappedCallback = function () {
        try {
          if (typeof callback === 'string') {
            //Check if the string contains redirect code
            if (callback.includes('location') && callback.includes('discord')) {
              console.log(
                'ImagePreview: Blocked setTimeout redirect:',
                callback
              );
              return;
            }
          }
          return typeof callback === 'string'
            ? eval(callback)
            : callback.apply(this, args);
        } catch (e) {
          console.log(
            'ImagePreview: Prevented potential redirect in setTimeout'
          );
        }
      };
      return originalSetTimeout.call(this, wrappedCallback, delay);
    };

    //Block clicks on links that could trigger external apps
    document.addEventListener(
      'click',
      function (e) {
        const target = e.target.closest('a');
        if (target && target.href) {
          const href = target.href;
          if (isBlockedUrl(href)) {
            console.log('ImagePreview: Blocked click on external link', href);
            e.preventDefault();
            e.stopPropagation();
          }
        }
      },
      true
    );

    //Monitor for meta refresh redirects
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (
            node.tagName === 'META' &&
            node.getAttribute('http-equiv') === 'refresh'
          ) {
            const content = node.getAttribute('content');
            if (content && content.includes('url=')) {
              const url = content.split('url=')[1];
              if (isBlockedUrl(url)) {
                console.log(
                  'ImagePreview: Blocked meta refresh redirect to',
                  url
                );
                node.remove();
              }
            }
          }
        });
      });
    });

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        observer.observe(document.head || document.documentElement, {
          childList: true,
          subtree: true
        });
      });
    } else {
      observer.observe(document.head || document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  } catch (err) {
    console.error('ImagePreview: Error setting up navigation blocking', err);
  }
})();

// window.onload = () => console.log('window.onload', `${(Date.now() - previewInitiationTime)/1000}s`);
// window.onloadstart = () => console.log('window.onloadstart', `${(Date.now() - previewInitiationTime)/1000}s`);
// window.onloadend = () => console.log('window.onloadend', `${(Date.now() - previewInitiationTime)/1000}s`);
// window.addEventListener('DOMContentLoaded', () => (console.log('window.DOMContentLoaded', `${(Date.now() - previewInitiationTime)/1000}s`)));
// setTimeout(() => (console.log('Timeout', `${(Date.now() - previewInitiationTime)/1000}s`)), 0); // ---- Note that clear() below could break this

(() => {
  try {
    const clear = () => {
      if (window.location.href.match(/^https?:\/\/(www\.)?redgifs\.com/)) {
        return;
      }

      if (window.location.href.match(/^https?:\/\/(www\.)?rule34video\.com/)) {
        return;
      }

      if (
        window.location.href.match(/^https?:\/\/[a-zA-Z0-9-]+\.tumblr\.com/)
      ) {
        // Because Tumblr sucks with their iframes
        const og = document.querySelectorAll(
          'meta[property="og:image"]:not([content=""])'
        );

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
        document
          .querySelectorAll('iframe, script' /*, style, head' */)
          .forEach(e => e.remove());
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

import log from 'electron-log';
import { ElectronBlocker } from '@cliqz/adblocker-electron';
import path from 'path';
import fs from 'fs';
import * as _ from 'lodash';
import * as electron from 'electron';
import { NetworkFilter } from '@cliqz/adblocker';

export class BlockerIntegration {
  protected static readonly adBlockerLists = [
    'https://easylist.to/easylist/easylist.txt',
    'https://easylist.to/easylist/easyprivacy.txt', // EasyPrivacy
    'https://secure.fanboy.co.nz/fanboy-cookiemonster.txt', // Easy Cookies
    'https://easylist.to/easylist/fanboy-social.txt', // Fanboy Social
    'https://easylist.to/easylist/fanboy-annoyance.txt', // Fanboy Annoyances
    'https://filters.adtidy.org/extension/chromium/filters/2.txt', // AdGuard Base
    'https://filters.adtidy.org/extension/chromium/filters/11.txt', // AdGuard Mobile Ads
    'https://filters.adtidy.org/extension/chromium/filters/4.txt', // AdGuard Social Media
    'https://filters.adtidy.org/extension/chromium/filters/14.txt', // AdGuard Annoyances
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/annoyances.txt', // uBlock Origin Annoyances
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt', // uBlock Origin Filters
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/privacy.txt', // uBlock Origin Privacy
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/badware.txt', // uBlock Origin Badware
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/resource-abuse.txt', // uBlock Origin Resource Abuse
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/unbreak.txt' // uBlock Origin Unbreak
  ];

  // tslint:disable-next-line:max-line-length
  constructor(
    protected readonly baseDir: string,
    protected readonly blocker?: ElectronBlocker,
    protected readonly session?: electron.Session
  ) {
    // nothing yet
  }

  static async factory(baseDir: string): Promise<BlockerIntegration> {
    log.debug('adblock.init');

    try {
      const blocker = await ElectronBlocker.fromLists(
        fetch,
        BlockerIntegration.adBlockerLists,
        {
          enableCompression: true
        },
        {
          path: path.join(baseDir, 'adblocker.bin'),
          read: fs.promises.readFile,
          write: fs.promises.writeFile
        }
      );

      log.debug('adblock.load.complete');

      const session = electron.session.fromPartition('persist:adblocked', {
        cache: true
      });

      log.debug('adblock.session.created');

      blocker.update({
        newNetworkFilters: [NetworkFilter.parse('@@||redgifs.com')!]
      });

      blocker.enableBlockingInSession(session);

      log.debug('adblock.enabled');

      BlockerIntegration.configureBlocker(blocker, session);

      log.debug('adblock.session.attached');

      return new BlockerIntegration(baseDir, blocker, session);
    } catch (err) {
      log.warn(
        'adblock.init.error',
        'Adblocker failed to initialize.' +
          'This does not break Horizon, but may produce slower image previews',
        err
      );

      return new BlockerIntegration(baseDir);
    }
  }

  protected static configureBlocker(
    blocker: ElectronBlocker,
    session: electron.Session
  ): void {
    // Temp fix -- manually override adblocker's preload script
    // to point to CJS  that has been copied over with config in webpack.config.js
    // require.resolve('@cliqz/adblocker-electron-preload');
    const preloadScript = path.join(
      electron.app.getAppPath(),
      './preview/assets/adblocker/preload.cjs.js'
    );

    // const originPath = require.resolve('@cliqz/adblocker-electron-preload');
    // const preloadScript = path.resolve(path.dirname(originPath), 'preload.cjs');
    log.debug('adblock.preload.path', {
      finalPath: preloadScript /*, originPath */
    });

    log.debug('adblock.preloaders.original', {
      loaders: session.getPreloads()
    });

    session.setPreloads(
      _.concat(
        _.filter(
          session.getPreloads(),
          p => p.indexOf('adblocker-electron-preload') < 0
        ),
        [preloadScript]
      )
    );

    blocker.blockFonts();

    log.debug('adblock.preloaders', { loaders: session.getPreloads() });

    blocker.on('request-blocked', (request: Request) => {
      log.debug('adblock.request.blocked', { url: request.url });
    });

    blocker.on('request-redirected', (request: Request) => {
      log.debug('adblock.request.redirected', { url: request.url });
    });

    blocker.on('request-whitelisted', (request: Request) => {
      log.debug('adblock.request.whitelisted', { url: request.url });
    });

    blocker.on('csp-injected', (request: Request) => {
      log.debug('adblock.inject.csp', { url: request.url });
    });

    blocker.on('script-injected', (script: string, url: string) => {
      log.debug('adblock.inject.script', { length: script.length, url });
    });

    blocker.on('style-injected', (style: string, url: string) => {
      log.debug('adblock.inject.style', { length: style.length, url });
    });
  }
}

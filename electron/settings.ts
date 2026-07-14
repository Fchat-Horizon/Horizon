//For potential git history reasons, this file used to be named "browser_options.ts" prior to f257b4c6a9d6fc06c1a6f7354e38c2dbd7bc69f6
import electronLog from 'electron-log/renderer';
import {
  installElectronLogging,
  applySharedLogLevel,
  applyHumanReadableLogs
} from './logging';
import { installRendererPlatform } from './platform-host';
import { createLogger } from '../logger';
const log = createLogger('settings');

import { GeneralSettings } from './common';
import BrowserOption from './Settings.vue';

installElectronLogging(electronLog);
installRendererPlatform();
log.info('init.settings');

const params = <{ [key: string]: string | undefined }>(
  Object.fromEntries(new URLSearchParams(window.location.search.substr(1)))
);
const settings = <GeneralSettings>JSON.parse(params['settings']!);

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'silly';

applySharedLogLevel(settings.risingSystemLogLevel || logLevel);
applyHumanReadableLogs(!!settings.horizonHumanReadableLogs);

log.info('init.settings.vue');

new BrowserOption({
  el: '#browserOption',
  data: { settings }
});

log.debug('init.settings.vue.done');

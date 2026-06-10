//For potential git history reasons, this file used to be named "browser_options.ts" prior to f257b4c6a9d6fc06c1a6f7354e38c2dbd7bc69f6
import * as qs from 'querystring';
import log from 'electron-log/renderer'; //tslint:disable-line:match-default-export-name

import { GeneralSettings } from './common';
import BrowserOption from './Settings.vue';

log.info('init.settings');

const params = <{ [key: string]: string | undefined }>(
  qs.parse(window.location.search.substr(1))
);
const settings = <GeneralSettings>JSON.parse(params['settings']!);

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'silly';

log.transports.console.level = settings.risingSystemLogLevel || logLevel;
log.transports.ipc.level = settings.risingSystemLogLevel || logLevel;

log.info('init.settings.vue');

new BrowserOption({
  el: '#browserOption',
  data: { settings }
});

log.debug('init.settings.vue.done');

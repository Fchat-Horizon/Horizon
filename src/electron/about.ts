import * as qs from 'querystring';
import log from 'electron-log/renderer'; //tslint:disable-line:match-default-export-name

import { GeneralSettings } from '@horizon/shared/common';
import About from './About.vue';
import Vue from 'vue';

log.info('init.about');

const params = <{ [key: string]: string | undefined }>(
  qs.parse(window.location.search.substr(1))
);
const settings = <GeneralSettings>JSON.parse(params['settings'] || '{}');
const appCommit = params['commit'] || process.env.APP_COMMIT || 'unknown';
const appVersion = params['version'] || process.env.APP_VERSION || 'unknown';

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'silly';

log.transports.console.level = settings.risingSystemLogLevel || logLevel;
log.transports.ipc.level = settings.risingSystemLogLevel || logLevel;

log.info('init.about.vue', Vue.version);

new About({
  el: '#about',
  data: { settings, appCommit, appVersion }
});

log.debug('init.about.vue.done');

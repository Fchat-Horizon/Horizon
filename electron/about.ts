import electronLog from 'electron-log/renderer';
import {
  installElectronLogging,
  applySharedLogLevel,
  applyHumanReadableLogs
} from './logging';
import { installRendererPlatform } from './platform-host';
import { createLogger } from '../logger';
const log = createLogger('about');

import { GeneralSettings } from './common';
import About from './About.vue';
import Vue from 'vue';

installElectronLogging(electronLog);
installRendererPlatform();
log.info('init.about');

const params = <{ [key: string]: string | undefined }>(
  Object.fromEntries(new URLSearchParams(window.location.search.substr(1)))
);
const settings = <GeneralSettings>JSON.parse(params['settings'] || '{}');
const appCommit = params['commit'] || process.env.APP_COMMIT || 'unknown';
const appVersion = params['version'] || process.env.APP_VERSION || 'unknown';

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'silly';

applySharedLogLevel(settings.risingSystemLogLevel || logLevel);
applyHumanReadableLogs(!!settings.horizonHumanReadableLogs);

log.info('init.about.vue', Vue.version);

new About({
  el: '#about',
  data: { settings, appCommit, appVersion }
});

log.debug('init.about.vue.done');

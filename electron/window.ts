import electronLog from 'electron-log/renderer';
import {
  installElectronLogging,
  applySharedLogLevel,
  applyHumanReadableLogs
} from './logging';
import { installRendererPlatform } from './platform-host';
import { createLogger } from '../logger';
const log = createLogger('window');

import { GeneralSettings } from './common';
import Window from './Window.vue';
import Vue from 'vue';

installElectronLogging(electronLog);
installRendererPlatform();
log.info('init.window');

const params = <{ [key: string]: string | undefined }>(
  Object.fromEntries(new URLSearchParams(window.location.search.substr(1)))
);
const settings = <GeneralSettings>JSON.parse(params['settings']!);
const importHint = params['import'];

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'silly';

applySharedLogLevel(settings.risingSystemLogLevel || logLevel);
applyHumanReadableLogs(!!settings.horizonHumanReadableLogs);

log.info('init.window.vue', Vue.version);

//tslint:disable-next-line:no-unused-expression
export default new Window({
  el: '#app',
  data: { settings, importHint }
});

log.debug('init.window.vue.done');

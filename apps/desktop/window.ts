import * as qs from 'querystring';
import electronLog from 'electron-log/renderer';
import { createLogger } from '@horizon/shared/logger';
const log = createLogger('window');
import { installElectronLogging, applySharedLogLevel } from './logging';
import { installRendererPlatform } from './platform-host';

import { GeneralSettings } from '@horizon/shared/common';
import Window from './Window.vue';
import Vue from 'vue';

installElectronLogging(electronLog);
installRendererPlatform();
log.info('init.window');

const params = <{ [key: string]: string | undefined }>(
  qs.parse(window.location.search.substr(1))
);
const settings = <GeneralSettings>JSON.parse(params['settings']!);
const importHint = params['import'];

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'silly';

applySharedLogLevel(settings.risingSystemLogLevel || logLevel);

log.info('init.window.vue', Vue.version);

//tslint:disable-next-line:no-unused-expression
export default new Window({
  el: '#app',
  data: { settings, importHint }
});

log.debug('init.window.vue.done');

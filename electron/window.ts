import * as qs from 'querystring';
import log from 'electron-log/renderer'; //tslint:disable-line:match-default-export-name

import { GeneralSettings } from './common';
import Window from './Window.vue';
import Vue from 'vue';

log.info('init.window');

const params = <{ [key: string]: string | undefined }>(
  qs.parse(window.location.search.substr(1))
);
const settings = <GeneralSettings>JSON.parse(params['settings']!);
const importHint = params['import'];

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'silly';

log.transports.console.level = settings.risingSystemLogLevel || logLevel;
log.transports.ipc.level = settings.risingSystemLogLevel || logLevel;

log.info('init.window.vue', Vue.version);

//tslint:disable-next-line:no-unused-expression
export default new Window({
  el: '#app',
  data: { settings, importHint }
});

log.debug('init.window.vue.done');

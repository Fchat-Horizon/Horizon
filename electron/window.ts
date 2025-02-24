import * as qs from 'querystring';
import log from 'electron-log'; //tslint:disable-line:match-default-export-name

import { GeneralSettings } from './common';
import Window from './Window.vue';

log.info('init.window');

const params = <{ [key: string]: string | undefined }>qs.parse(window.location.search.substr(1));
const settings = <GeneralSettings>JSON.parse(params['settings']!);

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'silly';

log.transports.file.level = settings.risingSystemLogLevel || logLevel;
log.transports.console.level = settings.risingSystemLogLevel || logLevel;
log.transports.file.maxSize = 5 * 1024 * 1024;

log.info('init.window.vue');

//tslint:disable-next-line:no-unused-expression
export default new Window({
  el: '#app',
  data: { settings }
});

log.debug('init.window.vue.done');

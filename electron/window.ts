import * as qs from 'querystring';
import log from 'electron-log'; //tslint:disable-line:match-default-export-name
import { createApp } from 'vue';

import Window from './Window.vue';
import { GeneralSettings } from './common';

log.info('init.window');

const params = <{ [key: string]: string | undefined }>(
  qs.parse(window.location.search.substr(1))
);
const settings = <GeneralSettings>JSON.parse(params['settings']!);

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'silly';

log.transports.file.level = settings.risingSystemLogLevel || logLevel;
log.transports.console.level = settings.risingSystemLogLevel || logLevel;
log.transports.file.maxSize = 5 * 1024 * 1024;

log.info('init.window.vue');

//tslint:disable-next-line:no-unused-expression
const app = createApp(
  {
    ...Window
  },
  { settings: settings }
);

app.mount('#app');

log.debug('init.window.vue.done');

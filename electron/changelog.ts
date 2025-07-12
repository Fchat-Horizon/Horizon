import * as qs from 'querystring';
import log from 'electron-log'; //tslint:disable-line:match-default-export-name

import { GeneralSettings } from './common';
import Changelog from './Changelog.vue';

log.info('init.changelog');

const params = <{ [key: string]: string | undefined }>(
  qs.parse(window.location.search.substr(1))
);
const settings = <GeneralSettings>JSON.parse(params['settings']!);

const updateVersion = params['updateVer'];

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'silly';

log.transports.file.level = settings.risingSystemLogLevel || logLevel;
log.transports.console.level = settings.risingSystemLogLevel || logLevel;
log.transports.file.maxSize = 5 * 1024 * 1024;

log.info('init.changelog.vue');

new Changelog({
  el: '#changelog',
  data: { settings, updateVersion }
});

log.debug('init.changelog.vue.done');

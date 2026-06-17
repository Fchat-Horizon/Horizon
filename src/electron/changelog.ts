import * as qs from 'querystring';
import log from 'electron-log/renderer'; //tslint:disable-line:match-default-export-name

import { GeneralSettings } from '@horizon/shared/common';
import Changelog from './Changelog.vue';

log.info('init.changelog');

const params = <{ [key: string]: string | undefined }>(
  qs.parse(window.location.search.substr(1))
);
const settings = <GeneralSettings>JSON.parse(params['settings']!);

const updateVersion = params['updateVer'];
const updateMode = params['updateMode'] || 'auto';

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'silly';

log.transports.console.level = settings.risingSystemLogLevel || logLevel;
log.transports.ipc.level = settings.risingSystemLogLevel || logLevel;

log.info('init.changelog.vue');

new Changelog({
  el: '#changelog',
  data: { settings, updateVersion, updateMode }
});

log.debug('init.changelog.vue.done');

import * as qs from 'querystring';
import electronLog from 'electron-log/renderer';
import { createLogger } from '@horizon/shared/logger';
const log = createLogger('changelog');
import { installElectronLogging, applySharedLogLevel } from './logging';
import { installRendererPlatform } from './platform-host';

import { GeneralSettings } from '@horizon/shared/common';
import Changelog from './Changelog.vue';

installElectronLogging(electronLog);
installRendererPlatform();
log.info('init.changelog');

const params = <{ [key: string]: string | undefined }>(
  qs.parse(window.location.search.substr(1))
);
const settings = <GeneralSettings>JSON.parse(params['settings']!);

const updateVersion = params['updateVer'];
const updateMode = params['updateMode'] || 'auto';

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'silly';

applySharedLogLevel(settings.risingSystemLogLevel || logLevel);

log.info('init.changelog.vue');

new Changelog({
  el: '#changelog',
  data: { settings, updateVersion, updateMode }
});

log.debug('init.changelog.vue.done');

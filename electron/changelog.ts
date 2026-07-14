import electronLog from 'electron-log/renderer';
import {
  installElectronLogging,
  applySharedLogLevel,
  applyHumanReadableLogs
} from './logging';
import { installRendererPlatform } from './platform-host';
import { createLogger } from '../logger';
const log = createLogger('changelog');

import { GeneralSettings } from './common';
import Changelog from './Changelog.vue';

installElectronLogging(electronLog);
installRendererPlatform();
log.info('init.changelog');

const params = <{ [key: string]: string | undefined }>(
  Object.fromEntries(new URLSearchParams(window.location.search.substr(1)))
);
const settings = <GeneralSettings>JSON.parse(params['settings']!);

const updateVersion = params['updateVer'];
const updateMode = params['updateMode'] || 'auto';

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'silly';

applySharedLogLevel(settings.risingSystemLogLevel || logLevel);
applyHumanReadableLogs(!!settings.horizonHumanReadableLogs);

log.info('init.changelog.vue');

new Changelog({
  el: '#changelog',
  data: { settings, updateVersion, updateMode }
});

log.debug('init.changelog.vue.done');

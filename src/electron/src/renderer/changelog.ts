import electronLog from 'electron-log/renderer';
import { createLogger } from '@horizon/shared/logger';
const log = createLogger('changelog');
import { installElectronLogging, applySharedLogLevel } from '@common/logging';
import { installRendererPlatform } from './platform-host';

import type { GeneralSettings } from '@horizon/shared/common';
import Changelog from './Changelog.vue';
import { createApp } from 'vue';

installElectronLogging(electronLog);
installRendererPlatform();
log.info('init.changelog');

const params = <{ [key: string]: string | undefined }>(
  Object.fromEntries(new URLSearchParams(window.location.search.slice(1)))
);
const settings = <GeneralSettings>JSON.parse(params['settings']!);

const updateVersion = params['updateVer'];
const updateMode = params['updateMode'] || 'auto';
const currentVersion = params['version'] || 'unknown';

const logLevel = import.meta.env.PROD ? 'info' : 'silly';

applySharedLogLevel(settings.risingSystemLogLevel || logLevel);

log.info('init.changelog.vue');

createApp(Changelog, {
  initialSettings: settings,
  updateVersion,
  updateMode,
  currentVersion
}).mount('#changelog');

log.debug('init.changelog.vue.done');

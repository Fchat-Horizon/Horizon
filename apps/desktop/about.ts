import electronLog from 'electron-log/renderer';
import { createLogger } from '@horizon/shared/logger';
const log = createLogger('about');
import { installElectronLogging, applySharedLogLevel } from './logging';
import { installRendererPlatform } from './platform-host';

import type { GeneralSettings } from '@horizon/shared/common';
import About from './About.vue';
import { createApp, version } from 'vue';

installElectronLogging(electronLog);
installRendererPlatform();
log.info('init.about');

const params = <{ [key: string]: string | undefined }>(
  Object.fromEntries(new URLSearchParams(window.location.search.slice(1)))
);
const settings = <GeneralSettings>JSON.parse(params['settings'] || '{}');
const appCommit =
  params['commit'] || import.meta.env.VITE_APP_COMMIT || 'unknown';
const appVersion =
  params['version'] || import.meta.env.VITE_APP_VERSION || 'unknown';

const logLevel = import.meta.env.PROD ? 'info' : 'silly';

applySharedLogLevel(settings.risingSystemLogLevel || logLevel);

log.info('init.about.vue', version);

createApp(About, { initialSettings: settings, appCommit, appVersion }).mount(
  '#about'
);

log.debug('init.about.vue.done');

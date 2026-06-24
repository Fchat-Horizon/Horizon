import electronLog from 'electron-log/renderer';
import { createLogger } from '@horizon/shared/logger';
const log = createLogger('window');
import { installElectronLogging, applySharedLogLevel } from './logging';
import { installRendererPlatform } from './platform-host';

import type { GeneralSettings } from '@horizon/shared/common';
import Window from './Window.vue';
import { createApp, version } from 'vue';

installElectronLogging(electronLog);
installRendererPlatform();
log.info('init.window');

const params = <{ [key: string]: string | undefined }>(
  Object.fromEntries(new URLSearchParams(window.location.search.slice(1)))
);
const settings = <GeneralSettings>JSON.parse(params['settings']!);
const importHint = params['import'];

const logLevel = import.meta.env.PROD ? 'info' : 'silly';
applySharedLogLevel(settings.risingSystemLogLevel || logLevel);

log.info('init.window.vue', version);

createApp(Window, { initialSettings: settings, importHint }).mount('#app');

log.debug('init.window.vue.done');

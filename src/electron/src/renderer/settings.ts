// note: formerly "browser_options.ts" - renamed in f257b4c, kept here for git history tracing
import electronLog from 'electron-log/renderer';
import { createLogger } from '@horizon/shared/logger';
const log = createLogger('settings');
import { installElectronLogging, applySharedLogLevel } from '@common/logging';
import { installRendererPlatform } from './platform-host';

import type { GeneralSettings } from '@horizon/shared/common';
import BrowserOption from './Settings.vue';
import { createApp } from 'vue';

installElectronLogging(electronLog);
installRendererPlatform();
log.info('init.settings');

const params = <{ [key: string]: string | undefined }>(
  Object.fromEntries(new URLSearchParams(window.location.search.slice(1)))
);
const settings = <GeneralSettings>JSON.parse(params['settings']!);

const logLevel = import.meta.env.PROD ? 'info' : 'silly';

applySharedLogLevel(settings.risingSystemLogLevel || logLevel);

log.info('init.settings.vue');

createApp(BrowserOption, { initialSettings: settings }).mount('#browserOption');

log.debug('init.settings.vue.done');

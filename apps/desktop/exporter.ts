import electronLog from 'electron-log/renderer';
import { createLogger } from '@horizon/shared/logger';
const log = createLogger('exporter');
import { installElectronLogging, applySharedLogLevel } from './logging';
import { installRendererPlatform } from './platform-host';

import type { GeneralSettings } from '@horizon/shared/common';
import ExporterWindow from './Exporter.vue';
import { createApp } from 'vue';

installElectronLogging(electronLog);
installRendererPlatform();
log.info('init.exporter');

const params = <{ [key: string]: string | undefined }>(
  Object.fromEntries(new URLSearchParams(window.location.search.slice(1)))
);
const settings = <GeneralSettings>JSON.parse(params['settings']!);
const importHint = params['import'];

const logLevel = import.meta.env.PROD ? 'info' : 'silly';

applySharedLogLevel(settings.risingSystemLogLevel || logLevel);

log.info('init.exporter.vue');

const exporterApp = createApp(ExporterWindow, {
  initialSettings: settings,
  importHint
}).mount('#exporterWindow');

log.debug('init.exporter.vue.done');

export default exporterApp;

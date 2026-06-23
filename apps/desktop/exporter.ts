import * as qs from 'querystring';
import electronLog from 'electron-log/renderer';
import { createLogger } from '@horizon/shared/logger';
const log = createLogger('exporter');
import { installElectronLogging, applySharedLogLevel } from './logging';
import { installRendererPlatform } from './platform-host';

import { GeneralSettings } from '@horizon/shared/common';
import ExporterWindow from './Exporter.vue';

installElectronLogging(electronLog);
installRendererPlatform();
log.info('init.exporter');

const params = <{ [key: string]: string | undefined }>(
  qs.parse(window.location.search.slice(1))
);
const settings = <GeneralSettings>JSON.parse(params['settings']!);
const importHint = params['import'];

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'silly';

applySharedLogLevel(settings.risingSystemLogLevel || logLevel);

log.info('init.exporter.vue');

const exporterApp = new ExporterWindow({
  el: '#exporterWindow',
  data: { settings, importHint }
});

log.debug('init.exporter.vue.done');

export default exporterApp;

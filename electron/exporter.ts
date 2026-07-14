import electronLog from 'electron-log/renderer';
import {
  installElectronLogging,
  applySharedLogLevel,
  applyHumanReadableLogs
} from './logging';
import { installRendererPlatform } from './platform-host';
import { createLogger } from '../logger';
const log = createLogger('exporter');

import { GeneralSettings } from './common';
import ExporterWindow from './Exporter.vue';

installElectronLogging(electronLog);
installRendererPlatform();
log.info('init.exporter');

const params = <{ [key: string]: string | undefined }>(
  Object.fromEntries(new URLSearchParams(window.location.search.slice(1)))
);
const settings = <GeneralSettings>JSON.parse(params['settings']!);
const importHint = params['import'];

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'silly';

applySharedLogLevel(settings.risingSystemLogLevel || logLevel);
applyHumanReadableLogs(!!settings.horizonHumanReadableLogs);

log.info('init.exporter.vue');

const exporterApp = new ExporterWindow({
  el: '#exporterWindow',
  data: { settings, importHint }
});

log.debug('init.exporter.vue.done');

export default exporterApp;

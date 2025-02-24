import Raven from 'raven-js';
import Vue from 'vue';

/*tslint:disable:no-unsafe-any no-any*/ //hack
function formatComponentName(vm: any): string {
  if (vm === undefined) return 'undefined';
  if (vm.$root === vm) return '<root instance>';
  const name = vm._isVue ? vm.$options.name || vm.$options._componentTag : vm.name;
  return (name ? `component <${name}>` : 'anonymous component') + (vm._isVue && vm.$options.__file ? ` at ${vm.$options.__file}` : '');
}
//tslint:enable

/*tslint:disable:no-unbound-method strict-type-predicates*/ //hack
function VueRaven(this: void, raven: Raven.RavenStatic): Raven.RavenStatic {
  if (typeof Vue.config !== 'object') return raven;
  const oldOnError = Vue.config.errorHandler;
  Vue.config.errorHandler = (error: Error, vm: Vue, info: string): void => {
    raven.captureException(error, {
      extra: {
        componentName: formatComponentName(vm),
        //propsData: vm.$options.propsData,
        info
      }
    });

    if (typeof oldOnError === 'function') oldOnError.call(this, error, vm, info);
    else console.log(error);
  };

  const oldOnWarn = Vue.config.warnHandler;
  Vue.config.warnHandler = (message: string, vm: Vue, trace: string): void => {
    raven.captureMessage(message + trace, {
      extra: {
        componentName: formatComponentName(vm)
        //propsData: vm.$options.propsData
      }
    });
    console.warn(`${message}: ${trace}`);
    if (typeof oldOnWarn === 'function') oldOnWarn.call(this, message, vm, trace);
  };

  return raven;
}
//tslint:enable

export function setupRaven(dsn: string, version: string): void {
  return; //TODO sentry temporarily disabled
  Raven.config(dsn, {
    release: version,
    dataCallback: (data: { culprit?: string; exception?: { values: { stacktrace: { frames: { filename: string }[] } }[] } }) => {
      if (data.culprit !== undefined) {
        const end = data.culprit.lastIndexOf('?');
        data.culprit = `~${data.culprit.substring(data.culprit.lastIndexOf('/'), end === -1 ? undefined : end)}`;
      }
      if (data.exception !== undefined)
        for (const ex of data.exception.values)
          for (const frame of ex.stacktrace.frames) {
            const index = frame.filename.lastIndexOf('/');
            const endIndex = frame.filename.lastIndexOf('?');
            frame.filename = `~${frame.filename.substring(index !== -1 ? index : 0, endIndex === -1 ? undefined : endIndex)}`;
          }
    }
  })
    .addPlugin(VueRaven, Vue)
    .install();
  (<Window & { onunhandledrejection(e: PromiseRejectionEvent): void }>window).onunhandledrejection = (e: PromiseRejectionEvent) => {
    Raven.captureException(<Error>e.reason);
  };
}

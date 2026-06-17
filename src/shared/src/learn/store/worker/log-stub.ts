/**
 * @module log-stub
 * Webpack aliases `electron-log` to this file inside the profile store
 * worker bundle: the real renderer transport needs window.__electronLog,
 * which does not exist in a worker scope, so the worker logs to the
 * console of its owning tab instead.
 */

/* tslint:disable:no-console */
const stub = {
  error: console.error.bind(console),
  warn: console.warn.bind(console),
  info: console.info.bind(console),
  verbose: console.debug.bind(console),
  debug: console.debug.bind(console),
  silly: console.debug.bind(console)
};
/* tslint:enable:no-console */

export default stub;

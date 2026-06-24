import _ from 'lodash';
import { createLogger } from '@/logger';
const log = createLogger('site-session');
import throat from 'throat';
import { ipc } from '@/platform/ipc';
import { NoteChecker } from './note-checker';

import type { AxiosRequestConfig } from 'axios';

/* tslint:disable:no-unsafe-any */

/**
 * The serializable subset of an Axios response returned by the main-process
 * transport (electron/site-session-host.ts). Cookie-jar requests need the
 * Node http adapter, which only exists in the main-process bundle.
 */
export interface SiteSessionResponse {
  status: number;
  data: any;
}

export interface SiteSessionInterface {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface SiteSessionInterfaceCollection extends Record<
  string,
  SiteSessionInterface
> {
  notes: NoteChecker;
}

export class SiteSession {
  private readonly sessionThroat = throat(1);

  readonly interfaces: SiteSessionInterfaceCollection = {
    notes: new NoteChecker(this)
  };

  private state: 'active' | 'inactive' = 'inactive';
  private account = '';
  private password = '';

  private csrf = '';

  setCredentials(account: string, password: string): void {
    this.account = account;
    this.password = password;
  }

  async start(): Promise<void> {
    try {
      await this.stop();
      await this.init();
      await this.login();

      this.state = 'active';

      await Promise.all(_.map(this.interfaces, i => i.start()));
    } catch (err) {
      this.state = 'inactive';
      log.error('sitesession.start.error', err);
    }
  }

  async stop(): Promise<void> {
    try {
      await Promise.all(_.map(this.interfaces, i => i.stop()));
    } catch (err) {
      log.error('sitesession.stop.error', err);
    }

    this.csrf = '';
    this.state = 'inactive';
  }

  private async init(): Promise<void> {
    log.debug('sitesession.init');

    // & Fresh cookie jar in the main process for this tab.
    await ipc.invoke('site-session-reset');
    this.csrf = '';

    const res = await this.get('/');

    if (res.status !== 200) {
      throw new Error(`SiteSession.init: Invalid status code: ${res.status}`);
    }

    const input = res.data.match(/<input.*?csrf_token.*?>/);

    if (!input || input.length < 1) {
      throw new Error('SiteSession.init: Missing csrf token');
    }

    const csrf = input[0].match(/value="([a-zA-Z0-9]+)"/);

    if (!csrf || csrf.length < 2) {
      throw new Error('SiteSession.init: Missing csrf token value');
    }

    this.csrf = csrf[1];
  }

  private async login(): Promise<void> {
    log.debug('sitesession.login');

    if (this.password === '' || this.account === '') {
      throw new Error('User credentials not set');
    }

    const res = await this.post(
      '/action/script_login.php',
      {
        username: this.account,
        password: this.password,
        csrf_token: this.csrf
      },
      false,
      {
        maxRedirects: 0,
        validateStatus: null
      }
    );

    if (res.status !== 302) {
      throw new Error('Invalid status code');
    }

    // console.log('RES RES RES', res);

    log.debug('sitesession.login.success');
  }

  // tslint:disable-next-line:prefer-function-over-method
  private async ensureLogin(): Promise<void> {
    if (this.state !== 'active') {
      throw new Error('Site session not active');
    }
  }

  private async prepareRequest(
    method: string,
    url: string,
    mustBeLoggedIn: boolean,
    config: AxiosRequestConfig
  ): Promise<AxiosRequestConfig> {
    if (mustBeLoggedIn) {
      await this.ensureLogin();
    }

    return _.merge({ method, url }, config);
  }

  async get(
    uri: string,
    mustBeLoggedIn: boolean = false,
    config: AxiosRequestConfig = {}
  ): Promise<SiteSessionResponse> {
    return this.sessionThroat(async () => {
      const finalConfig = await this.prepareRequest(
        'get',
        uri,
        mustBeLoggedIn,
        config
      );

      return ipc.invoke(
        'site-session-request',
        finalConfig
      ) as Promise<SiteSessionResponse>;
    });
  }

  async post(
    uri: string,
    data: Record<string, any>,
    mustBeLoggedIn: boolean = false,
    config: AxiosRequestConfig = {}
  ): Promise<SiteSessionResponse> {
    return this.sessionThroat(async () => {
      // ~ Form-encoded as a string: URLSearchParams cannot cross IPC.
      const finalConfig = await this.prepareRequest(
        'post',
        uri,
        mustBeLoggedIn,
        _.merge(
          {
            data: new URLSearchParams(data).toString(),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          },
          config
        )
      );

      return ipc.invoke(
        'site-session-request',
        finalConfig
      ) as Promise<SiteSessionResponse>;
    });
  }

  async onConnectionClosed(): Promise<void> {
    await this.stop();
  }

  async onConnectionEstablished(): Promise<void> {
    await this.start();
  }
}

import Axios, { AxiosError, AxiosResponse } from 'axios';
import * as qs from 'qs';
import { Connection as Interfaces, WebSocketConnection } from './interfaces';
import ReadyState = WebSocketConnection.ReadyState;
import log from 'electron-log'; //tslint:disable-line:match-default-export-name
import core from '../chat/core';
import throat from 'throat';

const fatalErrors = [2, 3, 4, 9, 30, 31, 33, 39, 40, 62, -4];
const dieErrors = [9, 30, 31, 39, 40];

let lastFetch = Date.now();
let lastApiTicketFetch = Date.now();

const queryApiThroat = throat(2);
const queryTicketThroat = throat(1);

async function queryApi(this: void, endpoint: string, data: object): Promise<AxiosResponse> {
  lastFetch = Date.now();

  return Axios.post(`https://www.f-list.net/json/api/${endpoint}`, qs.stringify(data));
}

export default class Connection implements Interfaces.Connection {
  character = '';
  vars: Interfaces.Vars = <any>{}; //tslint:disable-line:no-any
  protected socket: WebSocketConnection | undefined = undefined;
  //tslint:disable-next-line:no-object-literal-type-assertion
  private messageHandlers = <{ [key in keyof Interfaces.ServerCommands]: Interfaces.CommandHandler<key>[] }>{};
  private connectionHandlers: { [key in Interfaces.EventType]?: Interfaces.EventHandler[] } = {};
  private errorHandlers: ((error: Error) => void)[] = [];
  private ticket = '';
  private cleanClose = false;
  private reconnectTimer: NodeJS.Timer | undefined;
  private account = '';
  private ticketProvider?: Interfaces.TicketProvider;
  private reconnectDelay = 0;
  private isReconnect = false;
  private pinTimeout?: NodeJS.Timer;

  constructor(
    private readonly clientName: string,
    private readonly version: string,
    private readonly socketProvider: new () => WebSocketConnection
  ) {}

  setCredentials(account: string, ticketProvider: Interfaces.TicketProvider | string): void {
    this.account = account;
    this.ticketProvider = typeof ticketProvider === 'string' ? async () => this.getTicket(ticketProvider) : ticketProvider;
  }

  async connect(character: string): Promise<void> {
    if (!this.ticketProvider) throw new Error('No credentials set!');
    this.cleanClose = false;
    if (this.character !== character) this.isReconnect = false;
    this.character = character;
    try {
      this.ticket = await this.ticketProvider();
    } catch (e) {
      if (this.reconnectTimer !== undefined)
        if ((<AxiosError>e).request !== undefined) this.reconnect();
        else await this.invokeHandlers('closed', false);
      return this.invokeErrorHandlers(<Error>e, true);
    }
    try {
      await this.invokeHandlers('connecting', this.isReconnect);
    } catch (e) {
      await this.invokeHandlers('closed', false);
      return this.invokeErrorHandlers(<Error>e);
    }
    if (this.cleanClose) {
      this.cleanClose = false;
      await this.invokeHandlers('closed', false);
      return;
    }
    try {
      this.socket = new this.socketProvider();
    } catch (e) {
      await this.invokeHandlers('closed', false);
      return this.invokeErrorHandlers(<Error>e, true);
    }
    this.socket.onOpen(() => {
      this.send('IDN', {
        account: this.account,
        character: this.character,
        cname: this.clientName,
        cversion: this.version,
        method: 'ticket',
        ticket: this.ticket
      });
      this.resetPinTimeout();
    });
    this.socket.onMessage(async (msg: string) => {
      const type = <keyof Interfaces.ServerCommands>msg.substr(0, 3);
      const data = msg.length > 6 ? <object>JSON.parse(msg.substr(4)) : undefined;

      log.silly('socket.recv', {
        type,
        data
      });

      return this.handleMessage(type, data);
    });
    this.socket.onClose(async (event: CloseEvent) => {
      log.debug('socket.onclose', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        event
      });

      if (this.pinTimeout) clearTimeout(this.pinTimeout);
      if (!this.cleanClose) this.reconnect();
      this.socket = undefined;
      await this.invokeHandlers('closed', !this.cleanClose);
    });
    this.socket.onError((error: Error) => this.invokeErrorHandlers(error, true));
  }

  private reconnect(): void {
    this.reconnectTimer = setTimeout(async () => this.connect(this.character), this.reconnectDelay);
    this.reconnectDelay = this.reconnectDelay >= 30000 ? 60000 : this.reconnectDelay >= 10000 ? 30000 : 10000;
  }

  close(keepState: boolean = true): void {
    if (this.reconnectTimer !== undefined) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    this.cleanClose = true;
    if (this.socket !== undefined) this.socket.close();

    if (!keepState) {
      this.character = '';
    }
  }

  get isOpen(): boolean {
    return this.socket !== undefined && this.socket.readyState === ReadyState.OPEN;
  }

  async queryApi<T = object>(endpoint: string, data?: { account?: string; ticket?: string }): Promise<T> {
    return queryApiThroat(async () => this.queryApiExec<T>(endpoint, data));
  }

  protected async refreshTicket(oldTicket: string): Promise<string> {
    if (this.ticket !== oldTicket) {
      log.debug('api.ticket.renew.resolve.cache', {
        character: core.characters.ownCharacter?.name
      });

      return this.ticket;
    }

    if (!this.ticketProvider) {
      throw new Error('No credentials set!');
    }

    this.ticket = await queryTicketThroat(async () => this.ticketProvider!());

    log.debug('api.ticket.renew.resolve.refresh', {
      character: core.characters.ownCharacter?.name
    });

    return this.ticket;
  }

  protected async queryApiExec<T = object>(endpoint: string, data?: { account?: string; ticket?: string }): Promise<T> {
    if (!this.ticketProvider) throw new Error('No credentials set!');

    log.debug('api.query.start', {
      endpoint,
      data,
      character: core.characters.ownCharacter?.name,
      deltaToLastApiCall: Date.now() - lastFetch,
      deltaToLastApiTicket: Date.now() - lastApiTicketFetch
    });

    if (data === undefined) data = {};

    data.account = this.account;
    data.ticket = this.ticket;

    let res = <T & { error: string }>(await queryApi(endpoint, data)).data;

    if (res.error === 'Invalid ticket.' || res.error === 'Your login ticket has expired (five minutes) or no ticket requested.') {
      log.debug('api.ticket.loss', {
        error: res.error,
        character: core.characters.ownCharacter?.name,
        deltaToLastApiCall: Date.now() - lastFetch,
        deltaToLastApiTicket: Date.now() - lastApiTicketFetch
      });

      data.ticket = await this.refreshTicket(data.ticket);
      res = <T & { error: string }>(await queryApi(endpoint, data)).data;
    }

    if (res.error !== '') {
      log.debug('api.query.error', {
        error: res.error,
        endpoint,
        data,
        character: core.characters.ownCharacter?.name,
        deltaToLastApiCall: Date.now() - lastFetch,
        deltaToLastApiTicket: Date.now() - lastApiTicketFetch
      });

      const error = new Error(res.error);
      (<Error & { request: true }>error).request = true;
      throw error;
    }

    log.debug('api.query.success', {
      endpoint,
      data,
      character: core.characters.ownCharacter?.name,
      deltaToLastApiCall: Date.now() - lastFetch,
      deltaToLastApiTicket: Date.now() - lastApiTicketFetch
    });

    return res;
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandlers.push(handler);
  }

  onEvent(type: Interfaces.EventType, handler: Interfaces.EventHandler): void {
    let handlers = this.connectionHandlers[type];
    if (handlers === undefined) handlers = this.connectionHandlers[type] = [];
    handlers.push(handler);
  }

  offEvent(type: Interfaces.EventType, handler: Interfaces.EventHandler): void {
    const handlers = this.connectionHandlers[type];
    if (handlers === undefined) return;
    handlers.splice(handlers.indexOf(handler), 1);
  }

  onMessage<K extends keyof Interfaces.ServerCommands>(type: K, handler: Interfaces.CommandHandler<K>): void {
    let handlers = <Interfaces.CommandHandler<K>[] | undefined>this.messageHandlers[type];
    if (handlers === undefined) handlers = this.messageHandlers[type] = [];
    handlers.push(handler);
  }

  offMessage<K extends keyof Interfaces.ServerCommands>(type: K, handler: Interfaces.CommandHandler<K>): void {
    const handlers = <Interfaces.CommandHandler<K>[] | undefined>this.messageHandlers[type];
    if (handlers === undefined) return;
    handlers.splice(handlers.indexOf(handler), 1);
  }

  send<K extends keyof Interfaces.ClientCommands>(command: K, data?: Interfaces.ClientCommands[K]): void {
    if (this.socket !== undefined && this.socket.readyState === WebSocketConnection.ReadyState.OPEN) {
      const msg = <string>command + (data !== undefined ? ` ${JSON.stringify(data)}` : '');

      log.silly('socket.send', { data: msg });

      this.socket.send(msg);
    }
  }

  //tslint:disable:no-unsafe-any no-any
  protected async handleMessage<T extends keyof Interfaces.ServerCommands>(type: T, data: any): Promise<void> {
    const time = new Date();
    const handlers = <Interfaces.CommandHandler<T>[] | undefined>this.messageHandlers[type];
    if (handlers !== undefined) for (const handler of handlers) await handler(data, time);
    switch (type) {
      case 'VAR':
        this.vars[<keyof Interfaces.Vars>data.variable] = data.value;
        break;
      case 'PIN':
        this.send('PIN');
        this.resetPinTimeout();
        break;
      case 'ERR':
        if (fatalErrors.indexOf(data.number) !== -1) {
          this.invokeErrorHandlers(new Error(data.message), true);
          if (dieErrors.indexOf(data.number) !== -1) {
            this.close();
            this.character = '';
          } else this.socket!.close();
        }
        break;
      case 'NLN':
        if (data.identity === this.character) {
          await this.invokeHandlers('connected', this.isReconnect);
          this.reconnectDelay = 0;
          this.isReconnect = true;
        }
    }
  }

  //tslint:enable

  private async getTicket(password: string): Promise<string> {
    console.log('Acquiring new API ticket');
    const oldLastApiTicketFetch = lastApiTicketFetch;

    log.debug('api.getTicket.start', {
      character: core.characters.ownCharacter?.name,
      deltaToLastApiCall: Date.now() - lastFetch,
      deltaToLastApiTicket: Date.now() - oldLastApiTicketFetch
    });

    lastApiTicketFetch = Date.now();

    const data = <{ ticket?: string; error: string }>(
      (
        await Axios.post(
          'https://www.f-list.net/json/getApiTicket.php',
          qs.stringify({ account: this.account, password, no_friends: true, no_bookmarks: true, no_characters: true })
        )
      ).data
    );

    if (data.ticket !== undefined) {
      log.debug('api.getTicket.success', {
        character: core.characters.ownCharacter?.name,
        deltaToLastApiCall: Date.now() - lastFetch,
        deltaToLastApiTicket: Date.now() - oldLastApiTicketFetch
      });

      return data.ticket;
    }

    console.error('API Ticket Error', data.error);

    log.error('error.api.getTicket', {
      character: core.characters.ownCharacter.name,
      error: data.error,
      deltaToLastApiCall: Date.now() - lastFetch,
      deltaToLastApiTicket: Date.now() - oldLastApiTicketFetch
    });

    throw new Error(data.error);
  }

  private async invokeHandlers(type: Interfaces.EventType, isReconnect: boolean): Promise<void> {
    const handlers = this.connectionHandlers[type];
    if (handlers === undefined) return;
    for (const handler of handlers) await handler(isReconnect);
  }

  private invokeErrorHandlers(error: Error, request: boolean = false): void {
    if (request) (<Error & { request: true }>error).request = true;
    for (const handler of this.errorHandlers) handler(error);
  }

  private resetPinTimeout(): void {
    if (this.pinTimeout) clearTimeout(this.pinTimeout);

    this.pinTimeout = setTimeout(() => {
      log.error('pin.timeout');
      this.socket!.close();
    }, 90000);
  }
}

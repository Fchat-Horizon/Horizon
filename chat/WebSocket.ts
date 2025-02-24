import { WebSocketConnection } from '../fchat';
import log from 'electron-log'; //tslint:disable-line:match-default-export-name

export default class Socket implements WebSocketConnection {
  static host = 'wss://chat.f-list.net/chat2';
  private socket: WebSocket;
  private lastHandler: Promise<void> = Promise.resolve();

  constructor() {
    this.socket = new WebSocket(Socket.host);
  }

  get readyState(): WebSocketConnection.ReadyState {
    return this.socket.readyState;
  }

  close(): void {
    log.debug('socket.close');
    this.socket.close();
  }

  onMessage(handler: (message: string) => void): void {
    this.socket.addEventListener('message', e => {
      this.lastHandler = this.lastHandler.then(
        () => handler(<string>e.data),
        err => {
          window.requestAnimationFrame(() => {
            throw err;
          });
          handler(<string>e.data);
        }
      );
    });
  }

  onOpen(handler: () => void): void {
    this.socket.addEventListener('open', handler);
  }

  onClose(handler: (e: CloseEvent) => void): void {
    this.socket.addEventListener('close', handler);
  }

  onError(handler: (error: Error) => void): void {
    this.socket.addEventListener('error', () => handler(new Error()));
  }

  send(message: string): void {
    this.socket.send(message);
  }
}

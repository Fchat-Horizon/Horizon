export type ProfileStoreCommand = 'flush' | 'start' | 'stop' | 'update-meta' | 'store' | 'get' | 'init';

export interface IndexedRequest {
  cmd: ProfileStoreCommand;
  id: string;
  params: Record<string, any>;
}

export interface IndexedResponse {
  id: string;
  type: 'event' | 'res';
  state: 'err' | 'ok';
  result?: any;
  msg?: string;
}

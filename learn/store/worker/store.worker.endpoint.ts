import _ from 'lodash';
// import log from 'electron-log'; //tslint:disable-line:match-default-export-name

import { IndexedStore } from '../indexed';
import { IndexedRequest, ProfileStoreCommand } from './types';

type IndexedCallback = (params: Record<string, any>) => Promise<any>;

let indexed: IndexedStore;

const reply = (req: IndexedRequest, result?: any, err?: string | Error): void => {
  const res: any = {
    type: 'res',
    id: req.id,
    state: err ? 'err' : 'ok',
    result
  };

  if (err) {
    console.error('store.worker.endpoint.error', err);
    res.msg = _.isString(err) ? err : err.message;
  }

  // log.debug('store.worker.endpoint.reply', { req, res });

  postMessage(res);
};

const generateMessageProcessor = () => {
  const messageMapper: Record<ProfileStoreCommand, IndexedCallback> = {
    flush: (params: Record<string, any>) => indexed.flushProfiles(params.daysToExpire),
    start: () => indexed.start(),
    stop: () => indexed.stop(),
    get: (params: Record<string, any>) => indexed.getProfile(params.name),
    store: (params: Record<string, any>) => indexed.storeProfile(params.character),

    'update-meta': (params: Record<string, any>) =>
      indexed.updateProfileMeta(params.name, params.images, params.guestbook, params.friends, params.groups),

    init: async (params: Record<string, any>): Promise<void> => {
      indexed = await IndexedStore.open(params.dbName);
    }
  };

  return async (e: Event) => {
    // log.silly('store.worker.endpoint.msg', { e });

    const req = (e as any).data as IndexedRequest;

    if (!req) {
      return;
    }

    if (!(req.cmd in messageMapper)) {
      reply(req, undefined, 'unknown command');
      return;
    }

    try {
      const result = await messageMapper[req.cmd](req.params);
      reply(req, result);
    } catch (err) {
      reply(req, undefined, err);
    }
  };
};

onmessage = generateMessageProcessor();

import type {
  Character as ComplexCharacter,
  CharacterGroup,
  Guestbook
} from '@/site/character_page/interfaces';
import type { PermanentIndexedStore, ProfileRecord } from './types';
import type { CharacterImage, SimpleCharacter } from '@/interfaces';

import { WorkerClient } from './worker/client';
import { createLogger } from '@/logger';
const log = createLogger('store-worker');

export class WorkerStore implements PermanentIndexedStore {
  // @ts-ignore
  private _isVue = true;

  protected readonly workerClient: WorkerClient;

  constructor() {
    this.workerClient = new WorkerClient();
  }

  static async open(dbName?: string): Promise<WorkerStore> {
    const store = new WorkerStore();

    await store.workerClient.request('init', { dbName });

    return store;
  }

  async getProfile(name: string): Promise<ProfileRecord | undefined> {
    const record: ProfileRecord | undefined = await this.workerClient.request(
      'get',
      { name }
    );

    // fix custom kinks to prevent hangs

    if (record && Array.isArray(record.profileData.character.customs)) {
      log.warn('character.customs.strange.worker.getProfile', {
        name: record.profileData.character.name,
        record,
        customs: record.profileData.character.customs
      });

      // fix customs because it will crash the client
      const customsObject: ProfileRecord['profileData']['character']['customs'] =
        {};

      for (const [key, value] of Object.entries(
        record.profileData.character.customs
      )) {
        if (value !== undefined) customsObject[key] = value;
      }

      record.profileData.character.customs = customsObject;

      await this.storeProfile(record.profileData);
    }

    return record;
  }

  async storeProfile(character: ComplexCharacter): Promise<void> {
    return this.workerClient.request('store', { character });
  }

  async updateProfileMeta(
    name: string,
    images: CharacterImage[] | null,
    guestbook: Guestbook | null,
    friends: SimpleCharacter[] | null,
    groups: CharacterGroup[] | null
  ): Promise<void> {
    return this.workerClient.request('update-meta', {
      name,
      images,
      guestbook,
      friends,
      groups
    });
  }

  async start(): Promise<void> {
    return this.workerClient.request('start');
  }

  async stop(): Promise<void> {
    return this.workerClient.request('stop');
  }

  async flushProfiles(daysToExpire: number): Promise<void> {
    return this.workerClient.request('flush', { daysToExpire });
  }
}

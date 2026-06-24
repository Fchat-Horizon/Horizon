import type { CacheCollection } from './cache';
import { Cache } from './cache';
import { emptyMap } from '@/fchat/common';

export abstract class AsyncCache<RecordType> {
  protected cache: CacheCollection<RecordType> = emptyMap();

  abstract get(name: string): Promise<RecordType | null>;

  // tslint:disable-next-line no-any
  abstract register(record: any): void;

  static nameKey(name: string): string {
    return Cache.nameKey(name);
  }

  clear(): void {
    this.cache = emptyMap();
  }
}

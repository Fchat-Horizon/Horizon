export interface CacheCollection<RecordType> {
  [key: string]: RecordType;
}

export abstract class Cache<RecordType> {
  protected cache: CacheCollection<RecordType> = {};

  get(name: string): RecordType | null {
    const key = Cache.nameKey(name);

    if (key in this.cache) {
      return this.cache[key];
    }

    return null;
  }

  // tslint:disable-next-line: no-any
  abstract register(record: any): void;

  has(name: string): boolean {
    return name in this.cache;
  }

  static nameKey(name: string): string {
    return name.toLowerCase();
  }
}

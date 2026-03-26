/**
 * @license MPL-2.0
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * @copyright 2024-2026 Sylvia Roselie & Respective Horizon Contributors
 * @version 1.0
 * @see {@link https://github.com/Fchat-Horizon/Horizon|GitHub repo}
 */

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

  // tslint:disable-next-line: no-any
  abstract deregister(record: any): void;

  has(name: string): boolean {
    return name in this.cache;
  }

  static nameKey(name: string): string {
    return name.toLowerCase();
  }
}

import * as remote from '@electron/remote';
import log from 'electron-log'; //tslint:disable-line:match-default-export-name
import * as fs from 'fs';
import * as path from 'path';

import { EIconUpdater } from './updater';

// The eicon modal displays 7x7 at a time, so this is one page.
const EICON_PAGE_RESULTS_COUNT = 7 * 7;

const CURRENT_STORE_VERSION = 2.0;

// These funtions are so generic they could be moved to a utils file.

function Rotate<T>(arr: T[], amount: number): T[] {
  const remove = arr.splice(0, amount);

  arr = arr.concat(remove);

  return remove;
}

async function FisherYatesShuffle(arr: any[]): Promise<void> {
  for (let cp = arr.length - 1; cp > 0; cp--) {
    const np = Math.floor(Math.random() * (cp + 1));
    [arr[cp], arr[np]] = [arr[np], arr[cp]];
  }
}

export class EIconStore {
  protected lookup: string[] = [];

  protected asOfTimestamp = 0;

  protected updater = new EIconUpdater();

  async save(): Promise<void> {
    log.info('eicons.save', {
      records: this.lookup.length,
      asOfTimestamp: this.asOfTimestamp,
      file: this.getStoreFilename()
    });

    fs.writeFileSync(
      this.getStoreFilename(),
      JSON.stringify({
        version: CURRENT_STORE_VERSION,
        asOfTimestamp: this.asOfTimestamp,
        records: this.lookup
      })
    );

    remote.ipcMain.emit('eicons.reload', { asOfTimestamp: this.asOfTimestamp });
  }

  async load(): Promise<void> {
    const fn = this.getStoreFilename();
    log.info('eicons.load', { fn });

    try {
      const data = JSON.parse(fs.readFileSync(fn, 'utf-8'));

      /** Handling old formats is a must.
       *
       * Rising: Object = {
       *    asOfTimestamp: number,
       *    records: [
       *      { eicon: string,
       *        timestamp: number }
       *    ]
       * };
       * v2: Object = {
       *    version: number,
       *    asOfTimestamp: number,
       *    records: [
       *      eicon: string
       *    ]
       * }
       *
       * If you need to add a new version, check FIRST for version number,
       * but leave structure-based detection as a backup and for the original.
       */
      if (
        (data?.version && data.version === 2) ||
        (Array.isArray(data?.records) && typeof data?.records[0] === 'string')
      ) {
        this.lookup = data?.records;
      } else if (
        Array.isArray(data?.records) &&
        typeof data?.records[0] === 'object'
      ) {
        this.lookup = data?.records.map((i: { eicon: string }) => i.eicon);
      } else this.lookup = [];

      this.asOfTimestamp = data?.asOfTimestamp || 0;

      if (!this.lookup.length || !this.asOfTimestamp) {
        log.warn('eicons.load.failure.disk', {
          timestamp: data.asOfTimestamp,
          data: this.lookup.length
        });
        throw new Error('Data from disk is strange.');
      }

      log.verbose('eicons.loaded.local', {
        records: this.lookup.length,
        asOfTimestamp: this.asOfTimestamp
      });

      await this.checkForUpdates();

      log.verbose('eicons.loaded.update.remote', {
        records: this.lookup.length,
        asOfTimestamp: this.asOfTimestamp
      });
    } catch (err) {
      try {
        await this.downloadAll();
      } catch (err2) {
        log.error('eicons.load.failure.download', {
          initial: err,
          explicit: err2
        });
      }
    }
  }

  protected getStoreFilename(): string {
    const baseDir = remote.app.getPath('userData');
    const settingsDir = path.join(baseDir, 'data');

    return path.join(settingsDir, 'eicons.json');
  }

  async downloadAll(): Promise<void> {
    log.info('eicons.downloadAll');

    const data = await this.updater.fetchAll();

    this.lookup = data.eicons;

    this.asOfTimestamp = data.asOfTimestamp;

    await this.save();

    this.shuffle();
  }

  async checkForUpdates(): Promise<void> {
    if (this.asOfTimestamp === 0) await this.downloadAll();
    else await this.update();
  }

  protected async update(): Promise<void> {
    log.verbose('eicons.update', { asOf: this.asOfTimestamp });

    const changes = await this.updater.fetchUpdates(this.asOfTimestamp);

    const removals = changes.recordUpdates
      .filter(changeRecord => changeRecord.action === '-')
      .map(i => i.eicon);

    this.removeIcons(removals);

    const additions = changes.recordUpdates
      .filter(changeRecord => changeRecord.action === '+')
      .map(i => i.eicon);

    this.addIcons(additions);

    this.asOfTimestamp = changes.asOfTimestamp;

    log.info('eicons.update.processed', {
      removals: removals.length,
      additions: additions.length,
      asOf: this.asOfTimestamp
    });

    if (changes.recordUpdates.length > 0) {
      await this.save();
    }

    this.shuffle();
  }

  protected addIcons(additions: string[]): void {
    additions.forEach(e => {
      if (!this.lookup.includes(e)) this.lookup.push(e);
    });
  }

  protected removeIcons(removals: string[]): void {
    this.lookup = this.lookup.filter(e => !removals.includes(e));
  }

  search(searchString: string): string[] {
    const query = searchString.trim().toLowerCase();
    const found = this.lookup.filter(e => e.indexOf(query) >= 0);

    return found.sort((a, b) => {
      if (a.startsWith(query) && !b.startsWith(query)) return -1;

      if (b.startsWith(query) && !a.startsWith(query)) return 1;

      return a.localeCompare(b);
    });
  }

  async shuffle(): Promise<void> {
    await FisherYatesShuffle(this.lookup);
  }

  nextPage(amount: number = 0): string[] {
    return Rotate(this.lookup, amount || EICON_PAGE_RESULTS_COUNT * 2);
  }

  private static sharedStore: EIconStore | undefined;

  static async getSharedStore(): Promise<EIconStore> {
    if (!EIconStore.sharedStore) {
      EIconStore.sharedStore = new EIconStore();

      await EIconStore.sharedStore.load();

      setInterval(
        () => EIconStore.sharedStore!.checkForUpdates(),
        60 * 60 * 1000
      );
    }

    return EIconStore.sharedStore;
  }
}

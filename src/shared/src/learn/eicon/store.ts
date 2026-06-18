import { ipc } from '@/platform/ipc';
import { createLogger } from '@/logger';
const log = createLogger('eicon-store');
import { FisherYatesShuffle } from '@/chat/common';

import { EIconUpdater } from './updater';

/**
 * The eicon UI has a maximum display size of 7x7 eicons at a time,
 * so this is one page.
 */
const EICON_PAGE_RESULTS_COUNT = 7 * 7;

/**
 * The current store version will be saved locally with the eicon store to be
 * used for future eicon store upgrades.
 */
const CURRENT_STORE_VERSION = 2.0;

/**
 * Frequency to check for updates from the eicon service.
 */
const UPDATE_FREQUENCY = 60 * 60 * 1000;

// These funtions are so generic they could be moved to a utils file.

/**
 * Flip through entries of an array in the style of a rolodex, rotating them
 * from front to back while preserving the circular order.
 * @param arr The "rolodex" to cycle through; will be modified in-place
 * @param amount Number of results to move from front to back
 * @returns An array of the entries that were flipped through
 */
function Rotate<T>(arr: T[], amount: number): T[] {
  const remove = arr.splice(0, amount);

  arr.push(...remove);

  return remove;
}

/**
 * Confirms whether a given subject is an array that contains only strings;
 * useful for runtime verification of files, websites, and
 * other imported data.
 * @param subj Any type; will validate as array before having its values checked
 * @returns Is the subject an array that contains only strings?
 */
function isArrayOfStrings(subj: any): subj is string[] {
  return Array.isArray(subj) && subj.every(item => typeof item === 'string');
}

/**
 * Confirms whether a given subject is an array that contains only objects;
 * useful for runtime verification of files, websites, and
 * other imported data.
 *
 * This does not check that the objects contain any
 * particular internal structure.
 * @param subj Any type; will validate as array before having its values checked
 * @returns Is the subject an array that contains only objects?
 */
function isArrayOfObjects(subj: any): subj is object[] {
  return Array.isArray(subj) && subj.every(item => typeof item === 'object');
}

/**
 * The EIconStore contains all the structures and methods necessary for
 * managing a full list of avilable eicons so users can quickly search for
 * their desired icon or perform a fully random search, as well as add eicons
 * to their favorites.
 *
 * Initialize a local reference of the store using {@link EIconStore.getSharedStore}.
 */
export class EIconStore {
  /**
   * The primary structure of the eicon store. Holds the list of eicons that's
   * saved & loaded, shuffled, searched, and paged through.
   */
  private lookup: string[] = [];

  /**
   * The timestamp is retrieved from the eicon server when eicons are
   * downloaded. It's stored locally to enable partial updates instead of
   * having to re-download the full eicon db on every app launch.
   */
  private asOfTimestamp = 0;

  /**
   * A mini-structure for the download functions.
   */
  private updater = new EIconUpdater();

  /**
   * Save the eicon store to disk alongside its last-updated timestamp and
   * file version - as long as there is something to save. If it fails, the
   * error is caught, logged, and ignored.
   */
  private async save(): Promise<void> {
    if (this.lookup.length > 0 && this.asOfTimestamp > 0) {
      log.info('eicons.save', {
        records: this.lookup.length,
        asOfTimestamp: this.asOfTimestamp
      });

      // & Written by the main process; failures are logged there.
      ipc.send(
        'eicons-write',
        JSON.stringify({
          version: CURRENT_STORE_VERSION,
          asOfTimestamp: this.asOfTimestamp,
          records: this.lookup
        })
      );
    }
  }

  /**
   * Loads the local eicon db and upates it with data from Xariah's eicon
   * service.
   *
   * Called from {@link getSharedStore} any time a new tab is opened,
   * including when launching the app.
   *
   * This method can properly load (and upgrade) the Rising "array of
   * eicon+timestamp objects" as well as the version 2 (post-Rising)
   * "array of eicon names".
   */
  private async load(): Promise<void> {
    log.info('eicons.load');

    try {
      const raw = <string | null>await ipc.invoke('eicons-read');
      if (raw === null) throw new Error('No local eicon store');
      const data = JSON.parse(raw);

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
        data?.version &&
        data.version === 2 &&
        isArrayOfStrings(data.records)
      ) {
        log.debug('eicons.load.v2.explicit');
        this.lookup = data.records;
      } else if (isArrayOfStrings(data?.records)) {
        log.debug('eicons.load.v2.implicit');
        this.lookup = data.records;
      } else if (isArrayOfObjects(data?.records)) {
        log.debug('eicons.load.v1.implicit');
        this.lookup = data.records.map((i: { eicon: string }) => i.eicon);
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

  /**
   * Rebuild the entire eicon table by refetching all data from the eicon
   * server.
   *
   * For manual invocation, use {@link checkForUpdates} instead.
   */
  private async downloadAll(): Promise<void> {
    log.info('eicons.downloadAll');

    const data = await this.updater.fetchAll();

    this.lookup = data.eicons;

    this.asOfTimestamp = data.asOfTimestamp;

    await this.save();

    this.shuffle();
  }

  /**
   * Check for eicon db updates using the most efficient method.
   */
  async checkForUpdates(): Promise<void> {
    if (this.lookup.length > 0 && this.asOfTimestamp > 0) await this.update();
    else await this.downloadAll();
  }

  /**
   * Uses the current timestamp to fetch all eicon additions and removals,
   * preventing the need to fetch the entire eicon db from the server on every
   * app launch.
   *
   * For manual invocation, use {@link checkForUpdates} instead.
   */
  private async update(): Promise<void> {
    log.verbose('eicons.update', { asOf: this.asOfTimestamp });

    const changes = await this.updater.fetchUpdates(this.asOfTimestamp);

    // This is a hack to prevent massive changesets from locking up the thread. I'm sorry.
    if (changes.recordUpdates.length > 2000) {
      log.warn('eicons.update.tooManyChanges', {
        changeCount: changes.recordUpdates.length
      });
      await this.downloadAll();
      return;
    }

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

  /**
   * Adds eicons to the local store, avoiding duplicates.
   * @param additions Array of eicon names
   */
  private addIcons(additions: string[]): void {
    this.lookup.push(...additions.filter(e => !this.lookup.includes(e)));
  }

  /**
   * Removes eicons from the local store.
   * @param removals Array of eicon names
   */
  private removeIcons(removals: string[]): void {
    this.lookup = this.lookup.filter(e => !removals.includes(e));
  }

  /**
   * Search eicon names for a given query.
   * @param searchString The user query
   * @returns A locale sorted array of all eicons whos names contain the given searchString.
   */
  search(searchString: string): string[] {
    const query = searchString.toLowerCase();
    const found = this.lookup.filter(e => e.includes(query));

    return found.sort((a, b) => {
      if (a.startsWith(query) && !b.startsWith(query)) return -1;

      if (b.startsWith(query) && !a.startsWith(query)) return 1;

      return a.localeCompare(b);
    });
  }

  /**
   * Randomize the eicon db using the fast Fisher-Yates shuffle.
   */
  async shuffle(): Promise<void> {
    await FisherYatesShuffle(this.lookup);
  }

  /**
   * Retrieve the first `amount` of eicons from the (presumably shuffled) eicon
   * db.
   * @param amount The number of results to return in this page
   * @returns An array of eicon names
   */
  nextPage(amount: number = 0): string[] {
    return Rotate(this.lookup, amount || EICON_PAGE_RESULTS_COUNT * 2);
  }

  /**
   * Storage container for a singleton. The proper way to retrieve the store
   * is by invoking {@link EIconStore.getSharedStore}.
   */
  private static sharedStore: EIconStore | undefined;

  /**
   * A custom implementation of a singleton. Useful because there are multiple
   * eicon selector UIs and each one will try to instantiate the eicon store.
   * @returns The active instance of EIconStore, or a new one if it doesn't exist
   */
  static async getSharedStore(): Promise<EIconStore> {
    if (!EIconStore.sharedStore) {
      EIconStore.sharedStore = new EIconStore();

      await EIconStore.sharedStore.load();

      setInterval(
        () => EIconStore.sharedStore!.checkForUpdates(),
        UPDATE_FREQUENCY
      );
    }

    return EIconStore.sharedStore;
  }
}

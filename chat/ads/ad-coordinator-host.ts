import throat from 'throat';
import { delay } from '../../helpers/async';
import { createLogger } from '../../logger';
const log = createLogger('ad-coordinator-host');

const adCoordinatorThroat = throat(1);

// The slice of the host's IPC event this coordinator needs to answer a guest.
interface AdReplyTarget {
  reply(channel: string, ...args: unknown[]): void;
}

export class AdCoordinatorHost {
  static readonly MIN_DISTANCE = 7500;
  private lastPost = Date.now();

  async processAdRequest(event: AdReplyTarget, adId: string): Promise<void> {
    await adCoordinatorThroat(async () => {
      const sinceLastPost = Date.now() - this.lastPost;
      const waitTime = Math.max(
        0,
        AdCoordinatorHost.MIN_DISTANCE - sinceLastPost
      );

      log.debug('adid.request.host', { adId, sinceLastPost, waitTime });

      await delay(waitTime);

      log.debug('adid.request.host.grant', { adId, sinceLastPost, waitTime });

      event.reply('grant-send-ad', adId);

      this.lastPost = Date.now();
    });
  }
}

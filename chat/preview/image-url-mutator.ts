import * as _ from 'lodash';
import Axios from 'axios';
import { domain } from '../../bbcode/core';

export type UrlSolverCallback = (url: string, match: RegExpMatchArray) => Promise<string>;

export interface UrlSolver {
  matcher: RegExp;
  solver: UrlSolverCallback;
}

export class ImageUrlMutator {
  private solvers: UrlSolver[] = [];

  private static readonly IMGUR_CLIENT_ID = 'd60e27140a73b2e';

  private static readonly IMGUR_IMAGE_URL_REGEX = /^https?:\/\/i.imgur.com\/([a-zA-Z0-9]+)(\.[a-z0-9A-Z]+)(.*)$/;

  private debug: boolean;

  private static SUPPRESSOR_DOMAINS = ['vimeo.com', 'gfycat.com'];

  constructor(debug: boolean) {
    this.debug = debug;

    this.init();
  }

  protected init(): void {
    this.add(/^https?:\/\/(www\.)?tiktok\.com\//, async (url: string, _match: RegExpMatchArray): Promise<string> => {
      const result = await Axios.get(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
        responseType: 'json'
      });

      const userId = result.data.author_unique_id;
      const videoId = result.data.embed_product_id;

      return `https://www.tiktokstalk.com/user/${userId}/${videoId}/`;
    });

    this.add(
      /^http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?[\w\?=]*)?/,
      async (_url: string, match: RegExpMatchArray): Promise<string> => {
        const videoId = match[1];
        return `https://yewtu.be/embed/${videoId}?autoplay=1`;
      }
    );

    this.add(/^https?:\/\/.*twitter.com\/(.*)/, async (url: string, match: RegExpMatchArray): Promise<string> => {
      const path = match[1];

      try {
        const result = await Axios.get(`https://api.fxtwitter.com/${path}`);
        const imageUrl = _.get(result, 'data.tweet.media.photos.0.url', null);

        if (!imageUrl) {
          const videoUrl = _.get(result, 'data.tweet.media.videos.0.url', null);
          if (!videoUrl) {
            return url;
          }

          if (this.debug) console.log('Twitter', url, videoUrl);

          return videoUrl;
        }

        if (this.debug) console.log('Twitter', url, imageUrl);

        return imageUrl;
      } catch (err) {
        console.error('Twitter Failure', url, err);
        return url;
      }
    });

    this.add(/^https?:\/\/rule34video.com\/videos\/([0-9a-zA-Z-_]+)/, async (_url: string, match: RegExpMatchArray): Promise<string> => {
      const videoId = match[1];

      return `https://rule34video.com/embed/${videoId}`;
    });

    this.add(
      /^https?:\/\/(www.)?pornhub.com\/view_video.php\?viewkey=([a-z0-9A-Z]+)/,
      async (_url: string, match: RegExpMatchArray): Promise<string> => {
        // https://www.pornhub.com/view_video.php?viewkey=ph5e11b975327f2
        // https://www.pornhub.com/embed/ph5e11b975327f2

        const videoId = match[2];

        return `https://pornhub.com/embed/${videoId}`;
      }
    );

    this.add(/^https?:\/\/(www.)?pornhub.com\/gif\/([a-z0-9A-Z]+)/, async (_url: string, match: RegExpMatchArray): Promise<string> => {
      const gifId = match[2];

      return `https://pornhub.com/embedgif/${gifId}`;
    });

    this.add(
      /^https?:\/\/(www.|v3.)?gifdeliverynetwork.com\/([a-z0-9A-Z]+)/,
      async (_url: string, match: RegExpMatchArray): Promise<string> => {
        const redgifId = match[2];

        // Redgifs is correct
        return `https://www.redgifs.com/ifr/${redgifId}?controls=0&hd=1`;
      }
    );

    this.add(
      /^https?:\/\/(www.|v3.)?redgifs.com\/watch\/([a-z0-9A-Z]+)/,
      async (_url: string, match: RegExpMatchArray): Promise<string> => {
        const redgifId = match[2];

        return `https://www.redgifs.com/ifr/${redgifId}?controls=0&hd=1`;
      }
    );

    this.add(/^https?:\/\/media[0-9]?.giphy.com\/media\/(.+)$/, async (_url: string, match: RegExpMatchArray): Promise<string> => {
      const giphyUri = match[1];

      return `https://i.giphy.com/media/${giphyUri}`;
    });

    this.add(/^https?:\/\/(www.)?gfycat.com\/([a-z0-9A-Z\-]+)\/?$/, async (_url: string, match: RegExpMatchArray): Promise<string> => {
      const gfyId = match[2];

      return `https://gfycat.com/ifr/${gfyId}?controls=0&hd=1`;
    });

    this.add(/^https?:\/\/e621.net\/(posts|post\/show)\/([0-9]+)/, async (url: string, match: RegExpMatchArray): Promise<string> => {
      const galleryId = match[2];

      try {
        const result = await Axios.get(`https://e621.net/posts/${galleryId}.json`, {
          // headers: {
          //     'User-Agent': 'F-List-Rising-Client/1.0'
          // }
        });

        const imageUrl = _.get(result, 'data.post.file.url') as string;

        return imageUrl || url;
      } catch (err) {
        console.error('E621 API Failure', url, err);
        return url;
      }
    });

    this.add(
      /^https?:\/\/((m|www).)?imgur.(com|io)\/gallery\/([a-zA-Z0-9]+)/,
      async (url: string, match: RegExpMatchArray): Promise<string> => {
        // Imgur Gallery
        const galleryId = match[4];

        try {
          const result = await Axios.get(`https://api.imgur.com/3/gallery/${galleryId}/images`, {
            headers: {
              Authorization: `Client-ID ${ImageUrlMutator.IMGUR_CLIENT_ID}`
            }
          });

          const imageUrl = _.get(result, 'data.data.0.link', null);

          if (!imageUrl) {
            return url;
          }

          const imageCount = _.get(result, 'data.data.length', 1);

          if (this.debug) console.log('Imgur gallery', url, imageUrl, imageCount);

          return this.getOptimizedImgurUrlFromUrl(`${imageUrl}?flist_gallery_image_count=${imageCount}`);
        } catch (err) {
          console.error('Imgur Gallery Failure', url, err);
          return url;
        }
      }
    );

    this.add(/^https?:\/\/((m|www).)?imgur.(com|io)\/a\/([a-zA-Z0-9]+)/, async (url: string, match: RegExpMatchArray): Promise<string> => {
      // Imgur Album
      const albumId = match[4];

      try {
        const result = await Axios.get(`https://api.imgur.com/3/album/${albumId}/images`, {
          headers: {
            Authorization: `Client-ID ${ImageUrlMutator.IMGUR_CLIENT_ID}`
          }
        });

        const imageUrl = _.get(result, 'data.data.0.link', null);

        if (!imageUrl) {
          return url;
        }

        const imageCount = _.get(result, 'data.data.length', 1);

        if (this.debug) console.log('Imgur album', url, imageUrl, imageCount);

        return this.getOptimizedImgurUrlFromUrl(`${imageUrl}?flist_gallery_image_count=${imageCount}`);
      } catch (err) {
        console.error('Imgur Album Failure', url, err);
        return url;
      }
    });

    // must be AFTER gallery & album test
    this.add(/^https?:\/\/((m|www).)?imgur.(com|io)\/([a-zA-Z0-9]+)/, async (url: string, match: RegExpMatchArray): Promise<string> => {
      // Single Imgur Image
      const imageId = match[4];

      try {
        const result = await Axios.get(`https://api.imgur.com/3/image/${imageId}`, {
          headers: {
            Authorization: `Client-ID ${ImageUrlMutator.IMGUR_CLIENT_ID}`
          }
        });

        const imageUrl = _.get(result, 'data.data.link', url);

        if (this.debug) console.log('Imgur image', url, imageUrl);

        return this.getOptimizedImgurUrlFromUrl(imageUrl as string);
      } catch (err) {
        console.error('Imgur Image Failure', url, err);
        return url;
      }
    });

    // Load large thumbnail instead of the full size picture when possible
    this.add(ImageUrlMutator.IMGUR_IMAGE_URL_REGEX, async (_url: string, match: RegExpMatchArray) =>
      this.getOptimizedImgUrlFromMatch(match)
    );
  }

  getOptimizedImgUrlFromMatch(match: RegExpMatchArray): string {
    const imageId = match[1];
    const ext = match[2];
    const rest = match[3];

    const finalExt = ext === '.gif' || ext === '.gifv' ? '.mp4' : ext;

    return `https://i.imgur.com/${imageId}${imageId.length <= 7 && finalExt !== '.mp4' ? 'l' : ''}${finalExt}${rest}`;
  }

  getOptimizedImgurUrlFromUrl(url: string): string {
    const m = url.match(ImageUrlMutator.IMGUR_IMAGE_URL_REGEX);

    return m ? this.getOptimizedImgUrlFromMatch(m) : url;
  }

  setDebug(debug: boolean): void {
    this.debug = debug;
  }

  protected add(matcher: RegExp, solver: UrlSolverCallback): void {
    this.solvers.push({ matcher, solver });
  }

  async resolve(url: string): Promise<string> {
    const match = _.find(this.solvers, (s: UrlSolver) => url.match(s.matcher)) as UrlSolver | undefined;

    return this.attachSuppressor(match ? await match.solver(url, url.match(match.matcher) as RegExpMatchArray) : url);

    // return this.attachSuppressor(await match.solver(url, url.match(match.matcher) as RegExpMatchArray));
  }

  attachSuppressor(url: string): string {
    const host = domain(url);

    if (_.indexOf(ImageUrlMutator.SUPPRESSOR_DOMAINS, host) < 0) {
      return url;
    }

    const u = new URL(url);

    u.searchParams.set('__x-suppress__', '1');

    return u.toString();
  }
}

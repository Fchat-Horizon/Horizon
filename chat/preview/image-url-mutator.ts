import * as _ from 'lodash';
import Axios from 'axios';
import { domain } from '../../bbcode/core';

export type UrlSolverCallback = (
  url: string,
  match: RegExpMatchArray
) => Promise<string>;

export interface UrlSolver {
  matcher: RegExp;
  solver: UrlSolverCallback;
}

export class ImageUrlMutator {
  private solvers: UrlSolver[] = [];

  private static readonly IMGUR_CLIENT_ID = 'd60e27140a73b2e';

  private static readonly IMGUR_IMAGE_URL_REGEX =
    /^https?:\/\/i.imgur.com\/([a-zA-Z0-9]+)(\.[a-z0-9A-Z]+)(.*)$/;

  private static redgifsToken: string | null = null;

  private debug: boolean;

  private static SUPPRESSOR_DOMAINS = ['vimeo.com', 'gfycat.com'];

  constructor(debug: boolean) {
    this.debug = debug;

    this.init();
  }

  protected init(): void {
    this.add(
      /^https?:\/\/(www\.)?tiktok\.com\//,
      async (url: string, _match: RegExpMatchArray): Promise<string> => {
        const result = await Axios.get(
          `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
          {
            responseType: 'json'
          }
        );

        const userId = result.data.author_unique_id;
        const videoId = result.data.embed_product_id;

        return `https://picuki.com/media/${videoId}`;
      }
    );

    this.add(
      /^https?:\/\/(?:.*twitter.com|x.com|fixupx.com|fixvx.com|girlcockx.com)\/(\w*\/status\/\d*)(?:\/(photo)\/(\d*))?/,
      async (url: string, match: RegExpMatchArray): Promise<string> => {
        const path = match[1];

        try {
          const result = await Axios.get(`https://api.fxtwitter.com/${path}`);
          //This looks like complete nonsense, but it's pretty simple to explain:
          //The regex has 3 capture groups, the latter 2 of which are optional:
          //  1.  The base URI we send to the fxtwitter.com API to fetch the tweet data
          //  2.  Whether or not the original twitter.com/ x.com URL is a photo link or not
          //  3.  The number of the photo in the tweet. We'll be relying on our regular expression to parse whether or not this is actually a number,
          //      not Typescript (hence `(\d*)?` which checks for digit characters only.
          //This way, if the link in question focuses on a specific photo in a tweet, we can ask fxtwitter to show us that specific image instead
          //Everything else is just sanity checking
          const photoNum = match[3] ? Number.parseInt(match[3]) : 1; // default to 1 if not provided
          const photoIndex = photoNum - 1;
          const imageUrl = _.get(
            result,
            `data.tweet.media.photos.${photoIndex}.url`,
            null
          );

          if (!imageUrl) {
            const videoUrl = _.get(
              result,
              'data.tweet.media.videos.0.url',
              null
            );
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
      }
    );

    this.add(
      /^https?:\/\/([\w-]*bsky|bskye|bskyx|bsyy)\.app\/(profile\/[\w.:]+\/post\/\w+)/,
      async (url: string, match: RegExpMatchArray): Promise<string> => {
        const path = match[2];

        // https://github.com/Lexedia/VixBluesky/wiki/Features#custom-pds-video-support
        return `https://r.v.bskx.app/${path}`;
      }
    );

    this.add(
      /^https?:\/\/rule34video.com\/videos\/([0-9a-zA-Z-_]+)/,
      async (_url: string, match: RegExpMatchArray): Promise<string> => {
        const videoId = match[1];

        return `https://rule34video.com/embed/${videoId}`;
      }
    );

    this.add(
      /^https?:\/\/(www.)?pornhub.com\/view_video.php\?viewkey=([a-z0-9A-Z]+)/,
      async (_url: string, match: RegExpMatchArray): Promise<string> => {
        // https://www.pornhub.com/view_video.php?viewkey=ph5e11b975327f2
        // https://www.pornhub.com/embed/ph5e11b975327f2

        const videoId = match[2];

        return `https://pornhub.com/embed/${videoId}`;
      }
    );

    this.add(
      /^https?:\/\/(www.)?pornhub.com\/gif\/([a-z0-9A-Z]+)/,
      async (_url: string, match: RegExpMatchArray): Promise<string> => {
        const gifId = match[2];

        return `https://pornhub.com/embedgif/${gifId}`;
      }
    );

    this.add(
      /^https?:\/\/(www.|v3.)?redgifs.com\/(?:watch|ifr)\/([a-z0-9A-Z]+)/,
      async (_url: string, match: RegExpMatchArray): Promise<string> => {
        const redgifId = match[2];
        const fallback = `https://www.redgifs.com/ifr/${redgifId}?controls=0%hd=1`;

        for (const refresh of [false, true]) {
          try {
            const token = await this.getRedgifsToken(refresh);
            if (!token) continue;

            const response = await Axios.get(
              `https://api.redgifs.com/v2/gifs/${redgifId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
            const hdUrl = _.get(response, 'data.gif.urls.hd');

            return hdUrl || fallback;
          } catch (err) {
            // attempt token refresh, then fallback to iframe if API fails
            if (refresh && this.debug)
              console.error('RedGifs API Failure', redgifId, err);
          }
        }
        return fallback;
      }
    );

    this.add(
      /^https?:\/\/media[0-9]?.giphy.com\/media\/(.+)$/,
      async (_url: string, match: RegExpMatchArray): Promise<string> => {
        const giphyUri = match[1];

        return `https://i.giphy.com/media/${giphyUri}`;
      }
    );

    this.add(
      /^https?:\/\/(www.)?gfycat.com\/([a-z0-9A-Z\-]+)\/?$/,
      async (_url: string, match: RegExpMatchArray): Promise<string> => {
        const gfyId = match[2];

        return `https://gfycat.com/ifr/${gfyId}?controls=0&hd=1`;
      }
    );

    this.add(
      /^https?:\/\/e621.net\/(posts|post\/show)\/([0-9]+)/,
      async (url: string, match: RegExpMatchArray): Promise<string> => {
        const galleryId = match[2];

        try {
          const result = await Axios.get(
            `https://e621.net/posts/${galleryId}.json`,
            {
              // headers: {
              //     'User-Agent': 'F-List-Rising-Client/1.0'
              // }
            }
          );

          const imageUrl = _.get(result, 'data.post.file.url') as string;

          return imageUrl || url;
        } catch (err) {
          console.error('E621 API Failure', url, err);
          return url;
        }
      }
    );
  }

  private async getRedgifsToken(forceRefresh = false): Promise<string> {
    if (!forceRefresh && ImageUrlMutator.redgifsToken) {
      return ImageUrlMutator.redgifsToken;
    }

    try {
      const response = await Axios.get(
        'https://api.redgifs.com/v2/auth/temporary'
      );
      const token = _.get(response, 'data.token');
      console.log('Fetching redgifs API token');

      if (token) {
        ImageUrlMutator.redgifsToken = token;
        return token;
      }
    } catch (err) {
      if (this.debug) console.error('Failed to get RedGifs token', err);
    }

    return '';
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
    const match = _.find(this.solvers, (s: UrlSolver) =>
      url.match(s.matcher)
    ) as UrlSolver | undefined;

    return this.attachSuppressor(
      match
        ? await match.solver(url, url.match(match.matcher) as RegExpMatchArray)
        : url
    );
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

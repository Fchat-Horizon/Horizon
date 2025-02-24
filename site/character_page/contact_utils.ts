import { urlRegex as websitePattern } from '../../bbcode/core';
import { Infotag } from '../../interfaces';

const daUsernamePattern = /^([a-z0-9_\-]+)$/i;
const daSitePattern = /^https?:\/\/([a-z0-9_\-]+)\.deviantart\.com\//i;
const emailPattern = /^((?:[a-z0-9])+(?:[a-z0-9\._-])*@(?:[a-z0-9_-])+(?:[a-z0-9\._-]+)+)$/i;
const faUsernamePattern = /^([a-z0-9_\-~.]+)$/i;
const faSitePattern = /^https?:\/\/(?:www\.)?furaffinity\.net\/user\/([a-z0-9_\-~,]+)\/?$/i;
const inkbunnyUsernamePattern = /^([a-z0-9]+)$/i;
const inkbunnySitePattern = /^https?:\/\/inkbunny\.net\/([a-z0-9]+)\/?$/i;
const skypeUsernamePattern = /^([a-z][a-z0-9.,\-_]*)/i;
const twitterUsernamePattern = /^([a-z0-9_]+)$/i;
const twitterSitePattern = /^https?:\/\/(?:www\.)?twitter\.com\/([a-z0-9_]+)\/?$/i;
const yimUsernamePattern = /^([a-z0-9_\-]+)$/i;

const daNormalize = normalizeSiteUsernamePair(daSitePattern, daUsernamePattern);
const faNormalize = normalizeSiteUsernamePair(faSitePattern, faUsernamePattern);
const inkbunnyNormalize = normalizeSiteUsernamePair(inkbunnySitePattern, inkbunnyUsernamePattern);
const twitterNormalize = normalizeSiteUsernamePair(twitterSitePattern, twitterUsernamePattern);

function normalizeSiteUsernamePair(site: RegExp, username: RegExp): (value: string) => string | undefined {
  return (value: string): string | undefined => {
    let matches = value.match(site);
    if (matches !== null && matches.length === 2) return matches[1];
    matches = value.match(username);
    if (matches !== null && matches.length === 2) return matches[1];
    return;
  };
}

export function formatContactValue(infotag: Infotag, value: string): string {
  const methodName = infotag.name.toLowerCase();
  const formatters: { [key: string]: (() => string | undefined) | undefined } = {
    deviantart(): string | undefined {
      return daNormalize(value);
    },
    furaffinity(): string | undefined {
      return faNormalize(value);
    },
    inkbunny(): string | undefined {
      return inkbunnyNormalize(value);
    },
    twitter(): string | undefined {
      return twitterNormalize(value);
    }
  };
  if (typeof formatters[methodName] === 'function') {
    const formatted = formatters[methodName]!();
    return formatted !== undefined ? formatted : value;
  }
  return value;
}

export function formatContactLink(infotag: Infotag, value: string): string | undefined {
  const methodName = infotag.name.toLowerCase();
  const formatters: { [key: string]: (() => string | undefined) | undefined } = {
    deviantart(): string | undefined {
      const username = daNormalize(value);
      if (username !== undefined) return `https://${username}.deviantart.com/`;
    },
    'e-mail'(): string | undefined {
      const matches = value.match(emailPattern);
      if (matches !== null && matches.length === 2) return `mailto:${value}`;
    },
    furaffinity(): string | undefined {
      const username = faNormalize(value);
      if (username !== undefined) return `https://www.furaffinity.net/user/${username}`;
    },
    inkbunny(): string | undefined {
      const username = inkbunnyNormalize(value);
      if (username !== undefined) return `https://inkbunny.net/${username}`;
    },
    skype(): string | undefined {
      const matches = value.match(skypeUsernamePattern);
      if (matches !== null && matches.length === 2) return `skype:${value}?chat`;
    },
    twitter(): string | undefined {
      const username = twitterNormalize(value);
      if (username !== undefined) return `https://twitter.com/${username}`;
    },
    website(): string | undefined {
      const matches = value.match(websitePattern);
      if (matches !== null && matches.length === 2) return value;
    },
    yim(): string | undefined {
      const matches = value.match(yimUsernamePattern);
      if (matches !== null && matches.length === 2) return `ymsg:sendIM?${value}`;
    }
  };
  if (typeof formatters[methodName] === 'function') return formatters[methodName]!();
  return;
}

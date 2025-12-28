import core from './core';
import l from './localize';
import { buildMutedMatcher } from '../helpers/muted-matchers';

type MutedWordsMode = 'hide' | 'spoiler' | 'blur' | 'hide-message';
type MutedEiconsMode = 'hide' | 'spoiler' | 'blur' | 'replace';

type MutedWordsConfig = {
  mode: MutedWordsMode;
  matcher: RegExp;
};

type MutedEiconsConfig = {
  mode: MutedEiconsMode;
  matcher: RegExp;
  replacement?: string;
};

export type ApplyMutedWordsResult = {
  action: 'none' | 'hide-message';
};

let cachedMutedWordsConfig: { key: string; config: MutedWordsConfig } | null =
  null;
let cachedMutedEiconsConfig: { key: string; config: MutedEiconsConfig } | null =
  null;

const MUTED_WORDS_MODES: ReadonlyArray<MutedWordsMode> = [
  'hide',
  'spoiler',
  'blur',
  'hide-message'
];
const MUTED_EICONS_MODES: ReadonlyArray<MutedEiconsMode> = [
  'hide',
  'spoiler',
  'blur',
  'replace'
];

function normalizeEntries(entries?: ReadonlyArray<string>): string[] {
  if (!entries) return [];
  return entries
    .map(entry => entry.trim())
    .filter((entry: string) => entry.length > 0);
}

function getSettings(): any | null {
  const settings = core.state?.settings as any;
  return settings || null;
}

function getMutedWordsConfig(): MutedWordsConfig | null {
  const settings = getSettings();
  if (!settings) return null;

  const words = normalizeEntries(settings.horizonMutedWords);
  if (!words.length) {
    cachedMutedWordsConfig = null;
    return null;
  }

  const rawMode = settings.horizonMutedWordsMode || 'hide';
  const mode: MutedWordsMode = MUTED_WORDS_MODES.includes(rawMode)
    ? rawMode
    : 'hide';
  const key = `${mode}:${words.map((word: string) => word.toLowerCase()).join('|')}`;
  if (cachedMutedWordsConfig && cachedMutedWordsConfig.key === key) {
    return cachedMutedWordsConfig.config;
  }

  const matcher = buildMutedMatcher(words, 'word');
  if (!matcher) {
    cachedMutedWordsConfig = null;
    return null;
  }
  const config = { mode, matcher };
  cachedMutedWordsConfig = { key, config };
  return config;
}

function getMutedEiconsConfig(): MutedEiconsConfig | null {
  const settings = getSettings();
  if (!settings) return null;

  const eicons = normalizeEntries(settings.horizonMutedEicons);
  if (!eicons.length) {
    cachedMutedEiconsConfig = null;
    return null;
  }

  const rawMode = settings.horizonMutedEiconsMode || 'hide';
  const mode: MutedEiconsMode = MUTED_EICONS_MODES.includes(rawMode)
    ? rawMode
    : 'hide';
  const replacement = (settings.horizonMutedEiconsReplacement || '').trim();
  const key = `eicons:${mode}:${replacement}:${eicons.map((e: string) => e.toLowerCase()).join('|')}`;
  if (cachedMutedEiconsConfig && cachedMutedEiconsConfig.key === key) {
    return cachedMutedEiconsConfig.config;
  }

  const matcher = buildMutedMatcher(eicons, 'string');
  if (!matcher) {
    cachedMutedEiconsConfig = null;
    return null;
  }
  const config: MutedEiconsConfig = { mode, matcher };
  if (mode === 'replace' && replacement) {
    config.replacement = replacement;
  }
  cachedMutedEiconsConfig = { key, config };
  return config;
}

export function getFilterKey(): string {
  getMutedWordsConfig();
  getMutedEiconsConfig();
  const wordsKey = cachedMutedWordsConfig?.key || 'none';
  const eiconsKey = cachedMutedEiconsConfig?.key || 'none';
  return `${wordsKey}|${eiconsKey}`;
}

interface SpoilerElements {
  link: HTMLAnchorElement;
  revealed: HTMLSpanElement;
}

function isEiconElement(node: Node | null): node is HTMLImageElement {
  return (
    !!node &&
    node.nodeType === Node.ELEMENT_NODE &&
    (node as Element).tagName === 'IMG' &&
    (node as Element).classList.contains('icon')
  );
}

function isLineBreak(node: Node | null): node is HTMLBRElement {
  return (
    !!node &&
    node.nodeType === Node.ELEMENT_NODE &&
    (node as Element).tagName === 'BR'
  );
}

function isWhitespaceText(node: Node | null): boolean {
  return (
    !!node &&
    node.nodeType === Node.TEXT_NODE &&
    (node.nodeValue || '').trim() === ''
  );
}

function createSpoilerElements(): SpoilerElements {
  const link = document.createElement('a');
  const revealed = document.createElement('span');
  link.href = '#';
  link.className = 'spoiler-tag filtered-spoiler';
  link.onclick = e => {
    const target = e.target as HTMLElement;
    target.parentElement!.replaceChild(revealed, target);
    return false;
  };
  link.appendChild(
    document.createTextNode(
      l('settings.mutedWords.spoilerText') || '[filtered — click to reveal]'
    )
  );
  return { link, revealed };
}

function createSpoiler(content: Node): HTMLAnchorElement {
  const { link, revealed } = createSpoilerElements();
  revealed.appendChild(content);
  return link;
}

function createBlurContainer(blurPx: number = 4): {
  container: HTMLSpanElement;
  blurred: HTMLSpanElement;
} {
  const container = document.createElement('span');
  container.className = 'filtered-blur-container';
  container.style.overflow = 'hidden';
  container.style.display = 'inline-block';
  container.style.verticalAlign = 'bottom';
  container.style.cursor = 'pointer';
  container.title = 'Click to reveal filtered content';

  const blurred = document.createElement('span');
  blurred.className = 'filtered-blur';
  blurred.style.filter = `blur(${blurPx}px)`;
  blurred.style.display = 'inline-block';
  blurred.style.transition = 'filter 0.2s';

  container.appendChild(blurred);
  container.onclick = e => {
    e.preventDefault();
    e.stopPropagation();
    blurred.style.filter = 'none';
    container.style.cursor = 'default';
    container.onclick = null;
    container.title = '';
  };
  return { container, blurred };
}

function createBlurElement(content: Node): HTMLSpanElement {
  const { container, blurred } = createBlurContainer(4);
  blurred.appendChild(content);
  return container;
}

function replaceTextNodeWithWrapper(
  node: Text,
  matcher: RegExp,
  wrapFn: (content: Node) => Node
): void {
  const text = node.nodeValue || '';
  matcher.lastIndex = 0;
  if (!matcher.test(text)) return;
  matcher.lastIndex = 0;

  const fragment = document.createDocumentFragment();
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = matcher.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (start > lastIndex) {
      fragment.appendChild(
        document.createTextNode(text.slice(lastIndex, start))
      );
    }
    fragment.appendChild(wrapFn(document.createTextNode(match[0])));
    lastIndex = end;
  }

  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  node.parentNode?.replaceChild(fragment, node);
}

function hasTextMatch(root: HTMLElement, matcher: RegExp): boolean {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (
    let current = walker.nextNode();
    current !== null;
    current = walker.nextNode()
  ) {
    const text = current.nodeValue || '';
    matcher.lastIndex = 0;
    if (matcher.test(text)) return true;
  }
  return false;
}

function collectEiconMosaic(img: Element): Node[] {
  const parent = img.parentElement;
  if (!parent) return [img];

  let startNode: Node = img;
  let prev = img.previousSibling;
  while (prev) {
    if (isEiconElement(prev)) {
      startNode = prev;
      prev = prev.previousSibling;
      continue;
    }
    if (isLineBreak(prev)) {
      const beforeBr = prev.previousSibling;
      if (isEiconElement(beforeBr)) {
        startNode = prev;
        prev = prev.previousSibling;
        continue;
      }
      break;
    }
    if (isWhitespaceText(prev)) {
      prev = prev.previousSibling;
      continue;
    }
    break;
  }

  const mosaic: Node[] = [];
  let current: Node | null = startNode;
  while (current) {
    if (isEiconElement(current)) {
      mosaic.push(current);
      current = current.nextSibling;
      continue;
    }
    if (isLineBreak(current)) {
      const afterBr = current.nextSibling;
      let nextEl = afterBr;
      while (isWhitespaceText(nextEl)) {
        nextEl = nextEl?.nextSibling || null;
      }
      if (isEiconElement(nextEl)) {
        mosaic.push(current);
        current = current.nextSibling;
        continue;
      }
      break;
    }
    if (isWhitespaceText(current)) {
      mosaic.push(current);
      current = current.nextSibling;
      continue;
    }
    break;
  }

  return mosaic;
}

export function applyMutedWords(root: HTMLElement): ApplyMutedWordsResult {
  const result: ApplyMutedWordsResult = { action: 'none' };

  const textConfig = getMutedWordsConfig();
  if (textConfig) {
    const { matcher, mode } = textConfig;

    if (mode === 'hide-message') {
      if (hasTextMatch(root, matcher)) {
        result.action = 'hide-message';
        return result;
      }
    } else {
      const textNodes: Text[] = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: node => {
          const text = node.nodeValue || '';
          if (!text.trim()) return NodeFilter.FILTER_SKIP;
          const parent = (node as Text).parentElement;
          if (!parent) return NodeFilter.FILTER_SKIP;
          if (parent.closest('a.spoiler-tag')) return NodeFilter.FILTER_REJECT;
          if (parent.closest('.filtered-blur')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      for (
        let current = walker.nextNode();
        current !== null;
        current = walker.nextNode()
      ) {
        textNodes.push(current as Text);
      }

      for (const node of textNodes) {
        if (mode === 'hide') {
          matcher.lastIndex = 0;
          const nextValue = (node.nodeValue || '').replace(matcher, '');
          if (nextValue.length === 0) {
            node.parentNode?.removeChild(node);
          } else if (nextValue !== node.nodeValue) {
            node.nodeValue = nextValue;
          }
        } else if (mode === 'spoiler') {
          replaceTextNodeWithWrapper(node, matcher, createSpoiler);
        } else if (mode === 'blur') {
          replaceTextNodeWithWrapper(node, matcher, createBlurElement);
        }
      }
    }
  }

  const eiconConfig = getMutedEiconsConfig();
  if (eiconConfig) {
    const { matcher: eiconMatcher, mode: eiconMode } = eiconConfig;
    const processedEicons = new Set<Element>();

    const eicons = root.querySelectorAll('img.icon');
    for (const img of Array.from(eicons)) {
      if (processedEicons.has(img)) continue;

      const src = img.getAttribute('src') || '';
      if (!src.includes('/eicon/')) continue;
      const label = (
        img.getAttribute('title') ||
        img.getAttribute('alt') ||
        ''
      ).toLowerCase();
      eiconMatcher.lastIndex = 0;
      if (!eiconMatcher.test(label)) continue;

      const mosaic = collectEiconMosaic(img);
      mosaic.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          if (el.tagName === 'IMG' && el.classList.contains('icon')) {
            processedEicons.add(el);
          }
        }
      });

      if (eiconMode === 'hide') {
        mosaic.forEach(node => node.parentNode?.removeChild(node));
        continue;
      }

      const parent = img.parentElement;
      if (!parent || mosaic.length === 0) continue;

      if (eiconMode === 'spoiler') {
        const { link, revealed } = createSpoilerElements();
        parent.insertBefore(link, mosaic[0]);
        mosaic.forEach(node => revealed.appendChild(node));
      } else if (eiconMode === 'blur') {
        const { container, blurred } = createBlurContainer(20);
        parent.insertBefore(container, mosaic[0]);
        mosaic.forEach(node => blurred.appendChild(node));
      } else if (eiconMode === 'replace') {
        const replacementName = eiconConfig.replacement || 'eicon_filtered';
        const replacementSrc = `https://static.f-list.net/images/eicon/${replacementName}.gif`;
        for (const node of mosaic) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            if (el.tagName === 'IMG' && el.classList.contains('icon')) {
              (el as HTMLImageElement).src = replacementSrc;
              (el as HTMLImageElement).alt = replacementName;
              (el as HTMLImageElement).title = replacementName;
            }
          }
        }
      }
    }
  }

  return result;
}

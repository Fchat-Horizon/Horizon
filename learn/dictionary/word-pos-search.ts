import _ from 'lodash';

export interface FoundWord {
  word: string;
  start: number;
  clickedRect: DOMRect;
}

export class WordPosSearch {
  private listener?: (e: MouseEvent) => void;

  private lastClicked: FoundWord | null = null;

  constructor() {
    this.start();
  }

  stop() {
    if (this.listener) {
      document.removeEventListener('contextmenu', this.listener);
    }

    delete this.listener;
  }

  start() {
    this.stop();

    this.listener = this.generateListener();

    document.addEventListener('contextmenu', this.listener);
  }

  generateListener(): (e: MouseEvent) => void {
    return (e: MouseEvent): void => {
      try {
        if (!e.target) {
          return;
        }

        this.lastClicked = _.reduce(
          (e.target as any).childNodes || [],
          (accum: FoundWord | null, node) => (accum ? accum : this.findClickedWord(node as any, e.clientX, e.clientY)),
          null
        );
      } catch (err) {
        console.log('wordpos.event', err);
      }
    };
  }

  findClickedWord(parentElt: Element, x: number, y: number): FoundWord | null {
    if (!parentElt.textContent) {
      return null;
    }

    const range = document.createRange();
    const words = parentElt.textContent.split(/[\s\.\<\>\,\?\!\;\:\@\$\*\(\)]/);

    let start = 0;
    let end = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      end = start + word.length;

      try {
        range.setStart(parentElt, start);
        range.setEnd(parentElt, end);

        // not getBoundingClientRect as word could wrap
        const rects = range.getClientRects();
        const clickedRect = this.isClickInRects(x, y, rects);

        if (clickedRect) {
          return { word, start, clickedRect };
        }

        start = end + 1;
      } catch (e) {
        // console.log('MM', 'word', word, 'start', start, 'end', end, 'i', i, words);
        // console.error(e);
        return null;
      }
    }

    return null;
  }

  isClickInRects(x: number, y: number, rects: DOMRectList): DOMRect | null {
    for (let i = 0; i < rects.length; ++i) {
      const r = rects[i];

      if (r.left < x && r.right > x && r.top < y && r.bottom > y) {
        return r;
      }
    }

    return null;
  }

  getLastClickedWord(): string | null {
    return this.lastClicked ? this.lastClicked.word : null;
  }
}

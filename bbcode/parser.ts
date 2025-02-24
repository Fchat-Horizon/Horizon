abstract class BBCodeTag {
  noClosingTag = false;
  allowedTags: { [tag: string]: boolean | undefined } | undefined;

  constructor(
    public tag: string,
    tagList?: string[]
  ) {
    if (tagList !== undefined) this.setAllowedTags(tagList);
  }

  isAllowed(tag: string): boolean {
    return this.allowedTags === undefined || this.allowedTags[tag] !== undefined;
  }

  setAllowedTags(allowed: string[]): void {
    this.allowedTags = {};
    for (const tag of allowed) this.allowedTags[tag] = true;
  }

  abstract createElement(parser: BBCodeParser, parent: HTMLElement, param: string, content: string): HTMLElement | undefined;
}

export class BBCodeSimpleTag extends BBCodeTag {
  constructor(
    tag: string,
    private elementName: keyof HTMLElementTagNameMap,
    private classes?: string[],
    tagList?: string[]
  ) {
    super(tag, tagList);
  }

  createElement(parser: BBCodeParser, parent: HTMLElement, param: string): HTMLElement {
    if (param.length > 0) parser.warning('Unexpected parameter');
    const el = <HTMLElement>parser.createElement(this.elementName);
    if (this.classes !== undefined && this.classes.length > 0) el.className = this.classes.join(' ');
    parent.appendChild(el);
    /*tslint:disable-next-line:no-unsafe-any*/ // false positive
    return el;
  }
}

export class BBCodeCustomTag extends BBCodeTag {
  constructor(
    tag: string,
    private customCreator: (parser: BBCodeParser, parent: HTMLElement, param: string) => HTMLElement | undefined,
    tagList?: string[]
  ) {
    super(tag, tagList);
  }

  createElement(parser: BBCodeParser, parent: HTMLElement, param: string): HTMLElement | undefined {
    return this.customCreator(parser, parent, param);
  }
}

export class BBCodeTextTag extends BBCodeTag {
  constructor(
    tag: string,
    private customCreator: (parser: BBCodeParser, parent: HTMLElement, param: string, content: string) => HTMLElement | undefined
  ) {
    super(tag, []);
  }

  createElement(parser: BBCodeParser, parent: HTMLElement, param: string, content: string): HTMLElement | undefined {
    return this.customCreator(parser, parent, param, content);
  }
}

export class BBCodeParser {
  private _warnings: string[] = [];
  private _tags: { [tag: string]: BBCodeTag | undefined } = {};
  private _line = -1;
  private _column = -1;
  private _storeWarnings = false;
  private _currentTag!: { tag: string; line: number; column: number };

  parseEverything(input: string): HTMLElement {
    if (input.length === 0) return this.createElement('span');
    this._warnings = [];
    this._line = 1;
    this._column = 1;
    const parent = document.createElement('span');
    parent.className = 'bbcode';
    this._currentTag = { tag: '<root>', line: 1, column: 1 };
    this.parse(input, 0, undefined, parent, () => true, 0);

    //if(process.env.NODE_ENV !== 'production' && this._warnings.length > 0)
    //    console.log(this._warnings);
    return parent;
  }

  createElement<K extends keyof HTMLElementTagNameMap>(tag: K): HTMLElementTagNameMap[K] {
    return document.createElement(tag);
  }

  addTag(impl: BBCodeTag): void {
    this._tags[impl.tag] = impl;
  }

  getTag(tag: string): BBCodeTag | undefined {
    return this._tags[tag];
  }

  removeTag(tag: string): void {
    delete this._tags[tag];
  }

  get warnings(): ReadonlyArray<string> {
    return this._warnings;
  }

  set storeWarnings(store: boolean) {
    this._storeWarnings = store;
    if (!store) this._warnings = [];
  }

  warning(message: string): void {
    if (!this._storeWarnings) return;
    const cur = this._currentTag;
    const newMessage = `Error on ${this._line}:${this._column} while inside tag [${cur.tag} @ ${cur.line}:${cur.column}]: ${message}`;
    this._warnings.push(newMessage);
  }

  private parse(
    input: string,
    start: number,
    self: BBCodeTag | undefined,
    parent: HTMLElement | undefined,
    isAllowed: (tag: string) => boolean,
    depth: number
  ): number {
    let currentTag = this._currentTag;
    const selfAllowed = self !== undefined ? isAllowed(self.tag) : true;
    if (self !== undefined) {
      const parentAllowed = isAllowed;
      isAllowed = name => self.isAllowed(name) && parentAllowed(name);
      currentTag = this._currentTag = { tag: self.tag, line: this._line, column: this._column };
    }
    let tagStart = -1,
      paramStart = -1,
      mark = start,
      isInCollapseParam = false;
    for (let i = start; i < input.length; ++i) {
      const c = input[i];
      ++this._column;
      if (c === '\n') {
        ++this._line;
        this._column = 1;
      }
      if (c === '[' && !isInCollapseParam) {
        tagStart = i;
        paramStart = -1;
      } else if (c === '=' && paramStart === -1) {
        paramStart = i;

        const paramIndex = paramStart === -1 ? i : paramStart;
        let tagKey = input
          .substring(tagStart + 1, paramIndex)
          .trim()
          .toLowerCase();

        if (tagKey == 'collapse') isInCollapseParam = true;
      } else if (c === ']') {
        const paramIndex = paramStart === -1 ? i : paramStart;
        let tagKey = input
          .substring(tagStart + 1, paramIndex)
          .trim()
          .toLowerCase();
        if (tagKey.length === 0) {
          tagStart = -1;
          continue;
        }
        const param = paramStart > tagStart ? input.substring(paramStart + 1, i).trim() : '';
        const close = tagKey[0] === '/';
        if (close) tagKey = tagKey.substr(1).trim();
        if (this._tags[tagKey] === undefined) {
          tagStart = -1;
          continue;
        }
        if (isInCollapseParam) {
          let fullTagKey = input
            .substring(tagStart + 1, i + 1)
            .trim()
            .toLowerCase();
          if (fullTagKey.endsWith('[hr]')) {
            continue;
          }
        }

        isInCollapseParam = false;
        if (!close) {
          const tag = this._tags[tagKey]!;
          const allowed = isAllowed(tagKey);
          if (parent !== undefined) {
            parent.appendChild(document.createTextNode(input.substring(mark, allowed ? tagStart : i + 1)));
            mark = i + 1;
          }
          if (!allowed || parent === undefined || depth > 100) {
            i = this.parse(input, i + 1, tag, parent, isAllowed, depth + 1);
            mark = i + 1;
            continue;
          }
          let element: HTMLElement | undefined;
          if (tag instanceof BBCodeTextTag) {
            i = this.parse(input, i + 1, tag, undefined, isAllowed, depth + 1);
            element = tag.createElement(this, parent, param, input.substring(mark, input.lastIndexOf('[', i)));
            if (element === undefined) parent.appendChild(document.createTextNode(input.substring(tagStart, i + 1)));
          } else {
            element = tag.createElement(this, parent, param, '');
            if (element === undefined) parent.appendChild(document.createTextNode(input.substring(tagStart, i + 1)));
            if (!tag.noClosingTag) i = this.parse(input, i + 1, tag, element !== undefined ? element : parent, isAllowed, depth + 1);
            if (element === undefined) parent.appendChild(document.createTextNode(input.substring(input.lastIndexOf('[', i), i + 1)));
          }
          mark = i + 1;
          this._currentTag = currentTag;
          if (element === undefined) continue;
          (<HTMLElement & { bbcodeTag: string }>element).bbcodeTag = tagKey;
          if (param.length > 0) (<HTMLElement & { bbcodeParam: string }>element).bbcodeParam = param;
        } else if (self !== undefined) {
          //tslint:disable-line:curly
          if (self.tag === tagKey) {
            if (parent !== undefined) parent.appendChild(document.createTextNode(input.substring(mark, selfAllowed ? tagStart : i + 1)));
            return i;
          }
          if (!selfAllowed) return mark - 1;
          if (isAllowed(tagKey)) this.warning(`Unexpected closing ${tagKey} tag. Needed ${self} tag instead.`);
        } else if (isAllowed(tagKey)) this.warning(`Found closing ${tagKey} tag that was never opened.`);
      }
    }
    if (mark < input.length && parent !== undefined) {
      parent.appendChild(document.createTextNode(input.substring(mark)));
      mark = input.length;
    }
    if (self !== undefined) this.warning('Automatically closing tag at end of input.');
    return mark;
  }
}

import { getByteLength } from './common';

let crcTable!: number[];

export default class Zip {
  private blob: BlobPart[] = [];
  private files: { header: BlobPart[]; offset: number; name: string }[] = [];
  private offset = 0;

  constructor() {
    if (crcTable !== undefined!) return;
    crcTable = [];
    for (let c, n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1; //tslint:disable-line:strict-boolean-expressions
      crcTable[n] = c;
    }
  }

  addFile(name: string, content: string): void {
    let crc = -1;
    let length = 0;
    const nameLength = getByteLength(name);
    for (let i = 0, strlen = content.length; i < strlen; ++i) {
      let c = content.charCodeAt(i);
      if (c > 0xd800 && c < 0xd8ff)
        //surrogate pairs
        c = (c - 0xd800) * 0x400 + content.charCodeAt(++i) - 0xdc00 + 0x10000;
      let l = c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : c < 0x200000 ? 4 : c < 0x4000000 ? 5 : 6;
      length += l;
      let byte = l === 1 ? c : (0xff00 >> l) % 256 | (c >>> ((l - 1) * 6));
      --l;
      while (true) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
        if (--l >= 0) byte = ((c >>> (l * 6)) & 0x3f) | 0x80;
        else break;
      }
    }
    crc = (crc ^ -1) >>> 0;
    const file = {
      header: [Uint16Array.of(0, 0, 0, 0, 0), Uint32Array.of(crc, length, length), Uint16Array.of(nameLength, 0)],
      offset: this.offset,
      name
    };
    this.blob.push(Uint32Array.of(0x04034b50));
    this.blob.push(...file.header);
    this.blob.push(name, content);
    this.offset += nameLength + length + 30;
    this.files.push(file);
  }

  build(): Blob {
    const start = this.offset;
    for (const file of this.files) {
      this.blob.push(Uint16Array.of(0x4b50, 0x0201, 0));
      this.blob.push(...file.header);
      this.blob.push(Uint16Array.of(0, 0, 0, 0, 0), Uint32Array.of(file.offset), file.name);
      this.offset += getByteLength(file.name) + 46;
    }
    this.blob.push(
      Uint16Array.of(0x4b50, 0x0605, 0, 0, this.files.length, this.files.length),
      Uint32Array.of(this.offset - start, start),
      Uint16Array.of(0)
    );
    return new Blob(this.blob);
  }
}

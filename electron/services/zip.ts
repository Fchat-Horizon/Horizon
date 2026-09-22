import * as fs from 'fs';
import type { FileHandle } from 'fs/promises';
import { Readable, Writable } from 'stream';
import { finished } from 'stream/promises';
import type * as ZipJs from '@zip.js/zip.js';

const { Reader, ZipReader, ZipWriter, TextReader } =
  require('@zip.js/zip.js/index-native.js') as typeof ZipJs;
export { TextReader };

// Native compression avoids packaging worker scripts and WASM assets.
const codecOptions = { useWebWorkers: false, useCompressionStream: true };

class DiskReader extends Reader<FileHandle> {
  constructor(
    private readonly file: FileHandle,
    size: number
  ) {
    super(file);
    this.size = size;
  }

  async readUint8Array(index: number, length: number): Promise<Uint8Array> {
    if (
      !Number.isSafeInteger(index) ||
      index < 0 ||
      !Number.isSafeInteger(length) ||
      length < 0
    )
      throw new Error('Invalid ZIP read range.');
    const data = Buffer.alloc(Math.max(0, Math.min(length, this.size - index)));
    let offset = 0;
    while (offset < data.length) {
      const { bytesRead } = await this.file.read(
        data,
        offset,
        data.length - offset,
        index + offset
      );
      if (!bytesRead) throw new Error('Unexpected end of ZIP file.');
      offset += bytesRead;
    }
    return data;
  }
}

/** Consume entries inside the callback; the underlying file closes afterwards. */
export async function withZipReader<T>(
  filePath: string,
  read: (zip: ZipJs.ZipReader<FileHandle>) => Promise<T>
): Promise<T> {
  const file = await fs.promises.open(filePath, 'r');
  try {
    const zip = new ZipReader(new DiskReader(file, (await file.stat()).size), {
      ...codecOptions,
      checkCrc32: true,
      // Leave overlap checking off: zip.js 2.15 misreads descriptor sizes
      // when only the entry offset needs ZIP64.
      strictness: 'strict'
    });
    try {
      return await read(zip);
    } finally {
      await zip.close();
    }
  } finally {
    await file.close();
  }
}

export async function addZipStream(
  zip: ZipJs.ZipWriter<unknown>,
  name: string,
  source: Readable,
  size: number,
  lastModDate?: Date
): Promise<void> {
  const closed = finished(source, { cleanup: true });
  void closed.catch(() => {});
  try {
    const reader = {
      readable: Readable.toWeb(source, {
        strategy: {
          highWaterMark: 64 * 1024,
          size: chunk => chunk.byteLength
        }
      }) as ReadableStream<Uint8Array>,
      size
    };
    await zip.add(name, reader, { lastModDate });
    await closed;
  } finally {
    source.destroy();
    await closed.catch(() => {});
  }
}

export async function writeZipFile(
  filePath: string,
  write: (zip: ZipJs.ZipWriter<unknown>) => Promise<void>
): Promise<number> {
  const output = fs.createWriteStream(filePath, { flags: 'wx', mode: 0o600 });
  const closed = finished(output, { cleanup: true });
  void closed.catch(() => {});
  const abort = new AbortController();
  const zip = new ZipWriter(Writable.toWeb(output), {
    ...codecOptions,
    level: 6,
    bufferedWrite: false,
    dataDescriptor: true,
    signal: abort.signal
  });
  const writing = (async () => {
    await write(zip);
    await zip.close();
  })();
  try {
    await Promise.all([writing, closed]);
    return output.bytesWritten;
  } catch (error) {
    abort.abort(error);
    output.destroy();
    await Promise.allSettled([writing, closed]);
    throw error;
  }
}

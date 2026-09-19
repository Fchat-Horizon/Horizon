import * as fs from 'fs';
import { binaryLogToJson, DamagedLogError } from './log-backup';

/**
 * End offset of the record starting at `offset`, or -1 when `buffer` does not
 * hold all of it yet. Mirrors the framing serializeMessage writes:
 * u32 time | u8 type | u8 senderLength | sender | u16 textLength | text | u16.
 */
function recordEnd(buffer: Buffer, offset: number): number {
  if (buffer.length - offset < 10) return -1;
  const textLengthOffset = offset + 6 + buffer[offset + 5];
  if (textLengthOffset + 2 > buffer.length) return -1;
  const end = textLengthOffset + 2 + buffer.readUInt16LE(textLengthOffset) + 2;
  return end > buffer.length ? -1 : end;
}

export async function* streamJsonLog(filePath: string): AsyncGenerator<string> {
  yield '[';
  const input = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 });
  let pending: Buffer = Buffer.alloc(0);
  let first = true;
  try {
    for await (const chunk of input) {
      const buffer: Buffer = pending.length
        ? Buffer.concat([pending, chunk])
        : chunk;
      let offset = 0;
      const json: string[] = [];
      for (;;) {
        const end = recordEnd(buffer, offset);
        if (end < 0) break;
        const [message] = binaryLogToJson(buffer.subarray(offset, end), true);
        json.push((first ? '' : ',') + JSON.stringify(message));
        first = false;
        offset = end;
      }
      pending = buffer.subarray(offset);
      if (json.length) yield json.join('');
    }
    if (pending.length) throw new DamagedLogError();
    yield ']';
  } catch (error) {
    if (error instanceof DamagedLogError)
      throw new Error(
        'Damaged conversation log. Run Fix Logs before exporting.'
      );
    throw error;
  } finally {
    input.destroy();
  }
}

export interface JsonLogSlice {
  /** A complete JSON array document holding just this slice's records. */
  json: string;
  /** Byte offset the next slice starts at. */
  nextOffset: number;
  /** How many records `json` holds. */
  count: number;
  /** True when no further readable record follows this slice. */
  atEof: boolean;
}

/**
 * Reads one bounded slice of a binary log as a standalone JSON array, starting
 * at `startOffset`, which must be a record boundary. The slice is cut after the
 * record that crosses `maxJsonBytes`, so it overshoots by at most one record
 * rather than splitting one. Sizing on the serialized JSON rather than the
 * binary bytes keeps the budget honest, because JSON escaping is what the
 * receiver actually has to allocate.
 *
 * Damage is tolerated the way the sync export always has: the valid prefix is
 * returned and the slice reports EOF, rather than throwing and costing a whole
 * transfer over one bad conversation. Run Fix Logs to recover the remainder.
 */
export async function sliceJsonLog(
  filePath: string,
  startOffset: number,
  maxJsonBytes: number,
  maxRecords: number
): Promise<JsonLogSlice> {
  const size = (await fs.promises.stat(filePath)).size;
  if (startOffset >= size)
    return { json: '[]', nextOffset: size, count: 0, atEof: true };

  const input = fs.createReadStream(filePath, {
    start: startOffset,
    highWaterMark: 64 * 1024
  });
  const records: string[] = [];
  let pending: Buffer = Buffer.alloc(0);
  let consumed = 0;
  let jsonBytes = 2;
  let stopped = false;
  let damaged = false;
  try {
    walk: for await (const chunk of input) {
      const buffer: Buffer = pending.length
        ? Buffer.concat([pending, chunk])
        : chunk;
      let offset = 0;
      for (;;) {
        const end = recordEnd(buffer, offset);
        if (end < 0) break;
        let record: string;
        try {
          const [message] = binaryLogToJson(buffer.subarray(offset, end), true);
          record = JSON.stringify(message);
        } catch {
          damaged = true;
          break walk;
        }
        jsonBytes += Buffer.byteLength(record) + (records.length ? 1 : 0);
        records.push(record);
        consumed += end - offset;
        offset = end;
        if (jsonBytes >= maxJsonBytes || records.length >= maxRecords) {
          stopped = true;
          break walk;
        }
      }
      pending = buffer.subarray(offset);
    }
    // Bytes left over once the stream ends are a truncated trailing record.
    if (!stopped && pending.length) damaged = true;
  } finally {
    input.destroy();
  }

  const nextOffset = startOffset + consumed;
  return {
    json: `[${records.join(',')}]`,
    nextOffset,
    count: records.length,
    atEof: damaged || nextOffset >= size
  };
}

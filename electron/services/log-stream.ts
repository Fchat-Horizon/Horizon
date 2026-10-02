import * as fs from 'fs';
import { binaryLogToJson, DamagedLogError } from './log-backup';

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
      while (buffer.length - offset >= 10) {
        const textLengthOffset = offset + 6 + buffer[offset + 5];
        if (textLengthOffset + 2 > buffer.length) break;
        const end =
          textLengthOffset + 2 + buffer.readUInt16LE(textLengthOffset) + 2;
        if (end > buffer.length) break;
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

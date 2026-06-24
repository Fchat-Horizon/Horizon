/**
 * @module backup-export-utils
 * Pure backup helpers shared by the eager GUI backup host and the lazily-loaded
 * CLI exporter: binary-log decoding and recursive file listing. Living here
 * lets backup-host reuse them without statically pulling the archiver-heavy CLI
 * exporter into the main bundle (which would defeat its dynamic import()).
 */

import fs from 'fs';
import path from 'path';

export function binaryLogToJson(
  buffer: Buffer
): { time: number; type: number; sender: string; text: string }[] {
  const messages: {
    time: number;
    type: number;
    sender: string;
    text: string;
  }[] = [];
  let offset = 0;
  while (offset + 10 <= buffer.length) {
    const time = buffer.readUInt32LE(offset);
    const type = buffer.readUInt8(offset + 4);
    const senderLength = buffer.readUInt8(offset + 5);
    if (offset + 6 + senderLength + 2 > buffer.length) break;
    const sender = buffer.toString(
      'utf8',
      offset + 6,
      offset + 6 + senderLength
    );
    const textLength = buffer.readUInt16LE(offset + 6 + senderLength);
    const textStart = offset + 6 + senderLength + 2;
    if (textStart + textLength + 2 > buffer.length) break;
    const text = buffer.toString('utf8', textStart, textStart + textLength);
    messages.push({ time, type, sender, text });
    offset = textStart + textLength + 2;
  }
  return messages;
}

export function listFilesRecursive(rootDir: string): string[] {
  const results: string[] = [];
  const stack: string[] = [rootDir];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries: string[] = [];
    try {
      entries = fs.readdirSync(dir).map(n => path.join(dir, n));
    } catch {
      continue;
    }
    for (const abs of entries) {
      try {
        const stat = fs.statSync(abs);
        if (stat.isDirectory()) stack.push(abs);
        else if (stat.isFile()) results.push(abs);
      } catch {}
    }
  }
  return results;
}

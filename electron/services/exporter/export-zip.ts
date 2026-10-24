import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { Readable } from 'stream';
import { WritableStream } from 'stream/web';
import { addZipStream, TextReader, withZipReader, writeZipFile } from '../zip';
import { streamJsonLog } from '../log-stream';
import type { ExportManifest } from './manifest';

export type ExportEntry = {
  zip: string;
  abs?: string;
  isLog?: boolean;
  data?: string;
};

export async function verifyExportZip(
  filePath: string,
  manifest: ExportManifest,
  paths: string[]
): Promise<void> {
  const remaining = new Set(['manifest.json', ...paths]);
  if (remaining.size !== paths.length + 1)
    throw new Error('Export contains duplicate file names.');
  const manifestHash = createHash('sha256')
    .update(JSON.stringify(manifest, null, 2))
    .digest('hex');
  await withZipReader(filePath, async zip => {
    for await (const entry of zip.getEntriesGenerator()) {
      if (entry.directory || !remaining.delete(entry.filename))
        throw new Error(`Unexpected or duplicate ZIP entry: ${entry.filename}`);
      const hash =
        entry.filename === 'manifest.json' ? createHash('sha256') : undefined;
      await entry.getData(
        new WritableStream<Uint8Array>({
          write(chunk) {
            hash?.update(chunk);
          }
        })
      );
      if (hash && hash.digest('hex') !== manifestHash)
        throw new Error('ZIP manifest does not match the export.');
    }
    if (remaining.size)
      throw new Error(`ZIP is missing ${remaining.size} expected file(s).`);
  });
}

export async function writeExportZip(
  destination: string,
  manifest: ExportManifest,
  entries: ExportEntry[],
  onProgress: (processed: number, total: number) => void = () => {}
): Promise<number> {
  const staging = await fs.promises.mkdtemp(
    path.join(path.dirname(destination), '.horizon-export-')
  );
  const temporary = path.join(staging, 'export.zip');
  try {
    const bytes = await writeZipFile(temporary, async zip => {
      await zip.add(
        'manifest.json',
        new TextReader(JSON.stringify(manifest, null, 2))
      );
      let count = 0;
      for (const entry of entries) {
        try {
          if (entry.data !== undefined) {
            await zip.add(entry.zip, new TextReader(entry.data));
          } else if (entry.abs !== undefined) {
            const stat = await fs.promises.stat(entry.abs);
            let size = stat.size;
            if (entry.isLog) {
              size = 0;
              for await (const chunk of streamJsonLog(entry.abs))
                size += Buffer.byteLength(chunk);
            }
            const source = entry.isLog
              ? Readable.from(streamJsonLog(entry.abs), { objectMode: false })
              : fs.createReadStream(entry.abs);
            await addZipStream(zip, entry.zip, source, size, stat.mtime);
          } else {
            throw new Error('Export entry has no source.');
          }
        } catch (error) {
          throw new Error(
            `Could not export "${entry.zip}": ${error instanceof Error ? error.message : String(error)}`
          );
        }
        onProgress(++count, entries.length);
      }
    });
    await verifyExportZip(
      temporary,
      manifest,
      entries.map(entry => entry.zip)
    );
    await fs.promises.rename(temporary, destination);
    return bytes;
  } finally {
    await fs.promises.rm(staging, { recursive: true, force: true });
  }
}

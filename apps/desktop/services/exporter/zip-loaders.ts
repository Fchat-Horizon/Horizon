/**
 * @module zip-loaders
 * On-demand loaders for the archiver + adm-zip CJS libraries (~100kB with their
 * stream/zip deps). Routing every consumer through these keeps the libraries
 * out of the eager main bundle and lets them share one lazy chunk - nothing
 * imports them statically. Both are `export =`, so we hand-type the factory /
 * constructor and reach the value through the interop default at runtime; the
 * `import type` lines are erased.
 */

import type AdmZip from 'adm-zip';
import type { Archiver } from 'archiver';

export type ArchiverFactory = (
  format: 'zip',
  options?: { zlib?: { level?: number } }
) => Archiver;

let archiverFn: ArchiverFactory | undefined;
export async function loadArchiver(): Promise<ArchiverFactory> {
  if (archiverFn === undefined) {
    const mod: any = await import('archiver');
    archiverFn = (mod.default ?? mod) as ArchiverFactory;
  }
  return archiverFn;
}

export type AdmZipConstructor = new (input?: string | Buffer) => AdmZip;

let admZipCtor: AdmZipConstructor | undefined;
export async function loadAdmZip(): Promise<AdmZipConstructor> {
  if (admZipCtor === undefined) {
    const mod: any = await import('adm-zip');
    admZipCtor = (mod.default ?? mod) as AdmZipConstructor;
  }
  return admZipCtor;
}

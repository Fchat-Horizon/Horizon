/**
 * @module platform/path
 * Browser-safe path join for the simple cases shared/ needs; Node's path is
 * absent on web/tauri. Follows the base segment's separator so host paths on
 * Windows stay backslashed.
 */

export function join(...parts: string[]): string {
  const segments = parts.filter(p => p.length > 0);
  if (segments.length === 0) return '';
  const sep = segments[0].includes('\\') ? '\\' : '/';
  return segments
    .map((part, i) =>
      i === 0
        ? part.replace(/[\\/]+$/, '')
        : part.replace(/^[\\/]+|[\\/]+$/g, '')
    )
    .join(sep);
}

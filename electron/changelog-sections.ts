export interface ChangelogSection {
  version: string;
  date?: string;
  body: string;
}

export function parseChangelog(markdown: string): ChangelogSection[] {
  return markdown
    .replace(/\r/g, '')
    .replace(/^\[[^\]]+\]: \S+$/gm, '')
    .split(/^## /m)
    .slice(1)
    .map(chunk => {
      const [heading, ...body] = chunk.split('\n');
      const [, version, date] = /^\[(.+?)\](?: - (\S+))?/.exec(heading) || [];
      return { version, date, body: body.join('\n').trim() };
    })
    .filter(s => s.version && s.version !== 'Unreleased');
}

function compareVersions(a: string, b: string): number {
  const [coreA, preA] = a.replace(/^v/, '').split(/-(.*)/);
  const [coreB, preB] = b.replace(/^v/, '').split(/-(.*)/);
  const numeric = { numeric: true };
  return (
    coreA.localeCompare(coreB, undefined, numeric) ||
    (preA && preB
      ? preA.localeCompare(preB, undefined, numeric)
      : +!preA - +!preB)
  );
}

export function selectSections(
  sections: ChangelogSection[],
  from: string | undefined,
  to: string
): ChangelogSection[] {
  if (!from || compareVersions(from, to) >= 0)
    return sections.filter(s => compareVersions(s.version, to) === 0);
  return sections.filter(
    s =>
      compareVersions(s.version, from) > 0 &&
      compareVersions(s.version, to) <= 0
  );
}

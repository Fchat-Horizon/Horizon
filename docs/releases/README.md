# Release Notes

Each release lives in its own file named `x.y.z.md`.

Guidelines:

- File name: `docs/releases/x.y.z.md`
- First line: `## [x.y.Z] - MM-DD-YYYY`
- Content follows Keep a Changelog sections (Added/Changed/Fixed/etc.)

Useful commands:

- `pnpm changelog:split` (generate release files from `CHANGELOG.md`)
- `pnpm changelog:build` (regenerate `CHANGELOG.md` from release files)

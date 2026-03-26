# Versioning

Horizon follows [Semantic Versioning 2.0.0](https://semver.org/).

## Version Format

```
vX.Y.Z[-tag.N]
```

| Segment | Name  | When to bump                                                                  |
| ------- | ----- | ----------------------------------------------------------------------------- |
| `X`     | Major | Breaking changes, anything that disrupts user workflows or requires migration |
| `Y`     | Minor | New features, additive changes, no breakage                                   |
| `Z`     | Patch | Bugfixes, copy changes, performance improvements, no new features             |

**Classification rule:** a release is classified by its highest-impact change. If a single commit introduces a breaking change alongside a batch of patches, the entire release is a major.

---

## Release Tags

| Tag             | Stability   | Description                                                                                  |
| --------------- | ----------- | -------------------------------------------------------------------------------------------- |
| `vX.Y.Z`        | Stable      | Production-ready. Suitable for all users.                                                    |
| `vX.Y.Z-beta.N` | Pre-release | Public pre-release. Cut freely and often against whatever is ready now, not a WIP of stable. |
| `vX.Y.Z-dev.N`  | Canary      | Early, often unstable builds from the development branch. Not intended for general use.      |

All tag identifiers are lowercase.

---

## Changelog

`CHANGELOG.md` follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) convention. As you merge changes, add notes to the `## [Unreleased]` section at the top. Use plain English aimed at users, not developers. Standard categories: `Added`, `Changed`, `Fixed`, `Removed`, `Security`.

When a release is cut, `[Unreleased]` is automatically renamed to the new version and date by `release-it`.

---

## Branch Structure

| Branch        | Purpose                                                                |
| ------------- | ---------------------------------------------------------------------- |
| `development` | Main integration branch. All work lands here first.                    |
| `beta`        | Tracks the latest pre-release. Mirrors `development` after a beta cut. |
| `main`        | Production. Mirrors `development` after a stable release.              |

Tags are always created on `development`. Branch merges happen after the tag is pushed.

---

## Cutting a Release

All releases start on `development`. `release-it` handles the version bump, changelog, commit, and tag. Branch merges happen afterward.

### Stable release

```bash
# 1. Run on development
pnpm release-it

# 2. Merge forward and push
git checkout beta && git merge development
git checkout main && git merge development
git checkout development
git push origin beta main   # tag already pushed by release-it
```

`release-it` will:

1. Prompt you to confirm the version bump (patch / minor / major).
2. Rename `[Unreleased]` in `CHANGELOG.md` to the new version and date.
3. Bump `package.json` (root and `electron/`) to the new version.
4. Commit, tag, and push `development`.

CI then builds all platforms and opens a draft release on GitHub. Review and publish when satisfied.

### Beta release

```bash
# 1. Run on development
pnpm release-it --preRelease=beta

# 2. Merge forward and push
git checkout beta && git merge development
git checkout development
git push origin beta
```

Produces a tag like `v1.37.0-beta.1`. CI builds all platforms and opens a draft release for review before publishing.

### Dev builds (canary)

Dev builds are fully automatic. The nightly CI job (`nightly.yml`) runs at 06:00 UTC daily and:

1. Checks for new commits since the last tag of any kind.
2. If there are none, skip.
3. If there are, tags the current `development` HEAD as `vX.Y.Z-dev.N` and pushes it.

The tag triggers `build.yml`, which builds all platforms and publishes the release immediately (no draft, no review step for canary builds).

You never need to do anything for dev builds. If you want to trigger one outside the schedule, run the `Nightly Dev Build` workflow manually from the Actions tab.

### Dry run

```bash
pnpm release-it --dry-run
```

Shows exactly what would happen without touching anything.

---

## Release Cadence

| Type             | Cadence                                                      |
| ---------------- | ------------------------------------------------------------ |
| Patch (`Z`)      | Weekly (Mondays), skipped only if nothing has been merged    |
| Minor (`Y`)      | As features are ready; no more than 6 weeks between releases |
| Major (`X`)      | As needed, no fixed schedule                                 |
| Beta (`-beta.N`) | Cut freely whenever there is something worth testing         |

---

## Pre-release Philosophy

Beta builds exist to get work-in-progress into testers' hands **as soon as it is ready**, not to serve as a staging area for a batch of features before stable.

- Betas are cut against whatever is ready _now_.
- A beta never blocks on unfinished features. If something isn't ready, it isn't in the build.
- The final beta before a stable release must have a minimum **72-hour soak period** before being promoted. It may only be blocked from promotion by regressions, not missing features.

---

## Feature Freeze Rule

If any feature is blocking a release for **more than two weeks**, it is pulled and deferred to the next appropriate milestone. Releases ship on time with what is ready. This is a hard rule.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). You also read it on our [website](https://fchat-horizon.github.io/docs/changelog.html).

## [Development]
> [!CAUTION]
> Beware of development builds!
> These are unstable, unreleased, and should **not be used** except for development.
> You **will** lose data, and you **will** regret it!
> _You have been warned!_

### Added

- Overhauled build system [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/db43135677cb8e5e57f51bb0ffb417834ccd4103)
- Deb, tar.gz linux builds [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/db43135677cb8e5e57f51bb0ffb417834ccd4103)

### Fixed

- Fixes #15, Linux Arm64 build are actually x86_64 [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/db43135677cb8e5e57f51bb0ffb417834ccd4103)

### Changed

- Build system now uses electron-builder **Note to self, we need to update CONTRIBUTING.MD**
- Release scripts are a little more robust

### Removed

- pack.js related build tools

## [1.29.1] - 2024-03-02

### Added

- Custom character colors! [[Commit](https://github.com/Fchat-Horizon/Horizon/commit/124ffbcaa8498d09a94323f1961eb173e5c5ab65)] [[Docs](https://fchat-horizon.github.io/docs/docs/features-overview.html#custom-character-colors-high-quality-portraits)]
- Proper documentation ([README.md](https://github.com/Fchat-Horizon/Horizon/blob/main/README.md), [CONTRIBUTING.md](https://github.com/Fchat-Horizon/Horizon/blob/main/CONTRIBUTING.md), etc..) [[Commit](https://github.com/Fchat-Horizon/Horizon/commit/ec5b7deb2c2726bcf73ab25e6e24af8087b3ef38)]

### Fixed

- Fixed links opening in internal browser, and profileViewer being non-functional. [[Commit](https://github.com/Fchat-Horizon/Horizon/commit/192dbdce989942334883f9145179e1df5633ba2a)]

### Changed

- Settings have more clear names and use a diffent icon to indicate new settings [[Commit](https://github.com/Fchat-Horizon/Horizon/commit/21de3c1514146e7d5f9e7441fb986e5b74b96aac)]
- High quality portraits can now use the words 'Horizon Portrait' instead ('Rising Portrait' still works to maintain compatablity) [[Commit](https://github.com/Fchat-Horizon/Horizon/commit/e7589d748edc736565147a4f2adb87244cf09977)]
- Build tools now use PNPM instead of Yarn [[Commit](https://github.com/Fchat-Horizon/Horizon/commit/da6771bb95bee8e67f64f85e9243d761f7b44ad1)]
- Added changesets [[Commit](https://github.com/Fchat-Horizon/Horizon/commit/49394bd0d0d5769d3ffa80442063be1dd3d4cc93)]

### Removed

- IOS build removed [[Commit](https://github.com/Fchat-Horizon/Horizon/commit/41261d1ba7043eb7dfd5a1a6331dc604ff338814)]
- Webchat removed [[Commit](https://github.com/Fchat-Horizon/Horizon/commit/b894a180b9be31f68d1458aaa3c59f9c4470da89)]

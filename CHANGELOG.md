# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). You also read it on our [website](https://fchat-horizon.github.io/docs/changelog.html).

# [Development]

> [!WARNING]
> Heed this warning.
> Beta builds **may** have unfound bugs, some of which may be fatal to your data— including chat logs.
>
> If you haven't already, you should make a good habit of backing up your logs.

### Added

### Fixed

### Changed

# [Releases]

## [1.30.3] - 2024-04-25

### Fixed

- Fixed issues with performance tanking when receiving lots of channel messages. If you were experiencing larger CPU loads or just slow responsiveness under 1.30.2, this should fix that. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/9ed4dc9a05eeac05acef5cb25ba8463362166adc)
  - Thanks @astrayblackcat for the fix, and @0lm for their very helpful reproduction steps!
- Fixed a typo and inconsistency with the app's copyright info. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/a225cf9483da28ed9f9a96c158536f3dc8ed79c7)

### Changed

- Removed a stray Rising reference in the automated smart filter message. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/c10a7a5639d68d51897247e0447e79c5cc48dfa7)

### Security

- Updated to Electron 35.2.0. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/0c56349da45e6d380ba1085297bca8dd13d03644)

### Merged pull requests

- https://github.com/Fchat-Horizon/Horizon/pull/107 from @CodingWithAnxiety
- https://github.com/Fchat-Horizon/Horizon/pull/106 from @astrayblackcat
- https://github.com/Fchat-Horizon/Horizon/pull/91 from @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/83 from @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/79 from @astrayblackcat
- https://github.com/Fchat-Horizon/Horizon/pull/63 from @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/42 from @FatCatClient

## [1.30.2] [04.20.25]

### Fixed

- Channel tags spanning more than one line (#44)
- High quality avatars remaining as the tab icon after disconnecting (#46)
- Zoom in hotkey (Ctrl-+) not working as intended (#55)
- Restored Dracula theme colors to original values (#51)
- Multiple issues related to chat view component initialization (#66):
  - Notifications not showing up for the active conversation when window was minimized/out of focus
  - Saved ads in the ad editor not loading
  - Inability to reorder channels and conversations
  - Hotkey to switch between conversations (Alt-Up/Alt-Down) not working
  - Idle timer never starting
  - Font size settings not being initialized when connecting
- Fix ctrl-tab falling out of sync after dragging a tab (#74)
- Fix lack of shadows in black (and other) user names (#61)

### Changed

- Updated contributor information (#77)

## [1.30.1] - 2024-03-25

> [!WARNING]
> This is a major update!
> Please, back up your logs.

### Added

- GitHub Actions workflow for testing PR builds [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/1ed1e290ecf60d752bb010505455bb1c31f02c4c)
  - Allows testing builds from pull requests without creating a release
  - Adds comments to PRs with build status
- Updated electron [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/3bb81989fe82cafd0baf8c7dedc87b4519fa07d6)
  - This should help wayland bugs on linux, including preformance issues. This also fixes some large security issues found within Rising
- Overhauled build system [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/db43135677cb8e5e57f51bb0ffb417834ccd4103)
- Deb, tar.gz linux builds [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/db43135677cb8e5e57f51bb0ffb417834ccd4103)
- Experimental arch linux builds (`pnpm build:linux:arch`) [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/db43135677cb8e5e57f51bb0ffb417834ccd4103)
- MacOS builds have been melted together in a single, universal `dmg`, which should work on Intel and M1 based systems. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/d30700d09f0ae2fe3620005d05250b9ee82685fd)
- About page [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/d30700d09f0ae2fe3620005d05250b9ee82685fd)
- Release artifacts now produce SHASUM256.txt file to verify file signatures [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/4d57092007da6a70701cb309d7de4cd0f151efee)

### Changed

- Updated project dependencies [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/4eb416de00fe6c0de51883d193eb4a07b9b1732d)
- Refactored color functions and updated Sass dependencies [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/dfb964a33e57136604ff7f79f1210ff34929618f)
- Removed Changesets configuration [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/2c5045bf2205b28f17d1fa78794287a5bd83cc21)
- Code improvements through linting and style fixes [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/474a6b677e737e984d6d4a22fc762c57103929ce)

### Fixed

- Updated prepare script to use pnpm for Snyk protection [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/21ec93f995c58a9938a9a2967f7594dd4868afd1)
- Added pnpm-lock.yaml to prettier ignore [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/7c2c2e6b5c0233bb6e97df6b0b89aad8df1acf72)
- Fixed a bug the caused chat.ts to never load due to invalid URLs when updating electron past 27 [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/3bb81989fe82cafd0baf8c7dedc87b4519fa07d6)
- Fixed a bug where arm64 release artifacts were still building with x86_64 toolchains, causing them to not function. #15
- Fixed a documentation issue where download links were false in the readme #13 [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/bf8695283e53c28741c6eb893697a3f3d1a003ad) #18
  - Thank you @freenutsxd ♥
  - This was @freenutsxd first contribution~! ♥
- Several other stability improvements

### Changed

- Build system now uses electron-builder [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/d30700d09f0ae2fe3620005d05250b9ee82685fd)
- [CONTRIBUTING.md](/CONTRIBUTING.md) has been updated to reflect the new build system
- [Build scripts](/electron/release-scripts/) are now functionally more robust.

### Merged Pull Requests

- #25 User tab consistency improvements (from @FatCatClient) [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/04f3513fe68f5dd6e51aaefa264efc0e798a99f8)
- #27 Improvements from @FireUnderTheMountain [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/0492fefea3a5fce46a5f539baf4e9bac7ad23e8f)
- #29 Dracula color theme fixes (from @FatCatClient) [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/db7cf3e6b5dd2763b411537d5733eccccb5e1f3b)
- #32 Note silencer feature (from @FatCatClient) [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/ca50d101557b52a21f21fbd75890c5f2febaf0f1)
- #33 Dark dimmed links fix (from @FatCatClient) [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/f25cfbf9dd016ad72b7528663ba721a3bd10b77a)

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

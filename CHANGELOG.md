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

## [1.32.0] - 2025-06-09

> [!IMPORTANT]
> If you want to _downgrade_ from 1.32.0 or later to an earlier version, you will need to manually delete the `eicon.json` file in your Horizon data folder, or the EIcon search window might not show all results anymore.
> Please consult [this](https://github.com/Fchat-Horizon/Horizon/blob/main/PRIVACY.md) file on where to find this folder.
> For regular users, this should be no concern though.

### Added

- New EIcon Selector and Store update, significantly improving the EIcon selection UI and handling. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/2439abc9253ca87a510d3ac5bc8abded9f1b5d68)
  - You should see a **_massive_** decrease in memory per tab now, and searching for eicons is now a lot snappier.
  - Special thanks to @FireUnderTheMountain for helping investigate this, and subsequently writing the PR.
- Experimental gender matcher rework (community feedback appreciated). [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/7b35203e4e77245ff1864fcf505646bd55855b00)
  - Read more about it [here](https://github.com/Fchat-Horizon/Horizon/pull/173).
  - TL;DR: Gender and orientation are now a single score, determined primarily by your default kink gender preferences, while your orientation is used as a fallback. Orientation matching for nonbinary characters is also less dogmatic now.
  - More changes to the matcher are planned, including reassessing how species are determined.
- Consistency applied to most instances of the app name. We are now just "Horizon". [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/8f6abc30ffcfd6cfd1b1e4f64e494b56efbff1da)
  - We have a _temporary_ new logo to go with this change. If you don't like it, don't worry: We'll replace it with something better and less temporary soon enough. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/937182c1e30c5a99e0e5ace5f574cba22ba61662) [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/3a54fae7bff6da9af9e11a82d2b2adc04c57758e)

### Fixed

- Fixed an issue with minimizing the main window under some versions of Linux using KDE Plasma [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/e4d02cab494a3a7a14baf8227a1c4cb51bb1109d)
- Fixed another issue where the "Open Conversation" and "Join Channel" buttons could be rearranged by dragging items around them. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/489f3c4feff053abed6585170cd7382530579ab2)
- Fixed a 3.0-era issue where the text box wouldn't properly resize once the line count increased. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/a5bc4495253fc6e58d27e66c2dec9e10e2868e92)
- Your own ads should no longer be marked as compatible/ incompatible when returning to a channel after having posted one. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/205560abc43ccc850aa1a5bd6ec7cd825de45e64)

### Changed

- General UI/UX improvements for some icons. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/9e3520a906798e1f4b295e2167576c38ad9406c3) [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit//08b775bc696bf4c78c0bce1a7035789c2b566149)
- Installing a specific version now shows the changelog for that version, rather than the main branch. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/8b349bd6279f73558edf1290c0f371063d6106ce)
- The automatic update check can be toggled in the settings wheel. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/fed136f0169fe8d4c10af45042a6759cd6f9c867)

### Development

- Running a development version— either locally through `pnpm build` or from a Pull Request, now displays this in the version info. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/35b283e9f5a9c2e462d9552348e33bccb9131e62)
- App window related functions have been moved to their own file, to debloat the over bloated `electron/main.ts` file. [[Commit]
  ](https://github.com/Fchat-Horizon/Horizon/commit/6bb95d95039d177ecfb0652f8b5ff942aaff84b6)

### Merged pull requests

- https://github.com/Fchat-Horizon/Horizon/pull/135 from @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/173 from @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/192 from @FireUnderTheMountain
- https://github.com/Fchat-Horizon/Horizon/pull/198 from @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/201 from @FireUnderTheMountain
- https://github.com/Fchat-Horizon/Horizon/pull/204 from @FatCatClient

## [1.31.1] - 2024-05-25

### Added

- Support for setting an HTTP proxy. This can be found underneath the advanced settings when you sign in. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/fefe8821fcd3363a56f90b6abc9f710b4ddce625)
- Added `imgchest.com` as a High-Quality Portrait domain, and updated privacy/profile recommendations to mention it. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/50938a2407e6c4fb80ec301180a899bef5df0263)
- Added "Copy url" option to character gallery images. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/17624fb3f5d1cc594cf95187b434b6adc6222c65)
- New keyboard shortcuts: Use `Alt+Shift` + arrow keys to jump between channels/conversations with unread messages; use `Ctrl/Cmd+Shift+Alt` + arrow keys to jump between channels/conversations with mentions. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/42d57388454473c5e3e6459066bcb629b678d3b0)

### Fixed

- Fixed the Open Conversation and Join Channel buttons being draggable and messing up the Alt+Arrow keys order. Also fixed an issue where the Open Conversation modal would eat the conversation view. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/ea982ddec8be589b0bed9dd0444c5ffef2a0c0da)
- Font Awesome icons have been updated to v6, and a missing icon for the "Show Ad log" option has been added. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/43ec2985fd43696350e53e1a27d19d42cf39621c)
  - The differences for existing icons are pretty marginal, but in general icons are now slightly more consistent with each other.
- Fixed the slash-command for setting your status (`/status busy`) being case sensitive [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/9554511ff9cbf1395f4444696ab425ca8a05cc7d)
- Reverted a previous change that was causing issues with displaying the match result while searching for characters because of an event listener check. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/849e2ce7c9a516c0da4be6f7d3bcaa3af4315f18)
- Fixed a bug where empty character memos could be saved or displayed. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/56adec8d1e18458783694537f6809cb10d16b121)
  - Thank you @FireUnderTheMountain and the Frolic team!

### Changed

- When clicking the version info within Settings > Help, the current patch notes will now be shown according to the currently installed version. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/eae87e9ba6a62119634048804cbca52e0d88de9a)
- BBCode editor buttons are now all the same width. You can rest easy now knowing that the Help button isn't 6 pixels thinner than some of the others. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/2d09cb944b1868dbdd5276bc4c970e09277d5d0b)

### Documentation and Non-user facing changes (for developers)

- Updated the README to consistently refer to "Horizon" instead of "Rising" where appropriate. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/99ba4f276ebf81ee003dece14ccd78a2134ac438)
- Updated the version bump script (`bump_version.sh`) with a tag-only mode and argument parsing. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/d719dd7a97cdc70bf1427a515e4c8806b22c3c0d)

### Merged pull requests

- https://github.com/Fchat-Horizon/Horizon/pull/177 from @astrayblackcat
- https://github.com/Fchat-Horizon/Horizon/pull/176 from @freenutsxd
- https://github.com/Fchat-Horizon/Horizon/pull/175 from @freenutsxd
- https://github.com/Fchat-Horizon/Horizon/pull/136 from @BlueWildRose
  - This is their first PR! 🎉
- https://github.com/Fchat-Horizon/Horizon/pull/128 from @dupontcc
  - This is their first PR! 🎉
- https://github.com/Fchat-Horizon/Horizon/pull/156 from @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/142 from @freenutsxd
- https://github.com/Fchat-Horizon/Horizon/pull/147 from @freenutsxd
- https://github.com/Fchat-Horizon/Horizon/pull/178 from @FatCatClient

## [1.31.0] - 2024-05-09

> [!WARNING]
> This is a major update!
> Please, back up your logs.

### Added

- A new setting to notify you when a friend or bookmark logs in. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/c5b401f59db98450ceede0818c9f85d74a95e737)
- The 'Smart Filter' automated reply message can now be customized. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/3edab4956b0121cd711c1e67abb4d279bdfcd69d)
  - This also shuffles the related settings around, and hopefully explains the system a bit better.
- A new setting to display gender symbols next to character names. [\[Commit\]](https://github.com/Fchat-Horizon/Horizon/commit/1ae7b9cd2c634b481e83aaee5823627a06decb8c)
  - These symbols can (optionally) retain the original gendered name colour for characters using a custom colour.
- Automated update checks. The settings button on top-- or on Mac, a new one only visible when there's an update, will glow when a new version of Horizon is available for download. [\[Commit\]](https://github.com/Fchat-Horizon/Horizon/commit/b9189fe9f123dcd2d7a6d6c939e48d744401504b)
  - This also brings back and repurposes the old 3.0 beta channel setting, for checking if pre-release versions are available.

### Fixed

- Fixed icon position in the MacOS installer. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/c73f0549033f53ba679a19cd3946b7e9ebaba1b8)
- Issues with event listeners being assigned twice. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/c1e53c796df75960d34b0e8225e89e3c96a81ff0)
  - This should solve ads showing up more than once in the Recon tab and Ad History menu.
- Character-specific settings potentially being loaded before logging in. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/97e611734bdd0112596f8611e20bcd855e3c90ac)
  - This should fix showing not being able to view logs without logging in first.
- Fixed an issue where the bottom padding of the window would not readjust after maximizing the window (most noticeable by the chat input being cut off) .[[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/520226c026d73b5c9e1164e005150328f17a4a96)
- Fixed event listeners not being properly removed after logging out [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/be76897b0c9596c6663705cc457aadb69be0543d)
  - This should fix issues like Alt-↑ and Alt-↓ making you scroll through multiple conversations instead of only one after relogging.
- Fixed conversation list items not changing color in the Dracula theme when hovering over them. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/8a99eb47f3694ddb130aa94b30d37e6d1473b209)
- Fixed cases where conversations could be opened with a nameless character. This would (incorrectly) give a warning about corrupted logs. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/05c763a8955f1113732139cda1a18f33907d7fc4)
  - This also fixes other cases where using slash-commands with an empty name could allow for weird things happening (like ignoring a nameless character).
- Fixed notifications on Windows being labelled by the app's ID instead of the app's name, and clicking a notification while the app is minimized should restore it properly now. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/782236d6574f7e1c3b9686ae71be4df4d1b77637)

### Changed

- Tool tips in the BBCode editor now reflect platform-specific (MacOS) shortcuts. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/40b2ffe)
- Names beyond a certain length are now truncated in the user list, to prevent the layout from breaking. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/b828eb3172ca2f254bd45bec86beef4daf4e6378)
  - This should only affect extreme cases, where a name consists of over ±18 capital letters.
- Character status icons (Looking, Online, Busy, etc.) in the conversation list now match the ones in the user list. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/e0865a9a042ef07b96284898e8b109a6202877ce)
- On MacOS, the shortcut to open the developer tools window now matches the one used in Chrome and Safari on that platform (Command-Option-I). [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/0614adee072d15a5cce46a56a6d0477dec0c9065)

### Non-user facing changes (for developers)

- Fixes the release artefacts directory not being ignored by Git and Prettier. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/b5eff723787c1aa9250ba0dbc8db84b1fda3c7f5)
- Removed an unnecessary `include` in `tsconfig.json` that potentially confused LSPs. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/0d1926306bbef569a65da0b93d99d1fb25ed4cc5)
- The Prettier pre-commit hook now warns developers _before_ they make a commit, rather than after. [[Commit]](https://github.com/Fchat-Horizon/Horizon/pull/129/commits/f954d6ec685ea672300a2253553ae5c93d54b13d)
  - This behaviour can be ignored by using `git commit --no-verify [...]`
  - The Prettier format check is also part of the PR CI/CD pipeline now.

### Merged pull requests

- https://github.com/Fchat-Horizon/Horizon/pull/43 from @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/53 from @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/62 from @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/72 from @astrayblackcat
- https://github.com/Fchat-Horizon/Horizon/pull/75 from @astrayblackcat
- https://github.com/Fchat-Horizon/Horizon/pull/82 from @astrayblackcat
- https://github.com/Fchat-Horizon/Horizon/pull/85 from @BootsieWootsie
  - This is her first PR! 🎉
- https://github.com/Fchat-Horizon/Horizon/pull/88 from @BootsieWootsie
- https://github.com/Fchat-Horizon/Horizon/pull/89 from @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/90 from @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/95 from @astrayblackcat
- https://github.com/Fchat-Horizon/Horizon/pull/98 from @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/100 from @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/101 from @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/117 from @FireUnderTheMountain
- https://github.com/Fchat-Horizon/Horizon/pull/118 from @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/122 from @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/129 from @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/133/ from @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/134/ from @astrayblackcat

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

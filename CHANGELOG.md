# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). You can also read it on our [website](https://fchat-horizon.github.io/docs/changelog.html).

# [Releases]

## [1.35.7] 25-01-2026

## Fixed

- Fixed the channel list erratically jumping back to the start of the list whenever any of its child components would update their value. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/e10cdaff9444dacbbe4ef0585900ccf746f10438)
- Fixes the eicon picker sometimes letting you click-drag eicons outside of the favourites tab, which would then result in your favourites list being deleted. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/a2effce7bf605af5ca2a2b5642ae1d38c28f01e8)
- Fixed the Redgifs URL previewer not handling some URL formats correctly. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/36e246c004c030634c8a3690e50f4a194e65ec93)

## [1.35.6] 25-01-2026

## Added

- You can now view your list of ignored users in the characters settings tab, underneath the list of hidden ads. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/5fd3c3c3e3a02bc8c499c9d29bdcec15beb192ad)
- The "About Horizon" window has been redesigned with more info and a button to quickly copy information for when you report a bug. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/b20faaa442bec8f35ea8429046fdc93e65354d4a)
- Added links to Horizon's Ko-fi. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/afbd416c6a254e3e5562eaa2ece6bf8335cdf2c2)
- The ad launcher now handles half-selected lists of channels in a way that looks better. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/043065024fba1db18c99376bf02242ffb7b1c6f6)

## Changed

- Imgur is no longer supported as a host for your high-quality portraits. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/571949d8f92a896b99a390054c2ed04d46fda63b)
- Opening the "Open conversation" and channel search dialogs now automatically focus the text input. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/1c2d4ad307e97d16b7cc0c5123d6e444072fcc51)
- The user right-click menu has some of its old separator borders returned. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/4c464f87f4e5af4c14ba032f0ac6b3b30627ad4a)
- Some common misconfigurations (incorrect log folders and custom chat host URLs) now show actual error message when connecting inevitably fails. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/62dc89378b3000576c8768dd30050bb3b8ccae09) [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/5e84da60f25bd52495c4dfa430888472770b8b4d)

## Fixed

- Fixed some text contrast issues in Wilted Rose and Dracula themes. [[Wilted Rose]](https://github.com/Fchat-Horizon/Horizon/commit/99152ad9b0260d9aa49dc3fe691603e20410b6c7) [[Dracula]](https://github.com/Fchat-Horizon/Horizon/commit/fa8b75cc81c563b265aa7b8cddc098572a70a4ff)
- Fixed eicons not stretching to their full width and height anymore if the file itself doesn't have a 1:1 aspect ratio. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/0a9356690abb4776ba7195b714b66b320ec6a0ba)
  - We didn't realize this was the behavior most people wanted from their eicon collages. Whoops!
- Fixed some severe performance issues related to the channel search dialog and filtering. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/2cb6287e2f8d5226b882cc348c673076a7dc5d9f)
- Fixes issues with window focus events firing incorrectly in KDE Plasma desktops on Wayland. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/b1ec9a420c4aeb93ddb67b3dfc397c1d97969c25)
  - This should fix issues where the taskbar icon would flash after alt-tabbing into a different window.
- Fixed BlueSky embeds. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/96a8bffb7e9ca85a5fbd96b22680468b1122b756)
- Fixed Redgifs embeds. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/3f72e8528967fa528bbdd02bffd0927c11a95df7)
  - Thank you, @freenutsxd for both of these fixes.
- Sorting pinned eicons after unpinning one of them no longer unpins the incorrect eicons. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/15064a38ff6ed60f6b2322ae04b1d08e2610323f)
- Fixed the Russian and Hungarian translations not being selectable. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/2b0af06e51a7181339b7397fb04524b4726a3529)
- The Recon tab on the profile viewer now parses BBCode the same way as actual ads do. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/17287bc6d5e1a66dc6fdfd64db00765ba03564c1)
- The "vanilla BBCode colors" setting now uses the correct color for blue text. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/2bd769a7eab4779c9fcf6db0dfd26465d3595b60)

## Development

- Switched to PNPM workspaces for subprojects. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/52746e23e82a1e725ac02bb5a5b97af167f317a8)
- Added SCSS theme hot reloading. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/c8b43825b808570ee406b0ab1f84415be076814b)
- Added Nix development flakes. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/b37de23e4e024911256e85a2e4210d98bd4159cb)
- Added some missing button variations to the UI test dialog. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/38115a4e88f8b612ba17a9101d10cc4d45e45797)

## Merged Pull Requests

- https://github.com/Fchat-Horizon/Horizon/pull/578 by @CodingWithAnxiety
- https://github.com/Fchat-Horizon/Horizon/pull/582 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/589 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/593 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/594 by @freenutsxd
- https://github.com/Fchat-Horizon/Horizon/pull/595 by @freenutsxd
- https://github.com/Fchat-Horizon/Horizon/pull/599 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/601 by @CodingWithAnxiety
- https://github.com/Fchat-Horizon/Horizon/pull/612 by @CodingWithAnxiety

## [1.35.5] 29-12-2025

### Added

- Search results in the EIcon selector now go well beyond 300, you can scroll down the results to load more. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/18457eda25f91180e1540290e4fa842faebf4859)
  - Thank you, @freenutsxd
- Dragging pinned EIcons in the EIcon selector's favorites tab now reorders them. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/a3a103080f68f6b28220c7cb7c8cf54af8732d80)
- Added a Catpuccin "Moccha" theme. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/dba8afcdb5957893deab2443432ab4d8cb420dcd)

### Changed

- Drastically improved detection of your browser for the "Open in incognito mode" right click option. Linux is now supported as well [[Improvements]](https://github.com/Fchat-Horizon/Horizon/commit/3737b0ea3ad8039a9faba690256b3c6847095a28) [[Linux]](https://github.com/Fchat-Horizon/Horizon/commit/e82f2b0028801608cf91028346e578f2bd51fcd6)
  - If the browser you have set in the advanced app options is different from your computer's default browser, Horizon will try to open incognito links using your custom browser path too.
  - Due to Safari not supporting Private Mode flags for the command line, MacOS support for this feature has not yet been added.
- If you try and change the server host, you'll now get a warning asking you if you are _really_ sure. This is an advanced option after all. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/8c626f023e42842077574afad81fca4de1537044)
- Adjusted some matching/ kink-related colors in colorblind mode for better contrast. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/745da3f83cb008067ad310478d9c0db954fa8a82)
- "Yes" is once again the default option when prompted to log out or close a tab. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/14c53f141f793e27dee8e74c2d102091829988b5)
  - Fun fact: This was technically a bug, and "No" was the intended default option, an update in our dependencies unbroke this accidentally. But muscle memory > intent.
- Updated localization files.

### Fixed

- Fixed user avatars being cut off slightly in the conversation list. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/d00f1cdfd1d1d716bd9b4ddc9a1d7bc1db1da6a7)
- `[icon]` tags will now always use the file's aspect ratio. Useful for when your HQ portrait is vertical or horizontal. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/f5225d4d3419a2a973e10ceebf6231c318192124)

### Development

- Updated to Electron v39.2.7 (from v38.7.0) [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/ef558d49c653aace1adff0133b1483d9f4b45eb3)
  - This should fix various issues under Linux, like warped fonts on some desktop compositors.
- Converted `components/character_select.vue` to the composition API. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/b304f49b9d0ec6bd6543bfdb6afbe2fd95cbc281)

### Merged pull requests

- https://github.com/Fchat-Horizon/Horizon/pull/541 by @FatCatClient and @CodingWithAnxiety
- https://github.com/Fchat-Horizon/Horizon/pull/542 by @freenutsxd
- https://github.com/Fchat-Horizon/Horizon/pull/544 by @min-xy
  - This is their first contribution! 🎉
- https://github.com/Fchat-Horizon/Horizon/pull/545 by @CodingWithAnxiety
- https://github.com/Fchat-Horizon/Horizon/pull/553 by @AriannaAltomare
- https://github.com/Fchat-Horizon/Horizon/pull/556 by @astrayblackcat

## [1.35.4] - 11-12-2025

### Fixed

- Overly huge Eicon update responses from the Xariah.net API won't lock up the renderer thread for a tab anymore. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/228dab77f29a645a5e74fc3ec6cbbaa5851cd751)
  - This should fix the issues people were having when attempting to log in on December 11th 2025.
- Window transparency now works properly again. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/34dbf361a6633f8d9fcfcfaf176a90a331ab795e)

### Changed

- Restored old behaviour for taskbar icon flashing on Windows. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/b849619d3ac18bd11c8c5a6005abdb49e1f82b44)
  - If you want to disable it regardless, there is an app-level setting for it now.
- Opening the log viewer when looking at a conversation now automatically focuses the search field. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/c359973e6e20f8a8f1da7d1fc64764d0d5ef949f)
- Updated localization files.

### Development

- Updated Ghostery to v2.13.0 (from 2.10.0) [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/8c95c9837be4e18dab481445b1e3810287af16ad)

## [1.35.3] - 04-12-2025

### Security

- Fixed a potential exploit that would let malformed links run arbitrary commands when links are opened in incognito mode on Windows (mirrored from 3.0) [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/d882d542d2f40937c02e2c1ea1214753ec37c646)

### Fixed

- Fixed various issues like desynced friends lists or full app lockups as a result of switching between the "Friends" and "All" tabs in the console view. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/1e910ce6ac041e9ab769cbfb7a80323211eca498)
- Fixed the taskbar icon still flashing on Windows, even if you have desktop notifications disabled. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/eb49d1aba0667e46f69cfe420cb52ff2d6a52e7b)

### Changed

- The window's base color tries to take your system's light/ dark theme into account, to prevent a flashbang for cases where loading the actual webview is noticeable. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/eb49d1aba0667e46f69cfe420cb52ff2d6a52e7b)
- The typing indicator should be more distinct between "typing" and "paused" states. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/b81894b8aac1a29dd9b2a321715f801546b0faf2)
- Updated localization files.
  - Thanks @MJSJyanshi for the typo fix!

## [1.35.2] - 01-12-2025

### Changed

- Updated to FontAwesome 7.1.0. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/4a3342f)

### Fixed

- Fixed "Open in Incognito" not keeping the full URL. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/fa6990d)
- Fixed typo in tips.22 for SubscribeStar. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/fff4c03)
- Fixed old hidden scrollbar implementation. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/9c59df9)
- Security fixes

### Development

- Upgraded Electron Builder to v26.3.2. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/36ad549)
- Production builds now properly minify code. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/73536fc)

## [1.35.1] - 29-11-2025

### Added

- Your character's friends now appear in their own list on top of the friends tab. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/1bd8a6afb6f308ba35428d04838ba39198aca238)
  - There is even a setting to hide other friends (the ones that are not friends with your _current_ character), or to group them all together (the vanilla behaviour).
- The profile viewer now has extra filters and sorting options for comparing kinks between you and the profile you're viewing. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/6da8d252ff8b01dc3f01875b84e29a59d30bf8c6)
  - Thank you, @Matthew-X!
- The console view now has an "All friends" tab where you can see all of your friends and bookmarked profiles, even if they are offline. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/110a8534efbf5f5a738fee9dedcbfec0dab630d2)
- You can now navigate between your conversation history with the mouse's back and forwards buttons. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/a10f74f90ea4dda2ce5665a2ce862c83e4f654de)
  - `Alt` + `←` / `→` (or `Cmd` + `[` / `]` on macOS) are also supported.
- Modal dialog windows now have snappy opening and closing animations. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/0128f472ef7ee464c04d134f3601e43e6bbdaf96)
- Tabs on the top of the window now also have snappy opening and closing animations. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/b3d0eea6dc285b56956960b3683fb306782245d5)
- Added an accessibility setting to disable all animations, regardless of your system's reduced motions preference. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/b598237dd80bbdb6f7eb4b5a9e389bebff7cb999)
- `Ctrl` + `Shift` + `Q` now acts like a shortcut to quickly close the app on Windows and Linux. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/4f8f4dd6d072adde2571d269a5cd0499fae259a0)
- Contributor badges are now visible for people who have contributed to the Horizon repo. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/d2cff127c3c024e5ec9fe5bd5bd92638690cf300)

### Changed

- Dark-dimmed theme had its BBCode colors adjusted from the vanilla values to improve legibility. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/72d99ff3ed20a79088a4393a701e89bce8619c8f)
- Tips of the day now appear on the character select screen! [[Commit]](https://github.com/Fchat-Horizon/Horizon/pull/505)
  - If you're an expert user already, you can easily disable these from ever showing up in the app's general settings.
- We redesigned the character settings menu and put most of the settings in appropriate categories, in the hopes that it will help you find settings a bit easier. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/a669f36f71707afbf67ba68d5d4786c870a488dd)
  - The new design with the coloured buttons is in preparation for the new, _new_ settings menus where you will be able to set character settings on a global level. We're working on that still, but stay tuned.
- The MacOS version now uses a proper version of the Tahoe-style icon if you're on MacOS 26 (or later). [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/3e3c5e98bf0f031d2e2c909cca10158f60137931)

### Fixed

- The BBCode previewer won't be eating your other keyboard shortcuts so much anymore. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/1572b662840c3e98448df4f16706cf60b1379075)
- Fixed the dictionary lookup breaking once you disconnect and reconnect in the same tab. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/141976a834908186d72641f8c36147bccbec7f2b)
- Fixed the context menu showing an option to pin an eicon when viewing logs before having logged in.
- Fixed issues with the image previewer doing things it shouldn't do (like opening links) because of redirects. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/e525bfe0cf2bd1f3625c5b731de38ad1334101e2)
- Fixed some cases where custom kinks were sorted differently from the website (most notably for people who manually sort their customs with whitespace characters). [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/5123c86c5c7e1b1e898b6a760de7c98a98ae25d8)
- Custom profile portraits with broken URLs now get reset into their default ones. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/9b0dda8555e1a507fe4e3aacb0fc499a4dea7063)
  - If your own custom portrait is broken, the profile analyser on your profile page will tell you too.
- Fixed pasting urls with multiple square brackets (`[`/`]`) only fixing the first pair. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/742a1d10e360d9c67c26f5df2d05f4e06e02ad4e)

### Development

- Upgraded to Electron v38.7.0. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/073d0035a9eaf31a2826c3833dac52fcec2e3c0c)
- Upgraded Electron Builder to v26.2.0. [Commit]
- Converted the following components to the composition API:
  - `components/tabs.ts` [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/db553bb818c0976e9bd54cb14ae949b6d25cfe6a)
  - `character_page/friends.vue` [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/8646a035c471652c254cea55031ccc5971c87825)
  - `character_page/infotag.vue` [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/89a1db989f32afb13479d3d1ebb2c8ee4dfbd668)
  - `character_page/images.vue` [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/f2a2fad087f43fe488884ff898d6eb2a42850a11)
  - `character_page/match-report.vue` [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/a8aea5697a0070a67a36f62ad341052aee6676c5)

### Merged pull requests

- https://github.com/Fchat-Horizon/Horizon/pull/498 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/504 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/505 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/508 by @CodingWithAnxiety
- https://github.com/Fchat-Horizon/Horizon/pull/509 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/510 by @Matthew-X
- https://github.com/Fchat-Horizon/Horizon/pull/512 by @FatCatClient

## [1.35.0] - 05-11-2025

### Added

- Channel member lists now feature extensive filter options. Sorting has been moved to this pop-over menu as well. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/d9228c052920fefd1ed62d42b7fcbd934b3bd618)
  - You can even enable persistent filters under "Character settings > Smart filters".
  - Thank you, @Matthew-X!
- Added a conversation-level setting to disable that specific conversation from showing up as "unread" when new messages appear. Unless you get pinged, of course. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/41513f066de4e9adc2396a8b57b38d7bbf5225dc)
- Added a new light mode theme: "Snowed In". [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/207aa9b7d45d4f8f41a9703b124ca58d5fd51be3)
- Added settings to determine how long a profile's data can be stored on your computer, and how many profiles can be kept in active system memory at once. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/5526219900318b636abf59e41ec5c31e65556b87)
  - There was technically always a setting for the former, you just could not access it from any menu and would need to edit the settings file manually. The default value (30 days) remains unchanged though.
- Added "Hide" and "Hide Others" menu items for MacOS, and made Cmd + W close the active dialog. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/0e7caeb38db6065154ae802acce23c388bb5e1e4)

### Changed

- Custom name colors now load automatically. We also implemented a bunch of in-memory profile cache improvements to accommodate this. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/2ff45399718bc75b517d8f32f2799840d3657967)
  - This only happens for profiles you loaded at any point in time, for one reason or another, rather than _all_ of them at once. We don't want Horizon users to start barraging the F-List servers with requests just for opening a room with 3000+ members in it.
  - Overall though, you should see memory usage over time increase a lot less than before.
- The conversation settings menu has been given a slight facelift with coloured buttons instead of dropdowns. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/94de46fe80a23bebd3a7f61e567642c1afd4e46a)
  - These buttons were designed for the new settings menus, for when character settings can be defined globally. Expect this to come out soon.
- Updated localization files.

### Fixed

- Fixed an old 3.0 issue where "toast" messages, like setting a channel to public, would display unparsed BBCode. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/d6b79cc521eb38e7cf70a980e2e949f9aec25689)
- Fixed issues with video previews for sites like Rule34.xxx. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/6c1fcf5195d32dd55288e2f8694ab55fa394a5bd)
- Fixed `/warn` text in modern chat view having horrible, illegible colors in some themes. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/17e024f12a989348d857a2099a21108fc8da8cc0)
- Fixed themes not correctly showing as the root element's class name if using the "Sync with system theme". For setting custom CSS on a per-theme level. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/5a860a2c7d53cf239c627475930dd08cea2e3f2a)
- Fixed messages having a broken layout in the Recon tab when using modern chat view. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/9ad4269b84771f9e1c6760bc9f0ed58484adb766)

### Development

- Converted the following components to the composition API:
  - `components/date_display.vue` [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/1755e55b9ffa090465342d7873481b784046576b)
  - `site/character_page/kink.vue` and `site/character_page/kinks.vue` [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/909fe06a9a523834ab777a8891cc3780d69a0d7a)
- Dropdown components now take their menu's size from both the button and the optional splitter. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/8ddcaf093402e90ae1a66807e1059b8f1b66ed8c)
- Added direct .app builds for MacOS. For building locally. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/7704966c4e26de8154ddb3315639e32d47265c3e)

### Merged pull requests

- https://github.com/Fchat-Horizon/Horizon/pull/445 by @Matthew-X
- https://github.com/Fchat-Horizon/Horizon/pull/453 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/461 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/462 by @FatCatClient

## [1.34.2] - 19-10-2025

### Changed

- Adding BBCode tags through a button or shortcut now counts as an undo step. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/aa1fada7be07c78d28261ad0e32fb45bfaf2fac8)
- The link previewer now catches a website's social media previews (if any) before the first image. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/794debf16c8ce2e099891c1eeec0101986ebc9a5)
- The link previewer now properly works with these Twitter/ X proxies too: `fixupx.com`, `fixvx.com` and ...`girlcockx.com`. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/8df9152336f99ca774fa08a8c157c27cf7f85555)
- Improved the BBCode previewer. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/502ed2c69a9a2150a4dc0f6e7547f2adbb690663) [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/0ec6c55670fd4a5fbe50aa34d56942fe0586e6a0)
  - Having the BBCode toolbar disabled and toggling the previewer with the shortcut now gives you a button to escape from it.
  - Default size is the same as the editor's size.
  - Blends better into the background.
  - Closes when switching conversations.
- Pasting a URL right after a URL-tag's parameter `[url=` no longer adds a second pair of tags inside the first one. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/b3cb30a8146e4757de47bedc6bd04132fc901bb7)
- Updated localization files. [[German]](https://github.com/Fchat-Horizon/Horizon/commit/fb05eeab5724b3d7a91de669d15e4f7f47c16d04) [[English]](https://github.com/Fchat-Horizon/Horizon/commit/6df119616b3bd052a14553ed96ea12b335430d95)

### Fixed

- Updating on Windows no longer unpins the shortcut from your taskbar. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/56d60a0b0dd9068839cfd42f5a68cd5c27e85766)
- Fixed .rpm packages for Fedora Linux (and similar) having file collisions. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/a206370b632a74c54d84e7afac9327a513a4646e)
- Fixed conversation and character names being sorted by capitalization in the log viewer on non-Windows platforms. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/112b124f77535f5109f3e79cd4daeac28993967f)
- The search dialog no longer tries (and gets stuck) scoring search results if the related setting has been disabled. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/a47bdbc21b0bc768dd02e68cd87d307e6eb62457)
- Fixed logs not loading before signing in. Again. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/49421aa20f0414475137470d55552d849d36e9c6)
- Fixed some color issues with the No Exceptions theme. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/251311e49448866ecce5801ad6e7c65e6cb2361f)
- Character select screen icons are now centered properly. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/892fc2028157eae1b6d208293bda12913637ebb6)

### Development

- Removed .msi installers from PR CI/CD. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/479aed128682ebbc459cd466df519c79ecec2e67)
- Removed obsolete packaged Electron Linux lib binaries. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/8d7a57c76460197cc57436f2c7239d6c1383de1b)
- Fixed Docker builds. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/6f5c08712ffc9ec8076bdee01856dc6933f69f44)

### Merged pull requests

- https://github.com/Fchat-Horizon/Horizon/pull/460 by @snowsune

## [1.34.1] - 2025-10-14

### Fixed

- Fixed the app locking up because of Vue trying to delete some character search results. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/97dff91e82af3f5f2696c188b222a369d883a9f4)
- Fixes ad campaigns with intervals above 10 minutes not getting timing variance applied. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/0a38968b288b583885e131ee9b8f27451c46a563)

## [1.34.0] - 2025-10-13

### Added

- Added a new theme, "No Exceptions". [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/f5adb675bead7be6ef52b2bd280aee6365bfe69e)
  - It's version 1.34, after all 🐟
- Horizon now supports multiple languages beyond just English! Currently supported languages are: French, German, Hungarian, Italian and Spanish. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/cadf98feaed0b1e6b81e1b9507079f7a36992974)
  - More will be added with time! Interested in translating? Join the discord!
- Added a character-level setting for 'modern' chat display. Similar to Discord. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/0810899e2bda3dd80f69ea351c48c91b527b3dcf)
  - Special thanks to @BootsieWootsie for helping during development.
- We have a new tool to easily let you backup your logs (and import them again) right from Horizon itself! [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/b019131e144efe06e7cd3aa72d4b954c6e5f2efb)
  - This tool also automatically tries to import logs from Rising or 3.0 if you're launching Horizon for the first time.
  - You can also run this through the command line!
- You can now disable/ enable whether you want specific conversations or channels to save logs. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/6eaf01e52af2952fd94bba712595ff8ac591fa9c)
- You can now disable duplicate status updates or login/ logout messages from appearing in the console. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/9d1be3ec076d0a6b5568ad2dcb7a7ff37e57ec83)
- Added a setting to show seconds in chat message timestamps. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/164dcbd8c6911ba0b2555973af488d206d445a9a)
- Automatic ads now let you choose the interval between posts. You can't go below the F-Chat minimum though. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/e967090e6dd9eeef281be7ad91aec7f57dcccea6)
- Added two new sound themes: XPiano and Chiplet. [[XPiano]](https://github.com/Fchat-Horizon/Horizon/commit/a0d9af81ef4501fee63c29dc8c118585366fc4de) [[Chiplet]](https://github.com/Fchat-Horizon/Horizon/commit/abf7daa0ddb662b9b06babfb8648966503c827f4)
  - Thank you, Pankake!
- Added a setting to show the active character in the window's title. It's under the app settings. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/3f360cf23abac233e839426a09342efe25a21f4c)
- Added a setting to force profiles to use standard, ASCII fonts instead of unicode semifonts. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/016a0a428884c910cf8a79ce63d4ab263bb33667)
- Added a keyboard shortcut (Ctrl/ Cmd + Shift + P) for quickly previewing your BBCode formatting. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/c8116f01b043d45382638ec89a7ad2876da45e37)
- Right-clicking an eicon in chat now gives you a context menu to copy it or add it to your favourites. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/2e975d516aa5b8f7a3cbe2e2cd98af2f3726855b)
- You can now pin statuses in the Status History window for easy access. We also increased the limit of statuses your history saves to 15. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/8a15570fa0d002fb9fb5ef700bc96e7c1c3445db)
- You can now toggle whether the small profile pictures next to messages or PMs use the HQ avatar or not. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/a282312ba0617b46fda075e9a84b40a0e3ae5139)
- Added a setting for supporting transparent windows in custom CSS. [[Commit]](440c8ae978ffcfa2e6ad43a13a48b24a73d6fbd0)

### Changed

- Removed the ping sound from channel warnings. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/ff1bca7833e87fe99b621946e2ae00c3b4dded58)
  - We originally brought this back, because it was a feature in F-Chat 1.0 and 2.0. But this was a bad decision.
- The black BBCode color is no longer just a dark version of the theme's color. [[Commit]](303df63e43c4e887213a2596e07768f7f11100ba)
  - It's still not the vanilla color by default though. If you want that one, enable "Use vanilla BBCode colors" in the app settings.
- If you send an eicon collage but accidentally mess it up by forgetting to add a new line at the start, it will now automatically add it before you send it. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/a108c103506ff90e5068a80834a9f6ff37d5ef25)
- Importing character settings to a new character now also imports your pinned eicons and hidden ads. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/4477fdbd9988ab97af6ef0b6a2e9b600666efa6b)
- The Character Search dialog has been slightly redesigned to better work for widescreen devices. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/cac0f1e6b7d5177ec0e00cd7abe64c64e22d983b)
- The new color picker shortcut can disabled in the character settings window. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/208d16f4a20e5b18e513231692382cb4a79d2455)
- The CSS rules for applying gender (and bookmark) colors have been changed, to let you more easily write custom CSS for them. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/330d50127aa67225788764913196a51c95435ac4)
- Timestamps for highlighted (pinged, warned) messages now match the background style. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/b279ea74b8316f0d4c3402fb8067ef19c0001c86)
- Quick Jump search results are reodered in a way that hopefully makes more sense. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/4b1ba64a4068b7a73314323d2e2225d62474f140)
  - The order right now is: Pinged messages > Your previous conversation > Messages marked as unread (red color) > Message time > Alphabetical order
- The "Empty customs" warning in the profile analyzer now shows which customs have an empty descriptions. It also doesn't count intentionally blank (ie. with a single space for a description) descriptions as empty. We trust that you're aware that you did that and won't be opinionated about that anymore. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/220c79f1bb86f4c6d8ca7da5f92afa6a14f55d98)
- Viewing your own profile no longer shows infotags marked with a color for compatability with that same character... You can't RP with yourself after all. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/76162fb87d8808d215232d92c7fcd7caa90ed6ad)
- The flag that remembers whether you want to minimize match results from a profile is now split from the one that lets you minimize the profile analyzer. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/b380fb4cc4294729d43c3e6ba615df669d551b18)
- 'Full width' tab items no longer get a scrollbar if their contents are too wide for their containers. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/63bf433d95648b67ad86f2485ac82f73bd0238b8)
- Bookmark colors for the "Mark friends/ bookmarks in a different color" have been adjusted for the Dracula, Withered Rose and Moon Prims themes to look more distinct from gender colors. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/1e2d9aa0e63fac9da71879616bf3c39de07c4b40)
- If a conversation is muted, it no longer appears as if you were pinged. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/6ce7e525783f2f1ee5357f233fcf30075adf59fb)
- The text selection box now uses theme-appropriate colors. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/650b5c63d16e473ee5be8f1a1d47ed29ee49347d)

### Fixed

- Fixed a 3.0 issue with exporting logs to HTML running extremely slow and using an insane amount of RAM if you're doing it for a whole character. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/36644b3892000915e85a6d44e139ed5ce0cead92)
  - Thank you, @greyhoof
- Fixed another 3.0 issue with log folder names corrupting while exporting to .zip if a channel has non-ascii characters (like emoji). [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/117d779da60a48945c882416056ffcbaed54eeed)
  - Thank you again, @greyhoof
- Fixed a 3.0 issue where logs would be deleted by the log repair tool if they were missing an index file. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/a8d6096c28b5e855bb2a64e307663c00d566123b)
- Fixed excessive GPU usage in macOS 26 due to an upstream issue with Electron apps on that platform. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/98a741c103df247671f79f9f960f97a62918caed)
- Fixed pasting URLs with square brackets (`[` and `]`) making you paste broken BBCode. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/624a0005d8f9c158a721b3d5d0be6e511cd0e6de)
- Fixed profile \[collapse\] items looking slightly broken when closed. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/a257b2536342ba56f957f1f5081bf566c09d696f)
- Fixed character search results looking weird if someone is set to Looking and has an eicon collage in their status. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/c9249ed8fd6ed67ffec5b604a8a2aab9f62a9e93)
- Fixes issues with the zoom level occassionally resetting (and desynchronizing) when switching tabs. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/c0ee1c8cf1a23fd48ee0799a604d43ed689d36aa)
- Fixes issues with the Eicon picker breaking in narrow windows. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/aab77c299c036fa3773a99ee10e5caba2c08037c)
- Fixes the new color picker freezing text input until switching back and forth between the app window after clicking a color. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/3b3f5bd18fde136ad109e500f82e652a338a30b4)
- Fixes the color picker now showing up properly in narrow windows. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/ff8e161daa8ef3ebdba4a1e944f1b2f9e9368cf6)
- Fixes the color picker breaking text input if the BBCode toolbar is disabled. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/87cdaa4ddf3cabafaa9e052d62338337cd16d73f)
- Fixed some issues on MacOS where quitting the app through things like the dock or the Cmd+Tab menu would just hide the window instead. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/659b8c0c47c7ae80bc0974c1925bd759b24c8254)
- Clicking your own name while "Clicking users opens messages" is enabled now just opens your own profile anyway. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/804ef0e382cea601fca4d7d66221acc7b29abc7f)
- Closing a PM while having some text in the text box no longer makes the other person think you're still typing. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/b5c35c630577a5cd3af8470c8008295d2be05bfe)
- Fixes filterable select dropdowns not closing after clicking an item. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/d3aba66cb7352c015bfa5c5e94f7913e227c25ec)
- Fixes gender markers and match status items potentially having a shadow when vanilla BBCode colors are enabled. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/6f277fde4e7aaad0f40770ca184edfe8b8caf88d)
- Fixed Imgur embeds showing the whole page. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/03ae50fd1ccf164ba25a1caac0a473ea07eaf0fd)
- Fixed Youtube embeds not working. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/801c6948dc119801e08fd5d3362c070e0708585a)
  - Since there are no proxy services we can directly use, and Electron adblocking packages do not work with Youtube ads, we have dropped support for embedded Youtube links and now just show the thumbnail instead. We don't want to subject any users to ads while using our app, especially not ones from Google.
- Fixed an edge case where overly long status texts without any spaces would escape from the character right click menu. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/03fbe9f68d2fbd8653df2bda4a0a37d7f82938d0)
- F-List profile links that have a +-sign now open the correct profile. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/5a99dc08cd0156a7b1162ba31623b69859b9f74c)
- Fixed the tab close dialog showing the wrong title. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/86614ca2ce0acaa88c99232c65a804ca80c331a6)

### Development

- Upgraded to Electron 37.6.1 and Node 22.18 [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/98a741c103df247671f79f9f960f97a62918caed)
- Updated Cliqz to Ghostery 2.11. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/baadda11b9a1f28ec787f23938d86cb4fb6b35ed)
- Fixed Visual Studio Code not picking up on the pre-commit hook for automatically formatting with Prettier. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/64babac9b712190f00c3f0799f1c9d2703faedba)

### Merged Pull Requests

- https://github.com/Fchat-Horizon/Horizon/pull/384 by @greyhoof
- https://github.com/Fchat-Horizon/Horizon/pull/387 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/393 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/405 by @BootsieWootsie
- https://github.com/Fchat-Horizon/Horizon/pull/410 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/411 by @BootsieWootsie
- https://github.com/Fchat-Horizon/Horizon/pull/415 by @FireUnderTheMountain
- https://github.com/Fchat-Horizon/Horizon/pull/417 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/420 by @FatCatClient (and assets by Pankake)
- https://github.com/Fchat-Horizon/Horizon/pull/432 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/434 by @greyhoof
- https://github.com/Fchat-Horizon/Horizon/pull/435 by @CodingWithAnxiety
- https://github.com/Fchat-Horizon/Horizon/pull/436 by @CodingWithAnxiety
- https://github.com/Fchat-Horizon/Horizon/pull/437 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/443 by @CodingWithAnxiety
- https://github.com/Fchat-Horizon/Horizon/pull/444 by @FatCatClient

## [1.33.8] - 2025-09-27

- Hotfix for broken notifications [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/e47e37359de1bbba42d9074464a01eae42cb00f4)
  - The previous patch was quickly put out for a security issue that has been a thing since Rising, but we were so strict in blocking off permissions that we also broke the once instance where it was fine to have some permissions: Sending notifications from the chat sandbox.

## [1.33.7] - 2025-09-27

### Fixed

- Sites no longer get permissions by default. Or at all, for that matter. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/1fa0662f062d5507d9eb608f81f3eed02ed314ff)

## [1.33.6] - 2025-09-07

### Fixed

- Fixes ping highlight color for real this time: highlight color (final) (2) - Copy.docx [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/49f8b16c9e6fcee56da4c6a4e23a4c582b2fa385)

## [1.33.5] - 2025-09-07

### Added

- The dismiss buttons for the note/ site messages checker have been brought back. Dismissed notifications will keep the icon, but will not have the number count visible. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/6cd75849f678b6f587093fa6a41017723ef4f304)
- Added reduced motion accessibility support for our custom animations. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/10c7e46f1dc67e69af8a4aa51fbb67bbbd5b02fe)

### Fixed

- Fixes some cases where using the color picker keybind would make people accidentally overwrite their selected text. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/8a7423028520698ad0a111c7bc5e33926c4691c8)
- Fixes some cases where BBCode would parse correctly where it wouldn't in vanilla 3.0, for consistency with other users. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/08a15531572219dc37be2b4b2601fe0e29e08436)
- Fixes the user right click menu becoming unnecessarily wide for longer names if those names need multiple lines (and thus won't need the horizontal space anymore). [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/96021e74d9568730c4c90205d60c8001fca5999c)
- Fixes select dropdowns (like those found in the settings menu, or the log viewer) not using the same width as the main element. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/b56657f83dd3cb328dc12bda06027ca5f55bf098)
  - This also fixes those selection dropdowns not having a mouse over colour in light themes.
- Fixes search results for characters not set to 'Looking' having a broken layout if their status message was considerably tall. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/c0407949ea979ee1797cd99a35918faaf3deb1f0)

### Changed

- Profiles without a species no longer default to "human" for the matcher. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/7ebaad62e3d7803f7c1ddd9d21812fb4df84e50f)
- The ping highlight colour has been corrected back to a less bright shade of green. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/29d280df3cf7a3c56b9f43ec6ef5511edc05ecce)
- Broken inline tags no longer display their bbcode on profiles (which they don't on the website either). [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/2adb0e6c3dbe6aa08c191bd1281c57da9dddbf50)
- Sending a message now sets the conversation as read, instead of keeping the 'last read' green line in limbo. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/4fc11027f743325cbec641aeb4084c4995f7ee08)

### Merged Pull Requests

- https://github.com/Fchat-Horizon/Horizon/pull/281 by @BootsieWootsie
- https://github.com/Fchat-Horizon/Horizon/pull/336 by @BootsieWootsie

## [1.33.4] - 2025-09-01

### Added

- The colour picker shortcut (Ctrl/ Cmd + D) is now more intuitive and autocompletes the desired color [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/daef228846d62790366fd485f6ccc83425adc295)
- Added a setting to toggle between 12 or 24 hours timestamps, and one to toggle fuzzy/ exact times on the profile viewer (similar to the website). [[12 hours]](https://github.com/Fchat-Horizon/Horizon/commit/fb7f6fad365fa57fb6b8b52bad2b63f5372c3b59) [[Fuzzy times]](https://github.com/Fchat-Horizon/Horizon/commit/e1033a74786f5afeae5f9e3c4af491a02712bdec)
- Added a setting to sync your theme with your computer's light/ dark mode setting. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/368997ac899edf6163e7e35859c006fd98bd6046)
- Button to join Discord in several places. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/bf4430d)
- Character selector pinning. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/046c56c)
- New Moon Prism theme by @ShiningVenus [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/7f080dc60f10cb066777fe65c064bb494fdefafb)
  - This is her first contribution! 🎉
- Double clicking a character in the selector now connects as it. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/861c07da66c056eef27c9f653daa136dc64ebfc3)
- Sync mosaics option. Waits until all eicons in a message are loaded before playing them. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/eb145b1f829781806e0f0b8ede438dd91fcba3d8)
- Windows installer custom sidebar replacing the default Electron Builder one. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/6a0773c9970d3bbcd38e5bfc6df0d2e26c31d374)

### Fixed

- Ensure default profile star and pin icons render above character images in the character selector. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/137da320fa5a87cb262b8290f5cce7b69eeb82ac)
- Make character selector respect theme colours (removes placeholder colours). [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/f1f7f2a)
- Character selection screen fixes [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/d5625c9):
  - Fixes vertical scroll clipping for the whole grid.
  - Fixes grid item backgrounds being invisible in light themes.
  - Fixes avatars clipping into the avatar background.
- UI items with their own colour scaling now have their scaling back after the Bootstrap 5 upgrade. [[Reimplemented scaling]](https://github.com/Fchat-Horizon/Horizon/commit/4e168e67d6ec4c4dacd7c38ba7427a4c15efc257) [[Overridden colors]](https://github.com/Fchat-Horizon/Horizon/commit/15c02d1a539b75fd65b2a04f9ace0d5932567a1e)
  - This includes:
    - Ping messages.
    - Ads in mixed mode (while ad matching is disabled).
    - Signed in tabs when you have a new ping.
    - The text box while directly posting a channel ad.
    - Character badges on the profile view
  - This should also (hopefully) make some other instances of scaled colours slightly more accurate to how they were before.
- Profile analysis now marks unparsable species more clearly [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/c06642c)
- Fixes eicons not being visible in the log viewer if you haven't signed in yet. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/7e5774d21f12f7b34091e31b03cacacfebf72244)
- Fixes Default and Mars themes being detected as light themes by unstyled components. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/4a57466)
- Fixes Dracula message-own background colour. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/8a5cc9e)
- Fixes vanilla gender colours overriding the "Highlight friends/ bookmarks" name colours; that setting now uses the vanilla colour correctly. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/01603af)
- Fixed the 'About Horizon' window being fullscreenable on all platforms. And fixes it being forced into full screen mode on MacOS if opened while the main window is in full screen mode too. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/96a1ea85716317448027769941bc726e6484f269)
- Link preview middle click toolbar now theme-styled. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/9ecd78d77468595dd9f484e546ef67178a6f3073)
- Peached theme form styling improvements. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/69239c15813a454a75bad8ff31c4a11c83d0ee58)
- App title size no longer shifts tab layout. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/8f42c3ecb29ae7fcd3b0d4d34c4196bc48037aa6)
- Sidebar small mode & gradient alpha fixes. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/31a586ae6e2781c32ec2835d5419a1dc5fcf98da)
- Sidebar bottom padding inconsistencies. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/45c84ab0dfd809b386e7e193f80a7c707516d715)
- BBCode preview is scrollable and padded. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/1add1d2cf858f4fc040569b67ea17b47d3e0d854)
- Channel list buttons aligned with their inputs. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/78232eee10cd6be1f99a9567180cae41c14b0c6b)

### Changed

- Notification volume control styled with Bootstrap classes. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/700ea2a)
- Moved the version button to under "About Horizon". [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/c6ae55a)
- Better background/ text contrast for your own messages in light themes. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/283747c7b78792112a43b098b3d267d06b05b8db)
- Ping highlight colour reduced (less intense). [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/ea41481380d3a860823aee567345cf54bc047bce)
- Character search restored as a primary sidebar button. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/bc55cbe88e2e8e347e6e17ce95d0eee84c0143d2)
- Ad Center & Launcher layout tweaks. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/
- Slight settings menu reorganisation. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/1c8d9dd65a94a49209f7a4e9a5a6d1d3d7c4d9f0)

### Development

- Added GitHub Actions workflows for release notifications to Discord. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/f5b4dc6)
- Removed redundant scrollbar stylings from themes. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/829096af66277d5938b46a6f76587ae4047a0a49)
- README updated with more current info. [[Commit]]([https://](https://github.com/Fchat-Horizon/Horizon/commit/6404daaebdae4b940a39ad9de091720385ef4172)

### Merged pull requests

- https://github.com/Fchat-Horizon/Horizon/pull/367 by @ShiningVenus
  - This is her first contribution! 🎉

## [1.33.3] - 2025-08-24

### Fixed

- Fixed background color for ads when both ads and chat are visible being very hard to read. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/94438bddd0959bdd43a059018e99750ada393a22)
- The quick switcher on the top for narrow windows now shows up at the proper screen widths again. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/fa372a179c5872c6aa0a96e538208a28cd8ef6c8)
- Fixed a MacOS issue where the 'About Horizon' window could not be closed. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/5a44f12f67a870177c1c6cbaa4e7155e0cd75c73)
- Readjusted some overly bright text colours after the Bootstrap 5 upgrade: [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/017f4ced877626f69210f7d9faad7c330b2e89a9)
  - Active tab text color
  - Unread conversation text color
  - Own message background color
- Fixed the "Show friends/ bookmarks in a different color" setting not working for the new 1.33.0 themes. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/14b9b0ecbf02bad376e6cdb7632503c8bb72d129)

### Changed

- The light theme's primary color has been reverted back to blue for legibility reasons. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/33ca6e96c6410d3ad2bdedebcea381478eba9474)
- Regrouped the text color settings into their own header. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/80aa51dc63857c050f839a60dfb431d94182187b)

## [1.33.2] - 2025-08-24

### Added

- Autologin. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/e3e377f)

### Fixed

- Fix regression with the character selector by adding a search bar [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/7ff8955)

## [1.33.1] - 2025-08-24

### Added

- Revamp of the character selector. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/4d1fa88)
- New "Vanilla" gender colours setting. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/fa0b508)
- Sound theme menu revamp (Can now preview sounds and set per-sound volumes). [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/2f70066)
- Readded bbcode glow and added settings to toggle it. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/bccc564)

### Fixed

- Fixes for the default sound theme being painful on the ears. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/dcca0a4)
- Fixes Bootstrap-related colour issues on collapsible elements. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/970b58a)

## [1.33.0] - 2025-08-24

### Added

- Major UI / UX rework and refresh. [[Initial UI pass]](https://github.com/Fchat-Horizon/Horizon/commit/3f66933) [[Sidebar redesign]](https://github.com/Fchat-Horizon/Horizon/commit/48857a7) [[Conversation list redesign]](https://github.com/Fchat-Horizon/Horizon/commit/0012124) See the "UI Changes overview" section below for full details.
- Project now licensed under the GNU Public License v3 (previously MIT). Later re-licensed under MPL-2.0. [[License change]](https://github.com/Fchat-Horizon/Horizon/commit/9deb59b)
- Sound themes for customizing your notification sounds. [[Initial]](https://github.com/Fchat-Horizon/Horizon/commit/a7967bc72ae895a5e941a59f57a12b50be5845ea) [[Ocean]](https://github.com/Fchat-Horizon/Horizon/commit/6ac72cd72e9d3d66dd28abcf1ca7f87fd6c72cd2)
  - Want to create your own, or even submit it for release with Horizon? [Check this guide!](https://horizn.moe/docs/guides/sound-themes.html)
- Global setting for custom CSS styles (experimental). [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/7c929d3b6a76976dc82f3a124de65f96fb3764f2)
- Channels list button to quickly mark all channels as read. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/3d7260295ed740834db85baab9f5cc336564f4e8)
- Character-wide setting to notify you when specific users post in a public room (can be global or per-room). [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/421e1722b44359a701da109a54929d0fb283736f)
- Global setting to always display vanilla text colours, regardless of theme. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/488e8048d91e90347e360945aee1bb276ef6b500)
  - "Vanilla" refers to the original 3.0 appearance.
- Four new themes: "Wilted Rose", "Classic", "Peached" and "Mars". [[Wilted Rose]](https://github.com/Fchat-Horizon/Horizon/commit/50e9a0cd2623b9bc945d67f16e83ba47228e1b08) [[Classic]](https://github.com/Fchat-Horizon/Horizon/commit/73a85d41cb80834bfd464ffdfb51a7365d6deafb) [[Peached]](https://github.com/Fchat-Horizon/Horizon/commit/003f051d3199c102bc68f2bab1c62e58250e9073) [[Mars]](https://github.com/Fchat-Horizon/Horizon/commit/c895cdf2d7d1fa0888ddc563464685035620eabe)
- Side bars can now be resized by dragging their inner borders. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/a9857cf40b9762273be50896fb86158263a289d0)
- Developer badge visible in chat. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/ae001b3117e69defc990ef879e5f7f5564318ea7)
- New build system (see `electron/README.md` for details). [[Refactor]](https://github.com/Fchat-Horizon/Horizon/commit/8f79f8e) [[Rewrite]](https://github.com/Fchat-Horizon/Horizon/commit/8a0cdb0) [[Windows build fix]](https://github.com/Fchat-Horizon/Horizon/commit/29c1c5b) [[Docs]](https://github.com/Fchat-Horizon/Horizon/commit/4127bdb)
  - Support for long awaited RPMs! 🎉
  - Linux armv7l builds supported (manual build required).
  - Cross-building Windows binaries from Linux (and possibly macOS) supported.
  - Documentation updated accordingly.
  - Support for building Windows portable builds.

### Fixed

- Preview embeds that would prompt a browser to save a file instead of displaying an image (e.g. Discord .mp4 links) now show nothing instead of a save dialog. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/344313250112c999f4d2c5b8243bd88ab09626a7)
- TikTok preview embeds. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/f8d20b1c1824c2a4354709336c76cee5de3b2cf1)
- (Partial) Imgur previews. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/548ad15ba4804f292ec4610ee9667e84458a13c9)
- Cases where the chatbox would resize erratically at line ends, especially with narrow glyphs (e.g. ! or i). [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/72fdfe8c0232571e9ef0c81f0bc28f7c7fbb61ed)
- Issues with the tab switch shortcut not working immediately after creating a new tab. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/c932f5ebc976a666d516c0d25655da7011a913d2)
- Numerous BBCode profile formatting issues (e.g. `[sub]`, `[sup]`, `[big]`, `[small]`, `[heading]`). [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/c33c56d342f7f969019ca452e5245e64c1937255)
- The profile viewer's tabs will no longer float above the dimmer for dialogs inside the profile viewer. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/30f50213c28cd667b51eb201f4c9fad0afae226b)

### Changed

- _La Chasse à la licorne_ 🦄 – "Unicorn" matches are now called "Perfect" matches for clarity. Some other stray Rising-era references updated. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/86de04f6050f8c4de516335e64320741942f7fd5)
- Quick jumper (Ctrl/Cmd + T) now also shows recent conversations, bookmarks and friends. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/49b76e617189be1f3ad3131db6f6ca2cc08ac28f)
- Profile analyser now shows how the matcher interprets your character (species, inferred preference genders, etc.) rather than only missing fields. [[Species data]](https://github.com/Fchat-Horizon/Horizon/commit/f2522e8) [[Gender prefs]](https://github.com/Fchat-Horizon/Horizon/commit/7430118) [[UI & age nuance]](https://github.com/Fchat-Horizon/Horizon/commit/78f5de2)
- Notification sounds now use higher quality .ogg variants where available. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/57a78e056b8cb1b3dc8b26528b9bc912ab4fd856)
- Channel `/warn` messages now notify all users, as was the case in F-Chat 1.0 and 2.0. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/9afa0ef99b5cc7102669ee5508622a41d9f29060)

### Development

- Upgraded to Bootstrap 5.3 from Bootstrap 4. [[Initial]](https://github.com/Fchat-Horizon/Horizon/commit/70de52c) [[SCSS update]](https://github.com/Fchat-Horizon/Horizon/commit/e156de4) [[Variable adjustments]](https://github.com/Fchat-Horizon/Horizon/commit/a968b26) [[Component class updates]](https://github.com/Fchat-Horizon/Horizon/commit/db92d85)
- Running in development mode now adds an option to quickly view common UI elements for your current theme in a window dialog. It can be found in the app menu, under Help > Test UI items. [[Menu added]](https://github.com/Fchat-Horizon/Horizon/commit/ef0c9977bfe9d1d12bafc0e75e8bc47a5f465606) [[Elements added]](https://github.com/Fchat-Horizon/Horizon/commit/8c927962da322cd6dbea7ac99524f9499f5303f7)

### UI Changes overview

- Generic UI elements like tabs and "cards" (used to denote specific floating sections like the parts on the profile viewer or the sign in screen) have been given a facelift so we're not just using the vanilla Bootstrap styles.
  - The general idea was to go for a more "consistent" look, so that both our custom components and stock ones blend together more. We also figured that they could do with a little eyecandy without compromising on visual clarity.
  - Other changes to those elements, like with tabs, were done for extra visual polish. Tabs now always match the colour of their contents and have no seams, window modal dialogs no longer take up unnecessary width and have a cute little icon :)
- Various elements now use a "hidden", slim scroll bar that only shows when hovering.
- _Many_ tiny nitpicks and inconsistencies addressed.
- The "User Menu" right click menu has been polished and handles very long unbroken names better.
- The sidebar has been slimmed down: buttons replaced action links, and conversation-related actions moved to relevant lists.
  - The note/ messages counters have been integrated into the sidebar too, instead of displaying as a toast dialog on the bottom.
  - All buttons and functions should still be accessible from within a single click though. Aside from the "Edit ads" button, which has been moved to the Ad Launcher, and the Profile Analyser. Which is now no longer a separate window but has been integrated into the profile viewer for your own characters.
  - It should overall feel a bit more familiar to people using modern chat programs.
- BBCode colours for white, gray and black updated in all light/dark themes for legibility; most other colours in the light theme adjusted as they were hard to read.
  - Since this removes the "glow" effect that black text has in certain theme and was used for certain cool effects, the setting for bbcode colours mentioned above also adds the glow back to those colours.
- The light theme has (mostly) been fixed throughout and is now on par with the dark themes.
- Improved visual consistency between the Eicon Picker and the rest of the app.
- The profile viewer has been significantly polished too.
  - The side bar's buttons have been updated to match the look used for other buttons throughout the app.
  - Looking at your own character(s) now shows (preliminary!) buttons similar to the website. You can also see your private friends lists now.
  - The dialog for editing a memo has been changed to match the one in the user right click menu.
  - The profile analyser is now displayed on your own profile instead, inside the collapsible box used for match results on others' profiles.
  - The window will no longer shift around depending on whether or not a profile is loading/ unavailable, smaller or full size. This also includes a nice little loading animation (please do not look up what they're called).
  - Massively nested `[indent]` tags, used to create a padding effect, no longer have their contents completely squashed on narrower screen sizes.
  - Various elements (such as the buttons above the kink list, the "Info" tab's contents and the sidebar's contents now scale properly at various screen sizes.
  - Dropdown items and the kink lists have been slimmed down a bit. The kink lists now have a bit of a coloured flair similar to the website's profile page.
- Buttons on the window title bar now blend in better with the background.
  - On platforms that have a button for the app menu, a specific button was added to directly open the settings. The app menu button has been given a different icon to better show off its purpose.
- Text contrast fixes are now applied globally across appropriate elements (e.g. buttons). [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/8480f9ce4469ca2ef5e0a8e0e9e9b6a12c30cade)
  - This also fixes some cases where theme colours weren't being applied properly to some elements (like conversation lists in the Dracula theme).

### Removed

- Extra, unused CHANGELOG.md in `electron/CHANGELOG.md`. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/8d97fb9aef01638b1d89324e3aa62d0690d9a842)

### Merged pull requests

- https://github.com/Fchat-Horizon/Horizon/pull/285 by @little-voice
- https://github.com/Fchat-Horizon/Horizon/pull/298 by @little-voice
- https://github.com/Fchat-Horizon/Horizon/pull/290 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/300 by @DerEchteDimenzio
  - This is their first contribution! 🎉
- https://github.com/Fchat-Horizon/Horizon/pull/317 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/318 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/321 by @CodingWithAnxiety
- https://github.com/Fchat-Horizon/Horizon/pull/327 by @CodingWithAnxiety
- https://github.com/Fchat-Horizon/Horizon/pull/331 by @FatCatClient

## [1.32.3] - 2025-07-24

### Added

- New app icon! [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/8cf81e36b7a5f500dec2addee71fdcb9f78f2659)
- Quick jumper between conversations! Press CTRL/ CMD+T to quickly select any open conversation or channel in your list by simply typing it. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/1919a089cf06cdff2a0c9fdc497d6a88a2d3f307)
- Message drafts can now automatically be saved, to prevent them from being lost after connection issues. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/8877a2e07a23bcf93702a3a7cf75b968b9cc156b)
  - This behaviour can be turned off, much like saving logs can.
  - Thank you, @AriannaAltomare!!
- The changelog now displays inside the app instead of taking you to GitHub. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/d8fa1d10861bb2cbf701f52c59e32ab769e4018b)
- Update notifications now open the changelog inside the app, with the option to close and download, or just download it in the background. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/53a65730adeeb6f5413eda9a68aca35e2cf6c954)
- Toyhou.se images are now whitelisted for HQ portrait urls. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/7536a7aa30a8377551d21082f407b7653ee73974)

### Fixed

- Fixes the gender icons for some genders overlapping after the Font Awesome update. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/b556dd71b103f3779a0d38da87b3b4432a6e8630)
- Fixed Twitter embeds.
  - Fixes Xeets not showing a ximage preview if they're xinked from x.com instead of twitter.com/ vxtwitter.com/ etc. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/762179eab7917d159a4dce603e2ee84a0996d413)
  - Fixes previews for photo links either not working, or only showing the first photo (instead of the one linked). [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/f15e2e09f2bbbc1c73b88b1967234ba58515a466)
- Fixes a bunch of BBCode bugs and inconsistencies w/ the website for the profile viewer:
  - Incorrect `[color]` tags now parse the same as the website. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/ce3b47d08d0eb0f545fb4e146da3d33723de704c)
  - `[hr]` tags no longer break while next to, or inside of certain other tags. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/08c1b15ad04c750842ff62378517d9bbd1a93c21)
  - `[sub]` and `[sup]` tags actually display properly in profiles now. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/00f74b624812b777a819731dc61ba15939df4d6a)
  - Inline images not showing properly if they're within certain tags (like `[heading]`). [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/46dc1ba1afa3e6c645530079af33fb57e9053fb3)
  - Inline images not showing in guestbook posts (where they do work on the website, yes) [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/7ebdf0a85b3f540860c4b700fac997545551a663)
  - `[big]` tags no longer work in chat (which was technically a bug, yes). [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/18238778afa2073b775d7b4a3b6c6312679a82b5)
  - `[eicon]` tags inside tags like `[sub]` and `[heading]` in the profile viewer and guestbook posts. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/8cd8ab81c08da933ff693efaa5beb8870bc37ccc)
  - `[icon]` and `[eicon]` tags not showing up in the mini profile preview on the right. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/234744902793775731427c0e882521a23e63309b)
  - Thank you for the diligent work, @BootsieWootsie!!
- Fixes the right click menu for characters closing when you click a spoiler tag in somebody's status. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/c49f8de0b48aad3ebbdac3d9e5da47aafcea61b2)
- Fixes the profile viewer not showing new inlines when it's being refreshed due to a cache expiry. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/e228ee32d4daab3220c4c43bf1bbb9d25aa9cbce)
- Fixed some cases where HQ avatars wouldn't parse if they were in the same line as another `[url]` tag on your profile. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/9a7d6bb4a790504335a5c95cfbf1fec0438abbbe)
- Fixes the tray icon's "Quit" option only closing windows instead of actually exiting the app. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/52bbabda7649ef2314a8195fe1a8ede28ac983d8)
- Minor theme visual nitpicks. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/4e26ac904fea85e0c4ec82f9d5303392ca803fdb) [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/d5389f9fe4188262e507a9b269f33d780e92e9e9)

### Changed

- The 'new update' glowing icon has been replaced with a less attention demanding arrow, which was already in use on MacOS. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/378ed0a25a3ceb7c81ff84b97e96bb1ccc6d65ff)
- The MacOS version now uses the regular system 'Window' menu in the menu bar. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/daf5cbaf2358d25b0ce40b4e2b300e6149d7044d)

### Security & Development

- Updated Electron to 37.2.0. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/24791477c245ad9ca25222cfded78871f852d176)
- Updated Vue-Loader to 15.11 so we don't have to deal with Babel Traverse vulnerabilities anymore. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/6ec6ad6840d61fc5776f79732c348d6056acfd13)
- Updated Vue from 2.6 to 2.7. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/8b907f21aeafc08559ff34b1eee5552d1b73eb24)
  - In the 1.32.2 changelog we mentioned wanting to update to Vue 3 and that updates might pause because of that, but going through 2.7 first means we can do the necessary changes gradually instead of having to edge and drop all of the component changes in one go. It's a pain to have to deal with wanting to update a component in the development branch while the Vue 3 branch has to then have those changes backported to them, but the backend also relies on some Vue 2-specific code and slowly whittling this down will probably go way better.
- We now support Gentoo ebuilds! Check out all of our Linux package versions in the [Readme!](https://github.com/Fchat-Horizon/Horizon/blob/main/README.md#supported-distros) [[Commit]](https://github.com/Fchat-Horizon/horizon-packages/commit/9803c4373ebdfbba6e47e4c475b549c3868934f6) by @CodingWithAnxiety
- Made some BBCode parsing code more generic, instead of split up between standard and chat parsers. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/e52dd3b6a7655ffaeeeaa7c2dacea8e2d4861fb2)

### Merged Pull Requests

- https://github.com/Fchat-Horizon/Horizon/pull/240 by @AriannaAltomare
  - This is their first contribution! 🎉🎉
- https://github.com/Fchat-Horizon/Horizon/pull/257 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/258 by @BootsieWootsie
- https://github.com/Fchat-Horizon/Horizon/pull/260 by @BootsieWootsie
- https://github.com/Fchat-Horizon/Horizon/pull/261 by @BootsieWootsie
- https://github.com/Fchat-Horizon/Horizon/pull/263 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/268 by @FatCatClient
- https://github.com/Fchat-Horizon/Horizon/pull/272 by @BootsieWootsie
- https://github.com/Fchat-Horizon/Horizon/pull/273 by @BootsieWootsie
- https://github.com/Fchat-Horizon/Horizon/pull/275 by @BootsieWootsie
- https://github.com/Fchat-Horizon/Horizon/pull/277 by @BootsieWootsie
- https://github.com/Fchat-Horizon/Horizon/pull/278 by @BootsieWootsie
- https://github.com/Fchat-Horizon/Horizon/pull/280 by @little-voice
  - This is their first contribution! 🎉🎉

## [1.32.2] - 2025-07-05

> [!IMPORTANT]
> We are hard at work updating Horizon to use Vue 3 instead of Vue 2, [which should have been done well during Rising's lifespan](https://blog.vuejs.org/posts/vue-2-eol).
> This means we might slow down a bit on non-pre release updates, until we've gotten 2.0.0 (or whatever version number that would be) in a state where we feel it's stable enough. But unless something goes terribly wrong– or we wind up with a truckload of bugs as a result of this update process, this won't take more than a few weeks. 🤞🤞
> If you're anxiously waiting for new stuff after this update, and it's been a while. Know that we're probably busy with this.

### Fixed

- Fixed issues where the eicon picker's cache would get corrupted during a botched upgrade to any 1.32.X version from an earlier version. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/9a114a16c688961fa25d9bf90e9b8dd47c1de756)
  - This will also make sure that any `eicons.json` files that have already been broken because of this issue are automatically fixed.
- Fixes some cases where custom name colors wouldn't be applied even though the BBCode formatting was valid. This mostly happened if you had the `[color]` tag inside or right next to another one. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/831ffbc838e5adf656457daa8e2524929086b24f)
- Fixes the external browser setting no longer working in the new settings menu. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/b9b0adf0a75ab07a33cfa4d64eb63569508228f1)
- Fixes some instances where using the wrong capitalisation with an `[icon]` tag would link to an improperly capitalised profile preview. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/93247fd76b134162ae92e6ef450b6756b82b0f7c)
- Fixes the 'About Horizon' window being cut off on Windows. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/6020e542358c465343bd21d7caeffcac9806aa8b)
- Fixes the badge on the taskbar icon disappearing if you close a window and reopen it through the tray icon. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/2d8ab92f5497c3cf490dc4247caa926b2174f6e8)
- Fixes issues where closing the app to dock on MacOS would make the dock icon not respond to input, or let you break the app by clicking stuff in the menu bar you are not supposed to be able to without a window. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/4053389561b0552b18a7265a6108068110cc1e04)
- Fixes a bug where you could break the amount of tabs allowed by using the New Tab shortcut. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/9af50faef58fd34bb2e8809e27eb9d29b992abf4)

### Changed

- System broadcasts are now thrown into the console tab instead of pinging and notifying you for every single conversation you are in. The console tab glows just like if you were pinged when there is an announcement. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/37a54fe06c4e1dfc876bc6b3004ad27cd2403512)
- If "Close to system tray" is enabled, you now get only one tray icon that lets you open any tab, instead of one tray icon per tab. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/0176a37f3ae59a083a7a901b31b785e29aff0d70)

### Development

- Prettier updated to version 3.6.0 [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/1d3e9f3020f23c59a9919b1273c82785e4728c39)
- Cleaned up the profile viewer code so it won't cry about not having a specific tag anymore. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/b4e11d4239b21966de9971a5fa0c553892e705ce)

### Merged Pull Requests

- #225 by @BootsieWootsie
- #228 by @FatCatClient
- #233 by @FatCatClient
- #241 by @FireUnderTheMountain

## [1.32.1] - 2025-06-21

> [!IMPORTANT]
> This update changes the way global settings are accessed. Backing up your logs is recommended.

### Added

- General app settings now have a proper preferences window. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/d1578dc6ccaba15e56e0b1eec758f41887b74d90)
  - You can find it under Horizon > Preferences in the app menu.
  - In the nearby future, most of the character-specific settings will be moved to this global settings menu, where they will be applied globally across your characters. Settings like your pings, or other similar settings that can also be set on a per-conversation level will remain character-specific though. This is mostly for settings that have little business being tied to your character (like font size).

### Fixed

- Installing an update now displays the proper changelog instead of the one from the previous version. Oops! [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/324c9d347e9ec751cca152abf00364438aa7ee12)
- Zoom levels now properly persist throughout app sessions. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/2faa816f5f222ad9ab751665a8ea276f35ff314b)
- Clicking the update prompt now properly closes the app instead of leaving you with a tables window. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/badc733049f3c3342fe1c95011c8e3bcd05d51bb)
- Proxy settings are now properly saved after signing in. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/bd8e42999156a566d840d66fac49488f2ffa1805)
- Having a broken URL for your HQ avatar no longer prevents your custom color from displaying either. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/efe8f252294c140177e842d0928f45e0b82f2adf)
- Fixes the profile assistant linking to a nonexistent page when informing you about HQ portraits. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/3341f88941ffa3ab29830fdd1674fb38367746c1)
- Fixes the "Show friends/ bookmarks in a different colour" setting not working in the Dracula theme. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/267728c5cadfd775955e12c16666c0c07c05455e)
- Minor nitpicky visual fixes. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/bbfbd6b9736ca850677e4e70b30e9183279c96bd) [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/d13e7724a9f805720e507f3c0d3e239182161ca6)

### Development

- Themes now properly track whether they are light or dark. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/5c0e518d40168d187b35fa8d0b09e6a8de9f62e5)

### Merged Pull Requests

- https://github.com/Fchat-Horizon/Horizon/pull/210 by @Keerthi421
  - This is her first PR! 🎉
- https://github.com/Fchat-Horizon/Horizon/pull/216 by @FatCatClient

## [1.32.0] - 2025-06-15

> [!IMPORTANT]
> If you want to _downgrade_ from 1.32.0 or later to an earlier version, you will need to manually delete the `eicon.json` file in your Horizon data folder, or the EIcon search window might not show all results anymore.
> Please consult [this](https://github.com/Fchat-Horizon/Horizon/blob/main/PRIVACY.md) file on where to find this folder.
> For regular users, this should be no concern though.

### Added

- New EIcon Selector and Store update, significantly improving the EIcon selection UI and handling. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/2439abc9253ca87a510d3ac5bc8abded9f1b5d68)
  - You should see a **_massive_** decrease in memory per tab now, and searching for eicons is now a lot snappier.
  - Also fixes some issues where searchig for EIcons with a leading space wouldn't work. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/b88290eef690fdd3111abae52b6c41124b3e8663)
  - _Also_ fixes the EIcon search potentially messing up if Xariah's API is having issues. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/130d91b7fca64740cf7c08ca05f768fc83d3c0e6)
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
- A new setting to display gender symbols next to character names. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/1ae7b9cd2c634b481e83aaee5823627a06decb8c)
  - These symbols can (optionally) retain the original gendered name colour for characters using a custom colour.
- Automated update checks. The settings button on top-- or on Mac, a new one only visible when there's an update, will glow when a new version of Horizon is available for download. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/b9189fe9f123dcd2d7a6d6c939e48d744401504b)
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

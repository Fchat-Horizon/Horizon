# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). You can also read it on our [website](https://fchat-horizon.github.io/docs/changelog.html).

# [Releases]

## [1.33.3] - 2025-08-24

### Fixed

- Fixed background color for ads when both ads and chat are visible being very hard to read. [\[Commit\]](https://github.com/Fchat-Horizon/Horizon/commit/94438bddd0959bdd43a059018e99750ada393a22)
- The quick switcher on the top for narrow windows now shows up at the proper screen widths again. [\[Commit\]](https://github.com/Fchat-Horizon/Horizon/commit/fa372a179c5872c6aa0a96e538208a28cd8ef6c8)
- Fixed a MacOS issue where the 'About Horizon' window could not be closed. [\[Commit\]](https://github.com/Fchat-Horizon/Horizon/commit/5a44f12f67a870177c1c6cbaa4e7155e0cd75c73)
- Readjusted some overly bright text colours after the Bootstrap 5 upgrade: [\[Commit\]](https://github.com/Fchat-Horizon/Horizon/commit/017f4ced877626f69210f7d9faad7c330b2e89a9)
  - Active tab text color
  - Unread conversation text color
  - Own message background color
- Fixed the "Show friends/ bookmarks in a different color" setting not working for the new 1.33.0 themes. [\[Commit\]](https://github.com/Fchat-Horizon/Horizon/commit/14b9b0ecbf02bad376e6cdb7632503c8bb72d129)

### Changed

- The light theme's primary color has been reverted back to blue for legibility reasons. [\[Commit\]](https://github.com/Fchat-Horizon/Horizon/commit/33ca6e96c6410d3ad2bdedebcea381478eba9474)
- Regrouped the text color settings into their own header. [\[Commit\]](https://github.com/Fchat-Horizon/Horizon/commit/80aa51dc63857c050f839a60dfb431d94182187b)

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
- Project now licensed under the GNU Public License v3 (previously MIT). [[License change]](https://github.com/Fchat-Horizon/Horizon/commit/9deb59b)
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

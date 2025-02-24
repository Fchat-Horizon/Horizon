# Download

[Windows x64](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat-Rising-win-x64.exe) |
[Windows arm64](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat-Rising-win-arm64.exe) |
[MacOS M1](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat-Rising-macos-m1.dmg) |
[MacOS Intel](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat-Rising-macos-intel.dmg) |
[Linux x64](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat-Rising-linux-x64.AppImage) |
[Linux arm64](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat-Rising-linux-arm64.AppImage)

# F-Chat Horizon

This repository contains a heavily customized version of the mainline F-Chat 3.0 client.

## TL;DR

### Setting Up

FChat-Rising uses NodeJS `16.x` and may not work on newer versions. Use [`nvm`](https://github.com/nvm-sh/nvm) or [`nvm-windows`](https://github.com/coreybutler/nvm-windows) to simplify your life.

```bash
# Windows only:
npm install --global --production --vs2015 --add-python-to-path windows-build-tools node-gyp

# Ubuntu only:
sudo apt install libsecret-1-dev

# MacOS only:
brew install python-setuptools

# All operating systems:
git clone https://github.com/Fchat-Horizon/Horizon.git
cd fchat-rising
yarn

# Optional; make sure your commits are anonymous
git config --local user.name "SOME NAME"
git config --local user.email "some@email.com"
```

### Dev Mode

Run two processes simultaneously:

```bash
# Process 1 -- watch
cd electron
yarn watch
```

```bash
# Process 2 -- app
cd electron
yarn start
# Use `Ctrl+Shift+I` to open the Chromium debugger.
```

### Build

```bash
cd electron
yarn build:dist
node pack.js
```

## Key Differences

1. **Profile matching** automatically compares your profile with others to determine with whom you are compatible.
1. **Automatic ad posting** repeatedly posts and rotates ads on selected channels.
1. **Link previews** popup shows a preview of an image / video when you hover your mouse over a link.
1. **Caching** speeds up profile loads and other actions.
1. **Smart filters** let you choose what kind of ads and posts you see in the chat.

### More Detailed Differences

- Channel Conversations
  - Highlight ads from characters most interesting to you
  - Hide clearly unmatched ads
- Ad Auto-Posting
  - Manage channel ad settings via "Tab Settings"
  - Automatically re-post ads every 11-18 minutes (randomized) for up to 180 minutes
  - Rotate multiple ads on a single channel by entering multiple ads in "Ad Settings"
  - Channel owners can set a minimum time between ads by adding `[ads: 30min]` to the channel description
- Ad Ratings
  - LFP ads are automatically rated (great/good/maybe/no) and matched against your profile
- Private Conversations
  - View a characters' recent ads
  - Quick prof
- Link Previews
  - Hover cursor over any `[url]` to see a preview of it
  - Hover cursor over any character name to see a preview of the character
  - Middle click any `[url]` to turn the preview into a sticky / interactive mode
  - Link preview has an ad-blocker to minimize page load times and protect against unfriendly scripts
  - Use alt/option key + mouse click to pin the link preview
- Profile
  - Kinks are auto-compared when viewing character profile
  - Custom kink explanations can be expanded inline
  - Custom kinks are highlighted
  - Gender, anthro/human preference, age, sexual preference, and sub/dom preference are highlighted if compatible or incompatible
  - Guestbook, friend, and group counts are visible on tab titles
  - Character images are expanded inline
  - Cleaner presentation for the side bar details (age, etc.), sorted in most relevant order
  - Less informative side bar details (views, contact) are separated and shown in a less prominent way
  - Cleaner guestbook view
  - Profiles, images, guestbook posts, and groups are cached for faster view
  - Character view tabs (overview, images, etc.) stick to the top
  - Show/hide current profile with Ctrl+P or Command+P
  - Navigate back and forward in character profile view history
  - Profile Analyzer guides you to adjust your profile to maximize matches
- Character Search
  - Search results are sorted based on match scores
  - Best matching profiles get a 'unicorn' tag
  - Display match score in search results
  - Current search filters are listed in the search dialog
  - Search filters can be reset
  - Search results can be filtered by species
  - Search results can be filtered by body type
  - Last 15 searches are stored and can be accessed from the 'Character search' dialog
- Smart Filters
  - Filter out ads, channel posts, and PMs from characters based on filters such as age or kink preferences
  - Auto-respond to PMs with a 'no thanks' when character profile matches with your smart filters
- Character Status Message
  - Last 10 status messages are stored and can be accessed from the 'Set status' dialog
- General
  - Character profiles, guestbooks, friend lists, and image lists are cached for faster access
  - Conversation dialog can be opened by typing in a character name
  - Message search matches character names
  - PM list shows characters' online status as a colored icon
  - Use `Ctrl+Tab`, `Ctrl+Shift+Tab`, `Ctrl+PgDown`, and `Ctrl+PgUp` to switch between character tabs
  - Show number of unread notes and messages in the bottom right corner
  - Colorblind mode
  - Option to disable Windows high contrast mode
  - Right click any word and select 'Look up...' to see its dictionary definition
- Technical Details for Nerds
  - Upgraded to Electron 17.x
  - Replaced `node-spellchecker` with the built-in spellchecker that ships with Electron 8+
  - Multi-language support for spell checking (Windows only – language is autodetected on MacOS)

## How to Set Up Ads

1. Open a conversation channel of your preference, such as `#Sex Driven LFRP`
1. Locate the `Ad Editor` button underneath your character overview on the left.
1. Enter one or more ads and tag them appropriately
1. Click `Save`
1. Click the `Post Ads` underneath the `Ad Editor` option.
1. Select the tags you wish to use and which channel to post them in and then click `Start Posting Ads` on the bottom.
1. To stop, click the red stop button next to the `Post Ads` button.

## FAQ

1. The more information you have in your profile (**non-custom** kinks in particular), the better the matching quality will be. The algorithm considers the following data points:
   - Age
   - Gender
   - Sexual preference
   - Dominance preference
   - Human/anthro preference
   - Post length preference
   - Position preference
   - Non-custom kinks
   - Species
1. Matching for non-binary genders relies on kinks. For example, if your non-binary character has a preference for females, make sure 'females' are listed as a favorite kink.
   - Similarly if you want to match with non-binary genders -- independent of your characters' gender -- add your preferred non-binary types into your kink list.
1. 'Underage' kink is considered to apply to characters aged 16 or above; 'ageplay' kink is considered to apply to characters aged 16 or below.
1. 'Older characters' and 'younger characters' kink preferences are interpreted as age difference of 8+ years.
1. Comparison results will get faster over time, as more and more character data is cached.
1. If you have a species-fluid character (e.g. you play both your character as both a human and an anthro), you can indicate this by setting your **species** in your character profile in the following ways. F-List Rising will then score you against the best fitting type.
   - Human or tiger
   - Human, tiger, or dragon
   - Anthro (Horse or Tiger)
   - Dragon (Dwarf, Elf, or Human)
   - Elf (optionally vampire or dwarf)
   - Feline (optionally horse, tiger, or elf)

## Todo / Ideas

- Collect data on ads / responses to determine which ads work best
- Preview mode should allow detaching from the main window
- Improve log browsing
- Conversation bot API
- 'Filter unmatching ads' is not channel specific -- it's either on everywhere or nowhere
- What are the things that would make your profile more compatible with others?

# F-List Exported

This repository contains the open source parts of F-list and F-Chat 3.0.
All necessary files to build F-Chat 3.0 as an Electron, mobile or web application are included.

## Setting up a Dev Environment

- Clone the repo
- Install [Yarn](https://yarnpkg.com/en/docs/install)
- Change into the cloned directory and run `yarn install`. If you only want to make a custom theme, you do not need to do this!
- IntelliJ IDEA is recommended for development.

## Building for Electron

- **Windows only:** To build native Node assets, you will need to install Python and the Visual C++ 2015 Build tools. [More information can be found in the node-gyp docs.](https://github.com/nodejs/node-gyp#installation)
  - `npm install --global --production --vs2015 --add-python-to-path windows-build-tools node-gyp`
- Change into the `electron` directory.
- Run `yarn build`/`yarn watch` to build assets. They are placed into the `app` directory.
- Run `yarn start` to start the app in debug mode. Use `Ctrl+Shift+I` to open the Chromium debugger.

### Building a Release Package (Electron)

1.  `cd electron`
1.  `yarn build:dist`
1.  `node pack.js`

### Packaging

> This section is outdated and left here for reference purposes only.

~~See https://electron.atom.io/docs/tutorial/application-distribution/~~
~~Run `cd electron && yarn build:dist` to create a minified production build.~~
~~Run `yarn run pack`. The generated installer is placed into the `dist` directory.~~
~~On Windows you can add the path to and password for a code signing certificate as arguments.~~
~~On Mac you can add your code signing identity as an argument. `zip` is required to be installed.~~
~~On Linux you can add a GPG key for signing and its password as arguments. `mksquashfs` and `zsyncmake` are required to be installed.~~

## Building for Mobile

> Mobile builds are not supported. This section is outdated and left here for reference purposes only.
>
> Are you a kickass mobile developer? Maybe you can help us fix the build.

~~Change into the `mobile` directory.~~
~~Run `yarn build`/`yarn watch` to build assets. They are placed into the `www` directory.~~
~~For Android, change into the `android` directory and run `./gradlew assembleDebug`. The generated APK is placed into `app/build/outputs/apk`.~~
~~For iOS, change into the `ios` directory and open `F-Chat.xcodeproj` using XCode. From there, simply run the app using the play button.~~

## Building for Web

> Web builds are not supported. This section is outdated and left here for reference purposes only.
>
> Are you a kickass web developer? Maybe you can help us fix the build.

~~Change into the `webchat` directory.~~
~~Run `yarn build`/`yarn watch` to build assets. They are placed into the `dist` directory.~~
~~The compiled main.js file can be included by an HTML file that is expected to provide a global `const chatSettings: {account: string, theme: string, characters: ReadonlyArray<string>, defaultCharacter: string | null};`. It should also normalize the page to 100% height.~~

## Building a custom theme

See [the wiki](https://wiki.f-list.net/F-Chat_3.0/Themes) for instructions on how to create a custom theme.

- Change into the `scss` directory.
- Run `yarn install`.
- Run `yarn build themes/chat/{name}.scss`.
- Your theme file will be placed into the `scss/css` directory.

## Dependencies

Note: Adding _and upgrading_ dependencies should only be done with prior consideration and subsequent testing.

That's why `yarn.lock` exists and is version controlled.

To upgrade NPM dependencies, run `yarn upgrade` locally. Run `yarn outdated` to see pending upgrades.

If you encounter error 'Could not detect abi for version X.X.X and runtime electron', try running
`npx uuaw node-abi`

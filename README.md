# Table of Contents <!-- omit in toc -->

- [Download](#download)
- [F-Chat Horizon](#f-chat-horizon)
  - [Features](#features)
  - [Goals](#goals)
- [Installing](#installing)
  - [Windows](#windows)
  - [MacOS](#macos)
  - [Linux](#linux)
- [Usage](#usage)
  - [Getting started](#getting-started)
  - [Wiki](#wiki)
  - [FAQ:](#faq)
- [Development](#development)
- [Credits](#credits)

# Download

[Windows x64](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat-Rising-win-x64.exe) |
[Windows arm64](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat-Rising-win-arm64.exe) |
[MacOS M1](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat-Rising-macos-m1.dmg) |
[MacOS Intel](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat-Rising-macos-intel.dmg) |
[Linux x64](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat-Rising-linux-x64.AppImage) |
[Linux arm64](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat-Rising-linux-arm64.AppImage)

# F-Chat Horizon

This repository contains a continuation of the heavily customized F-Chat Rising, a version of the mainline F-Chat 3.0 client.

## Features

In a non-exhaustive list, F-Chat Horizon has these features!

- **Profile matching** automatically compares your profile with others to determine with whom you are compatible.
- **Automatic ad posting** repeatedly posts and rotates ads on selected channels.
- **Link previews** popup shows a preview of an image / video when you hover your mouse over a link.
- **Caching** speeds up profile loads and other actions.
- **Smart filters** let you choose what kind of ads and posts you see in the chat.

## Goals

F-Chat Horizon aims to be an opinionated fork of F-Chat Rising. Instead of aiming solely to be a more customized fork of the original client, we aim to:

- Set a sound foundation for further forks, with different goals.
- Enforce code-quality standards
- Aim to be progressive in functionality.
  - Additional functionality should be optional.
- Maintain the _core_ functionality from **Rising**.

While more features will be added, we aim to not deviate _too_ heavily from the original client as to avoid feature-creep.

# Installing

F-chat Horizon can be installed on all _major_ operating systems (Minus BSDs.)

## Windows

1. Download the installer for your architecture:
   - [Windows x64](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat-Rising-win-x64.exe)
   - [Windows arm64](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat-Rising-win-arm64.exe)
2. Run the downloaded installer and follow the on-screen instructions.

(Maybe one day we'll support winget~)

## MacOS

1. Download the installer for your architecture:
   - [MacOS M1](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat-Rising-macos-m1.dmg)
   - [MacOS Intel](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat-Rising-macos-intel.dmg)
2. Open the downloaded .dmg file and drag the application to your Applications folder.

## Linux

1. Download the AppImage for your architecture:
   - [Linux x64](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat-Rising-linux-x64.AppImage)
   - [Linux arm64](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat-Rising-linux-arm64.AppImage)
2. Make the AppImage executable:
   ```bash
   chmod +x F-Chat-Rising-linux-x64.AppImage
   ```
3. Run the AppImage:
   ```bash
   ./F-Chat-Rising-linux-x64.AppImage
   ```

# Usage

## Getting started

When you first load F-Chat Horizon, you'll notice its interface is closely similar to the original client. However, note the added menus:

1. **Ad Editor**: Located underneath your profile, entering the Ad editor will open an additional menu. Here you can edit the ads you want to post!
   - Assign a 'tag' to your ads. You can use the 'post ads' function to post ads of specific tag types into specified channels.
2. **Post Ads**: Located under the Ad Editor, clicking this button will open the ad posting dialog. You can select the tags and channels for your ads.
3. **Settings**: Horizon adds additional settings under the settings button.
   - _The Horizon tab_: Contains general settings for Horizon
   - _The Smart Filters tab_: Here you can configure the smart filters. **Be aware that this is a work in progress!**

## Moving over from F-Chat Rising
1. It is recommended to create a backup of your logs and such.
2. Deinstall F-Chat Rising, before installing F-Chat Horizon.
3. Your settings, channels, ads, logs, etc. can easily be moved over by copying or moving the related files:
   - For Windows users, the files containing this information are saved in `%appdata%\fchat\data` and can be moved or copied to `%appdata%\horizon-electron\data`.
4. That's it! You are set and can start using F-Chat Horizon.

## Wiki

The (currently work in progress and non-existing at this current moment) wiki has additional information on using Horizon

## FAQ:

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
1. 'Older characters' and 'younger characters' kink preferences are interpreted as age difference of 8+ years.
1. Comparison results will get faster over time, as more and more character data is cached.
1. If you have a species-fluid character (e.g. you play both your character as both a human and an anthro), you can indicate this by setting your **species** in your character profile in the following ways. F-List Rising will then score you against the best fitting type.
   - Human or tiger
   - Human, tiger, or dragon
   - Anthro (Horse or Tiger)
   - Dragon (Dwarf, Elf, or Human)
   - Elf (optionally vampire or dwarf)
   - Feline (optionally horse, tiger, or elf)

# Development

Please read [CONTRIBUTING.md](./CONTRIBUTING.md)

# Credits

- _CodingWithAnxiety_, Project Maintainer
- _kawinski_, Assigned Project Nerd (Aka, helps with project direction.)

# Table of Contents <!-- omit in toc -->

- [Download](#download)
- [F-Chat Horizon](#f-chat-horizon)
  - [Features](#features)
  - [Goals](#goals)
- [Installing](#installing)
  - [Windows](#windows)
  - [MacOS](#macos)
  - [Linux](#linux)
    - [Debian/Ubuntu (deb)](#debianubuntu-deb)
    - [AppImage](#appimage)
    - [Tarball (tar.gz)](#tarball-targz)
    - [Arch-based (pacman)](#arch-based-pacman)
- [Usage](#usage)
  - [Getting started](#getting-started)
  - [Wiki](#wiki)
  - [FAQ:](#faq)
- [Development](#development)
- [Credits](#credits)

# Download

[Windows x64](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-win-x64.exe) |
[Windows arm64](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-win-arm64.exe) |
[MacOS (Universal)](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-mac-universal.dmg) |
[Linux x64](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-linux-x64.AppImage) |
[Linux arm64](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-linux-arm64.AppImage)

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

F-chat Rising can be installed on all _major_ operating systems (Minus BSDs.)

## Windows

> [!NOTE]
> I, the developer of this project, do not use windows, _and thus cannot test these._ While I have no reason to believe they won't work, please [contact me](https://horizn.moe/contact.html) with any bugs.

1. Download the installer for your architecture:
   - [Windows x64](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-win-x64.exe)
   - [Windows arm64](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-win-arm64.exe)
2. Run the downloaded installer and follow the on-screen instructions.

(Maybe one day we'll support winget~)

## MacOS

> [!WARNING]
> Due to that nature of Mac, MacOS builds are **experimental**. Please [contact me](https://horizn.moe/contact.html) if you have any issues.

1. Download the installer. This _should_ work for M1 / Intel based systems
   - [MacOS (Universal)](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-mac-universal.dmg)
2. Open the downloaded .dmg file and drag the application to your Applications folder.

## Linux

Select the correct package for your distribution and architecture:

### Debian/Ubuntu (deb)

1. Download the `.deb` file for your architecture.
   - [Linux x64 .deb](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-linux-x64.deb)
   - [Linux arm64 .deb](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-linux-arm64.deb)
2. Install:
   ```bash
   sudo dpkg -i F-Chat.Horizon-linux-<arch>.deb
   ```

### AppImage

1. Download the AppImage for your architecture:
   - [Linux x64 .AppImage](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-linux-x64.AppImage)
   - [Linux arm64 .AppImage](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-linux-arm64.AppImage)
2. Make it executable, then run:
   ```bash
   chmod +x F-Chat.Horizon-linux-<arch>.AppImage
   ./F-Chat.Horizon-linux-<arch>.AppImage
   ```

### Tarball (tar.gz)

1. Download the `.tar.gz` for your architecture:
   - [Linux x64 .tar.gz](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-linux-x64.tar.gz)
   - [Linux arm64 .tar.gz](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-linux-arm64.tar.gz)
2. Extract and run:
   ```bash
   tar -xzf F-Chat.Horizon-linux-<arch>.tar.gz
   cd F-Chat.Horizon-linux-<arch>
   ./F-Chat.Horizon
   ```

### Arch-based (pacman)

> [!NOTE]
> There is currently no offical support for arch.
> You will have you build the .pacman file yourself. `cd electron` and run `pnpm build:linux:arch`
>
> You need to have pacman available on your system to build the arch builds. Duh.

1. Download the `.pacman` file for your architecture.
   - [Linux x64 .pacman](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-linux-x64.pacman)
   - [Linux arm64 .pacman](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-linux-arm64.pacman)
2. Install:
   ```bash
   sudo pacman -U F-Chat.Horizon-linux-<arch>.pacman
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
- _FatCatClient_, (Temporary) co-owner.

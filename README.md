# Table of Contents <!-- omit in toc -->

- [Download](#download)
- [Horizon](#horizon)
  - [Features](#features)
  - [Goals](#goals)
- [Installing](#installing)
  - [Windows](#windows)
  - [MacOS](#macos)
  - [Linux](#linux)
    - [Supported distros](#supported-distros)
    - [Additional installation instructions](#additional-installation-instructions)
      - [Debian/Ubuntu (deb)](#debianubuntu-deb)
      - [Fedora/RPM-based (rpm)](#fedorarpm-based-rpm)
      - [AppImage](#appimage)
      - [Tarball (tar.gz)](#tarball-targz)
      - [Arch-based (AUR)](#arch-based-aur)
  - [From source](#from-source)
- [Usage](#usage)
  - [Getting started](#getting-started)
  - [Wiki](#wiki)
  - [FAQ:](#faq)
- [Development](#development)
- [Credits](#credits)
  - [Code](#code)
  - [Translation](#translation)

# Download

[![Windows x64](https://img.shields.io/badge/Windows%20x64-%230079d5.svg?style=for-the-badge&logo=Windows%2011&logoColor=white)](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-win-x64.exe)
[![Windows ARM64](https://img.shields.io/badge/Windows%20arm64-%230079d5.svg?style=for-the-badge&logo=Windows%2011&logoColor=white)](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-win-arm64.exe)
[![MacOS (Universal)](https://img.shields.io/badge/macOS%20Universal-000000?style=for-the-badge&logo=macos&logoColor=F0F0F0)](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-mac-universal.dmg)
[![Linux x64](https://img.shields.io/badge/Linux%20x64-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-linux-x86_64.AppImage)
[![Linux arm64](https://img.shields.io/badge/Linux%20arm64-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-linux-arm64.AppImage)

Also check out [Frolic Chat](https://github.com/Frolic-chat/Frolic)! It's another F-Chat Rising fork, and we're big fans on it ourselves.

# Horizon

This repository contains a continuation of the heavily customized F-Chat Rising, a version of the mainline F-Chat 3.0 client.

## Features

In a non-exhaustive list, Horizon has these features!

- **Profile matching** automatically compares your profile with others to determine with whom you are compatible.
- **Automatic ad posting** repeatedly posts and rotates ads on selected channels.
- **Link previews** popup shows a preview of an image / video when you hover your mouse over a link.
- **Caching** speeds up profile loads and other actions.
- **Smart filters** let you choose what kind of ads and posts you see in the chat.

## Goals

Horizon aims to be an opinionated fork of F-Chat Rising. Instead of aiming solely to be a more customized fork of the original client, we aim to:

- **Maintain Cross-Platform Compatibility**  
  Ensure full functionality across Linux, Windows, and macOS without bias toward any specific platform.

- **Show Function Over Form**  
  Prioritize features, usability, and reliability over appearance. Adopt modern feature sets and evolving standards.

- **Be Community-Driven**  
  Foster an open, collaborative development environment guided by the community. See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

- **Have Safe and High-Quality Code**  
  Enforce strict code quality standards, specifically in readability, maintainability, and safety.

- **Be Simple by Default, Powerful When Needed**  
  All additional features should be optional, and when possible, disabled by default.

- **Have a Fork-Friendly Foundation**  
  Establish a solid base that can be easily adapted for future forks with different objectives.

- **Retain Core Features**  
  Maintain _all core_ functionality from the original _Rising_ project.

It should be known that this project aligns closely with the ideaology of [KDE](https://manifesto.kde.org)

# Installing

Horizon can be installed on all _major_ operating systems (Minus BSDs.)

## Windows

1. Download the installer for your architecture:
   - [Windows x64](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-win-x64.exe)
   - [Windows arm64](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-win-arm64.exe)
2. Run the downloaded installer and follow the on-screen instructions.

(Maybe one day we'll support winget~)

## MacOS

> [!WARNING]
> Due to that nature of Mac, MacOS builds are **experimental**. Please [contact me](https://horizn.moe/contact.html) if you have any issues.

Since we currently don't have a paid developer license (and MacOS by default blocks unsigned apps downloaded from the internet), you may need to manually allow the app in your command line or System Settings.

1. Download the installer. There are both versions specific to Intel (pre-2020) and Apple Sillicon Macs, and a 'Universal' one that works on both.
   - [MacOS (Apple Sillicon)](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-mac-arm64.dmg)
   - [MacOS (Intel)](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-mac-arm64.dmg)
   - [MacOS (Universal)](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-mac-universal.dmg)

2. Open the downloaded .dmg file and drag the application to your Applications folder.
   If you get a warning saying `"Horizon" is damaged and can't be opened. You should move it to the Bin.` while attempting to open Horizon, continue past step 2:

3. Open the Applications folder in your finder, and hold the Ctrl key while clicking the Horizon icon, and select "Open".
4. The warning should appear like normal, but if you then go to System Settings > Privacy and Security, Horizon should appear as a blocked app. Clicking "Open Anyway" should add it to the whitelist and let you use it as normal.

![MacOS Ctrl-Open](https://raw.githubusercontent.com/Fchat-Horizon/Horizon/refs/heads/main/docs/images/macos-whitelist-ctrl-open.png)
![MacOS System Settings Whitelist](https://raw.githubusercontent.com/Fchat-Horizon/Horizon/refs/heads/main/docs/images/macos-whitelist-settings.png)

Or if you're more of a Terminal hero:

3. Open your Terminal app
4. Type the following command and press Enter:

```bash
xattr -d com.apple.quarantine /Applications/Horizon.app
```

5. Now the app should open as expected.

This is unfortunately unresolvable unless we either get a paid developer license from Apple, or if users disable the Gatekeeper whitelist from their system altogether– which we do **not** recommend you do.

## Linux

Horizon has excellent Linux support. Read more at [horizon-packages](https://github.com/Fchat-Horizon/horizon-packages).

### Supported distros

| Distro                                                                                                                                                                                                                    | Info                                                                                                                                     | Maintainer(s)                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| ![Gentoo](https://img.shields.io/badge/Gentoo-54487A?style=for-the-badge&logo=gentoo&logoColor=white)                                                                                                                     | [link](https://github.com/Fchat-Horizon/gentoo/tree/0dbb49c0a2010d9a1813b5495fb78e1178494b14)                                            | @CodingWithAnxiety                             |
| ![Arch](https://img.shields.io/badge/Arch%20Linux-1793D1?logo=arch-linux&logoColor=fff&style=for-the-badge) <br> ![Manjaro](https://img.shields.io/badge/Manjaro-35BF5C?style=for-the-badge&logo=Manjaro&logoColor=white) | [![AUR package](https://repology.org/badge/version-for-repo/aur/fchat-horizon.svg)](https://repology.org/project/fchat-horizon/versions) | astrayblackcat, KenwoodFox, @CodingWithAnxiety |
| ![Debian](https://img.shields.io/badge/Debian-D70A53?style=for-the-badge&logo=debian&logoColor=white) <br> ![Ubuntu](https://img.shields.io/badge/Ubuntu-E95420?style=for-the-badge&logo=ubuntu&logoColor=white)          | [Available under releases](https://github.com/Fchat-Horizon/Horizon/releases/latest)                                                     | The Horizon Developers                         |
| ![Fedora](https://img.shields.io/badge/Fedora-294172?style=for-the-badge&logo=fedora&logoColor=white) <br> ![openSUSE](https://img.shields.io/badge/openSUSE-%2364B345?style=for-the-badge&logo=openSUSE&logoColor=white) | [Available under releases](https://github.com/Fchat-Horizon/Horizon/releases/latest)                                                     | The Horizon Developers                         |
| ![Alpine](https://img.shields.io/badge/Alpine%20Linux-1793D1?logo=alpine-linux&logoColor=fff&style=for-the-badge) | [link](https://codeberg.org/akatsukilevi/fchat-horizon) | @akatsukilevi |

### Additional installation instructions

#### Debian/Ubuntu (deb)

1. Download the `.deb` file for your architecture.
   - [Linux x64 .deb](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-linux-amd64.deb)
   - [Linux arm64 .deb](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-linux-arm64.deb)
2. Install:
   ```bash
   sudo dpkg -i F-Chat.Horizon-linux-<arch>.deb
   ```

#### Fedora/RPM-based (rpm)

1. Download the `.rpm` file for your architecture:
   - [Linux x64 .rpm](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-linux-x86_64.rpm)
   - [Linux arm64 .rpm](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-linux-arm64.rpm)
2. Install using your package manager:
   - **Fedora/RHEL/CentOS:**
     ```bash
     sudo dnf install F-Chat.Horizon-linux-<arch>.rpm
     ```
   - **openSUSE:**
     ```bash
     sudo zypper install F-Chat.Horizon-linux-<arch>.rpm
     ```
   - **Generic RPM:**
     ```bash
     sudo rpm -i F-Chat.Horizon-linux-<arch>.rpm
     ```

#### AppImage

1. Download the AppImage for your architecture:
   - [Linux x64 .AppImage](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-linux-x86_64.AppImage)
   - [Linux arm64 .AppImage](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-linux-arm64.AppImage)
2. Make it executable, then run:
   ```bash
   chmod +x F-Chat.Horizon-linux-<arch>.AppImage
   ./F-Chat.Horizon-linux-<arch>.AppImage
   ```

#### Tarball (tar.gz)

1. Download the `.tar.gz` for your architecture:
   - [Linux x64 .tar.gz](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-linux-x64.tar.gz)
   - [Linux arm64 .tar.gz](https://github.com/Fchat-Horizon/Horizon/releases/latest/download/F-Chat.Horizon-linux-arm64.tar.gz)
2. Extract and run:
   ```bash
   tar -xzf F-Chat.Horizon-linux-<arch>.tar.gz
   cd F-Chat.Horizon-linux-<arch>
   ./F-Chat.Horizon
   ```

#### Arch-based (AUR)

> [!NOTE]
> The AUR package currently doesn't support ARM.

- With an AUR helper:
  ```bash
  yay|paru|etc -S fchat-horizon-bin
  ```
- Manually:
  ```bash
  git clone https://aur.archlinux.org/fchat-horizon-bin.git
  cd fchat-horizon-bin
  makepkg -si
  ```

## From Source

If you want to compile and install Horizon from the source code yourself, please see the build and packaging instructions in the [contributing document](./CONTRIBUTING.md).

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

[The wiki](https://horizn.moe/docs/), while still a work in progress, has additional information on using Horizon

## FAQ:

> [!INFO]
> Our FAQ section, for both the Readme and the website, is in the process of being fully rewritten.

# Development

Please read [CONTRIBUTING.md](./CONTRIBUTING.md)

# Credits

## Code

Our codebase has received contributions from the following people:

<a href="https://github.com/Fchat-Horizon/Horizon/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Fchat-Horizon/Horizon" />
</a>

## Translation

<!--Sort contributors alphabetically if you add more, please 🐟.-->

- **French**: Azthenor, Fragile, Xav
- **German**: Froggy, Peel
- **Hungarian**: Firespark
- **Italian**: Clovermoth
- **Spanish**: A Day with a Carrot, Dess, DannyIW
- **UWUnglish** (we're so sorry): @CodingWithAnxiety, @FatCatClient

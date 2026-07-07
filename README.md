<div align="center">

<img src="./electron/build/icon.png" alt="F-Chat Horizon logo" width="120" />

# F-Chat Horizon

A community-driven continuation of F-Chat Rising: profile matching, smarter ads, powerful filters, and a whole lot of polish.

[![Latest release](https://img.shields.io/github/v/release/Fchat-Horizon/Horizon?style=flat-square&label=release)](https://github.com/Fchat-Horizon/Horizon/releases/latest)
[![Downloads](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2FFchat-Horizon%2Fstats%2Fmain%2Fbadges%2Fdownloads.json&style=flat-square)](https://github.com/Fchat-Horizon/Horizon/releases)
[![Nightly build](https://img.shields.io/github/actions/workflow/status/Fchat-Horizon/Horizon/nightly.yml?branch=development&style=flat-square&label=nightly)](https://github.com/Fchat-Horizon/Horizon/actions/workflows/nightly.yml)
[![Locale check](https://img.shields.io/github/actions/workflow/status/Fchat-Horizon/Horizon/i18n_check.yml?branch=development&style=flat-square&label=locales)](https://github.com/Fchat-Horizon/Horizon/actions/workflows/i18n_check.yml)
[![Translation status](https://img.shields.io/weblate/progress/horizon?server=https%3A%2F%2Ftranslate.horizn.moe&style=flat-square&label=translated)](https://translate.horizn.moe/engage/horizon/)

[Download](#download) | [Website](https://horizn.moe/) | [Docs](https://horizn.moe/docs/) | [Discord](https://discord.gg/JYuxqNVNtP)

</div>

# Table of Contents <!-- omit in toc -->

- [F-Chat Horizon](#f-chat-horizon)
- [Download](#download)
- [Horizon](#horizon)
  - [Features](#features)
    - [Find your people](#find-your-people)
    - [Advertise smarter](#advertise-smarter)
    - [See only what you want](#see-only-what-you-want)
    - [Make it yours](#make-it-yours)
    - [And the little things](#and-the-little-things)
  - [Goals](#goals)
- [Installing](#installing)
  - [Windows](#windows)
  - [MacOS](#macos)
  - [Linux](#linux)
    - [Supported distros](#supported-distros)
    - [Additional installation instructions](#additional-installation-instructions)
      - [Debian/Ubuntu (deb)](#debianubuntu-deb)
      - [Fedora/RPM-based (rpm)](#fedorarpm-based-rpm)
      - [NixOS](#nixos)
      - [AppImage](#appimage)
      - [Tarball (tar.gz)](#tarball-targz)
      - [Arch-based (AUR)](#arch-based-aur)
  - [From Source](#from-source)
- [Getting started](#getting-started)
- [Getting help](#getting-help)
- [Development](#development)
- [Credits](#credits)

# Download

[![Windows x64](https://img.shields.io/badge/Windows%20x64-%230079d5.svg?style=for-the-badge&logo=Windows%2011&logoColor=white)](https://github.com/Fchat-Horizon/Horizon/releases/latest)
[![Windows ARM64](https://img.shields.io/badge/Windows%20arm64-%230079d5.svg?style=for-the-badge&logo=Windows%2011&logoColor=white)](https://github.com/Fchat-Horizon/Horizon/releases/latest)
[![MacOS (Universal)](https://img.shields.io/badge/macOS%20Universal-000000?style=for-the-badge&logo=macos&logoColor=F0F0F0)](https://github.com/Fchat-Horizon/Horizon/releases/latest)
[![Linux x64](https://img.shields.io/badge/Linux%20x64-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://github.com/Fchat-Horizon/Horizon/releases/latest)
[![Linux arm64](https://img.shields.io/badge/Linux%20arm64-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://github.com/Fchat-Horizon/Horizon/releases/latest)

Also check out [Frolic Chat](https://github.com/Frolic-chat/Frolic)! It's another F-Chat Rising fork, and we're big fans of it ourselves.

# Horizon

Horizon started life as a continuation of F-Chat Rising, itself a heavily customized take on the official F-Chat 3.0 client for [F-List](https://www.f-list.net/). When Rising went died, we picked it up and continuined building off of it with new features, a lively community, translations, modern tooling, and releases for Windows, macOS, and Linux.

Horizon updates itself, speaks nine languages, and the people who build it are the same people who use it.

## Features

A non-exhaustive tour of what Horizon adds on top of the **stock client**:

### Find your people

- **Profile matching.** Horizon compares every profile you open against your own character and scores your compatibility, so you can tell at a glance whether you've found a match or a mismatch.
- **Profile analyzer.** Shows you how the matcher reads _your_ profile and points out what might be hurting your scores.
- **Kink comparison.** Filter and sort another character's kinks against your own, right in the profile viewer.
- **Hover previews.** Hover a character name for an instant profile card. Hover a link for an image or video preview, with a built-in ad blocker so previews don't come with surprises.
- **Caching.** A profile loads from the network once; after that it opens straight from cache.

### Advertise smarter

- **Ad Center.** Write your ads once, tag them, and manage them all in one place.
- **Auto-posting.** Pick your channels and let Horizon rotate your ads for you. It handles the timers and respects the delays.
- **Fine-grained control.** Choose which ads go to which channels, and hide ads from characters you're not interested in.

### See only what you want

- **Smart filters.** Hide ads and posts by content category, so the chat fits your tastes.
- **Scoped filtering.** Each filter can apply to ads, search results, channel member lists, and messages, in any combination.
- **Filters that stick.** Gender and member-list filters can persist between sessions instead of resetting every login.

### Make it yours

- **Themes.** Over a dozen chat themes, from Dracula to Catppuccin Mocha to our own creations, plus light/dark sync with your OS and a colorblind mode.
- **Sound themes.** Multiple sound sets with in-menu previews and per-sound volume control.
- **Your chat, your colors.** Custom character name colors, gender icons next to names, high-quality portraits, and plenty more toggles in the settings.
- **Nine languages.** English, French, German, Hungarian, Italian, Japanese, Russian, Spanish, and Cyute Engwish. Volunteers translate Horizon on [Weblate](https://translate.horizn.moe/engage/horizon/), and you can join them.

### And the little things

- **A better eicon picker**, with favorites, recents, and search that keeps going past 300 results.
- **Grouped channel pins** to keep a busy channel list organized.
- **Message drafts** that survive switching conversations, and restarts too if you turn that on.
- **Dictionary lookup** for any word, straight from the chat.
- **Log export and backup**, settings included.
- **Automatic updates.** Download in the background, install in one click.
- **Tray icon and unread badges**, so you know what's waiting for you.

## Goals

Horizon is an opinionated fork. Beyond adding features, we aim to:

- **Stay cross-platform.**  
  First-class support for Linux, Windows, and macOS, with no favorite child.

- **Put function over form.**  
  Features, usability, and reliability come first. Adopt modern feature sets and evolving standards.

- **Be community-driven.**  
  Development happens in the open, guided by the people who use the client. See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

- **Keep the code safe and high-quality.**  
  Enforce strict standards for readability, maintainability, and safety.

- **Be simple by default, powerful when needed.**  
  Extra features are optional and, wherever possible, disabled by default.

- **Stay fork-friendly.**  
  Maintain a solid base that future forks can adapt for their own goals, the way we did.

- **Retain core features.**  
  Everything Rising could do, Horizon should do too.

If this list sounds familiar, we share the ideology of [KDE](https://manifesto.kde.org).

# Installing

Horizon can be installed on all _major_ operating systems (minus BSDs.)

## Windows

1. Download the installer for your architecture:
   - [Windows x64](https://github.com/Fchat-Horizon/Horizon/releases/latest)
   - [Windows arm64](https://github.com/Fchat-Horizon/Horizon/releases/latest)
2. Run the downloaded installer and follow the on-screen instructions.

(Maybe one day we'll support winget~)

## MacOS

1. Download the installer. There are both versions specific to Intel (pre-2020) and Apple Sillicon Macs, and a 'Universal' one that works on both.
   - [MacOS (Apple Sillicon)](https://github.com/Fchat-Horizon/Horizon/releases/latest)
   - [MacOS (Intel)](https://github.com/Fchat-Horizon/Horizon/releases/latest)
   - [MacOS (Universal)](https://github.com/Fchat-Horizon/Horizon/releases/latest)

2. Open the downloaded .dmg file and drag the app icon to your Applications folder.

## Linux

Horizon has excellent Linux support. Read more at [horizon-packages](https://github.com/Fchat-Horizon/horizon-packages).

### Supported distros

| Distro                                                                                                                                                                                                                    | Info                                                                                                                                     | Maintainer(s)                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| ![Gentoo](https://img.shields.io/badge/Gentoo-54487A?style=for-the-badge&logo=gentoo&logoColor=white)                                                                                                                     | [link](https://github.com/Fchat-Horizon/gentoo/tree/0dbb49c0a2010d9a1813b5495fb78e1178494b14)                                            | @CodingWithAnxiety                             |
| ![Arch](https://img.shields.io/badge/Arch%20Linux-1793D1?logo=arch-linux&logoColor=fff&style=for-the-badge) <br> ![Manjaro](https://img.shields.io/badge/Manjaro-35BF5C?style=for-the-badge&logo=Manjaro&logoColor=white) | [![AUR package](https://repology.org/badge/version-for-repo/aur/fchat-horizon.svg)](https://repology.org/project/fchat-horizon/versions) | astrayblackcat, KenwoodFox, @CodingWithAnxiety |
| ![Debian](https://img.shields.io/badge/Debian-D70A53?style=for-the-badge&logo=debian&logoColor=white) <br> ![Ubuntu](https://img.shields.io/badge/Ubuntu-E95420?style=for-the-badge&logo=ubuntu&logoColor=white)          | [Available under releases](https://github.com/Fchat-Horizon/Horizon/releases/latest)                                                     | The Horizon Developers                         |
| ![Fedora](https://img.shields.io/badge/Fedora-294172?style=for-the-badge&logo=fedora&logoColor=white) <br> ![openSUSE](https://img.shields.io/badge/openSUSE-%2364B345?style=for-the-badge&logo=openSUSE&logoColor=white) | [Available under releases](https://github.com/Fchat-Horizon/Horizon/releases/latest)                                                     | The Horizon Developers                         |
| ![Alpine](https://img.shields.io/badge/Alpine%20Linux-1793D1?logo=alpine-linux&logoColor=fff&style=for-the-badge)                                                                                                         | [link](https://codeberg.org/akatsukilevi/fchat-horizon)                                                                                  | @akatsukilevi                                  |
| ![NixOS](https://img.shields.io/badge/NixOS-1793D1?logo=nixos&logoColor=fff&style=for-the-badge)                                                                                                                          | [Flake Below](#nixos)                                                                                                                    | The Horizon Developers                         |

### Additional installation instructions

#### Debian/Ubuntu (deb)

1. Download the `.deb` file for your architecture from the [latest release](https://github.com/Fchat-Horizon/Horizon/releases/latest).
   Look for `F-Chat.Horizon-*-linux-amd64.deb` (x64) or `F-Chat.Horizon-*-linux-arm64.deb` (arm64).
2. Install (replace "`<version>`" and "`<arch>`" to match the downloaded filename):
   ```bash
   sudo dpkg -i F-Chat.Horizon-<version>-linux-<arch>.deb
   ```

#### Fedora/RPM-based (rpm)

1. Download the `.rpm` file for your architecture from the [latest release](https://github.com/Fchat-Horizon/Horizon/releases/latest).
   Look for `F-Chat.Horizon-*-linux-x86_64.rpm` (x64) or `F-Chat.Horizon-*-linux-aarch64.rpm` (arm64).
2. Install using your package manager (replace "`<version>`" and "`<arch>`" to match the downloaded filename):
   - **Fedora/RHEL/CentOS:**
     ```bash
     sudo dnf install F-Chat.Horizon-<version>-linux-<arch>.rpm
     ```
   - **openSUSE:**
     ```bash
     sudo zypper install F-Chat.Horizon-<version>-linux-<arch>.rpm
     ```
   - **Generic RPM:**
     ```bash
     sudo rpm -i F-Chat.Horizon-<version>-linux-<arch>.rpm
     ```

#### NixOS

Horizon is available as a Nix Flake input based on the GitHub repo. See [this](https://nix.dev/manual/nix/2.28/command-ref/new-cli/nix3-flake.html#flake-inputs) page for more information.

```nix
    horizon = {
      url = "github:Fchat-Horizon/Horizon?ref=main";
      inputs.nixpkgs.follows = "nixpkgs-unstable";
    };
```

You can then reference this input as a System Package or user-specific package:

```nix
      environment.systemPackages = [
        inputs.horizon.packages.\${pkgs.system}.horizon-electron
      ];
```

Our repository's default branch is `development`, which is not strictly guaranteed to build (nor is it expected to!)-- so note the `?ref=main` after the Git URL, which is what we use for _stable releases_. If you want to follow the beta update track, or use nightly builds, replace `main` with `beta` or `development` respectively in the `?ref=<source>` URL parameter for the Flake input.

#### AppImage

1. Download the AppImage for your architecture from the [latest release](https://github.com/Fchat-Horizon/Horizon/releases/latest).
   Look for `F-Chat.Horizon-*-linux-x86_64.AppImage` (x64) or `F-Chat.Horizon-*-linux-arm64.AppImage` (arm64).
2. Make it executable, then run (replace "`<version>`" and "`<arch>`" to match the downloaded filename):
   ```bash
   chmod +x F-Chat.Horizon-<version>-linux-<arch>.AppImage
   ./F-Chat.Horizon-<version>-linux-<arch>.AppImage
   ```

#### Tarball (tar.gz)

1. Download the `.tar.gz` for your architecture from the [latest release](https://github.com/Fchat-Horizon/Horizon/releases/latest).
   Look for `F-Chat.Horizon-*-linux-x64.tar.gz` (x64) or `F-Chat.Horizon-*-linux-arm64.tar.gz` (arm64).
2. Extract and run (replace "`<version>`" and "`<arch>`" to match the downloaded filename):
   ```bash
   tar -xzf F-Chat.Horizon-<version>-linux-<arch>.tar.gz
   cd F-Chat.Horizon-<version>-linux-<arch>
   ./horizon-electron
   ```

#### Arch-based (AUR)

> [!NOTE]
> The AUR package currently doesn't support ARM.

> [!NOTE]
> The AUR package is not directly maintained by the Horizon team. If you have any issues with it, please check if they can be reproduced in an official build first before reporting them.

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

# Getting started

If you're coming from F-Chat 3.0 or Rising, you know your way around: Horizon keeps the familiar interface and adds its own tools where you'd expect them.

- **Ad Center**, found beneath your character portrait, is where you write and manage your ads. Give each ad one or more tags, and you can post whole categories of ads at once.
- **Post Ads**, right below it, opens the posting dialog: pick the tags and channels, and the auto-poster takes it from there.
- **Settings** are split in two. Character settings stay where they've always been, next to your character, and hold a lot of the new toys, including the Smart Filters tab. App-wide settings get their own button in the top right, near the window controls.

For guides on everything else, from channel groups to backups, head to [the docs](https://horizn.moe/docs/).

# Getting help

- **[The docs](https://horizn.moe/docs/)** cover Horizon's features in depth, and we add pages as features land.
- **[Our Discord](https://discord.gg/JYuxqNVNtP)** is the fastest place to ask questions and hang out with other users.
- **[GitHub issues](https://github.com/Fchat-Horizon/Horizon/issues)** are the right place for bug reports and feature requests.

# Development

Everything you need to start hacking on Horizon lives in [CONTRIBUTING.md](./CONTRIBUTING.md). We welcome bug reports, translations, and pull requests.

# Credits

Horizon exists thanks to a lot of lovely people: code contributors, translators, and the original F-Chat 3.0 team. See [CONTRIBUTORS.md](./CONTRIBUTORS.md) for the full list.

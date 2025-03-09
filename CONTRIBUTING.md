# Contributing to Horizon

Before we begin, I'd like to thank you for taking interest in contributing! Horizon is a small-time side hobby, so any help is greatly appreciated.

That being said, _Horizon is an opinionated fork_, and as such we enforce strong code quality standards. You can read more about this on this page.

## Table of Contents <!-- omit in toc -->

- [Contributing to Horizon](#contributing-to-horizon)
  - [Where do I start?!](#where-do-i-start)
    - [Technology](#technology)
    - [Setting up your development enviroment](#setting-up-your-development-enviroment)
    - [Building](#building)
      - [Electron](#electron)
      - [Mobile](#mobile)
    - [Project layout](#project-layout)
      - [Branches](#branches)
      - [Tags](#tags)
  - [Style guidelines](#style-guidelines)

## Where do I start?!

You wish to add a new feature to Horizon, or fix that one bug that's been pissing you off for months? Then this guide'll give you the rundown.

### Technology

Horizon is written primarily in _Vue_, _Typescript_, and _Javascript._ You'll need **[Node.js](https://nodejs.org/en/download)**, **[PNPM](https://pnpm.io/installation)**, and **[NVM](https://github.com/nvm-sh/nvm)** (or a similar node version manager, such as fnm). You might also want to consider using VScode to integrate with prettier.

You should use Node.js **v22.13.0**.

### Setting up your development enviroment

In short, you can run the following commands:

```sh
git clone https://github.com/Fchat-Horizon/Horizon.git
cd Horizon
pnpm install
```

### Building

#### Electron

Run the following commands,

**For development:**


```
cd electron
pnpm build
pnpm start
```

**For distribution:**

> [!NOTE]
> While you can choose to build for OSes, it **will** fail if you attempt to build on a OS that's different from your own.
>
> Please read the [electron-builder](https://www.electron.build/multi-platform-build.html) wiki for more info. If you're a kickass electron dev, please make a pull request to fix this.

Read [the package.json](/electron/package.json), or you will be lost.

```
cd electron
pnpm build:osname
```

#### Mobile

Mobile builds are currently unsupported, but if you're up to the challange, _maybe you can fix it?_

Look at the `mobile` directory for more info. For `android`, we recommend you use android studio to make your life more pleasent.

I've completely deleted the `ios` directory, and have no intention to support ios at this time. However, for those interested, the `ios` directory was removed in [this commit](https://github.com/Fchat-Horizon/Horizon/commit/41261d1ba7043eb7dfd5a1a6331dc604ff338814), and you're more then welcome to restore it.

### Project layout

#### Branches

- **main**  
  This is the production-ready branch. All stable releases are tagged on this branch.

- **beta**
  The 'semi-stable' branch. Development is merged into beta when it is stable enough for a pre-release.

- **develop**  
  The main integration branch. New features and fixes are first merged into develop.

- **feature/\***  
  For new features, create a branch named `feature/your-feature-name` off of develop. Once finalized, open a PR to merge into develop.

- **hotfix/\***  
  For urgent fixes on production, create a branch named `hotfix/description` off of main, then merge back into both main and develop after the fix.

- **experimental/\*** (optional)  
  For experimental changes that may not be merged immediately, create branches with the prefix `experimental/`.

#### Tags

We follow a [semantic versioning](https://semver.org) format:

- **vX.Y.Z**  
  Represents a production-ready release. For example: `v1.0.0`
- **vX.Y.Z-DEV-X.Y**  
  Early, often unstable releases. Also known as _Canary_ in **Rising**. Doesn't leave the development branch/
- **vX.Y.Z-BETA-X.Y**  
  A pre-release version that's intended for testing before the final release.
- **vX.Y.Z-rc-X.Y**  
  A release candidate version. This indicates a near-final release version. No new features should be added to RCs.

## Style guidelines

We use [Prettier](https://prettier.io/) to enforce a consistent coding style. Please follow these guidelines:

1. **Formatting**  
   - Run `prettier --write .` (or use the lint-staged integration) before committing. This ensures all code is consistent with [.prettierrc](../.prettierrc).
   - Use 2 spaces for indentation.
   - Keep a maximum line length of 80 characters.
   - Declare strings with single quotes (') instead of double quotes (").

2. **Structure & Syntax**  
   - Always include semicolons.
   - Use trailing commas sparingly (only where allowed by Prettier).
   - For arrow functions with one parameter, avoid parentheses (e.g., `param => ...`).

3. **Vue Components**  
   - Ensure `<script>` and `<style>` in `.vue` files are properly indented.
   - Use the recommended Vue style guide for component names and ordering.

A important part of Horizon is a strict code quality standard. Prettier should do most of the work for you.
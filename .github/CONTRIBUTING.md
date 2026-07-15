# Contributing to Horizon

Before we begin, I'd like to thank you for taking interest in contributing! Horizon is a small-time side hobby, so any help is greatly appreciated.

That being said, _Horizon is an opinionated fork_, and as such we enforce strong code quality standards. You can read more about this on this page.

## Table of Contents <!-- omit in toc -->

- [Contributing to Horizon](#contributing-to-horizon)
  - [Contributor License Agreement](#contributor-license-agreement)
  - [Where do I start?!](#where-do-i-start)
    - [Technology](#technology)
    - [Setting up your development environment](#setting-up-your-development-environment)
      - [Nix](#nix)
    - [Building](#building)
      - [Electron](#electron)
      - [Mobile](#mobile)
    - [Workflow](#workflow)
      - [Issue tracking](#issue-tracking)
      - [Project Board](#project-board)
      - [Pull requests](#pull-requests)
      - [Pull Requests for maintainers](#pull-requests-for-maintainers)
      - [Branches](#branches)
      - [Tags](#tags)
  - [Style guidelines](#style-guidelines)
  - [Packaging and installing](#packaging-and-installing)

## Contributor License Agreement

By submitting a pull request or contributing to this project (including translations via Weblate), you agree to the terms of our [Contributor License Agreement](../docs/CLA.md).

In short: you keep ownership of your code, but you grant the project lead the right to license contributions under MPL-2.0 and to provide them to Dragonfruit under MIT.

## Where do I start?!

You wish to add a new feature to Horizon, or fix that one bug that's been pissing you off for months? Then this guide'll give you the rundown.

### Technology

Horizon is written primarily in _Vue_, _TypeScript_, and _JavaScript._ You'll need **[Node.js](https://nodejs.org/en/download)**, **[PNPM](https://pnpm.io/installation)**, and **[NVM](https://github.com/nvm-sh/nvm)** (or a similar node version manager, such as fnm). You might also want to consider using VS Code to integrate with Prettier.

You should use Node.js **v24.14.0** (see [.nvmrc](./.nvmrc)).

If you intend on _packaging_ for MacOS, you need to install **Xcode 26+** or the build will fail with an error when packing into the desired format. **This includes the Xcode CLI tools**.

### Setting up your development environment

In short, you can run the following commands:

```sh
git clone https://github.com/Fchat-Horizon/Horizon.git
cd Horizon
pnpm install
```

#### Nix

If you're using [Nix](https://nixos.org/), whether as a package manager or as part of NixOS, a flake has been provided so you don't need to install any Node.js dependencies yourself. Run the following command from the project root:

```bash
nix develop
```

Note that as of writing, the package `sass-embedded` is still required and doesn't directly work inside the Nix shell (because it's its own distributed binary). The Nix flake comes with its own patcher method that solves this, though you do need to run it every time you reinstall the PNPM packages:

```bash
pnpm install
patch_sass_embed
```

### Building

#### Electron

Run the following commands,

**For development:**

```
pnpm build
pnpm start
```

Tip: this repo uses a pnpm workspace, so you can target subprojects with filters:

```
pnpm --filter horizon-electron build
pnpm --filter horizon-electron start
```

**For distribution:**

> [!NOTE]
> While you can choose to build for other OSes, it **will** fail if you attempt to build for an OS that's different from your own.
>
> Please read the [electron-builder](https://www.electron.build/multi-platform-build.html) wiki for more info. If you're a kickass electron dev, please make a pull request to fix this.

Read [the electron README.md](../electron/README.md) for more info.

#### Mobile

Mobile development has moved to its own project: [Solstice](https://github.com/Fchat-Horizon/Solstice). The old mobile build files have been removed from this repository, so if you want to contribute to the mobile experience, head over there.

### Workflow

We try to keep a (mostly) structured workflow when working on Horizon releases. The information here isn't exactly relevant for if you want to fork Horizon or just build the project for yourself, but it might be useful for contributors so that they know what to expect when they make a pull request.

#### Issue tracking

Issues with the type "Bug" or "Task" are supposed to be sorted by level of priority, as tagged on the GitHub issue tracker. Though the levels are both self-explanatory, while also needing to be assigned loosely at the discretion of the team member triaging, we should aim to adhere to the following priorities:

- **Critical**  
  App crashes under _regular_ use\*, security issues, or similar problems. Likely requires a hotfix that might bypass the regular release flow and goes straight to the `main` branch. If an issue like this is found, it means we should likely drop whatever else we are working on until it's resolved. They should also be added to the appropriate milestone.
- **High**  
  App crashes under irregular circumstances\*, important features are broken or regressed hard. Should be resolved quickly, but does not require dropping anything else we might be working on. If (realistically) possible, these should be resolved before the next stable release. That also means they should be added to the appropriate milestone.

  Regressions found during (and originating _from_) a pre-release build are automatically given this priority as well, as are issues with the ["blocks release"](https://github.com/Fchat-Horizon/Horizon/issues?q=state%3Aopen%20label%3A%22blocks-release%22) tag.

- **Medium**  
  Issues with obscure features, or issues that can be worked around. Issues that originate from 3.0, F-Chat Rising, or significantly older versions of Horizon mostly fall under this umbrella, unless they're also critical. Use sound judgement here. Can be added to the current upcoming-release milestone, but depending on the existing workload or potential deadline, it might be best to throw it under a future patch-release milestone.

  Most styling issues probably fall underneath this category, unless they seriously impede regular use.

- **Low**  
  Minor annoyances and quirks, doubly so if they're older ones. They would be good to resolve, and if the issue itself can be done quickly then we don't need to hold back on them. Low priority issues should simply not get in the way of more important ones.

Bugs and styling issues that have not been triaged with a priority yet should be tagged with the ["Needs Triage"](https://github.com/Fchat-Horizon/Horizon/issues?q=state%3Aopen%20label%3A%22Needs%20Triage%22) tag, which should be added automatically to any new issues created. Issues with the 'Task' type aren't able to be created from the templates and have to be defined by project members, but their priorities have to be defined on a case-by-case basis regardless.

\* _"Regular" and "irregular" use aren't terms we can strictly define, so you have to rely on a bit of common sense to make those calls. Assume that a user action like searching for characters constitutes "regular use", but "I pasted 50,000 characters in the EIcon searcher, and now the app crashes" is considered 'irregular' use._

#### Project Board

We track our project's progress using [GitHub's project boards](https://github.com/orgs/Fchat-Horizon/projects/2/). The priorities given in the [Issue Tracking](#issue-tracking) header are set with the 'Priority' field from this project board, not the one for individual issues. We use the following state columns:

- **Backlog**  
  The default state. A priority has not been given yet.
- **Triage**  
  Issues that have been given a priority, or at least been looked at, but have not been slotted for a specific upcoming release yet.
- **Planned**  
  Slotted for a release, but work has not been started yet.
- **In progress**  
  Work has been started, but it's not yet ready for review or merging. If a pull request is made for an existing issue, it's automatically assigned this state.
- **Follow Up Before Release**  
  Work is hopefully finished, but maintainers need to look at the pull request still. If a pull request is set to close one or more issues, and then gets assigned this state, its issues will also be set to this.
- **Done**  
  Merged into development, will be in the upcoming release.

When a release is done, all of the items under that milestone that are set to 'Done' will be archived. If items are under that milestone that are not marked as 'Done', they are kept in their current column and moved to the next release.

Since the project board(s) group issues and pull request by milestones, all issues that are moved into a state further than 'Triage' should be assigned a release milestone.

#### Pull requests

We always appreciate contributions to our project, and even the fact that you're reading this section means you're cool for considering it.

Pull requests should be targeting our `development` branch, since that's where development happens obviously. When you make a branch for a pull request locally, consider using the scheme from our section on [branches](#branches). It's not a requirement, but it'll save you a headache trying to get your own default branch to sync up properly, and it makes it easier for us if we want to check out your remote branch locally.

#### Pull Requests for maintainers

Pull requests should be properly tested and code-reviewed before they're merged into the `development` branch. New pull requests should therefore be given the ["Needs testing"](https://github.com/Fchat-Horizon/Horizon/issues?q=state%3Aopen%20label%3A%22Needs%20testing%22) and ["Needs code review"](https://github.com/Fchat-Horizon/Horizon/issues?q=state%3Aopen%20label%3A%22Needs%20code%20review%22) tags.

If either of these two tags are still on the pull request, assume it's not yet ready to be merged!

Maintainers should be assigned to pull requests for two reasons:

- If a pull request is still marked as a work in progress, then this maintainer will (likely) be the one to finish it up to a finalized state.
- If a pull request is marked as being ready for review, then the assigned maintainer is meant to review and/or test the pull request. For big enough pull requests created by a maintainer instead of a contributor, the maintainer reviewing and testing it should ideally not be the creator.

If a pull request is meant to resolve an existing issue, then it should be given the same milestone as the issue (if applicable).

Maintainers should (ideally) not push too much code directly to the development branch and instead make distinct branches and pull requests, especially if that code would require significant refactors for any work-in-progress branches that may or may not exist. Contained bug fixes or small features are usually fine, and if discussed with other maintainers exceptions can always be made.

The rule of thumb here is that if it would seriously disrupt the work of other maintainers then it should either be pushed to its own branch, _**or**_ it can be discussed between maintainers.

When a pull request is slotted under a specific release milestone, please do not merge it into the development branch without discussing it with other maintainers first. Exceptions can be made for significantly huge bugs (though expect those not to be added to later releases anyway), but additions should be spread out accordingly to reduce the workload on testers. The more things they have to test, the less they'll be able to test.

Oh and mind the ["do not merge"](https://github.com/Fchat-Horizon/Horizon/pulls?q=is%3Apr+is%3Aopen+label%3A%22do+not+merge%22) tag. That usually means it needs extra attention before it's ready.

#### Branches

- **main**  
  This is the production-ready branch. All stable releases are tagged on this branch.

- **beta**
  The 'semi-stable' branch. Development is merged into beta when it is stable enough for a pre-release.

- **development**  
  The main integration branch. New features and fixes are first merged into development.

- **feature/\***  
  For new features, create a branch named `feature/your-feature-name` off of development. Once finalized, open a PR to merge into development.

- **fix/\***  
  Bug fixes, but not critical hotfix ones like the ones below. Use the format `fix/fix-description`.

- **hotfix/\***  
  For urgent fixes on production, create a branch named `hotfix/description` off of main, then merge back into both main and development after the fix.

- **experimental/\*** (optional)  
  For experimental changes that may not be merged immediately, create branches with the prefix `experimental/`.

#### Tags

We follow a [semantic versioning](https://semver.org) format. Please read our [versioning document](../docs/VERSIONING.md) for more information, including the way we plan releases.

## Style guidelines

We use [Prettier](https://prettier.io/) to enforce a consistent coding style. Please follow these guidelines:

1. **Formatting**
   - Run `prettier --write .` (or use the lint-staged integration) before committing. This ensures all code is consistent with [.prettierrc](./.prettierrc).
   - Use 2 spaces for indentation.
   - Keep a maximum line length of 80 characters.
   - Declare strings with single quotes (') instead of double quotes (").

2. **Structure & Syntax**
   - Always include semicolons.
   - Use trailing commas sparingly (only where allowed by Prettier).
   - For arrow functions with one parameter, avoid parentheses (e.g., `param => ...`).

3. **Vue Components**
   - Ensure `<script>` and `<style>` in `.vue` files are properly indented.
   - Follow the [Vue style guide](https://v2.vuejs.org/v2/style-guide) to the best of your ability.

An important part of Horizon is a strict code quality standard. Prettier should do most of the work for you.

When writing user-facing text strings, please make sure to **always** use the [localization system](./docs/localize.md).

## Packaging and installing

> [!NOTE]
> This section assumes you have already set up the build tools and dependencies from earlier in this document.

1. Install PNPM packages:

```bash
pnpm install
```

2. (Optional) Make any changes you need to the code and test.

3. Build a production build of the Electron app:

```bash
pnpm build:dist
```

Note that this does not build a distributable or installable release yet, this just leaves the transpiled scripts and compiled binaries in the build output directories. You'll still need the next step if you want to distribute or install it properly.

4. Run the build/package script:

```bash
node electron/build/build.mjs --os <linux|windows|macos> <options>
```

The options for the build script are quite varied, and thus won't be elaborated on here. You can select the kind of package, system architecture, etc. For more details, run the script with the help flag:

```bash
node electron/build/build.mjs -h
```

See also the [README](../electron/README.md) file for the Electron sub-project.

#!/bin/bash -e

# Usage: ./macos.sh RELEASE_VERSION [RELEASE_PATH]
# ** RELEASE_VERSION: The version string for the release.
#    RELEASE_PATH (optional): The directory where release artifacts will be stored.
#       ^ The github action will automatically set the release path— Do not fret!

# * Parse arguments
RELEASE_VERSION="$1"
RELEASE_PATH="${2:-$(pwd)/release_artifacts/macos/$RELEASE_VERSION}"

if [ -z "$RELEASE_VERSION" ]; then
  echo "Usage: $0 RELEASE_VERSION [RELEASE_PATH]"
  exit 1
fi

# & Sets our paths
REPO_ROOT="$(git rev-parse --show-toplevel)"
DIST_PATH="$REPO_ROOT/electron/dist"

# & Ensure we're at the root of the repo
cd "$REPO_ROOT"

# This is handled by our CI.
# // # & Ensure we're on the 'main' branch and up-to-date
# // git checkout main
# // git pull

# & Install dependencies
pnpm install

# & Clean previous builds
rm -rf "$DIST_PATH"

# & Build the project
cd electron
rm -rf app dist
pnpm install
node ../webpack production
node build.mjs --os macos --format dmg --arch universal

# & Prepare release directory
mkdir -p "$RELEASE_PATH"

# & Copy artifacts
cp "$DIST_PATH"/*.dmg "$RELEASE_PATH"/ 2>/dev/null || true

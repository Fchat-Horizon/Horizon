#!/bin/bash -e

# & Usage: ./linux.sh RELEASE_VERSION [RELEASE_PATH]
# ** RELEASE_VERSION: The version string for the release.
#    RELEASE_PATH (optional): The directory where release artifacts will be stored.
#       ^ The github action will automatically set the release path— Do not fret!

# * Parse arguments
RELEASE_VERSION="$1"
RELEASE_PATH="${2:-$(pwd)/release_artifacts/linux/$RELEASE_VERSION}"

if [ -z "$RELEASE_VERSION" ]; then
  echo "Usage: $0 RELEASE_VERSION [RELEASE_PATH]"
  exit 1
fi

# & Sets our paths
REPO_ROOT="$(git rev-parse --show-toplevel)"
DIST_PATH="$REPO_ROOT/electron/dist/downloaded"

# & Ensure we're at the root of the repo
cd "$REPO_ROOT"

# & Ensure we're on the 'main' branch and up-to-date
git checkout main
git pull

# & Install dependencies
yarn install

# & Clean previous builds
rm -rf "$DIST_PATH"

# & Build the project
cd electron
rm -rf app dist
yarn build:dist
node pack.js

# & Prepare release directory
mkdir -p "$RELEASE_PATH"

# & Copy artifacts for release
cp "$DIST_PATH/fchat.arm64.AppImage" "$RELEASE_PATH/F-Chat-Rising-linux-arm64.AppImage"
cp "$DIST_PATH/fchat.arm64.AppImage.zsync" "$RELEASE_PATH/F-Chat-Rising-linux-arm64.AppImage.zsync"
cp "$DIST_PATH/fchat.x64.AppImage" "$RELEASE_PATH/F-Chat-Rising-linux-x64.AppImage"
cp "$DIST_PATH/fchat.x64.AppImage.zsync" "$RELEASE_PATH/F-Chat-Rising-linux-x64.AppImage.zsync"

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
DIST_PATH="$REPO_ROOT/electron/dist/"

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
node build/build.mjs --os linux --format deb tar.gz AppImage rpm --arch x64 arm64

# & Prepare release directory
mkdir -p "$RELEASE_PATH"

# & Copy artifacts for release
cp "$DIST_PATH"/*.tar.gz "$RELEASE_PATH"/ 2>/dev/null || true
cp "$DIST_PATH"/*.deb "$RELEASE_PATH"/ 2>/dev/null || true
cp "$DIST_PATH"/*.rpm "$RELEASE_PATH"/ 2>/dev/null || true
cp "$DIST_PATH"/*.AppImage "$RELEASE_PATH"/ 2>/dev/null || true
#!/bin/bash -e

# & Usage: ./linux-dev.sh RELEASE_VERSION [RELEASE_PATH] [ARCH]
# ** RELEASE_VERSION: The version string for the release.
#    RELEASE_PATH (optional): The directory where release artifacts will be stored.
#    ARCH (optional): Target architecture (default: runner native)

# * Parse arguments
RELEASE_VERSION="$1"
RELEASE_PATH="${2:-$(pwd)/release_artifacts/linux/$RELEASE_VERSION}"
ARCH="$3"

if [ -z "$RELEASE_VERSION" ]; then
  echo "Usage: $0 RELEASE_VERSION [RELEASE_PATH]"
  exit 1
fi

# & Sets our paths
REPO_ROOT="$(git rev-parse --show-toplevel)"
DIST_PATH="$REPO_ROOT/electron/dist/"

# & Ensure we're at the root of the repo
cd "$REPO_ROOT"

# & Install dependencies
pnpm install --frozen-lockfile

# & Clean previous builds
rm -rf "$DIST_PATH"

# & Build the project
cd electron
rm -rf app dist
mkdir -p "$DIST_PATH"
if [ -n "$ARCH" ]; then
  pnpm run webpack:dev
  node build/build.mjs --os linux --format AppImage --arch "$ARCH"
else
  pnpm build:dev:linux
fi

# & Prepare release directory
mkdir -p "$RELEASE_PATH"

# & Copy artifacts for release
cp "$DIST_PATH"/*.AppImage "$RELEASE_PATH"/ 2>/dev/null || true

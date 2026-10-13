#!/bin/bash -e

# & Usage: ./linux-portable.sh DIST_PATH RELEASE_PATH
# ** Bundles each AppImage with a horizon-data folder as a portable tar.gz.
#    ^ Not the unpacked app: the AppImage launcher handles the Chromium sandbox
#      on distros that restrict user namespaces.

DIST_PATH="$1"
RELEASE_PATH="$2"

if [ -z "$DIST_PATH" ] || [ -z "$RELEASE_PATH" ]; then
  echo "Usage: $0 DIST_PATH RELEASE_PATH"
  exit 1
fi

ELECTRON_PATH="$(cd "$(dirname "$0")/.." && pwd)"
STAGE_PATH="$(mktemp -d)"
trap 'rm -rf "$STAGE_PATH"' EXIT

mkdir -p "$RELEASE_PATH"
shopt -s nullglob

for APPIMAGE in "$DIST_PATH"/*.AppImage; do
  BUNDLE_PATH="$STAGE_PATH/Horizon"
  rm -rf "$BUNDLE_PATH"
  mkdir -p "$BUNDLE_PATH/horizon-data"
  cp "$APPIMAGE" "$BUNDLE_PATH/"
  cp "$ELECTRON_PATH/build/portable-readme.txt" "$BUNDLE_PATH/horizon-data/README.txt"
  tar -czf "$RELEASE_PATH/$(basename "$APPIMAGE" .AppImage)-portable.tar.gz" -C "$STAGE_PATH" Horizon
done

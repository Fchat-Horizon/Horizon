#!/bin/bash
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "Usage: with-macos-notarization.sh COMMAND [ARGS...]" >&2
  exit 1
fi

for secret_name in APPLE_API_KEY_P8 APPLE_API_KEY_ID APPLE_API_ISSUER; do
  if [ -z "${!secret_name:-}" ]; then
    echo "::error::Missing GitHub Actions secret: $secret_name" >&2
    exit 1
  fi
done

notarization_key_dir=$(mktemp -d "${RUNNER_TEMP:?}/horizon-notarization.XXXXXX")
trap 'rm -rf "$notarization_key_dir"' EXIT

# electron-builder expects a file path, not the private key contents.
# Thusly, we must create a temporary file for the private key.
export APPLE_API_KEY="$notarization_key_dir/AuthKey.p8"
(
  umask 077
  printf '%s\n' "$APPLE_API_KEY_P8" > "$APPLE_API_KEY"
)

if ! openssl pkey -in "$APPLE_API_KEY" -noout 2>/dev/null; then
  echo "::error::APPLE_API_KEY_P8 must contain the full PEM contents of the .p8 file, not base64." >&2
  exit 1
fi

# The build only needs the key file, not the raw secret in its environment.
unset APPLE_API_KEY_P8

# Keep this shell alive so the EXIT trap also cleans up after a failed build.
"$@"

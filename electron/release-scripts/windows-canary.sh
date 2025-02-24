#!/bin/bash -ex

DIST_PATH="${HOME}/fchat-rising/electron/dist"

export NODE_OPTIONS=--openssl-legacy-provider

cd "${HOME}/fchat-rising"
git checkout canary
git pull
pnpm

rm -rf "${DIST_PATH}"

cd electron
rm -rf app
pnpm build
node pack.js

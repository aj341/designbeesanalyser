#!/bin/sh
set -e
echo "Installing Chrome for Puppeteer..."
npx puppeteer browsers install chrome
echo "Starting server..."
exec node --enable-source-maps artifacts/api-server/dist/index.mjs

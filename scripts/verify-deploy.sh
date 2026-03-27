#!/usr/bin/env bash
set -euo pipefail

echo "Running lint..."
npm run lint

echo "Running build..."
npm run build

echo "Scanning dist assets for forbidden legacy strings..."
if grep -R -n -E "verified=eq\\.true|businesses\\.verified" dist --include='*.js'; then
  echo "Forbidden legacy string detected in built assets."
  exit 1
fi

echo "Deployment verification passed: lint/build succeeded and no forbidden strings were found in dist/."

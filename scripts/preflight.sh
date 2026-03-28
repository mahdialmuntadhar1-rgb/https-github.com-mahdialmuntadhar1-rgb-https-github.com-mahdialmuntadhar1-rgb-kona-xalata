#!/usr/bin/env bash
set -euo pipefail

echo "Checking required Supabase env vars..."
: "${VITE_SUPABASE_URL:?Missing required env var VITE_SUPABASE_URL}"
: "${VITE_SUPABASE_ANON_KEY:?Missing required env var VITE_SUPABASE_ANON_KEY}"

echo "Running lint..."
npm run lint

echo "Running build..."
npm run build

echo "Preflight checks passed for Supabase deployment."

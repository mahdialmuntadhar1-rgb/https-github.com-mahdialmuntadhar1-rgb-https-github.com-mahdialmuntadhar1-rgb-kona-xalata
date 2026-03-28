#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${VITE_SUPABASE_URL:-}" || -z "${VITE_SUPABASE_ANON_KEY:-}" ]]; then
  echo "Missing required Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
  exit 1
fi

echo "Running lint..."
npm run lint

echo "Running build..."
npm run build

echo "Preflight checks passed for Supabase frontend deployment."

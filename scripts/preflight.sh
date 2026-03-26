#!/usr/bin/env bash
set -euo pipefail

required_vars=(
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
  VITE_CLOUDFLARE_ACCOUNT_ID
  VITE_CLOUDFLARE_PROJECT_NAME
)

missing=0
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "Missing required env var: ${var}"
    missing=1
  fi
done

if [[ "${missing}" -ne 0 ]]; then
  echo "Preflight failed due to missing required Supabase/Cloudflare environment variables."
  exit 1
fi

echo "Running lint..."
npm run lint

echo "Running build..."
npm run build

echo "Preflight checks passed for frontend + Cloudflare Worker + Supabase deployment."

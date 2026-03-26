#!/usr/bin/env bash
set -euo pipefail

TARGET_ENV="${1:-dev}"

if ! command -v wrangler >/dev/null 2>&1; then
  echo "Wrangler CLI is not installed. Install with: npm i -g wrangler"
  exit 1
fi

required_vars=(VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY)
for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required env var: ${var_name}"
    exit 1
  fi
done

echo "Running lint..."
npm run lint

echo "Running build..."
npm run build

echo "Supabase + Cloudflare preflight checks passed for '${TARGET_ENV}'."

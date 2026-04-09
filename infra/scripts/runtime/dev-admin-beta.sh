#!/usr/bin/env bash
# Run admin frontend dev server against beta API (Mode B)
# Usage: BETA_API_URL=https://vpn.example.com/api/v1 ./infra/scripts/runtime/dev-admin-beta.sh
set -euo pipefail
cd "$(dirname "$0")/../../.."

BETA_API_URL="${BETA_API_URL:?Set BETA_API_URL (e.g. https://vpn.example.com/api/v1)}"
export VITE_API_BASE_URL="$BETA_API_URL"
pnpm dev:admin

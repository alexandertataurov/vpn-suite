#!/usr/bin/env bash
# Run admin frontend dev server against local API (Mode A)
# Usage: ./infra/scripts/runtime/dev-admin-local.sh
set -euo pipefail
cd "$(dirname "$0")/../../.."

# Unset so the admin app uses the vite proxy -> localhost:8000
unset VITE_API_BASE_URL
pnpm dev:admin

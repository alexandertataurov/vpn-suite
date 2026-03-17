#!/usr/bin/env bash
# Run admin frontend dev server against local API (Mode A)
# Usage: ./scripts/dev-admin-local.sh
set -euo pipefail
cd "$(dirname "$0")/.."

# Unset so frontend uses vite proxy -> localhost:8000
unset VITE_API_BASE_URL
cd frontend && pnpm dev:admin

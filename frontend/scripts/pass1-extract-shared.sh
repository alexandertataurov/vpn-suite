#!/usr/bin/env bash
# Pass 1 — extract shared code
# Why: deterministic move/copy recipe for auditing and re-running locally.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p shared/src/{types,utils}

echo "This script is informational; Pass 1 already applied via commits."
echo "Use it to re-derive the same file layout in a clean checkout."
echo

echo "1) Ensure workspaces include shared (frontend/package.json)"
echo "2) Ensure dependencies include @vpn-suite/shared (admin/package.json, miniapp/package.json)"
echo "3) Ensure TS/Vite aliases include @shared + @vpn-suite/shared (admin/miniapp tsconfig + vite)"
echo

echo "Suggested grep to validate no legacy imports remain:"
echo "  grep -R --line-number -E \"@/lib/types|@/lib/utils/cn|@/shared/statusMap|@/shared/types/api-error\" miniapp/src admin/src || true"
echo


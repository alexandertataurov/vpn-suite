#!/usr/bin/env bash
# Clear Storybook / Vite caches that can keep a stale story index after moving or deleting story files.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/../.." && pwd)"
for base in "$ROOT/node_modules/.cache" "$REPO_ROOT/node_modules/.cache" "$ROOT/.cache"; do
  [[ -d "$base" ]] || continue
  rm -rf "$base/storybook" "$base/sb-manager" "$base/sb-*" 2>/dev/null || true
done
echo "storybook:clear-cache — done (removed storybook-related dirs under node_modules/.cache when present)"

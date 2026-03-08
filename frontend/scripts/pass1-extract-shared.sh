#!/usr/bin/env bash
# Pass 1 — extract shared code
# Why: deterministic move/copy recipe for auditing and re-running locally.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p shared/src/{hooks,types,utils,constants}

copy_if_exists() {
  local source_path="$1"
  local destination_path="$2"
  if [[ -f "$source_path" ]]; then
    cp -f "$source_path" "$destination_path"
    echo "copied: $source_path -> $destination_path"
  else
    echo "skip (missing): $source_path"
  fi
}

# Shared hook candidates
copy_if_exists "admin/src/hooks/useDebounce.ts" "shared/src/hooks/useDebounce.ts"
copy_if_exists "admin/src/hooks/useLocalStorage.ts" "shared/src/hooks/useLocalStorage.ts"

# Shared util candidates
copy_if_exists "admin/src/shared/utils/format.ts" "shared/src/utils/format.ts"
copy_if_exists "admin/src/shared/utils/error.ts" "shared/src/utils/error.ts"

# Shared type candidates
copy_if_exists "admin/src/core/telemetry/types.ts" "shared/src/types/telemetry.types.ts"

echo
echo "Next checks:"
echo "  1) npm run typecheck -w shared"
echo "  2) rg -n \"from ['\\\"].*(admin/src|miniapp/src).*['\\\"]\" admin/src miniapp/src"
echo "  3) rg -n \"@vpn-suite/shared|@shared/\" admin/src miniapp/src"
echo

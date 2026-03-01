#!/usr/bin/env bash
# Fail CI if raw hex/rgb/hsl found outside token sources.
set -euo pipefail
IFS=$'\n\t'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PATTERN='#[0-9a-fA-F]{3,8}\b|rgb\(|rgba\(|hsl\(|hsla\('
PX_PATTERN='\\b[0-9]+(\\.[0-9]+)?px\\b'

ALLOWED='frontend/shared/tokens/|frontend/shared/scripts/build-tokens|frontend/shared/src/theme/tokens\.css|frontend/shared/\.storybook/theme\.ts|frontend/admin/src/charts/theme\.ts|frontend/admin/src/charts/presets/|\.md$|storybook-static/'

MATCHES="$(rg -n --files-with-matches -e "$PATTERN" frontend \
  -g '*.css' -g '*.tsx' -g '*.ts' \
  -g '!node_modules/**' -g '!dist/**' -g '!storybook-static/**' | rg -v "$ALLOWED" || true)"

if [[ -n "$MATCHES" ]]; then
  echo "Token violation: raw hex/rgb/hsl found. Use design tokens instead."
  while read -r f; do
    [[ -z "$f" ]] && continue
    echo ""
    echo "$f:"
    rg -n "$PATTERN" "$f" | sed 's/^/  /'
  done <<< "$MATCHES"
  exit 1
fi

PX_MATCHES="$(rg -n --files-with-matches -e "$PX_PATTERN" frontend/shared/src/ui/primitives frontend/shared/src/ui/styles/primitives \
  -g '*.css' -g '*.tsx' -g '*.ts' || true)"

if [[ -n "$PX_MATCHES" ]]; then
  echo "Token violation: raw px values found in primitives. Use spacing/size tokens instead."
  while read -r f; do
    [[ -z "$f" ]] && continue
    echo ""
    echo "$f:"
    rg -n "$PX_PATTERN" "$f" | sed 's/^/  /'
  done <<< "$PX_MATCHES"
  exit 1
fi

echo "OK: No raw color values outside token sources"

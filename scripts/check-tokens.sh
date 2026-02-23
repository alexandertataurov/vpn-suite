#!/usr/bin/env bash
# Fail CI if raw hex/rgb/hsl found outside token sources.
# Allowed: tokens/colors.json, build-tokens.js, tokens.css, chart theme fallbacks, Storybook theme.
# See frontend/shared/docs/DESIGN_SYSTEM_GUARDRAILS.md

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PATTERN='#[0-9a-fA-F]{3,8}\b|rgb\(|rgba\(|hsl\(|hsla\('
PX_PATTERN='\\b[0-9]+(\\.[0-9]+)?px\\b'

ALLOWED='frontend/shared/tokens/|frontend/shared/scripts/build-tokens|frontend/shared/src/theme/tokens\.css|frontend/shared/\.storybook/theme\.ts|frontend/admin/src/charts/theme\.ts|frontend/admin/src/charts/presets/|\.md$|storybook-static/'

MATCHES=$(grep -rE "$PATTERN" frontend \
  --include='*.css' --include='*.tsx' --include='*.ts' \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude-dir=storybook-static \
  -l 2>/dev/null | grep -vE "$ALLOWED" || true)

if [ -n "$MATCHES" ]; then
  echo "Token violation: raw hex/rgb/hsl found. Use design tokens instead."
  echo "$MATCHES" | while read f; do
    echo ""
    echo "$f:"
    grep -nE "$PATTERN" "$f" 2>/dev/null | sed 's/^/  /'
  done
  exit 1
fi

PX_MATCHES=$(grep -rE "$PX_PATTERN" frontend/shared/src/ui/primitives frontend/shared/src/ui/styles/primitives \
  --include='*.css' --include='*.tsx' --include='*.ts' \
  -l 2>/dev/null || true)

if [ -n "$PX_MATCHES" ]; then
  echo "Token violation: raw px values found in primitives. Use spacing/size tokens instead."
  echo "$PX_MATCHES" | while read f; do
    echo ""
    echo "$f:"
    grep -nE "$PX_PATTERN" "$f" 2>/dev/null | sed 's/^/  /'
  done
  exit 1
fi

echo "OK: No raw color values outside token sources"

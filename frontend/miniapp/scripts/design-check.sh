#!/usr/bin/env bash
# Design system checks: single :root, no inline styles in app code, no direct lucide outside shared icons module.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src"
VIOLATIONS=0

# 1. Only token/shell files may define :root
ROOT_FILES=$(grep -rl "^:root\s*{" "$SRC" --include="*.css" 2>/dev/null || true)
ALLOWED_ROOT="$SRC/design-system/styles/tokens/base.css $SRC/design-system/styles/theme/consumer.css $SRC/design-system/styles/shell/frame.css"
if [ -n "$ROOT_FILES" ]; then
  for f in $ROOT_FILES; do
    allowed=
    for a in $ALLOWED_ROOT; do
      [ "$(realpath "$f" 2>/dev/null)" = "$(realpath "$a" 2>/dev/null)" ] && allowed=1 && break
    done
    if [ -z "$allowed" ]; then
      echo "design:check — :root only allowed in design-system/styles (tokens/base, theme/consumer, shell/frame), found in: $f"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  done
fi

# 2. No inline style={ in miniapp-owned TSX (exclude design-system/stories — token demos use inline var())
APP_TSX=$(find "$SRC" -name "*.tsx" 2>/dev/null | grep -v "/design-system/stories/" || true)
for f in $APP_TSX; do
  if grep -q 'style=\s*{{' "$f" 2>/dev/null; then
    echo "design:check — no inline styles; use CSS classes. File: $f"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
done

# 3. No direct lucide-react import outside src/lib/icons.ts
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if [ "$(realpath "$f" 2>/dev/null)" = "$(realpath "$SRC/lib/icons.ts" 2>/dev/null)" ]; then
    continue
  fi
  if grep -qE 'from\s+["'\'']lucide-react["'\'']' "$f" 2>/dev/null; then
    echo "design:check — use @vpn-suite/shared icons, not direct lucide-react. File: $f"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
done <<EOF
$(find "$SRC" \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null)
EOF

# 4. Pages/page-models should consume reusable UI from the public design-system entrypoint.
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if grep -qE 'from\s+["'\'']@/design-system/(components|layouts|recipes|patterns|primitives)/' "$f" 2>/dev/null; then
    if grep -qE 'from\s+["'\'']@/design-system/patterns/FallbackScreen["'\'']' "$f" 2>/dev/null; then
      if grep -vE 'from\s+["'\'']@/design-system/patterns/FallbackScreen["'\'']' "$f" | grep -qE 'from\s+["'\'']@/design-system/(components|layouts|recipes|patterns|primitives)/' 2>/dev/null; then
        echo "design:check — pages/page-models must import reusable UI from '@/design-system'. File: $f"
        VIOLATIONS=$((VIOLATIONS + 1))
      fi
    else
      echo "design:check — pages/page-models must import reusable UI from '@/design-system'. File: $f"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  fi
done <<EOF
$(find "$SRC/pages" "$SRC/page-models" \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null)
EOF

# 5. No page-local stylesheets under src/pages; styling belongs in shared design-system layers.
PAGE_CSS_FILES=$(find "$SRC/pages" -name "*.css" 2>/dev/null || true)
if [ -n "$PAGE_CSS_FILES" ]; then
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    echo "design:check — page-local stylesheets are not allowed; move styles into design-system shared layers. File: $f"
    VIOLATIONS=$((VIOLATIONS + 1))
  done <<EOF
$PAGE_CSS_FILES
EOF
fi

PAGE_STYLE_IMPORTS=$(grep -RInE 'import\s+["'"'"']\./[^"'"'"']+\.css["'"'"'];?' "$SRC/pages" --include="*.tsx" 2>/dev/null || true)
if [ -n "$PAGE_STYLE_IMPORTS" ]; then
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    echo "design:check — page-local stylesheet imports are not allowed; use shared design-system styles. $line"
    VIOLATIONS=$((VIOLATIONS + 1))
  done <<EOF
$PAGE_STYLE_IMPORTS
EOF
fi

# 6. Token drift — tokens-map PRIMITIVES vs tokens/*.ts
if ! node "$ROOT/scripts/check-token-drift.mjs" 2>/dev/null; then
  VIOLATIONS=$((VIOLATIONS + 1))
fi

if [ "$VIOLATIONS" -gt 0 ]; then
  echo "design:check — $VIOLATIONS violation(s). See .cursor/rules/design-system.mdc"
  exit 1
fi
echo "design:check — passed"

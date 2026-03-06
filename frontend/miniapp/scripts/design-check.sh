#!/usr/bin/env bash
# Design system checks: single :root, no inline styles in app code, no direct lucide outside shared icons module.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src"
VIOLATIONS=0

# 1. Only token/shell files may define :root
ROOT_FILES=$(grep -rl "^:root\s*{" "$SRC" --include="*.css" 2>/dev/null || true)
ALLOWED_ROOT="$SRC/design-system/styles/miniapp-tokens.css $SRC/design-system/styles/miniapp.css $SRC/design-system/styles/miniapp-palette.css"
if [ -n "$ROOT_FILES" ]; then
  for f in $ROOT_FILES; do
    allowed=
    for a in $ALLOWED_ROOT; do
      [ "$(realpath "$f" 2>/dev/null)" = "$(realpath "$a" 2>/dev/null)" ] && allowed=1 && break
    done
    if [ -z "$allowed" ]; then
      echo "design:check — :root only allowed in design-system/styles (miniapp-tokens, miniapp, miniapp-palette), found in: $f"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  done
fi

# 2. No inline style={ in miniapp-owned TSX
APP_TSX=$(find "$SRC" -name "*.tsx" 2>/dev/null || true)
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

if [ "$VIOLATIONS" -gt 0 ]; then
  echo "design:check — $VIOLATIONS violation(s). See .cursor/rules/design-system.mdc"
  exit 1
fi
echo "design:check — passed"

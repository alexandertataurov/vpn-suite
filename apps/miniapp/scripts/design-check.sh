#!/usr/bin/env bash
# Design system checks: single :root, no inline styles in app code, no direct lucide outside shared icons module.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src"
STYLES_DIR="$SRC/design-system/styles"
CONFIG_JSON="$ROOT/scripts/design-check-config.json"
VIOLATIONS=0

ALLOWED_ROOT=$(node -e "const c=require(process.argv[1]); console.log(c.allowedRoot.map((p) => process.argv[2] + '/' + p).join(' '));" "$CONFIG_JSON" "$ROOT")
ALLOWED_CSS=$(node -e "const c=require(process.argv[1]); console.log(c.allowedHexCss.map((p) => process.argv[2] + '/' + p).join(' '));" "$CONFIG_JSON" "$ROOT")
ENFORCED_CSS_ROOTS=$(node -e "const c=require(process.argv[1]); console.log(c.enforcedCssRoots.map((p) => process.argv[2] + '/' + p).join(' '));" "$CONFIG_JSON" "$ROOT")

# 1. Only token/shell files may define :root
ROOT_FILES=$(grep -rlE "^:root\\b" "$SRC" --include="*.css" 2>/dev/null || true)
if [ -n "$ROOT_FILES" ]; then
  for f in $ROOT_FILES; do
    allowed=
    for a in $ALLOWED_ROOT; do
      [ "$(realpath "$f" 2>/dev/null)" = "$(realpath "$a" 2>/dev/null)" ] && allowed=1 && break
    done
    if [ -z "$allowed" ]; then
      echo "design:check — :root only allowed in approved token/theme files, found in: $f"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  done
fi

# 2. No inline style={ in miniapp-owned TSX (exclude *.stories.tsx, story-helpers, foundation story components)
APP_TSX=$(find "$SRC" -name "*.tsx" 2>/dev/null | grep -vE '(\.stories\.tsx$|story-helpers\.tsx|foundations/(shared/foundationShared|components/))' || true)
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
    if grep -qE 'from\s+["'\'']@/design-system/(patterns/FallbackScreen|patterns/PageStateScreen|layouts/PageScaffold)["'\'']' "$f" 2>/dev/null; then
      if grep -vE 'from\s+["'\'']@/design-system/(patterns/FallbackScreen|patterns/PageStateScreen|layouts/PageScaffold)["'\'']' "$f" | grep -qE 'from\s+["'\'']@/design-system/(components|layouts|recipes|patterns|primitives)/' 2>/dev/null; then
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

# 5. No page-local stylesheets under src/pages; route styling belongs in src/styles/app or reusable design-system layers.
PAGE_CSS_FILES=$(find "$SRC/pages" -name "*.css" 2>/dev/null || true)
if [ -n "$PAGE_CSS_FILES" ]; then
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    echo "design:check — page-local stylesheets are not allowed; move styles into src/styles/app or reusable design-system layers. File: $f"
    VIOLATIONS=$((VIOLATIONS + 1))
  done <<EOF
$PAGE_CSS_FILES
EOF
fi

PAGE_STYLE_IMPORTS=$(grep -RInE 'import\s+["'"'"']\./[^"'"'"']+\.css["'"'"'];?' "$SRC/pages" --include="*.tsx" 2>/dev/null || true)
if [ -n "$PAGE_STYLE_IMPORTS" ]; then
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    echo "design:check — page-local stylesheet imports are not allowed; use src/styles/app or reusable design-system styles. $line"
    VIOLATIONS=$((VIOLATIONS + 1))
  done <<EOF
$PAGE_STYLE_IMPORTS
EOF
fi

# 6. Shared design-system CSS must not contain route/page ancestor selectors for app-owned page families.
PAGE_ANCESTOR_SELECTORS=$(grep -RInE '\.(home-page|settings-page|devices-page|support-page|onboarding-page)\b' "$STYLES_DIR" --include="*.css" 2>/dev/null || true)
if [ -n "$PAGE_ANCESTOR_SELECTORS" ]; then
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    echo "design:check — page ancestor selectors are not allowed in design-system CSS; move route styling to src/styles/app. $line"
    VIOLATIONS=$((VIOLATIONS + 1))
  done <<EOF
$PAGE_ANCESTOR_SELECTORS
EOF
fi

# 7. No raw hex/rgba in design-system CSS except in token source files.
while IFS= read -r f; do
  [ -z "$f" ] && continue
  allowed=
  for a in $ALLOWED_CSS; do
    [ "$(realpath "$f" 2>/dev/null)" = "$(realpath "$a" 2>/dev/null)" ] && allowed=1 && break
  done
  if [ -z "$allowed" ] && grep -qE '#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b|rgba\s*\(' "$f" 2>/dev/null; then
    echo "design:check — no raw hex/rgba in design-system CSS outside approved token sources. File: $f"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
done <<EOF
$(find "$STYLES_DIR" -name "*.css" 2>/dev/null)
EOF

# 8. No raw hex/rgba in component/recipe/app CSS outside token source files.
for dir in $ENFORCED_CSS_ROOTS; do
  [ -d "$dir" ] || continue
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    allowed=
    for a in $ALLOWED_CSS; do
      [ "$(realpath "$f" 2>/dev/null)" = "$(realpath "$a" 2>/dev/null)" ] && allowed=1 && break
    done
    if [ -z "$allowed" ] && grep -qE '#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b|rgba\s*\(' "$f" 2>/dev/null; then
      echo "design:check — no raw hex/rgba in component or app CSS. File: $f"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  done <<EOF
$(find "$dir" -name "*.css" 2>/dev/null)
EOF
done

# 9. Token drift — tokens-map PRIMITIVES vs tokens/*.ts
if ! node "$ROOT/scripts/check-token-drift.mjs" 2>/dev/null; then
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# 10. Typography parity test must pass whenever token or CSS layers drift.
if ! pnpm exec vitest run src/design-system/core/tokens/__tests__/token-parity.test.ts >/dev/null 2>&1; then
  echo "design:check — typography/breakpoint token parity failed. Run: pnpm exec vitest run src/design-system/core/tokens/__tests__/token-parity.test.ts"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# 11. Storybook taxonomy must stay aligned with the UI-platform layer model.
if ! node "$ROOT/scripts/check-storybook-taxonomy.mjs" >/dev/null 2>&1; then
  echo "design:check — Storybook taxonomy drifted. Run: npm run storybook:taxonomy"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

if [ "$VIOLATIONS" -gt 0 ]; then
  echo "design:check — $VIOLATIONS violation(s). See .cursor/rules/design-system.mdc"
  exit 1
fi
echo "design:check — passed"

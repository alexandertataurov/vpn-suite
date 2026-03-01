#!/usr/bin/env bash
# Miniapp verify: typecheck, lint, build, optional E2E.
set -euo pipefail
IFS=$'\n\t'

command -v npm >/dev/null 2>&1 || { echo "npm not found" >&2; exit 1; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
source scripts/lib/quality_steps.sh

RUN_E2E="${RUN_E2E:-1}"

step "Miniapp: Typecheck"
(cd frontend && npm run typecheck -w miniapp)

step "Miniapp: Lint"
(cd frontend && npm run lint -w miniapp)

step "Miniapp: Build"
(cd frontend && npm run build:miniapp)

if [[ "$RUN_E2E" == "1" ]]; then
  step "Miniapp: E2E (Playwright)"
  (cd frontend && npm run test:e2e:miniapp)
fi

echo
echo "Miniapp verify: all steps passed."

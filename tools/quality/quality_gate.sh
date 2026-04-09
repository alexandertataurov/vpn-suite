#!/usr/bin/env bash
# Quality gate: lint, typecheck, test, build.
set -euo pipefail
IFS=$'\n\t'

command -v npm >/dev/null 2>&1 || { echo "npm not found" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "python3 not found" >&2; exit 1; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
source scripts/lib/quality_steps.sh

RUN_E2E="${RUN_E2E:-0}"
[[ "${1:-}" == "--e2e" ]] && RUN_E2E=1

docs_validate
backend_ruff
step "Backend: Pytest"
(
  cd apps/admin-api
  export DATABASE_URL="${DATABASE_URL:-postgresql+asyncpg://postgres:postgres@localhost:5432/vpn_admin}"
  export REDIS_URL="${REDIS_URL:-redis://localhost:6379/0}"
  export SECRET_KEY="${SECRET_KEY:-ci-secret-key-min-32-chars-long}"
  export ADMIN_EMAIL="${ADMIN_EMAIL:-admin@ci}"
  export ADMIN_PASSWORD="${ADMIN_PASSWORD:-ci-admin-password}"
  export NODE_MODE="${NODE_MODE:-mock}"
  export TELEGRAM_STARS_WEBHOOK_SECRET="${TELEGRAM_STARS_WEBHOOK_SECRET:-}"
  if [[ -x .venv/bin/python ]]; then
    .venv/bin/python -m pytest tests/ -v
  else
    python3 -m pytest tests/ -v
  fi
)
frontend_checks

if [[ "$RUN_E2E" == "1" ]]; then
  step "E2E: Playwright (requires admin-api and admin dev server)"
  (cd apps/admin-web && ADMIN_EMAIL="${ADMIN_EMAIL:-admin@ci}" ADMIN_PASSWORD="${ADMIN_PASSWORD:-ci-admin-password}" pnpm exec playwright test)
fi

echo
echo "Quality gate passed."

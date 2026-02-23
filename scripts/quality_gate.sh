#!/usr/bin/env bash
# Quality gate: lint, typecheck, test, build. One-command validation before PR/merge.
# Requires: backend postgres+redis (or docker compose up postgres redis); frontend node.
# Optional: RUN_E2E=1 to run Playwright E2E (needs admin-api + admin dev server).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RUN_E2E="${RUN_E2E:-0}"
if [[ "${1:-}" == "--e2e" ]]; then
  RUN_E2E=1
fi

step() { echo; echo "==> $*"; }

step "Backend: Ruff check"
(cd backend && ruff check .)

step "Backend: Ruff format"
(cd backend && ruff format --check .)

step "Backend: Pytest"
(
  cd backend
  export DATABASE_URL="${DATABASE_URL:-postgresql+asyncpg://postgres:postgres@localhost:5432/vpn_admin}"
  export REDIS_URL="${REDIS_URL:-redis://localhost:6379/0}"
  export SECRET_KEY="${SECRET_KEY:-ci-secret-key-min-32-chars-long}"
  export ADMIN_EMAIL="${ADMIN_EMAIL:-admin@ci}"
  export ADMIN_PASSWORD="${ADMIN_PASSWORD:-ci-admin-password}"
  export NODE_MODE="${NODE_MODE:-mock}"
  export TELEGRAM_STARS_WEBHOOK_SECRET="${TELEGRAM_STARS_WEBHOOK_SECRET:-}"
  pytest tests/ -v
)

step "Frontend: Lint"
(cd frontend && npm run lint)

step "Frontend: Typecheck"
(cd frontend && npm run typecheck)

step "Frontend: Unit tests"
(cd frontend && npm test -- --run)

step "Frontend: Build"
(cd frontend && npm run build)

if [[ "$RUN_E2E" == "1" ]]; then
  step "E2E: Playwright (requires admin-api and admin dev server)"
  (
    cd frontend/admin
    ADMIN_EMAIL="${ADMIN_EMAIL:-admin@ci}" ADMIN_PASSWORD="${ADMIN_PASSWORD:-ci-admin-password}" \
      npx playwright test
  )
fi

echo
echo "Quality gate passed."

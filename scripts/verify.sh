#!/usr/bin/env bash
# Quality Gate: one command for lint + typecheck + unit tests + build.
# Optional: API smoke + E2E (set RUN_E2E=1 and ensure API + admin dev server; or use ./manage.sh smoke-staging).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

step() { echo; echo "==> $*"; }

# --- Backend ---
step "Backend: Ruff check"
(cd backend && ruff check .)
step "Backend: Ruff format"
(cd backend && ruff format --check .)
# Backend migrate + pytest require DATABASE_URL and REDIS_URL. Set VERIFY_SKIP_DB=1 to skip (lint/build only).
if [[ "${VERIFY_SKIP_DB:-0}" != "1" ]]; then
  if [[ -z "${DATABASE_URL:-}" ]]; then
    export DATABASE_URL="${DATABASE_URL:-postgresql+asyncpg://postgres:postgres@localhost:5432/vpn_admin}"
    export REDIS_URL="${REDIS_URL:-redis://localhost:6379/0}"
  fi
  step "Backend: Migrate (up head)"
  (cd backend && python3 -m alembic upgrade head)
  step "Backend: Migration integrity (downgrade/upgrade)"
  (cd backend && python3 -m alembic downgrade -1 && python3 -m alembic upgrade head)
  step "Backend: Alembic check"
  (cd backend && python3 -m alembic check)
  step "Backend: Pytest"
  (cd backend && NODE_MODE=mock TELEGRAM_STARS_WEBHOOK_SECRET="" python3 -m pytest tests/ -v)
  step "Bot: Pytest"
  (cd bot && python3 -m pytest -q)
else
  echo "Skipping backend migrate/pytest and bot pytest (VERIFY_SKIP_DB=1)."
fi

# --- Frontend ---
step "Frontend: npm ci"
(cd frontend && npm ci)
step "Frontend: Lint"
(cd frontend && npm run lint)
step "Frontend: Typecheck"
(cd frontend && npm run typecheck)
step "Frontend: Unit tests"
(cd frontend && npm test -- --run)
step "Frontend: Build"
(cd frontend && npm run build)

# --- Compose config ---
# PUBLIC_DOMAIN required by docker-compose; default so config-validate works without it in ENV_FILE.
export PUBLIC_DOMAIN="${PUBLIC_DOMAIN:-localhost}"
step "Compose: config-validate"
./manage.sh config-validate

echo
echo "Verify (lint + typecheck + unit + build + config) completed successfully."
echo "For API smoke + E2E: run ./manage.sh smoke-staging (requires core stack up and ADMIN_EMAIL/ADMIN_PASSWORD)."

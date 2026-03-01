#!/usr/bin/env bash
# Full verify: lint + typecheck + unit tests + build + migrate integrity + config-validate.
# Set VERIFY_SKIP_DB=1 to skip migrate/pytest (lint/build only).
set -euo pipefail
IFS=$'\n\t'

command -v npm >/dev/null 2>&1 || { echo "npm not found" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "python3 not found" >&2; exit 1; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
source scripts/lib/quality_steps.sh

backend_ruff
if [[ "${VERIFY_SKIP_DB:-0}" != "1" ]]; then
  if [[ -z "${DATABASE_URL:-}" ]]; then
    export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/vpn_admin" REDIS_URL="${REDIS_URL:-redis://localhost:6379/0}"
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

step "Frontend: npm ci"
(cd frontend && npm ci)
frontend_checks

# --- Compose config ---
# PUBLIC_DOMAIN required by docker-compose; default so config-validate works without it in ENV_FILE.
export PUBLIC_DOMAIN="${PUBLIC_DOMAIN:-localhost}"
step "Compose: config-validate"
./manage.sh config-validate

echo
echo "Verify (lint + typecheck + unit + build + config) completed successfully."
echo "For API smoke + E2E: run ./manage.sh smoke-staging (requires core stack up and ADMIN_EMAIL/ADMIN_PASSWORD)."

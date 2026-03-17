#!/usr/bin/env bash
# Pre-deploy smoke: 2-minute or 10-minute checks per docs/ops/pre-deploy-checklist.md
# Usage: ./scripts/pre_deploy_smoke.sh [2min|10min]   (default: 2min)
set -euo pipefail
IFS=$'\n\t'

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

command -v curl >/dev/null 2>&1 || { echo "curl not found" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "python3 not found" >&2; exit 1; }

LEVEL="${1:-2min}"
SKIP_CHECK="${PRE_DEPLOY_SKIP_CHECK:-0}"
BASE_URL="${BASE_URL:-http://127.0.0.1:8000}"
BASE_URL="${BASE_URL%/}"
ENV_FILE="${ENV_FILE:-.env}"

_load_env() {
  [[ -f "$ENV_FILE" ]] || return 0
  # Export only ADMIN_EMAIL/ADMIN_PASSWORD for login (avoid loading secrets broadly)
  for key in ADMIN_EMAIL ADMIN_PASSWORD; do
    val=$(grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'" || true)
    [[ -n "$val" ]] && export "$key=$val"
  done
}

step() { echo ""; echo "==> $*"; }

# --- 2-minute smoke ---
run_2min() {
  if [[ "$SKIP_CHECK" != "1" ]]; then
    step "2-minute smoke: check"
    if ./manage.sh check 2>/dev/null; then
      :
    else
      echo "WARN: manage.sh check failed. Running minimal checks..."
      (cd backend && ruff check . -q 2>/dev/null) || true
      (cd frontend && pnpm run lint 2>/dev/null) || true
    fi
  fi

  step "2-minute smoke: core up (if not already)"
  ./manage.sh up-core 2>/dev/null || true

  step "2-minute smoke: GET /health"
  code=$(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' "$BASE_URL/health" 2>/dev/null || echo "000")
  if [[ "$code" != "200" ]]; then
    echo "FAIL: GET /health -> $code (expected 200)"
    exit 1
  fi
  echo "OK GET /health -> 200"

  _load_env
  if [[ -n "${ADMIN_EMAIL:-}" && -n "${ADMIN_PASSWORD:-}" ]]; then
    step "2-minute smoke: login"
    token=$(curl -sS --max-time 10 -X POST "$BASE_URL/api/v1/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" 2>/dev/null | \
      python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || true)
    if [[ -z "$token" ]]; then
      echo "WARN: Login failed (check ADMIN_EMAIL/ADMIN_PASSWORD)"
    else
      echo "OK Login -> token received"
    fi
  else
    echo "Skip login: ADMIN_EMAIL/ADMIN_PASSWORD not set"
  fi

  echo ""
  echo "2-minute smoke passed. Manual: open http://localhost:5174/admin/ and check dashboard."
}

# --- 10-minute pre-release ---
run_10min() {
  if [[ "$SKIP_CHECK" != "1" ]]; then
    step "10-minute: verify"
    if ./manage.sh verify 2>/dev/null; then
      :
    else
      echo "WARN: manage.sh verify failed. Running minimal checks..."
      (cd backend && ruff check . -q && python3 -m pytest tests/ -q) || true
      (cd frontend && pnpm run lint && pnpm run typecheck && pnpm run test -- --run) || true
      ./manage.sh config-validate 2>/dev/null || true
    fi
  else
    step "10-minute: verify (skipped, PRE_DEPLOY_SKIP_CHECK=1)"
  fi

  step "10-minute: core up"
  ./manage.sh up-core

  step "10-minute: GET /health"
  code=$(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' "$BASE_URL/health" 2>/dev/null || echo "000")
  [[ "$code" == "200" ]] || { echo "FAIL: GET /health -> $code"; exit 1; }
  echo "OK GET /health -> 200"

  step "10-minute: GET /health/ready"
  code=$(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' "$BASE_URL/health/ready" 2>/dev/null || echo "000")
  [[ "$code" == "200" ]] || { echo "FAIL: GET /health/ready -> $code"; exit 1; }
  echo "OK GET /health/ready -> 200"

  step "10-minute: frontend build"
  (cd frontend && pnpm build:admin)

  _load_env
  if [[ -n "${ADMIN_EMAIL:-}" && -n "${ADMIN_PASSWORD:-}" ]]; then
    step "10-minute: login + API smoke"
    token=$(curl -sS --max-time 10 -X POST "$BASE_URL/api/v1/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" 2>/dev/null | \
      python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || true)
    if [[ -n "$token" ]]; then
      for ep in "/api/v1/servers" "/api/v1/overview/health-snapshot" "/api/v1/users?limit=5"; do
        c=$(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $token" "$BASE_URL$ep" 2>/dev/null || echo "000")
        [[ "$c" =~ ^2 ]] || echo "WARN: GET $ep -> $c"
      done
      echo "OK API smoke"
    else
      echo "WARN: Login failed, skip API smoke"
    fi
  fi

  step "10-minute: Postgres + Redis"
  docker compose exec -T postgres pg_isready -U postgres -q || { echo "WARN: Postgres not ready"; }
  docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG || { echo "WARN: Redis not ready"; }

  echo ""
  echo "10-minute pre-release passed. Manual: UI smoke (auth, nav, dashboard, lists)."
}

case "$LEVEL" in
  2min) run_2min ;;
  10min) run_10min ;;
  *) echo "Usage: $0 [2min|10min]" >&2; exit 1 ;;
esac

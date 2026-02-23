#!/usr/bin/env bash
# Baseline capture for /admin: network (curl), backend logs. Run with stack up.
# Browser items (console, Web Vitals) — run manually in Chrome DevTools.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
BASE_URL="${BASE_URL:-http://127.0.0.1:8000}"
OUT="${BASELINE_OUT:-$ROOT/baseline_capture.txt}"
ENV_FILE="${ENV_FILE:-}"

log() { echo "$@" | tee -a "$OUT"; }
section() { echo ""; echo "========== $* ==========" | tee -a "$OUT"; }

: > "$OUT"
log "Baseline capture $(date -Iseconds)"
log "BASE_URL=$BASE_URL"

section "Network — admin API endpoints (status, time_total, size_download)"
source scripts/lib/env.sh
resolve_env_file || true
if [[ -n "${ENV_FILE:-}" && -f "$ENV_FILE" ]]; then
  load_env_file "$ENV_FILE"
fi
if [[ -z "${ADMIN_EMAIL:-}" || -z "${ADMIN_PASSWORD:-}" ]]; then
  log "Skip: ADMIN_EMAIL/ADMIN_PASSWORD not set"
else
  TOKEN=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
  if [[ -z "$TOKEN" ]]; then log "Login failed"; else
    AUTH="Authorization: Bearer $TOKEN"
    for path in /api/v1/overview /api/v1/audit?limit=5 /api/v1/servers /api/v1/control-plane/automation/status /api/v1/control-plane/events?limit=5 /api/v1/telemetry/docker/hosts; do
      r=$(curl -s -w "\n%{http_code}\t%{time_total}\t%{size_download}" -H "$AUTH" "$BASE_URL$path" -o /tmp/baseline_body)
      code=$(echo "$r" | tail -1 | cut -f1)
      time=$(echo "$r" | tail -1 | cut -f2)
      size=$(echo "$r" | tail -1 | cut -f3)
      log "GET $path -> $code  time=${time}s  size=$size"
    done
  fi
fi

section "Backend logs (admin-api last 100 lines)"
docker compose logs --tail=100 admin-api 2>&1 | tee -a "$OUT" || log "(docker not available)"

log ""
log "Capture written to $OUT"
log "Manual: open /admin in Chrome → DevTools Network (record), Console (errors), Lighthouse (LCP/CLS)."

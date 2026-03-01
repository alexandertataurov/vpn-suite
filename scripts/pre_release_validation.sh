#!/usr/bin/env bash
# Pre-release SRE validation: collect runtime, logs, connectivity, API smoke, resources.
set -euo pipefail
IFS=$'\n\t'
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

command -v docker >/dev/null 2>&1 || { echo "docker not found" >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "curl not found" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "python3 not found" >&2; exit 1; }

BASE_URL="${BASE_URL:-http://127.0.0.1:8000}"
REPORT="${REPORT:-$ROOT/pre_release_validation_report.txt}"
ENV_FILE="${ENV_FILE:-}"

log() { echo "$@" | tee -a "$REPORT"; }
section() { echo ""; echo "========== $* ==========" | tee -a "$REPORT"; }

: > "$REPORT"
log "Pre-release validation report $(date -Iseconds)"
log "BASE_URL=$BASE_URL"

section "Phase 1 — Runtime"
docker compose ps -a 2>&1 | tee -a "$REPORT"
log ""
for c in $(docker compose ps -aq 2>/dev/null); do
  docker inspect --format '{{.Name}} RestartCount={{.RestartCount}} Health={{.State.Health.Status}}' "$c" 2>/dev/null | tee -a "$REPORT"
done

section "Phase 2 — Log grep (ERROR/WARN/Exception)"
for s in admin-api reverse-proxy postgres redis telegram-vpn-bot; do
  log "--- $s ---"
  docker compose logs --tail=300 "$s" 2>&1 | grep -iE 'ERROR|WARN|Exception|Timeout|Failed|Traceback|Fatal|OOM|refused|ECONNREFUSED' || log "(none)"
done

section "Phase 3 — Connectivity"
log "GET $BASE_URL/health -> $(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' "$BASE_URL/health")"
log "GET $BASE_URL/health/ready -> $(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' "$BASE_URL/health/ready")"
log "GET $BASE_URL/metrics -> $(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' "$BASE_URL/metrics")"
log "GET http://127.0.0.1:8090/healthz -> $(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' http://127.0.0.1:8090/healthz 2>/dev/null || echo 'N/A')"
log "GET http://127.0.0.1:80/health (Caddy) -> $(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' http://127.0.0.1:80/health 2>/dev/null || echo 'N/A')"

section "Phase 3a — Migrations"
./manage.sh migrate 2>&1 | tee -a "$REPORT" || true

section "Phase 3b — API endpoints (with JWT)"
source scripts/lib/env.sh
resolve_env_file
load_env_file "$ENV_FILE"
if [[ -z "${ADMIN_EMAIL:-}" || -z "${ADMIN_PASSWORD:-}" ]]; then
  log "Skip API smoke: ADMIN_EMAIL/ADMIN_PASSWORD not set"
else
  TOKEN="$(curl -sS --max-time 10 -X POST "$BASE_URL/api/v1/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)"
  if [[ -z "$TOKEN" ]]; then
    log "Login failed, skip authenticated endpoints"
  else
    AUTH="Authorization: Bearer $TOKEN"
    endpoints=(
      "GET /api/v1/overview"
      "GET /api/v1/audit?limit=5"
      "GET /api/v1/cluster/topology"
      "GET /api/v1/cluster/nodes"
      "GET /api/v1/cluster/health"
      "GET /api/v1/servers"
      "GET /api/v1/users?limit=5"
      "GET /api/v1/plans"
      "GET /api/v1/subscriptions?limit=5"
      "GET /api/v1/payments?limit=5"
      "GET /api/v1/control-plane/topology/summary"
      "GET /api/v1/control-plane/automation/status"
      "GET /api/v1/control-plane/events?limit=5"
      "GET /api/v1/telemetry/docker/hosts"
      "GET /api/v1/telemetry/docker/containers"
      "GET /api/v1/telemetry/docker/alerts"
    )
    for ep in "${endpoints[@]}"; do
      method="${ep%% *}"; path="${ep#* }"
      code=$(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' -X "$method" -H "$AUTH" "$BASE_URL$path" 2>/dev/null)
      log "$method $path -> $code"
    done
  fi
fi

section "Phase 4 — Resources"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>&1 | tee -a "$REPORT"
docker events --since 5m --until 0s --filter 'event=oom' 2>/dev/null | head -5 || log "No OOM events (or no events)"

section "Phase 5 — Migrations"
./manage.sh migrate 2>&1 | tee -a "$REPORT" || true

log ""
log "Report written to $REPORT"

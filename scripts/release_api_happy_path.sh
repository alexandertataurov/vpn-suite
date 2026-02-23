#!/usr/bin/env bash
# Release verification: happy-path requests for admin-used endpoints.
# Saves redacted sample responses to reports/release-api-ui-verification/samples/.
# Usage: BASE_URL=http://127.0.0.1:8000 [ADMIN_EMAIL=... ADMIN_PASSWORD=...] ./scripts/release_api_happy_path.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
BASE_URL="${BASE_URL:-http://127.0.0.1:8000}"
BASE_URL="${BASE_URL%/}"
ENV_FILE="${ENV_FILE:-}"
SAMPLES="$ROOT/reports/release-api-ui-verification/samples"
RESULTS="$ROOT/reports/release-api-ui-verification/happy_path_results.txt"
mkdir -p "$SAMPLES"
: > "$RESULTS"

redact() {
  sed -e 's/"access_token":"[^"]*"/"access_token":"[REDACTED]"/g' \
      -e 's/"refresh_token":"[^"]*"/"refresh_token":"[REDACTED]"/g' \
      -e 's/"token":"[^"]*"/"token":"[REDACTED]"/g' \
      -e 's/"Authorization":"[^"]*"/"Authorization":"[REDACTED]"/g'
}

req() {
  local method="$1" path="$2" out="$3" body="${4:-}"
  local code
  if [[ -n "$body" ]]; then
    code=$(curl -s -w '%{http_code}' -o "$out" -X "$method" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$body" "$BASE_URL$path" 2>/dev/null || echo "000")
  else
    code=$(curl -s -w '%{http_code}' -o "$out" -X "$method" -H "Authorization: Bearer $TOKEN" "$BASE_URL$path" 2>/dev/null || echo "000")
  fi
  echo "$code"
}

echo "Release API happy-path — $(date -Iseconds)" | tee -a "$RESULTS"
echo "BASE_URL=$BASE_URL" | tee -a "$RESULTS"

source scripts/lib/env.sh
resolve_env_file || true
if [[ -n "${ENV_FILE:-}" && -f "$ENV_FILE" ]]; then
  load_env_file "$ENV_FILE"
fi
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}"

# Health (no auth)
curl -s -o "$SAMPLES/health.json" "$BASE_URL/health" 2>/dev/null || true
code_health=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/health" 2>/dev/null || echo "000")
echo "GET /health -> $code_health" | tee -a "$RESULTS"

# Login
login_resp=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" 2>/dev/null || echo "{}")
echo "$login_resp" | redact > "$SAMPLES/auth_login.json"
TOKEN=$(echo "$login_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token') or d.get('data',{}).get('access_token') or '')" 2>/dev/null || true)
code_login=$(echo "$login_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('meta',{}).get('code') or (200 if d.get('access_token') else 401))" 2>/dev/null || echo "401")
echo "POST /api/v1/auth/login -> $code_login" | tee -a "$RESULTS"

if [[ -z "$TOKEN" ]]; then
  echo "No JWT; skipping authenticated endpoints." | tee -a "$RESULTS"
  exit 0
fi

# Authenticated GETs (path -> sample filename)
declare -a get_endpoints=(
  "/api/v1/overview:overview"
  "/api/v1/overview/dashboard_timeseries:overview_timeseries"
  "/api/v1/audit?limit=5&offset=0:audit"
  "/api/v1/devices?limit=10&offset=0:devices"
  "/api/v1/payments?limit=10&offset=0:payments"
  "/api/v1/subscriptions?limit=10&offset=0:subscriptions"
  "/api/v1/users?limit=10&offset=0:users"
  "/api/v1/servers?limit=50&offset=0:servers"
  "/api/v1/servers/device-counts:servers_device_counts"
  "/api/v1/servers/telemetry/summary:servers_telemetry_summary"
  "/api/v1/servers/snapshots/summary:servers_snapshots_summary"
  "/api/v1/control-plane/topology/summary:control_plane_topology_summary"
  "/api/v1/control-plane/topology/graph:control_plane_topology_graph"
  "/api/v1/control-plane/metrics/business:control_plane_metrics_business"
  "/api/v1/control-plane/metrics/security:control_plane_metrics_security"
  "/api/v1/control-plane/metrics/anomaly:control_plane_metrics_anomaly"
  "/api/v1/control-plane/automation/status:control_plane_automation_status"
  "/api/v1/control-plane/events?limit=12:control_plane_events"
  "/api/v1/telemetry/docker/hosts:telemetry_docker_hosts"
)
for entry in "${get_endpoints[@]}"; do
  path="${entry%%:*}"; name="${entry##*:}"
  code=$(req GET "$path" "$SAMPLES/${name}.json")
  echo "GET $path -> $code" | tee -a "$RESULTS"
  [[ -f "$SAMPLES/${name}.json" ]] && redact < "$SAMPLES/${name}.json" > "$SAMPLES/${name}.json.tmp" && mv "$SAMPLES/${name}.json.tmp" "$SAMPLES/${name}.json"
done

# Servers list may have items; get first server id for detail/sync if present
SERVER_ID=$(python3 -c "
import json
try:
    with open('$SAMPLES/servers.json') as f:
        d = json.load(f)
    items = d.get('items') or d.get('data',{}).get('items') or []
    if items:
        print(items[0].get('id',''))
except Exception:
    pass
" 2>/dev/null || true)

if [[ -n "$SERVER_ID" ]]; then
  for path in "/api/v1/servers/$SERVER_ID" "/api/v1/servers/$SERVER_ID/telemetry" "/api/v1/servers/$SERVER_ID/peers"; do
    name=$(echo "$path" | sed 's|/api/v1/||;s|/|_|g;s/^_//')
    code=$(req GET "$path" "$SAMPLES/${name}.json")
    echo "GET $path -> $code" | tee -a "$RESULTS"
    [[ -f "$SAMPLES/${name}.json" ]] && redact < "$SAMPLES/${name}.json" > "$SAMPLES/${name}.json.tmp" && mv "$SAMPLES/${name}.json.tmp" "$SAMPLES/${name}.json"
  done
fi

echo "Done. Results in $RESULTS, samples in $SAMPLES" | tee -a "$RESULTS"

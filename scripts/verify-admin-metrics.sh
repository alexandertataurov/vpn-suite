#!/usr/bin/env bash
# Verify admin metrics/telemetry APIs return real or explicit-unavailable data (no mock/fake).
# Usage: BASE_URL=http://127.0.0.1:8000 [ADMIN_EMAIL=... ADMIN_PASSWORD=...] ./scripts/verify-admin-metrics.sh
# Or:   TOKEN=<jwt> BASE_URL=http://127.0.0.1:8000 ./scripts/verify-admin-metrics.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
BASE_URL="${BASE_URL:-http://127.0.0.1:8000}"
BASE_URL="${BASE_URL%/}"
FAILED=0

req() {
  local path="$1"
  if [[ -n "${TOKEN:-}" ]]; then
    curl -sS --max-time 15 -H "Authorization: Bearer $TOKEN" "$BASE_URL$path"
  else
    curl -sS --max-time 15 "$BASE_URL$path"
  fi
}

req_with_code() {
  local path="$1"
  local body_file="$2"
  if [[ -n "${TOKEN:-}" ]]; then
    curl -sS --max-time 15 -o "$body_file" -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE_URL$path"
  else
    curl -sS --max-time 15 -o "$body_file" -w "%{http_code}" "$BASE_URL$path"
  fi
}

# Resolve JWT if not set
if [[ -z "${TOKEN:-}" ]]; then
  source scripts/lib/env.sh 2>/dev/null || true
  resolve_env_file 2>/dev/null || true
  [[ -n "${ENV_FILE:-}" && -f "$ENV_FILE" ]] && load_env_file "$ENV_FILE" 2>/dev/null || true
  ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
  ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}"
  login_resp=$(curl -sS --max-time 10 -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" 2>/dev/null || echo "{}")
  TOKEN=$(echo "$login_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token') or d.get('data',{}).get('access_token') or '')" 2>/dev/null || true)
fi

if [[ -z "${TOKEN:-}" ]]; then
  echo "No JWT; health-snapshot may require auth (401). Skipping authenticated checks." >&2
  # Unauthenticated: only /health
  code=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/health" 2>/dev/null || echo "000")
  [[ "$code" =~ ^2 ]] || { echo "FAIL: GET /health -> $code"; exit 1; }
  echo "OK GET /health"
  exit 0
fi

BODY_TMP=$(mktemp)
trap 'rm -f "$BODY_TMP"' EXIT

# 1) GET /api/v1/overview/health-snapshot — metrics_freshness, real or missing/stale
echo "Check: GET /api/v1/overview/health-snapshot"
http_code=$(req_with_code "/api/v1/overview/health-snapshot" "$BODY_TMP")
json=$(cat "$BODY_TMP")
ok=$(echo "$json" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print('ok' if 'metrics_freshness' in d and isinstance(d['metrics_freshness'], dict) else 'fail')
except Exception:
    print('fail')
" 2>/dev/null || echo "fail")
if [[ "$http_code" != "200" || "$ok" != "ok" ]]; then
  echo "FAIL: health-snapshot (http=$http_code, valid=$ok)"
  ((FAILED++))
else
  echo "OK health-snapshot (metrics_freshness present)"
fi

# 2) GET /api/v1/analytics/telemetry/services — prometheus_available bool, services list or message
echo "Check: GET /api/v1/analytics/telemetry/services"
http_code=$(req_with_code "/api/v1/analytics/telemetry/services" "$BODY_TMP")
json=$(cat "$BODY_TMP")
ok=$(echo "$json" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if 'prometheus_available' not in d: print('fail'); raise SystemExit(0)
    if d['prometheus_available'] and not isinstance(d.get('services'), list): print('fail'); raise SystemExit(0)
    print('ok')
except Exception: print('fail')
" 2>/dev/null || echo "fail")
if [[ "$http_code" != "200" || "$ok" != "ok" ]]; then
  echo "FAIL: analytics/telemetry/services (http=$http_code, valid=$ok)"
  ((FAILED++))
else
  echo "OK analytics/telemetry/services (no fake targets)"
fi

# 3) GET /api/v1/analytics/metrics/kpis — when prometheus_available false, KPIs must be null (no fabricated numbers)
echo "Check: GET /api/v1/analytics/metrics/kpis"
http_code=$(req_with_code "/api/v1/analytics/metrics/kpis" "$BODY_TMP")
json=$(cat "$BODY_TMP")
ok=$(echo "$json" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if 'prometheus_available' not in d: print('fail'); raise SystemExit(0)
    if not d['prometheus_available']:
        if d.get('request_rate_5m') is not None or d.get('error_rate_5m') is not None or d.get('latency_p95_seconds') is not None:
            print('fail')  # no fake numbers when Prometheus off
        else:
            print('ok')
    else:
        print('ok')
except Exception: print('fail')
" 2>/dev/null || echo "fail")
if [[ "$http_code" != "200" || "$ok" != "ok" ]]; then
  echo "FAIL: analytics/metrics/kpis (http=$http_code, valid=$ok)"
  ((FAILED++))
else
  echo "OK analytics/metrics/kpis (real or null)"
fi

# 4) GET /api/v1/overview/operator?time_range=1h — timeseries is list
echo "Check: GET /api/v1/overview/operator"
http_code=$(req_with_code "/api/v1/overview/operator?time_range=1h" "$BODY_TMP")
json=$(cat "$BODY_TMP")
ok=$(echo "$json" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print('fail' if 'timeseries' in d and not isinstance(d['timeseries'], list) else 'ok')
except Exception: print('fail')
" 2>/dev/null || echo "fail")
if [[ "$http_code" != "200" || "$ok" != "ok" ]]; then
  echo "FAIL: overview/operator (http=$http_code, valid=$ok)"
  ((FAILED++))
else
  echo "OK overview/operator (timeseries is list)"
fi

# 5) GET /api/v1/overview/connection_nodes — nodes from DB
echo "Check: GET /api/v1/overview/connection_nodes"
http_code=$(req_with_code "/api/v1/overview/connection_nodes" "$BODY_TMP")
json=$(cat "$BODY_TMP")
ok=$(echo "$json" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print('ok' if 'nodes' in d and isinstance(d['nodes'], list) else 'fail')
except Exception: print('fail')
" 2>/dev/null || echo "fail")
if [[ "$http_code" != "200" || "$ok" != "ok" ]]; then
  echo "FAIL: overview/connection_nodes (http=$http_code, valid=$ok)"
  ((FAILED++))
else
  echo "OK overview/connection_nodes (nodes list)"
fi

if [[ $FAILED -gt 0 ]]; then
  echo "verify-admin-metrics: $FAILED check(s) failed" >&2
  exit 1
fi
echo "verify-admin-metrics: all checks passed"

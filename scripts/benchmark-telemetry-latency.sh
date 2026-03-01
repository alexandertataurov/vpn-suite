#!/usr/bin/env bash
# Benchmark telemetry endpoints: snapshot and operator.
set -euo pipefail
IFS=$'\n\t'

BASE_URL="${BASE_URL:-http://127.0.0.1:8000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}"
N="${N:-50}"
[[ "$N" =~ ^[0-9]+$ ]] || { echo "N must be numeric" >&2; exit 1; }

echo "=== Telemetry latency benchmark ==="
echo "BASE_URL=$BASE_URL  N=$N"
echo ""

TOKEN="$(curl -sS --max-time 10 -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)"
[[ -n "$TOKEN" ]] || { echo "Failed to get JWT"; exit 1; }

echo "--- GET /api/v1/telemetry/snapshot?scope=all ---"
SNAPSHOT_TIMES=()
for _ in $(seq 1 "$N"); do
  t="$(curl -sS --max-time 10 -o /dev/null -w "%{time_total}" -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/v1/telemetry/snapshot?scope=all")"
  SNAPSHOT_TIMES+=("$t")
done
printf '%s\n' "${SNAPSHOT_TIMES[@]}" | sort -n | awk -v n=$N '
  NR==1 { min=$1 }
  { sum+=$1; a[NR]=$1 }
  END {
    if (n==0) exit;
    p50=int(n*0.5); p95=int(n*0.95); p99=int(n*0.99);
    printf "  min=%.3fs  max=%.3fs  avg=%.3fs\n", min, $1, sum/NR;
    printf "  P50=%.3fs  P95=%.3fs  P99=%.3fs\n", a[p50]?a[p50]:a[1], a[p95]?a[p95]:a[NR], a[p99]?a[p99]:a[NR];
  }'

echo ""
echo "--- GET /api/v1/overview/operator?time_range=1h ---"
OP_TIMES=()
for _ in $(seq 1 "$N"); do
  t="$(curl -sS --max-time 10 -o /dev/null -w "%{time_total}" -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/v1/overview/operator?time_range=1h")"
  OP_TIMES+=("$t")
done
printf '%s\n' "${OP_TIMES[@]}" | sort -n | awk -v n=$N '
  NR==1 { min=$1 }
  { sum+=$1; a[NR]=$1 }
  END {
    if (n==0) exit;
    p50=int(n*0.5); p95=int(n*0.95); p99=int(n*0.99);
    printf "  min=%.3fs  max=%.3fs  avg=%.3fs\n", min, $1, sum/NR;
    printf "  P50=%.3fs  P95=%.3fs  P99=%.3fs\n", a[p50]?a[p50]:a[1], a[p95]?a[p95]:a[NR], a[p99]?a[p99]:a[NR];
  }'

echo ""
echo "Done. Target: snapshot P95 < 0.2s, operator P95 < 2s (cached)."

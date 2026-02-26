#!/usr/bin/env bash
# Benchmark telemetry endpoints: snapshot (cache) and operator (snapshot-first + Prom).
# Usage: BASE_URL=http://127.0.0.1:8000 ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=admin ./scripts/benchmark-telemetry-latency.sh

set -e
BASE_URL="${BASE_URL:-http://127.0.0.1:8000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}"
N="${N:-50}"

echo "=== Telemetry latency benchmark ==="
echo "BASE_URL=$BASE_URL  N=$N"
echo ""

# Get JWT
TOKEN=$(curl -sS --max-time 5 -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
if [ -z "$TOKEN" ]; then
  echo "Failed to get JWT (login failed or no access_token)"
  exit 1
fi

# Collect latencies (seconds) for snapshot
echo "--- GET /api/v1/telemetry/snapshot?scope=all (cache) ---"
SNAPSHOT_TIMES=""
for i in $(seq 1 "$N"); do
  t=$(curl -sS -o /dev/null -w "%{time_total}" -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/v1/telemetry/snapshot?scope=all")
  SNAPSHOT_TIMES="$SNAPSHOT_TIMES $t"
done
echo "$SNAPSHOT_TIMES" | tr ' ' '\n' | sort -n | awk -v n=$N '
  NR==1 { min=$1 }
  { sum+=$1; a[NR]=$1 }
  END {
    if (n==0) exit;
    p50=(n*0.5); p95=(n*0.95); p99=(n*0.99);
    printf "  min=%.3fs  max=%.3fs  avg=%.3fs\n", min, $1, sum/NR;
    printf "  P50=%.3fs  P95=%.3fs  P99=%.3fs  (approx)\n", a[int(p50)]?a[int(p50)]:a[1], a[int(p95)]?a[int(p95)]:a[NR], a[int(p99)]?a[int(p99)]:a[NR];
  }'

# Collect latencies for operator
echo ""
echo "--- GET /api/v1/overview/operator?time_range=1h ---"
OP_TIMES=""
for i in $(seq 1 "$N"); do
  t=$(curl -sS -o /dev/null -w "%{time_total}" -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/v1/overview/operator?time_range=1h")
  OP_TIMES="$OP_TIMES $t"
done
echo "$OP_TIMES" | tr ' ' '\n' | sort -n | awk -v n=$N '
  NR==1 { min=$1 }
  { sum+=$1; a[NR]=$1 }
  END {
    if (n==0) exit;
    p50=(n*0.5); p95=(n*0.95); p99=(n*0.99);
    printf "  min=%.3fs  max=%.3fs  avg=%.3fs\n", min, $1, sum/NR;
    printf "  P50=%.3fs  P95=%.3fs  P99=%.3fs  (approx)\n", a[int(p50)]?a[int(p50)]:a[1], a[int(p95)]?a[int(p95)]:a[NR], a[int(p99)]?a[int(p99)]:a[NR];
  }'

echo ""
echo "Done. Target: snapshot P95 < 0.2s, operator P95 < 2s (cached)."

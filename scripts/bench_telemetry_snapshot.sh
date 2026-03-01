#!/usr/bin/env bash
# Benchmark GET /telemetry/snapshot.
set -euo pipefail
IFS=$'\n\t'
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
BASE_URL="${BASE_URL:-http://127.0.0.1:8000}"
SCOPE="${SCOPE:-all}"
FIELDS="${FIELDS:-}"
source scripts/lib/env.sh 2>/dev/null || true
resolve_env_file || true
[[ -n "${ENV_FILE:-}" && -f "$ENV_FILE" ]] && load_env_file "$ENV_FILE" || true

if [[ -z "${ADMIN_EMAIL:-}" || -z "${ADMIN_PASSWORD:-}" ]]; then
  echo "Set ADMIN_EMAIL and ADMIN_PASSWORD (or ENV_FILE) to run bench_telemetry_snapshot.sh"
  exit 1
fi

TOKEN="$(curl -sS --max-time 10 -X POST "$BASE_URL/api/v1/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)"
[[ -n "$TOKEN" ]] || { echo "Login failed"; exit 1; }
AUTH="Authorization: Bearer $TOKEN"

URL="$BASE_URL/api/v1/telemetry/snapshot?scope=$SCOPE"
[[ -n "$FIELDS" ]] && URL="$URL&fields=$FIELDS"
echo "=== GET $URL ==="

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
r="$(curl -sS --max-time 15 -w "\n%{http_code}\t%{time_total}\t%{size_download}" -H "$AUTH" "$URL" -o "$tmp")"
code="$(echo "$r" | tail -1 | cut -f1)"
time="$(echo "$r" | tail -1 | cut -f2)"
size="$(echo "$r" | tail -1 | cut -f3)"
echo "status=$code  time_total=${time}s  size=$size bytes"

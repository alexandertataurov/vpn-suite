#!/usr/bin/env bash
# Benchmark GET /devices and GET /devices/summary.
set -euo pipefail
IFS=$'\n\t'
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
BASE_URL="${BASE_URL:-http://127.0.0.1:8000}"
source scripts/lib/env.sh 2>/dev/null || true
[[ -n "${ENV_FILE:-}" && -f "$ENV_FILE" ]] && source "$ENV_FILE" || true
[[ -n "${ADMIN_EMAIL:-}" && -n "${ADMIN_PASSWORD:-}" ]] || { echo "Set ADMIN_EMAIL and ADMIN_PASSWORD"; exit 1; }
TOKEN="$(curl -sS --max-time 10 -X POST "$BASE_URL/api/v1/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)"
[[ -n "$TOKEN" ]] || { echo "Login failed"; exit 1; }

tmp1="$(mktemp)"
tmp2="$(mktemp)"
trap 'rm -f "$tmp1" "$tmp2"' EXIT

echo "=== GET /api/v1/devices?limit=100 ==="
curl -sS --max-time 10 -w " %{http_code} %{time_total}s %{size_download}B\n" -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/v1/devices?limit=100" -o "$tmp1"
echo "=== GET /api/v1/devices/summary ==="
curl -sS --max-time 10 -w " %{http_code} %{time_total}s %{size_download}B\n" -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/v1/devices/summary" -o "$tmp2"

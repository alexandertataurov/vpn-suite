#!/usr/bin/env bash
# Benchmark GET /devices and GET /devices/summary. Set ADMIN_EMAIL, ADMIN_PASSWORD.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
BASE_URL="${BASE_URL:-http://127.0.0.1:8000}"
source scripts/lib/env.sh 2>/dev/null || true
[[ -n "${ENV_FILE:-}" && -f "$ENV_FILE" ]] && source "$ENV_FILE" || true
[[ -z "${ADMIN_EMAIL:-}" || -z "${ADMIN_PASSWORD:-}" ]] && { echo "Set ADMIN_EMAIL and ADMIN_PASSWORD"; exit 1; }
TOKEN=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" -H "Content-Type: application/json" -d '{"email":"'"$ADMIN_EMAIL"'","password":"'"$ADMIN_PASSWORD"'"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
[[ -z "$TOKEN" ]] && { echo "Login failed"; exit 1; }
echo "=== GET /api/v1/devices?limit=100 ==="
curl -s -w " %{http_code} %{time_total}s %{size_download}B\n" -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/v1/devices?limit=100" -o /tmp/bd
echo "=== GET /api/v1/devices/summary ==="
curl -s -w " %{http_code} %{time_total}s %{size_download}B\n" -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/v1/devices/summary" -o /tmp/bs

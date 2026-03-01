#!/usr/bin/env bash
# Call admin API: get token, reissue device, or create server action.
# Usage: call_admin_api.sh get_token | reissue <device_id> | create_action <server_id> <type>
# Env: API_TOKEN (Bearer), or ADMIN_EMAIL + ADMIN_PASSWORD for login. ADMIN_API_URL (default http://127.0.0.1:8000).
set -euo pipefail
IFS=$'\n\t'

need() { command -v "$1" >/dev/null 2>&1 || { echo "missing dependency: $1" >&2; exit 1; }; }
need curl
need python3

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Load env so ADMIN_EMAIL, ADMIN_PASSWORD, PUBLIC_DOMAIN available
ENV_FILE="${ENV_FILE:-.env}"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck source=scripts/lib/env.sh
  source "$ROOT/scripts/lib/env.sh"
  resolve_env_file || true
  load_env_file "$ENV_FILE" 2>/dev/null || true
fi

BASE_URL="${ADMIN_API_URL:-http://127.0.0.1:8000}"
BASE_URL="${BASE_URL%/}"

_get_token() {
  if [[ -n "${API_TOKEN:-}" ]]; then
    echo "$API_TOKEN"
    return
  fi
  local email="${ADMIN_EMAIL:-}"
  local pass="${ADMIN_PASSWORD:-}"
  if [[ -z "$email" || -z "$pass" ]]; then
    echo "ERROR: Set API_TOKEN or ADMIN_EMAIL and ADMIN_PASSWORD." >&2
    return 1
  fi
  local json
  json="$(curl -sS --max-time 10 -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$pass\"}" 2>/dev/null || true)"
  if [[ -z "$json" ]]; then
    echo "ERROR: Login failed (no response). Is admin-api reachable at $BASE_URL?" >&2
    return 1
  fi
  python3 - <<'PY' <<<"$json" || {
    echo "ERROR: Login failed. Check ADMIN_EMAIL/ADMIN_PASSWORD or API_TOKEN." >&2
    return 1
  }
import json,sys
data=json.loads(sys.stdin.read())
print(data["access_token"])
PY
}

_reissue() {
  local device_id="$1"
  local token
  token="$(_get_token)" || exit 1
  local http_code out body
  out=$(curl -sS --max-time 10 -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/devices/$device_id/reissue" \
    -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "{}" 2>/dev/null || true)
  http_code=$(echo "$out" | tail -n1)
  body=$(echo "$out" | sed '$d')
  if [[ "$http_code" = "409" ]]; then
    echo "Reissue blocked: server public key not verified." >&2
    echo "Run: ./manage.sh server:sync <server_id>  (then retry device:reissue)." >&2
    exit 1
  fi
  if [[ "$http_code" != "200" ]]; then
    echo "ERROR: Reissue failed (HTTP $http_code). Response: $body" >&2
    exit 1
  fi
  echo "$body"
}

_create_action() {
  local server_id="$1"
  local type="$2"
  local token
  token="$(_get_token)" || exit 1
  local http_code out body
  out=$(curl -sS --max-time 10 -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/servers/$server_id/actions" \
    -H "Authorization: Bearer $token" -H "Content-Type: application/json" \
    -d "{\"type\":\"$type\"}" 2>/dev/null || true)
  http_code=$(echo "$out" | tail -n1)
  body=$(echo "$out" | sed '$d')
  if [[ "$http_code" != "201" && "$http_code" != "200" ]]; then
    echo "ERROR: Create action failed (HTTP $http_code). Response: $body" >&2
    exit 1
  fi
  echo "$body"
}

case "${1:-}" in
  get_token) _get_token ;;
  reissue)
    [[ -z "${2:-}" ]] && { echo "Usage: $0 reissue <device_id>" >&2; exit 1; }
    _reissue "$2"
    ;;
  create_action)
    [[ -z "${2:-}" || -z "${3:-}" ]] && { echo "Usage: $0 create_action <server_id> <type>" >&2; exit 1; }
    _create_action "$2" "$3"
    ;;
  *)
    echo "Usage: $0 get_token | reissue <device_id> | create_action <server_id> <type>" >&2
    exit 1
    ;;
esac

#!/usr/bin/env bash
# Sync AmneziaWG H1–H4 from control-plane desired-state to node env and restart container.
set -euo pipefail
IFS=$'\n\t'

need() { command -v "$1" >/dev/null 2>&1 || { echo "missing dependency: $1" >&2; exit 1; }; }
need curl
need python3

NODE_ENV_PATH="${NODE_ENV_PATH:-${AMNEZIA_NODE_ENV_PATH:-./secrets/node.env}}"
[[ -f "$NODE_ENV_PATH" ]] || { echo "NODE_ENV_PATH not found: $NODE_ENV_PATH" >&2; exit 1; }

: "${CONTROL_PLANE_URL:?Set CONTROL_PLANE_URL}"
: "${SERVER_ID:?Set SERVER_ID}"
: "${AGENT_SHARED_TOKEN:?Set AGENT_SHARED_TOKEN}"

URL="${CONTROL_PLANE_URL%/}/api/v1/agent/desired-state?server_id=$SERVER_ID"
DATA="$(curl -fsS --max-time 10 -H "X-Agent-Token: $AGENT_SHARED_TOKEN" "$URL" 2>/dev/null || true)"
[[ -n "$DATA" ]] || { echo "Failed to fetch desired-state from $URL" >&2; exit 1; }

if command -v jq >/dev/null 2>&1; then
  H1="$(echo "$DATA" | jq -r '.obfuscation_h.h1 // empty')"
  H2="$(echo "$DATA" | jq -r '.obfuscation_h.h2 // empty')"
  H3="$(echo "$DATA" | jq -r '.obfuscation_h.h3 // empty')"
  H4="$(echo "$DATA" | jq -r '.obfuscation_h.h4 // empty')"
else
  read -r H1 H2 H3 H4 < <(python3 - <<'PY'
import json,sys
d=json.loads(sys.stdin.read() or "{}").get("obfuscation_h") or {}
print(d.get("h1",""), d.get("h2",""), d.get("h3",""), d.get("h4",""))
PY
<<<"$DATA")
fi

if [[ -z "$H1" || -z "$H2" || -z "$H3" || -z "$H4" ]]; then
  echo "No obfuscation_h in desired-state (or parse failed); skipping."
  exit 0
fi

CURRENT="$(grep -E '^AWG_H[1-4]=' "$NODE_ENV_PATH" 2>/dev/null | sort | tr '\n' ' ')"
if [[ "$CURRENT" == *"AWG_H1=$H1"* && "$CURRENT" == *"AWG_H2=$H2"* && "$CURRENT" == *"AWG_H3=$H3"* && "$CURRENT" == *"AWG_H4=$H4"* ]]; then
  echo "H keys already in sync."
  exit 0
fi

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
while IFS= read -r line; do
  case "$line" in
    AWG_H1=*) echo "AWG_H1=$H1" ;;
    AWG_H2=*) echo "AWG_H2=$H2" ;;
    AWG_H3=*) echo "AWG_H3=$H3" ;;
    AWG_H4=*) echo "AWG_H4=$H4" ;;
    *) echo "$line" ;;
  esac
done < "$NODE_ENV_PATH" > "$TMP"

if ! grep -q '^AWG_H1=' "$TMP"; then
  {
    echo "AWG_H1=$H1"
    echo "AWG_H2=$H2"
    echo "AWG_H3=$H3"
    echo "AWG_H4=$H4"
  } >> "$TMP"
fi

mv "$TMP" "$NODE_ENV_PATH"
echo "Updated $NODE_ENV_PATH with new H keys"

AWG_DIR="$(cd "$(dirname "$(dirname "$NODE_ENV_PATH")")" && pwd)"
if [[ -f "$AWG_DIR/manage.sh" ]]; then
  (cd "$AWG_DIR" && ./manage.sh down && ./manage.sh up)
  echo "Restarted AmneziaWG stack in $AWG_DIR"
else
  docker restart amnezia-awg 2>/dev/null || echo "Could not restart amnezia-awg (run from amnezia-awg2 dir or set NODE_ENV_PATH)"
fi

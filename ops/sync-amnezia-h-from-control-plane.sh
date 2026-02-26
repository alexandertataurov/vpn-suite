#!/usr/bin/env bash
# Sync AmneziaWG H1–H4 from control-plane desired-state to node env and restart container.
# Run on the VPN host (where amnezia-awg2 runs). Use cron or systemd timer for auto-sync.
#
# Required env (or set in .env next to this script):
#   CONTROL_PLANE_URL   e.g. https://vpn.example.com:8443
#   SERVER_ID           server_id from Admin (e.g. node-01)
#   AGENT_SHARED_TOKEN  from vpn-suite .env
#   NODE_ENV_PATH       path to node.env (default: ./secrets/node.env relative to script dir or CWD)
#
# Usage: cd /opt/amnezia/amnezia-awg2 && ./scripts/sync-amnezia-h-from-control-plane.sh
#    or: CONTROL_PLANE_URL=... SERVER_ID=... AGENT_SHARED_TOKEN=... bash /opt/vpn-suite/ops/sync-amnezia-h-from-control-plane.sh

set -e

# NODE_ENV_PATH: path to node.env (AWG_H1..H4). Default: ./secrets/node.env (run from amnezia-awg2 dir).
NODE_ENV_PATH="${NODE_ENV_PATH:-${AMNEZIA_NODE_ENV_PATH:-./secrets/node.env}}"
if [[ ! -f "$NODE_ENV_PATH" ]]; then
  echo "NODE_ENV_PATH not found: $NODE_ENV_PATH (run from amnezia-awg2 or set NODE_ENV_PATH)" >&2
  exit 1
fi

if [[ -z "$CONTROL_PLANE_URL" ]] || [[ -z "$SERVER_ID" ]] || [[ -z "$AGENT_SHARED_TOKEN" ]]; then
  echo "Set CONTROL_PLANE_URL, SERVER_ID, AGENT_SHARED_TOKEN (and optionally NODE_ENV_PATH)" >&2
  exit 1
fi

URL="${CONTROL_PLANE_URL%/}/api/v1/agent/desired-state?server_id=$SERVER_ID"
DATA=$(curl -sS -H "X-Agent-Token: $AGENT_SHARED_TOKEN" "$URL" 2>/dev/null || true)
if [[ -z "$DATA" ]]; then
  echo "Failed to fetch desired-state from $URL" >&2
  exit 1
fi

if command -v jq >/dev/null 2>&1; then
  OBJ=$(echo "$DATA" | jq -r '.obfuscation_h // empty')
  [[ -z "$OBJ" ]] && { echo "No obfuscation_h in desired-state; skipping."; exit 0; }
  H1=$(echo "$OBJ" | jq -r '.h1')
  H2=$(echo "$OBJ" | jq -r '.h2')
  H3=$(echo "$OBJ" | jq -r '.h3')
  H4=$(echo "$OBJ" | jq -r '.h4')
else
  H1=$(echo "$DATA" | python3 -c "import sys,json; d=json.load(sys.stdin).get('obfuscation_h'); print(d['h1'] if d else '')" 2>/dev/null || true)
  H2=$(echo "$DATA" | python3 -c "import sys,json; d=json.load(sys.stdin).get('obfuscation_h'); print(d['h2'] if d else '')" 2>/dev/null || true)
  H3=$(echo "$DATA" | python3 -c "import sys,json; d=json.load(sys.stdin).get('obfuscation_h'); print(d['h3'] if d else '')" 2>/dev/null || true)
  H4=$(echo "$DATA" | python3 -c "import sys,json; d=json.load(sys.stdin).get('obfuscation_h'); print(d['h4'] if d else '')" 2>/dev/null || true)
fi

if [[ -z "$H1" ]] || [[ -z "$H2" ]] || [[ -z "$H3" ]] || [[ -z "$H4" ]]; then
  echo "No obfuscation_h in desired-state (or parse failed); skipping."
  exit 0
fi

CURRENT=$(grep -E '^AWG_H[1-4]=' "$NODE_ENV_PATH" 2>/dev/null | sort | tr '\n' ' ')
WANT="AWG_H1=${H1} AWG_H2=${H2} AWG_H3=${H3} AWG_H4=${H4}"
if [[ "$CURRENT" == *"AWG_H1=$H1"* ]] && [[ "$CURRENT" == *"AWG_H2=$H2"* ]] && [[ "$CURRENT" == *"AWG_H3=$H3"* ]] && [[ "$CURRENT" == *"AWG_H4=$H4"* ]]; then
  echo "H keys already in sync."
  exit 0
fi

# Update or add AWG_H1..AWG_H4 in node.env (preserve other vars)
TMP=$(mktemp)
while IFS= read -r line; do
  if [[ "$line" =~ ^AWG_H1= ]]; then echo "AWG_H1=$H1"; elif [[ "$line" =~ ^AWG_H2= ]]; then echo "AWG_H2=$H2"; elif [[ "$line" =~ ^AWG_H3= ]]; then echo "AWG_H3=$H3"; elif [[ "$line" =~ ^AWG_H4= ]]; then echo "AWG_H4=$H4"; else echo "$line"; fi
done < "$NODE_ENV_PATH" > "$TMP"
if ! grep -q '^AWG_H1=' "$TMP"; then
  echo "AWG_H1=$H1" >> "$TMP"
  echo "AWG_H2=$H2" >> "$TMP"
  echo "AWG_H3=$H3" >> "$TMP"
  echo "AWG_H4=$H4" >> "$TMP"
fi
mv "$TMP" "$NODE_ENV_PATH"
echo "Updated $NODE_ENV_PATH with H1=$H1 H2=$H2 H3=$H3 H4=$H4"

# Restart AmneziaWG container so it picks up new env
AWG_DIR="$(cd "$(dirname "$(dirname "$NODE_ENV_PATH")")" && pwd)"
if [[ -f "$AWG_DIR/manage.sh" ]]; then
  (cd "$AWG_DIR" && ./manage.sh down && ./manage.sh up)
  echo "Restarted AmneziaWG stack in $AWG_DIR"
else
  docker restart amnezia-awg 2>/dev/null || echo "Could not restart amnezia-awg (run from amnezia-awg2 dir or set NODE_ENV_PATH)"
fi

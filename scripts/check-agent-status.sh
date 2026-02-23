#!/usr/bin/env bash
# Agent-mode troubleshooting: Redis heartbeats, env consistency, node-agent status.
# Run from project root.

set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== 1. Redis agent heartbeats ==="
docker exec vpn-suite-redis-1 redis-cli KEYS "agent:hb:*" 2>/dev/null || echo "(redis not running)"
for key in $(docker exec vpn-suite-redis-1 redis-cli KEYS "agent:hb:*" 2>/dev/null || true); do
  [ -z "$key" ] && continue
  echo "  $key:"
  docker exec vpn-suite-redis-1 redis-cli GET "$key" 2>/dev/null | head -c 300
  echo ""
done

echo ""
echo "=== 2. Control-plane env (NODE_DISCOVERY, REDIS_URL) ==="
source scripts/lib/env.sh
resolve_env_file
load_env_file "$ENV_FILE"
echo "  NODE_DISCOVERY=${NODE_DISCOVERY:-not set}"
echo "  REDIS_URL=${REDIS_URL:-not set}"
echo "  AGENT_SHARED_TOKEN set: $([ -n "${AGENT_SHARED_TOKEN:-}" ] && echo yes || echo no)"
echo "  AGENT_HEARTBEAT_TTL_SECONDS=${AGENT_HEARTBEAT_TTL_SECONDS:-120}"

echo ""
echo "=== 3. Node-agent checklist (run on each VPN host) ==="
echo "  - Is node-agent running? (systemctl status node-agent or docker ps | grep node-agent)"
echo "  - Can it reach Redis? (REDIS_URL must be reachable from host)"
echo "  - AGENT_SHARED_TOKEN must match control-plane .env"
echo "  - Server id in agent config must match servers.id in DB"

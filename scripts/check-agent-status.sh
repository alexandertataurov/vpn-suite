#!/usr/bin/env bash
# Agent-mode troubleshooting: Redis heartbeats, env consistency, node-agent status.
set -euo pipefail
IFS=$'\n\t'
cd "$(dirname "$0")/.."

command -v docker >/dev/null 2>&1 || { echo "docker not found" >&2; exit 1; }

echo "=== 1. Redis agent heartbeats ==="
if docker exec vpn-suite-redis-1 redis-cli PING >/dev/null 2>&1; then
  docker exec vpn-suite-redis-1 redis-cli --scan --pattern "agent:hb:*" 2>/dev/null | head -n 50
else
  echo "(redis not running)"
fi

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

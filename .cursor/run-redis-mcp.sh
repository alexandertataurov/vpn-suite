#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
set -euo pipefail

REDIS_MCP_URL="${REDIS_URL:-redis://127.0.0.1:6379/0}"
if [[ -f "$ROOT/.env" ]]; then
  REDIS_URL_FROM_ENV="$(sed -n 's/^REDIS_URL=//p' "$ROOT/.env" | tail -n 1)"
  if [[ -n "$REDIS_URL_FROM_ENV" ]]; then
    REDIS_MCP_URL="$REDIS_URL_FROM_ENV"
  fi
fi

REDIS_MCP_URL="${REDIS_MCP_URL/@redis:/@127.0.0.1:}"
REDIS_MCP_URL="${REDIS_MCP_URL/@localhost:/@127.0.0.1:}"
REDIS_MCP_URL="${REDIS_MCP_URL/redis:\/\/redis:/redis:\/\/127.0.0.1:}"
REDIS_MCP_URL="${REDIS_MCP_URL/redis:\/\/localhost:/redis:\/\/127.0.0.1:}"

exec npx -y @modelcontextprotocol/server-redis "$REDIS_MCP_URL"

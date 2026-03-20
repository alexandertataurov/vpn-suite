#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
set -euo pipefail
set -a
[[ -f "$ROOT/.env" ]] && source "$ROOT/.env"
set +a

REDIS_MCP_URL="${REDIS_URL:-redis://127.0.0.1:6379/0}"
REDIS_MCP_URL="${REDIS_MCP_URL/@redis:/@127.0.0.1:}"
REDIS_MCP_URL="${REDIS_MCP_URL/@localhost:/@127.0.0.1:}"

exec npx -y @modelcontextprotocol/server-redis "$REDIS_MCP_URL"

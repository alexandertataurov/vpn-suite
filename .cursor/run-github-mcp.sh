#!/usr/bin/env bash
# Load GITHUB_PERSONAL_ACCESS_TOKEN from .env and run GitHub MCP server
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
set -a
[[ -f "$ROOT/.env" ]] && source "$ROOT/.env"
set +a
exec npx -y @modelcontextprotocol/server-github

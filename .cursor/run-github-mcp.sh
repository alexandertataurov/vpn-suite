#!/usr/bin/env bash
# Load GITHUB_PERSONAL_ACCESS_TOKEN from .env and run GitHub MCP server
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -f "$ROOT/.env" ]]; then
  GITHUB_PERSONAL_ACCESS_TOKEN="$(sed -n 's/^GITHUB_PERSONAL_ACCESS_TOKEN=//p' "$ROOT/.env" | tail -n 1)"
  export GITHUB_PERSONAL_ACCESS_TOKEN
fi

exec npx -y @modelcontextprotocol/server-github

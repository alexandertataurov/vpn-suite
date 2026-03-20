#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
set -euo pipefail

if [[ -f "$ROOT/.env" ]]; then
  CONTEXT7_API_KEY="$(sed -n 's/^CONTEXT7_API_KEY=//p' "$ROOT/.env" | tail -n 1)"
  export CONTEXT7_API_KEY
fi

exec npx -y @upstash/context7-mcp

#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
set -euo pipefail
set -a
[[ -f "$ROOT/.env" ]] && source "$ROOT/.env"
set +a
exec npx -y @upstash/context7-mcp

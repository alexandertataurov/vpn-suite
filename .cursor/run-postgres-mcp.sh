#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
set -euo pipefail
set -a
[[ -f "$ROOT/.env" ]] && source "$ROOT/.env"
set +a

DB_URL="${DATABASE_URL:-}"
if [[ -z "$DB_URL" ]]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

DB_URL="${DB_URL/postgresql+asyncpg:/postgresql:}"
DB_URL="${DB_URL/@postgres:/@127.0.0.1:}"
DB_URL="${DB_URL/@localhost:/@127.0.0.1:}"

exec npx -y @modelcontextprotocol/server-postgres "$DB_URL"

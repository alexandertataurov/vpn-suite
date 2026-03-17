#!/usr/bin/env bash
# Sanitize local Postgres after restore from VPS: reset admin password, clear TOTP.
# Run seed_admin after to set admin password from local .env
# Usage: ./scripts/sanitize-local-db.sh
set -euo pipefail
IFS=$'\n\t'
cd "$(dirname "$0")/.."

log() { printf '%s\n' "$*" >&2; }

ENV_FILE="${ENV_FILE:-.env}"
[[ -f "$ENV_FILE" ]] || { log "ENV_FILE not found: $ENV_FILE"; exit 1; }

DC=(env ENV_FILE="$ENV_FILE" docker compose --env-file "$ENV_FILE" -f docker-compose.yml)
CID=$("${DC[@]}" ps -q postgres 2>/dev/null || true)
[[ -n "$CID" ]] || { log "Postgres not running. Start with: ./manage.sh up-core"; exit 2; }

PG_USER="${POSTGRES_USER:-postgres}"
PG_DB="${POSTGRES_DB:-vpn_admin}"

log "Clearing admin TOTP secrets..."
docker exec -i "$CID" psql -U "$PG_USER" -d "$PG_DB" -c \
  "UPDATE admin_users SET totp_secret = NULL WHERE totp_secret IS NOT NULL;"

log "Resetting admin password from local .env (via seed_admin)..."
"${DC[@]}" run --rm admin-api python scripts/seed_admin.py

log "Sanitization done. Restart admin-api: docker compose restart admin-api"

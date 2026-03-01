#!/usr/bin/env bash
# Backup Postgres + Redis. Run from repo root; requires core stack up. Needs .env.
set -euo pipefail
IFS=$'\n\t'

REPO_ROOT="${REPO_ROOT:-/opt/vpn-suite}"
BACKUP_DIR="${BACKUP_DIR:-$REPO_ROOT/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
ENV_FILE="${ENV_FILE:-$REPO_ROOT/.env}"

mkdir -p "$BACKUP_DIR"
cd "$REPO_ROOT"

source scripts/lib/env.sh
resolve_env_file || true
load_env_file "$ENV_FILE"

DC=(env ENV_FILE="$ENV_FILE" docker compose --env-file "$ENV_FILE")

# Postgres
if "${DC[@]}" ps postgres --status running -q 2>/dev/null | grep -q .; then
  export PGPASSWORD="${POSTGRES_PASSWORD:-}"
  out="$BACKUP_DIR/vpn_admin_$(date +%Y%m%d_%H%M).dump"
  tmp="${out}.tmp"
  "${DC[@]}" exec -T postgres pg_dump -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-vpn_admin}" -F c > "$tmp"
  mv "$tmp" "$out"
  unset PGPASSWORD
fi

# Redis (trigger BGSAVE and copy; path may vary by image)
if "${DC[@]}" ps redis --status running -q 2>/dev/null | grep -q .; then
  "${DC[@]}" exec -T redis redis-cli BGSAVE || true
  sleep 2
  "${DC[@]}" cp redis:/data/dump.rdb "$BACKUP_DIR/redis_$(date +%Y%m%d_%H%M).rdb" 2>/dev/null || true
fi

find "$BACKUP_DIR" -name 'vpn_admin_*.dump' -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name 'redis_*.rdb' -mtime +"$RETENTION_DAYS" -delete

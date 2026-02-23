#!/usr/bin/env bash
# Backup Postgres + Redis. Run from repo root; requires core stack up. Needs .env (POSTGRES_PASSWORD).
set -e
REPO_ROOT="${REPO_ROOT:-/opt/vpn-suite}"
BACKUP_DIR="${BACKUP_DIR:-$REPO_ROOT/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
mkdir -p "$BACKUP_DIR"
cd "$REPO_ROOT"
[ -f .env ] && set -a && . ./.env && set +a

# Postgres
if docker compose ps postgres --status running -q 2>/dev/null | grep -q .; then
  export PGPASSWORD="${POSTGRES_PASSWORD:-}"
  docker compose exec -T postgres pg_dump -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-vpn_admin}" -F c > "$BACKUP_DIR/vpn_admin_$(date +%Y%m%d_%H%M).dump"
  unset PGPASSWORD
fi

# Redis (trigger BGSAVE and copy; path may vary by image)
if docker compose ps redis --status running -q 2>/dev/null | grep -q .; then
  docker compose exec redis redis-cli BGSAVE
  sleep 2
  docker compose cp redis:/data/dump.rdb "$BACKUP_DIR/redis_$(date +%Y%m%d_%H%M).rdb" 2>/dev/null || true
fi

# Prune old backups
find "$BACKUP_DIR" -name 'vpn_admin_*.dump' -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name 'redis_*.rdb' -mtime +$RETENTION_DAYS -delete

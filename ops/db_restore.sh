#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [ "${1:-}" = "--force" ]; then
  shift
  FORCE=1
fi
FORCE="${FORCE:-0}"

DUMP_FILE="${1:-}"
if [ -z "$DUMP_FILE" ]; then
  echo "Usage: ENV_FILE=... $0 [--force] <path/to/pgdump_*.dump>" >&2
  exit 2
fi
if [ ! -f "$DUMP_FILE" ]; then
  echo "Dump file not found: $DUMP_FILE" >&2
  exit 2
fi
if [ "$FORCE" != "1" ]; then
  echo "Refusing to restore without --force (this will overwrite the current database)." >&2
  exit 2
fi

ENV_FILE="${ENV_FILE:-.env}"

DC=(env ENV_FILE="$ENV_FILE" docker compose --env-file "$ENV_FILE" -f docker-compose.yml)

CID="$("${DC[@]}" ps -q postgres)"
if [ -z "$CID" ]; then
  echo "postgres container is not running" >&2
  exit 2
fi

docker cp "$DUMP_FILE" "$CID:/tmp/restore.dump"
docker exec -i "$CID" sh -ec 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-privileges /tmp/restore.dump'
docker exec -i "$CID" sh -ec 'rm -f /tmp/restore.dump' || true

echo "restored"


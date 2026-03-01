#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
cd "$(dirname "$0")/.."

log() { printf '%s\n' "$*" >&2; }

FORCE=0
if [[ "${1:-}" = "--force" ]]; then
  shift
  FORCE=1
fi

DUMP_FILE="${1:-}"
[[ -n "$DUMP_FILE" ]] || { log "Usage: ENV_FILE=... $0 [--force] <path/to/pgdump_*.dump>"; exit 2; }
[[ -f "$DUMP_FILE" ]] || { log "Dump file not found: $DUMP_FILE"; exit 2; }
[[ "$FORCE" == "1" ]] || { log "Refusing to restore without --force (overwrites DB)."; exit 2; }

ENV_FILE="${ENV_FILE:-.env}"
[[ -f "$ENV_FILE" ]] || { log "ENV_FILE not found: $ENV_FILE"; exit 1; }

DC=(env ENV_FILE="$ENV_FILE" docker compose --env-file "$ENV_FILE" -f docker-compose.yml)

CID="$(${DC[@]} ps -q postgres || true)"
[[ -n "$CID" ]] || { log "postgres container is not running"; exit 2; }

trap 'docker exec -i "$CID" sh -ec "rm -f /tmp/restore.dump" >/dev/null 2>&1 || true' EXIT

docker cp "$DUMP_FILE" "$CID:/tmp/restore.dump"
docker exec -i "$CID" sh -ec 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-privileges /tmp/restore.dump'
docker exec -i "$CID" sh -ec 'rm -f /tmp/restore.dump' || true

log "restored"

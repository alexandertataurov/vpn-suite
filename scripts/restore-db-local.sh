#!/usr/bin/env bash
# Restore Postgres dump into local Docker postgres.
# Usage: ./scripts/restore-db-local.sh [path/to/pgdump_*.dump]
# Requires: core stack up (postgres running)
set -euo pipefail
IFS=$'\n\t'
cd "$(dirname "$0")/.."

log() { printf '%s\n' "$*" >&2; }

DUMP_FILE="${1:-}"
if [[ -z "$DUMP_FILE" ]]; then
  LATEST=$(ls -t snapshots/pgdump_*.dump 2>/dev/null | head -1)
  [[ -n "$LATEST" ]] || { log "Usage: $0 <path/to/pgdump_*.dump>"; log "Or place dump in snapshots/ and run without args"; exit 2; }
  DUMP_FILE="$LATEST"
  log "Using latest: $DUMP_FILE"
fi

[[ -f "$DUMP_FILE" ]] || { log "Dump not found: $DUMP_FILE"; exit 2; }

log "Restoring $DUMP_FILE (overwrites local DB)..."
./manage.sh restore-db --force "$DUMP_FILE"

log "Restored. Run ./scripts/sanitize-local-db.sh next."

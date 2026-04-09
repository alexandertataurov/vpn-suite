#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
cd "$(dirname "$0")/.."

log() { printf '%s\n' "$*" >&2; }

ENV_FILE="${ENV_FILE:-.env}"
[[ -f "$ENV_FILE" ]] || { log "ENV_FILE not found: $ENV_FILE"; exit 1; }

DC=(env ENV_FILE="$ENV_FILE" docker compose --env-file "$ENV_FILE" -f infra/compose/docker-compose.yml)

TS="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_DIR="${OUT_DIR:-backups/postgres}"
RETENTION_COUNT="${RETENTION_COUNT:-14}"

umask 077
mkdir -p "$OUT_DIR"

OUT_FILE="$OUT_DIR/pgdump_${TS}.dump"
TMP_FILE="${OUT_FILE}.tmp"

CID="$(${DC[@]} ps -q postgres || true)"
[[ -n "$CID" ]] || { log "postgres container is not running"; exit 1; }

"${DC[@]}" exec -T postgres sh -ec 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -Z 6' >"$TMP_FILE"
mv "$TMP_FILE" "$OUT_FILE"
chmod 600 "$OUT_FILE" || true

export OUT_DIR
python3 - <<'PY' || true
import os
from pathlib import Path
out_dir = Path(os.environ.get("OUT_DIR", "backups/postgres"))
keep = int(os.environ.get("RETENTION_COUNT", "14"))
if keep <= 0:
    raise SystemExit(0)
files = sorted(out_dir.glob("pgdump_*.dump"), key=lambda p: p.stat().st_mtime, reverse=True)
for p in files[keep:]:
    try: p.unlink()
    except Exception: pass
PY

log "$OUT_FILE"

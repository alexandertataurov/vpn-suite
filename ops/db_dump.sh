#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE="${ENV_FILE:-.env}"

DC=(env ENV_FILE="$ENV_FILE" docker compose --env-file "$ENV_FILE" -f docker-compose.yml)

TS="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_DIR="${OUT_DIR:-backups/postgres}"
RETENTION_COUNT="${RETENTION_COUNT:-14}"

umask 077
mkdir -p "$OUT_DIR"

OUT_FILE="$OUT_DIR/pgdump_${TS}.dump"

# Custom format (-Fc) is compressed and suitable for pg_restore.
"${DC[@]}" exec -T postgres sh -ec 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -Z 6' >"$OUT_FILE"
chmod 600 "$OUT_FILE" || true

# Best-effort retention (keep newest N).
python3 - <<'PY' || true
import os
from pathlib import Path

out_dir = Path(os.environ["OUT_DIR"])
keep = int(os.environ.get("RETENTION_COUNT", "14"))
if keep <= 0:
    raise SystemExit(0)

files = sorted(out_dir.glob("pgdump_*.dump"), key=lambda p: p.stat().st_mtime, reverse=True)
for p in files[keep:]:
    try:
        p.unlink()
    except Exception:
        pass
PY

echo "$OUT_FILE"

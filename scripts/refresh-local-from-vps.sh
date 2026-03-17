#!/usr/bin/env bash
# Full refresh: dump from VPS -> download -> restore -> sanitize
# Usage: VPS_HOST=deploy@vpn.example.com ./scripts/refresh-local-from-vps.sh
set -euo pipefail
IFS=$'\n\t'
cd "$(dirname "$0")/.."

log() { printf '%s\n' "$*" >&2; }

VPS_HOST="${VPS_HOST:?Set VPS_HOST (e.g. deploy@vpn.example.com)}"

log "1. Dump and download from VPS..."
./scripts/dump-db-from-vps.sh

log "2. Ensure core is up..."
./manage.sh up-core 2>/dev/null || true

log "3. Restore into local postgres..."
./scripts/restore-db-local.sh

log "4. Sanitize (reset admin, clear TOTP)..."
./scripts/sanitize-local-db.sh

log "5. Restart admin-api..."
./manage.sh up-core

log "Refresh complete. Use ADMIN_EMAIL/ADMIN_PASSWORD from .env to log in."

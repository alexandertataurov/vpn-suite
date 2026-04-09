#!/usr/bin/env bash
# Dump Postgres on VPS and download to local snapshots/
# Usage: VPS_HOST=deploy@vpn.example.com ./infra/scripts/runtime/dump-db-from-vps.sh
set -euo pipefail
IFS=$'\n\t'
cd "$(dirname "$0")/../../.."

log() { printf '%s\n' "$*" >&2; }

VPS_HOST="${VPS_HOST:?Set VPS_HOST (e.g. deploy@vpn.example.com)}"
REMOTE_PATH="${REMOTE_PATH:-/opt/vpn-suite}"
SNAPSHOTS_DIR="${SNAPSHOTS_DIR:-snapshots}"

umask 077
mkdir -p "$SNAPSHOTS_DIR"

log "Creating dump on VPS..."
ssh "$VPS_HOST" "cd $REMOTE_PATH && ./manage.sh backup-db"

# Get latest dump filename
REMOTE_DUMP=$(ssh "$VPS_HOST" "ls -t $REMOTE_PATH/backups/postgres/pgdump_*.dump 2>/dev/null | head -1")
[[ -n "$REMOTE_DUMP" ]] || { log "No dump found on VPS"; exit 1; }

LOCAL_FILE="$SNAPSHOTS_DIR/$(basename "$REMOTE_DUMP")"
log "Downloading $REMOTE_DUMP -> $LOCAL_FILE"
scp "$VPS_HOST:$REMOTE_DUMP" "$LOCAL_FILE"
chmod 600 "$LOCAL_FILE" 2>/dev/null || true

log "Done: $LOCAL_FILE"

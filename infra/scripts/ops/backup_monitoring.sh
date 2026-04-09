#!/usr/bin/env bash
# Backup monitoring config (Prometheus, Grafana provisioning, alert rules, etc.). Run from repo root.
set -euo pipefail
IFS=$'\n\t'
cd "$(dirname "$0")/.."

log() { printf '%s\n' "$*" >&2; }

OUT_DIR="${OUT_DIR:-backups/monitoring}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
[[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]] || { log "RETENTION_DAYS must be numeric"; exit 1; }

umask 077
mkdir -p "$OUT_DIR"

TS="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVE="$OUT_DIR/monitoring_config_${TS}.tar.gz"
tar czf "$ARCHIVE" -C . infra/monitoring/config
chmod 600 "$ARCHIVE" || true

find "$OUT_DIR" -name 'monitoring_config_*.tar.gz' -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
log "$ARCHIVE"

#!/usr/bin/env bash
# Periodic RAM + disk optimization. Run as root (e.g. via cron).
set -euo pipefail
IFS=$'\n\t'

LOG_TAG="[vpn-suite-optimize]"
log() { echo "$(date -Iseconds) $LOG_TAG $*"; }

[[ $EUID -eq 0 ]] || { log "Run as root."; exit 1; }
[[ "${FORCE:-0}" == "1" ]] || { log "Set FORCE=1 to proceed."; exit 1; }

log "start"

sync && echo 3 > /proc/sys/vm/drop_caches
log "dropped kernel caches"

if command -v docker >/dev/null 2>&1; then
  docker image prune -a -f 2>/dev/null || true
  docker builder prune -f 2>/dev/null || true
  log "docker prune done"
fi

if command -v journalctl >/dev/null 2>&1; then
  journalctl --vacuum-size=200M 2>/dev/null || true
  log "journal vacuum done"
fi

log "done"

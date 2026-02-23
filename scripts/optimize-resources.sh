#!/usr/bin/env bash
# Periodic RAM + disk optimization. Run as root (e.g. via cron).
set -e
LOG_TAG="[vpn-suite-optimize]"

log() { echo "$(date -Iseconds) $LOG_TAG $*"; }

log "start"

# RAM: drop reclaimable caches
sync && echo 3 > /proc/sys/vm/drop_caches
log "dropped kernel caches"

# Disk: Docker — unused images and build cache only (no volume prune)
if command -v docker >/dev/null 2>&1; then
  docker image prune -a -f 2>/dev/null || true
  docker builder prune -f 2>/dev/null || true
  log "docker prune done"
fi

# Disk: journal — keep last 200M
if command -v journalctl >/dev/null 2>&1; then
  journalctl --vacuum-size=200M 2>/dev/null || true
  log "journal vacuum done"
fi

log "done"

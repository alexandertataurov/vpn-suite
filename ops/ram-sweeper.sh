#!/usr/bin/env bash
# Safe RAM pressure relief: drop pagecache only when MemAvailable is low.
# Throttled: max once per 30 min. Run as root (cron).
set -euo pipefail

LOG_FILE="${LOG_FILE:-/var/log/vpn-suite-ram-sweeper.log}"
COOLDOWN_SEC=1800  # 30 min
MEM_THRESHOLD_KIB=512000  # 500 MiB - only act when MemAvailable < this

log() { echo "$(date -Iseconds) $*" >> "$LOG_FILE"; }

[[ $EUID -eq 0 ]] || { log "Run as root."; exit 1; }

mem_avail=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
swap_used=$(grep SwapTotal /proc/meminfo -A1 | grep SwapFree | awk '{print $2}' || true)
swap_total=$(grep SwapTotal /proc/meminfo | awk '{print $2}')
swap_used_kib=$((swap_total - ${swap_used:-0}))

if [[ "${mem_avail:-0}" -ge "$MEM_THRESHOLD_KIB" ]]; then
  exit 0
fi

if [[ -f /var/run/vpn-suite-ram-sweeper.cooldown ]]; then
  last=$(stat -c %Y /var/run/vpn-suite-ram-sweeper.cooldown 2>/dev/null || echo 0)
  now=$(date +%s)
  if (( now - last < COOLDOWN_SEC )); then
    exit 0
  fi
fi

log "pressure detected: MemAvailable=${mem_avail}KiB SwapUsed=${swap_used_kib}KiB; drop_caches mode=pagecache"
sync
echo 1 > /proc/sys/vm/drop_caches
touch /var/run/vpn-suite-ram-sweeper.cooldown
mem_after=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
log "done: MemAvailable=${mem_after}KiB SwapUsed=${swap_used_kib}KiB"

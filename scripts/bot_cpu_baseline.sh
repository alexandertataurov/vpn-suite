#!/usr/bin/env bash
# Collect CPU/mem samples. Run 5 min, sample every 10s.
set -euo pipefail
IFS=$'\n\t'

CONTAINER="${1:-vpn-suite-audit-telegram-vpn-bot-1}"
DURATION="${BOT_CPU_DURATION:-300}"
INTERVAL="${BOT_CPU_INTERVAL:-10}"

[[ "$DURATION" =~ ^[0-9]+$ ]] || { echo "DURATION must be numeric" >&2; exit 1; }
[[ "$INTERVAL" =~ ^[0-9]+$ ]] || { echo "INTERVAL must be numeric" >&2; exit 1; }
[[ "$INTERVAL" -gt 0 ]] || { echo "INTERVAL must be > 0" >&2; exit 1; }

count=$((DURATION / INTERVAL))
echo "# Container: $CONTAINER | Duration: ${DURATION}s | Interval: ${INTERVAL}s | Samples: $count"
echo "# Format: CPUPerc,MemUsage"
for _ in $(seq 1 "$count"); do
  docker stats --no-stream "$CONTAINER" --format "{{.CPUPerc}},{{.MemUsage}}" 2>/dev/null || true
  sleep "$INTERVAL"
done

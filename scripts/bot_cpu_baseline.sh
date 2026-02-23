#!/usr/bin/env bash
# Collect CPU/mem samples for vpn-suite-audit-telegram-vpn-bot-1. Run 5 min, sample every 10s.
# Usage: ./scripts/bot_cpu_baseline.sh [CONTAINER]

set -euo pipefail
CONTAINER="${1:-vpn-suite-audit-telegram-vpn-bot-1}"
DURATION="${BOT_CPU_DURATION:-300}"
INTERVAL="${BOT_CPU_INTERVAL:-10}"

count=$((DURATION / INTERVAL))
echo "# Container: $CONTAINER | Duration: ${DURATION}s | Interval: ${INTERVAL}s | Samples: $count"
echo "# Format: CPUPerc,MemUsage"
for i in $(seq 1 "$count"); do
  docker stats --no-stream "$CONTAINER" --format "{{.CPUPerc}},{{.MemUsage}}" 2>/dev/null || true
  sleep "$INTERVAL"
done

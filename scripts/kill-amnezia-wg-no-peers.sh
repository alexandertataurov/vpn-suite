#!/usr/bin/env bash
# Stop amnezia-awg* containers that have zero WireGuard peers.
# Run on host: ./scripts/kill-amnezia-wg-no-peers.sh
# Legacy root helper retained until it is moved under infra/scripts/ops.
set -e

for c in $(docker ps --format '{{.Names}}' | grep -E '^amnezia-awg'); do
  ifaces=$(docker exec "$c" wg show interfaces 2>/dev/null) || true
  if [ -z "$ifaces" ]; then
    echo "Skip $c (no wg interfaces)"
    continue
  fi
  peers=0
  for iface in $ifaces; do
    dump=$(docker exec "$c" wg show "$iface" dump 2>/dev/null) || true
    # First line = interface; rest = peers
    n=$(echo "$dump" | grep -c . 2>/dev/null || echo 0)
    [ "$n" -gt 1 ] && peers=$((peers + n - 1))
  done
  if [ "$peers" -eq 0 ]; then
    echo "Stopping $c (0 peers)"
    docker stop "$c"
  else
    echo "Keep $c ($peers peers)"
  fi
done

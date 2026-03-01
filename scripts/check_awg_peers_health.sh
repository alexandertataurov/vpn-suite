#!/usr/bin/env bash
# Health-check for AmneziaWG peers on awg0 with automatic repair via node-resync.
set -euo pipefail
IFS=$'\n\t'

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

command -v docker >/dev/null 2>&1 || { echo "docker binary not found; cannot run awg peers health-check." >&2; exit 1; }

container_name="${AWG_CONTAINER_NAME:-amnezia-awg}"
iface="${AWG_INTERFACE_NAME:-awg0}"

if command -v timeout >/dev/null 2>&1; then
  dump="$(docker exec "$container_name" timeout 5 wg show "$iface" dump 2>/dev/null || true)"
else
  dump="$(docker exec "$container_name" wg show "$iface" dump 2>/dev/null || true)"
fi

if [[ -z "$dump" ]]; then
  echo "wg show $iface dump returned no data for container=$container_name; skipping repair." >&2
  exit 1
fi

lines=$(printf "%s\n" "$dump" | grep -c . || echo 0)
peers=0
if [[ "$lines" -gt 1 ]]; then
  peers=$((lines - 1))
fi

echo "awg0 peers health-check: container=$container_name iface=$iface peers=$peers"

if [[ "$peers" -eq 0 ]]; then
  echo "No peers detected on $iface; running ./manage.sh node-resync to repair from DB..." >&2
  ENV_FILE="${ENV_FILE:-.env}" ./manage.sh node-resync || {
    echo "manage.sh node-resync failed; manual investigation required." >&2
    exit 1
  }
  exit 2
fi

exit 0

#!/usr/bin/env bash
# Clean up all AmneziaWG containers, volumes, images, and host files.
# Run on host with Docker access.
set -e

echo "=== Stopping amnezia-awg* containers ==="
for c in $(docker ps -a --format '{{.Names}}' | grep -E '^amnezia-awg' || true); do
  docker stop "$c" 2>/dev/null || true
  docker rm -f "$c" 2>/dev/null || true
  echo "Removed $c"
done

echo "=== Removing amnezia_awg_data volume ==="
docker volume rm vpn-suite_amnezia_awg_data 2>/dev/null || true

echo "=== Removing amnezia-awg images ==="
docker images --format '{{.Repository}}:{{.Tag}}' \
  | grep -E '^(amnezia-awg-compatible|amnezia-awg2):' \
  | xargs -r docker rmi 2>/dev/null || true

echo "=== Disabling amnezia-watchdog service ==="
systemctl stop amnezia-watchdog.service 2>/dev/null || true
systemctl disable amnezia-watchdog.service 2>/dev/null || true
rm -f /etc/systemd/system/amnezia-watchdog.service
rm -f /etc/systemd/system/multi-user.target.wants/amnezia-watchdog.service 2>/dev/null || true
systemctl daemon-reload 2>/dev/null || true

echo "=== Removing host /etc/amnezia/amneziawg ==="
rm -rf /etc/amnezia/amneziawg 2>/dev/null || true
# Remove /etc/amnezia if empty
rmdir /etc/amnezia 2>/dev/null || true

echo "=== Done ==="

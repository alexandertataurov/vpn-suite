#!/usr/bin/env bash
# AmneziaWG "нет трафика" + DB vs Runtime — диагностика на сервере.
# Usage: run on host or inside admin-api container; set AWG_CONTAINER and WG_PORT.
set -euo pipefail
IFS=$'\n\t'

command -v docker >/dev/null 2>&1 || { echo "docker not found" >&2; exit 1; }

AWG_CONTAINER="${AWG_CONTAINER:-amnezia-awg}"
WG_PORT="${WG_PORT:-45790}"
IFACE="${IFACE:-awg0}"

echo "=== 1) Interface and listen port ==="
docker exec "$AWG_CONTAINER" wg show 2>/dev/null || true
docker exec "$AWG_CONTAINER" ip -br a 2>/dev/null | head -20
echo "--- UDP listen $WG_PORT ---"
docker exec "$AWG_CONTAINER" ss -lunp 2>/dev/null | rg -n ":$WG_PORT|$WG_PORT " || true

echo ""
echo "=== 2) Peers (wg show $IFACE) ==="
docker exec "$AWG_CONTAINER" wg show "$IFACE" 2>/dev/null || true

echo ""
echo "=== 3) IP forward ==="
docker exec "$AWG_CONTAINER" sysctl net.ipv4.ip_forward net.ipv6.conf.all.forwarding 2>/dev/null || true

echo ""
echo "=== 4) NAT (POSTROUTING) — expect MASQUERADE for VPN subnet ==="
docker exec "$AWG_CONTAINER" iptables -t nat -S POSTROUTING 2>/dev/null | rg -n "10\.|MASQUERADE" | head -20

echo ""
echo "=== 5) FORWARD — expect ACCEPT for awg0 <-> eth0 ==="
docker exec "$AWG_CONTAINER" iptables -S FORWARD 2>/dev/null | head -25

echo ""
echo "=== 6) Routes (VPN subnet via $IFACE) ==="
docker exec "$AWG_CONTAINER" ip route 2>/dev/null | rg -n "10\.|$IFACE" || true

echo ""
echo "=== 7) Client public key from PrivateKey (run where wg is available) ==="
echo "  Use: echo '<ClientPrivateKey>' | wg pubkey"
echo "  Then: docker exec $AWG_CONTAINER wg show $IFACE | sed -n '/peer: <CLIENT_PUBKEY>/,/peer:/p'"

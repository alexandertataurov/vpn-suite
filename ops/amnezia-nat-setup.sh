#!/usr/bin/env bash
# Add NAT (MASQUERADE) for AmneziaWG tunnel subnets so client traffic can reach the internet.
# Run on the VPN host as root (or via sudo). Persists until reboot unless iptables-persistent is used.
# Usage: sudo ./ops/amnezia-nat-setup.sh [outbound_interface]
#
# Subnets: 10.8.1.0/24 (default vpn-suite), 10.66.66.0/24 (common amnezia-awg2)
# Also adds route 10.8.1.0/24 dev awg0 so reply traffic goes through the tunnel (required when awg0
# does not get this route from WireGuard, e.g. host network mode).

set -e

IFACE="${1:-}"
if [[ -z "$IFACE" ]]; then
  IFACE=$(ip route get 8.8.8.8 2>/dev/null | grep -oP 'dev \K\S+' || true)
fi
if [[ -z "$IFACE" ]]; then
  echo "Could not detect outbound interface. Pass it: $0 eth0" >&2
  exit 1
fi

for subnet in 10.8.1.0/24 10.66.66.0/24; do
  if iptables -t nat -C POSTROUTING -s "$subnet" -o "$IFACE" -j MASQUERADE 2>/dev/null; then
    echo "NAT rule already exists: $subnet -> $IFACE"
  else
    iptables -t nat -A POSTROUTING -s "$subnet" -o "$IFACE" -j MASQUERADE
    echo "Added NAT: $subnet -> $IFACE"
  fi
done

if command -v iptables-save >/dev/null 2>&1 && command -v netfilter-persistent >/dev/null 2>&1; then
  netfilter-persistent save 2>/dev/null && echo "Rules saved (netfilter-persistent)." || true
elif [[ -d /etc/iptables ]]; then
  iptables-save >/etc/iptables/rules.v4 2>/dev/null && echo "Rules saved to /etc/iptables/rules.v4." || true
fi

# Ensure reply traffic to tunnel clients goes via awg0 (not default route)
if ip link show awg0 &>/dev/null; then
  if ! ip route show | grep -q '10\.8\.1\.0/24.*dev awg0'; then
    ip route add 10.8.1.0/24 dev awg0
    echo "Added route 10.8.1.0/24 dev awg0"
  else
    echo "Route 10.8.1.0/24 dev awg0 already exists"
  fi
else
  echo "awg0 not found; skip route add (run again after AmneziaWG is up)"
fi

echo "Done. Verify: iptables -t nat -L POSTROUTING -n -v | grep -E '10\.8\.1|10\.66\.66'; ip route | grep 10.8.1"

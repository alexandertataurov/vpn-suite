#!/usr/bin/env bash
# Add NAT (MASQUERADE) for AmneziaWG tunnel subnets.
set -euo pipefail
IFS=$'\n\t'

log() { printf '%s\n' "$*" >&2; }

[[ $EUID -eq 0 ]] || { log "Run as root (or via sudo)."; exit 1; }

IFACE="${1:-}"
if [[ -z "$IFACE" ]]; then
  IFACE="$(ip route get 8.8.8.8 2>/dev/null | awk '{for (i=1;i<=NF;i++) if ($i=="dev") {print $(i+1); exit}}')"
fi
if [[ -z "$IFACE" ]]; then
  log "Could not detect outbound interface. Pass it: $0 eth0"
  exit 1
fi

add_nat() {
  local subnet="$1"
  if iptables -t nat -C POSTROUTING -s "$subnet" -o "$IFACE" -j MASQUERADE 2>/dev/null; then
    log "NAT rule already exists: $subnet -> $IFACE"
  else
    iptables -t nat -A POSTROUTING -s "$subnet" -o "$IFACE" -j MASQUERADE
    log "Added NAT: $subnet -> $IFACE"
  fi
}

add_nat "10.8.1.0/24"
add_nat "10.66.66.0/24"

if command -v iptables-save >/dev/null 2>&1 && command -v netfilter-persistent >/dev/null 2>&1; then
  netfilter-persistent save 2>/dev/null && log "Rules saved (netfilter-persistent)." || true
elif [[ -d /etc/iptables ]]; then
  iptables-save >/etc/iptables/rules.v4 2>/dev/null && log "Rules saved to /etc/iptables/rules.v4." || true
fi

if ip link show awg0 &>/dev/null; then
  if ip route show | grep -q '10\.8\.1\.0/24.*dev awg0'; then
    log "Route 10.8.1.0/24 dev awg0 already exists"
  else
    ip route replace 10.8.1.0/24 dev awg0
    log "Added route 10.8.1.0/24 dev awg0"
  fi
else
  log "awg0 not found; skip route add (run again after AmneziaWG is up)"
fi

log "Done. Verify: iptables -t nat -L POSTROUTING -n -v | grep -E '10\.8\.1|10\.66\.66'; ip route | grep 10.8.1"

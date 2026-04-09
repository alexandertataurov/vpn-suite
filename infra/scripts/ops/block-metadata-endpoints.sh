#!/usr/bin/env bash
# HARDENING: Block cloud metadata endpoints (169.254.0.0/16) to prevent SSRF/credential theft.
set -euo pipefail
IFS=$'\n\t'

[[ $EUID -eq 0 ]] || { echo "Run as root (sudo)"; exit 1; }

add_rule() {
  local chain="$1"
  if iptables -C "$chain" -d 169.254.0.0/16 -j DROP 2>/dev/null; then
    echo "Rule already exists in $chain"
  else
    iptables -A "$chain" -d 169.254.0.0/16 -j DROP
    echo "Added iptables rule: $chain DROP 169.254.0.0/16"
  fi
}

add_rule OUTPUT
add_rule FORWARD

echo "To persist: iptables-save | sudo tee /etc/iptables/rules.v4 (or netfilter-persistent)"

#!/usr/bin/env bash
# HARDENING: Block cloud metadata endpoints (169.254.0.0/16) to prevent SSRF/credential theft.
# Run: sudo ./ops/block-metadata-endpoints.sh

set -e
# Block outbound to metadata (AWS, GCP, Azure, etc.)
if iptables -C OUTPUT -d 169.254.0.0/16 -j DROP 2>/dev/null; then
  echo "Rule already exists"
else
  iptables -A OUTPUT -d 169.254.0.0/16 -j DROP
  echo "Added iptables rule: DROP 169.254.0.0/16"
fi
# Persist: apt install iptables-persistent; iptables-save > /etc/iptables/rules.v4
echo "To persist: iptables-save | sudo tee /etc/iptables/rules.v4 (or netfilter-persistent)"

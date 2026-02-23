#!/usr/bin/env bash
# HARDENING: Remove UFW allow 8000 — admin-api binds 127.0.0.1:8000 only.
# Run: sudo ./ops/ufw-remove-8000.sh

set -e
ufw status | grep -q "8000" && ufw delete allow 8000 || echo "Port 8000 not in UFW (already removed)."
ufw status | grep -q "8000 (v6)" && ufw delete allow 8000/tcp 2>/dev/null || true
echo "Done. Verify: ufw status"

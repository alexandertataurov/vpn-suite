#!/usr/bin/env bash
# HARDENING: Remove UFW allow 8000 — admin-api binds 127.0.0.1:8000 only.
set -euo pipefail
IFS=$'\n\t'

command -v ufw >/dev/null 2>&1 || { echo "ufw not installed"; exit 1; }
[[ $EUID -eq 0 ]] || { echo "Run as root (sudo)"; exit 1; }

ufw status | grep -q "8000" && ufw delete allow 8000 || echo "Port 8000 not in UFW (already removed)."
ufw status | grep -q "8000 (v6)" && ufw delete allow 8000/tcp 2>/dev/null || true
echo "Done. Verify: ufw status"

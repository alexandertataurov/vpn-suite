#!/usr/bin/env bash
# HARDENING: Install and configure fail2ban for sshd.
set -euo pipefail
IFS=$'\n\t'

[[ $EUID -eq 0 ]] || { echo "Run as root (sudo)"; exit 1; }

apt-get update
apt-get install -y --no-install-recommends fail2ban

cat > /etc/fail2ban/jail.d/sshd.conf << 'EOF2'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF2

systemctl enable --now fail2ban
echo "Done. Status: fail2ban-client status"

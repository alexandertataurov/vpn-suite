#!/usr/bin/env bash
# HARDENING: Install and configure fail2ban for sshd.
# Run: sudo ./ops/setup-fail2ban.sh

set -e
apt-get update && apt-get install -y fail2ban
cat > /etc/fail2ban/jail.d/sshd.conf << 'EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF
systemctl enable fail2ban
systemctl restart fail2ban
echo "Done. Status: fail2ban-client status"

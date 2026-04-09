#!/usr/bin/env bash
# HARDENING: Set chmod 600 on all secret files.
set -euo pipefail
IFS=$'\n\t'

[[ $EUID -eq 0 ]] || { echo "Run as root (sudo)"; exit 1; }
cd "$(dirname "$0")/.."
umask 077

stat_perm() {
  stat -c '%a' "$1" 2>/dev/null || stat -f '%A' "$1" 2>/dev/null || echo ""
}

FIXED=0
for f in \
  .env .env.production .env.local \
  secrets/*.pem secrets/README.md \
  /opt/amnezia/amnezia-awg2/secrets/awg_private_key \
  /opt/amnezia/amnezia-awg2/secrets/node.env \
  ; do
  [[ -e "$f" ]] || continue
  perms="$(stat_perm "$f")"
  if [[ "$perms" != "600" && "$perms" != "400" ]]; then
    chmod 600 "$f"
    echo "chmod 600: $f"
    FIXED=$((FIXED + 1))
  fi
done

for d in secrets secrets/pki; do
  [[ -d "$d" ]] && chmod 700 "$d" && echo "chmod 700: $d" && FIXED=$((FIXED + 1))
done
echo "Done. Fixed $FIXED items."

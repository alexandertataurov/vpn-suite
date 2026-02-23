#!/usr/bin/env bash
# HARDENING: Set chmod 600 on all secret files.
# Run: sudo ./ops/harden-secrets.sh

set -e

cd "$(dirname "$0")/.."

FIXED=0
for f in \
  .env .env.production .env.local \
  secrets/*.pem secrets/README.md \
  /opt/amnezia/amnezia-awg2/secrets/awg_private_key \
  /opt/amnezia/amnezia-awg2/secrets/node.env \
  /opt/outline/access.txt \
  ; do
  [ -e "$f" ] || continue
  perms=$(stat -c '%a' "$f" 2>/dev/null || stat -f '%A' "$f" 2>/dev/null)
  if [ "$perms" != "600" ] && [ "$perms" != "400" ]; then
    chmod 600 "$f"
    echo "chmod 600: $f"
    FIXED=$((FIXED + 1))
  fi
done
# Directory: secrets/ and secrets/pki/
for d in secrets secrets/pki; do
  [ -d "$d" ] && chmod 700 "$d" && echo "chmod 700: $d" && FIXED=$((FIXED + 1))
done
echo "Done. Fixed $FIXED items."

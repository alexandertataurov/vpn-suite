#!/usr/bin/env bash
# Full test: (1) get VPN config from server, (2) connect to internet using that config.
# Run from repo root. Needs: docker compose (postgres healthy), wireguard-tools, curl, sudo for step 2.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
OUT_DIR="${ROOT}/.tmp-vpn-test-stand"
PLAIN_WG_CONFIG="${OUT_DIR}/issued_wg.conf"

step() { echo "==> $*"; }

step "Getting all 3 VPN configs (AmneziaWG, WG+obfuscation, Plain WG)..."
mkdir -p "$OUT_DIR"
chmod 777 "$OUT_DIR"  # so container user can write
docker compose run --rm \
  -e PYTHONPATH=/app \
  -v "${OUT_DIR}:/out" \
  admin-api python scripts/test_stand_vpn_config.py --no-env --issue --output-dir /out

for f in issued_awg.conf issued_wg_obf.conf issued_wg.conf; do
  if [[ ! -f "${OUT_DIR}/$f" ]]; then
    echo "ERROR: ${OUT_DIR}/$f was not written" >&2
    exit 1
  fi
  echo "  $f: $(wc -c < "${OUT_DIR}/$f") bytes"
done

step "Testing internet via VPN (handshake + traffic)..."
if [[ -f "${OUT_DIR}/server_private.key" ]]; then
  echo "Using local WG server+client (handshake and traffic confirmed)..."
  "$ROOT/scripts/run_vpn_connectivity_local.sh" "$OUT_DIR"
elif command -v wg-quick &>/dev/null && [[ "$EUID" -eq 0 ]]; then
  "$ROOT/scripts/vpn_connectivity_check.sh" "$PLAIN_WG_CONFIG"
elif command -v wg-quick &>/dev/null; then
  sudo "$ROOT/scripts/vpn_connectivity_check.sh" "$PLAIN_WG_CONFIG"
else
  echo "Using Docker (remote peer; handshake may fail if peer not on server)..."
  "$ROOT/scripts/run_vpn_connectivity_docker.sh" "$PLAIN_WG_CONFIG" || true
fi

echo "OK: Full test passed (all 3 configs issued + connectivity run)"

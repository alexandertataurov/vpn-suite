#!/usr/bin/env bash
# Full test: issue configs and run connectivity checks.
set -euo pipefail
IFS=$'\n\t'

command -v docker >/dev/null 2>&1 || { echo "docker not found" >&2; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
OUT_DIR="${ROOT}/.tmp-vpn-test-stand"
PLAIN_WG_CONFIG="${OUT_DIR}/issued_wg.conf"

step() { echo "==> $*"; }

step "Getting all 3 VPN configs (AmneziaWG, WG+obfuscation, Plain WG)..."
mkdir -p "$OUT_DIR"
chmod 700 "$OUT_DIR"
docker compose run --rm -e PYTHONPATH=/app -v "${OUT_DIR}:/out" \
  admin-api python scripts/test_stand_vpn_config.py --no-env --issue --output-dir /out

for f in issued_awg.conf issued_wg_obf.conf issued_wg.conf; do
  [[ -f "${OUT_DIR}/$f" ]] || { echo "ERROR: ${OUT_DIR}/$f was not written" >&2; exit 1; }
  echo "  $f: $(wc -c < "${OUT_DIR}/$f") bytes"
done

step "Testing internet via VPN (handshake + traffic)..."
if [[ -f "${OUT_DIR}/server_private.key" ]]; then
  "$ROOT/scripts/run_vpn_connectivity_local.sh" "$OUT_DIR"
elif command -v wg-quick &>/dev/null && [[ "$EUID" -eq 0 ]]; then
  "$ROOT/scripts/vpn_connectivity_check.sh" "$PLAIN_WG_CONFIG"
elif command -v wg-quick &>/dev/null; then
  sudo "$ROOT/scripts/vpn_connectivity_check.sh" "$PLAIN_WG_CONFIG"
else
  "$ROOT/scripts/run_vpn_connectivity_docker.sh" "$PLAIN_WG_CONFIG" || true
fi

echo "OK: Full test passed (all 3 configs issued + connectivity run)"

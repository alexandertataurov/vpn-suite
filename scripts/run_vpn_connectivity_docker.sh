#!/usr/bin/env bash
# Run VPN connectivity test in a Docker container (no host wireguard-tools needed).
set -euo pipefail
IFS=$'\n\t'

CONFIG_FILE="${1:?Usage: $0 /path/to/issued_wg.conf}"
[[ -f "$CONFIG_FILE" ]] || { echo "ERROR: Config file not found: $CONFIG_FILE" >&2; exit 1; }

CURL_TIMEOUT="${CURL_TIMEOUT:-20}"
CHECK_URL="${CHECK_URL:-https://ifconfig.me}"
CONFIG_ABS="$(realpath "$CONFIG_FILE")"

echo "==> Running connectivity test in container (config: $CONFIG_FILE)"
docker run --rm --cap-add=NET_ADMIN \
  -v "${CONFIG_ABS}:/etc/wireguard/wg0.conf:ro" \
  alpine sh -c "
    apk add --no-cache wireguard-tools curl >/dev/null 2>&1
    PRIV=\$(awk -F'= ' '/^PrivateKey =/{print \$2; exit}' /etc/wireguard/wg0.conf | tr -d '\r')
    ADDR=\$(awk -F'= ' '/^Address =/{print \$2; exit}' /etc/wireguard/wg0.conf | tr -d '\r')
    PUB=\$(awk -F'= ' '/^PublicKey =/{print \$2; exit}' /etc/wireguard/wg0.conf | tr -d '\r')
    ENDP=\$(awk -F'= ' '/^Endpoint =/{print \$2; exit}' /etc/wireguard/wg0.conf | tr -d '\r')
    IPS=\$(awk -F'= ' '/^AllowedIPs =/{print \$2; exit}' /etc/wireguard/wg0.conf | tr -d '\r')
    PK=\$(awk -F'= ' '/^PersistentKeepalive =/{print \$2; exit}' /etc/wireguard/wg0.conf | tr -d '\r')
    [ -n \"\$PRIV\" ] && [ -n \"\$ADDR\" ] && [ -n \"\$PUB\" ] && [ -n \"\$ENDP\" ] && [ -n \"\$IPS\" ] || { echo 'Missing required WG config fields'; exit 1; }
    ip link add dev wg0 type wireguard
    echo \"\$PRIV\" | wg set wg0 private-key /dev/stdin
    wg set wg0 peer \"\$PUB\" allowed-ips \"\$IPS\" endpoint \"\$ENDP\" persistent-keepalive \"\${PK:-25}\"
    ip -4 address add \"\$ADDR\" dev wg0
    ip link set mtu 1420 up dev wg0
    ip route add 0.0.0.0/1 dev wg0 2>/dev/null
    ip route add 128.0.0.0/1 dev wg0 2>/dev/null
    echo '=== wg show ==='
    wg show wg0
    echo \"=== curl ${CHECK_URL} (timeout ${CURL_TIMEOUT}s) ===\"
    EXIT_IP=\$(curl -s --max-time ${CURL_TIMEOUT} ${CHECK_URL} 2>/dev/null || true)
    ip link del dev wg0 2>/dev/null || true
    echo \"Exit IP: \${EXIT_IP:-FAIL}\"
    if [ -n \"\$EXIT_IP\" ]; then echo 'OK: Internet via VPN'; exit 0; else echo 'FAIL: No response'; exit 1; fi
  "

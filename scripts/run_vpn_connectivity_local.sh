#!/usr/bin/env bash
# Local connectivity test: run a WG server container + client container so handshake and traffic are confirmed.
# Requires: .tmp-vpn-test-stand/issued_wg.conf and server_private.key (from test stand --issue --output-dir).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${1:-${ROOT}/.tmp-vpn-test-stand}"
CLIENT_CONF="${OUT_DIR}/issued_wg.conf"
SERVER_KEY_FILE="${OUT_DIR}/server_private.key"
NET_NAME="vpn-test-net"
SERVER_NAME="wg-server"
CURL_TIMEOUT="${CURL_TIMEOUT:-15}"
CHECK_URL="${CHECK_URL:-https://ifconfig.me}"

if [[ ! -f "$CLIENT_CONF" ]] || [[ ! -f "$SERVER_KEY_FILE" ]]; then
  echo "ERROR: Need $CLIENT_CONF and $SERVER_KEY_FILE. Run test stand with --issue --output-dir first." >&2
  exit 1
fi

TMP_PRIV=$(mktemp)
SERVER_CONF=$(mktemp)
CLIENT_CONF_LOCAL=$(mktemp)
trap "rm -f $TMP_PRIV $SERVER_CONF $CLIENT_CONF_LOCAL; docker rm -f $SERVER_NAME 2>/dev/null; docker network rm $NET_NAME 2>/dev/null || true" EXIT

CLIENT_PRIV=$(awk '/^PrivateKey =/{sub(/^PrivateKey = /,""); print; exit}' "$CLIENT_CONF" | tr -d '\r\n')
SERVER_PRIV=$(cat "$SERVER_KEY_FILE" | tr -d '\r\n')

echo "==> Getting client public key..."
printf '%s' "$CLIENT_PRIV" > "$TMP_PRIV"
CLIENT_PUB=$(docker run --rm -v "$TMP_PRIV:/key:ro" alpine sh -c "apk add --no-cache wireguard-tools >/dev/null 2>&1 && wg pubkey < /key")
echo "==> Creating server config..."
cat > "$SERVER_CONF" << EOF
[Interface]
PrivateKey = $SERVER_PRIV
Address = 10.8.0.1/24
ListenPort = 47604

[Peer]
PublicKey = $CLIENT_PUB
AllowedIPs = 10.8.1.2/32
EOF

echo "==> Creating network and starting WG server..."
docker network create "$NET_NAME" 2>/dev/null || true
docker rm -f "$SERVER_NAME" 2>/dev/null || true
docker run -d --name "$SERVER_NAME" --cap-add=NET_ADMIN --sysctl net.ipv4.ip_forward=1 \
  --network "$NET_NAME" \
  -v "$SERVER_CONF:/etc/wireguard/wg0.conf:ro" \
  alpine sh -c "apk add --no-cache wireguard-tools iptables >/dev/null 2>&1 && wg-quick up wg0 && (iptables -t nat -A POSTROUTING -s 10.8.1.0/24 -o eth0 -j MASQUERADE || true) && sleep infinity"
sleep 2

echo "==> Starting client (endpoint $SERVER_NAME:47604)..."
sed "s|Endpoint = .*|Endpoint = $SERVER_NAME:47604|" "$CLIENT_CONF" > "$CLIENT_CONF_LOCAL"

docker run --rm --cap-add=NET_ADMIN \
  --network "$NET_NAME" \
  -v "$CLIENT_CONF_LOCAL:/etc/wireguard/wg0.conf:ro" \
  alpine sh -c "
    apk add --no-cache wireguard-tools curl >/dev/null 2>&1
    PRIV=\$(awk -F'= ' '/^PrivateKey =/{print \$2; exit}' /etc/wireguard/wg0.conf | tr -d '\r\n')
    ADDR=\$(awk -F'= ' '/^Address =/{print \$2; exit}' /etc/wireguard/wg0.conf | tr -d '\r\n')
    PUB=\$(awk -F'= ' '/^PublicKey =/{print \$2; exit}' /etc/wireguard/wg0.conf | tr -d '\r\n')
    ENDP=\$(awk -F'= ' '/^Endpoint =/{print \$2; exit}' /etc/wireguard/wg0.conf | tr -d '\r\n')
    IPS=\$(awk -F'= ' '/^AllowedIPs =/{print \$2; exit}' /etc/wireguard/wg0.conf | tr -d '\r\n')
    PK=\$(awk -F'= ' '/^PersistentKeepalive =/{print \$2; exit}' /etc/wireguard/wg0.conf | tr -d '\r\n')
    ip link add dev wg0 type wireguard
    echo \"\$PRIV\" | wg set wg0 private-key /dev/stdin
    wg set wg0 peer \"\$PUB\" allowed-ips \"\$IPS\" endpoint \"\$ENDP\" persistent-keepalive \"\${PK:-25}\"
    ip -4 address add \"\$ADDR\" dev wg0
    ip link set mtu 1420 up dev wg0
    ip route add 0.0.0.0/1 dev wg0 2>/dev/null
    ip route add 128.0.0.0/1 dev wg0 2>/dev/null
    echo '=== wg show (handshake?) ==='
    wg show wg0
    echo \"=== curl ${CHECK_URL} (timeout ${CURL_TIMEOUT}s) ===\"
    EXIT_IP=\$(curl -s --max-time ${CURL_TIMEOUT} ${CHECK_URL} 2>/dev/null || true)
    ip link del dev wg0 2>/dev/null || true
    echo \"Exit IP: \${EXIT_IP:-FAIL}\"
    if [ -n \"\$EXIT_IP\" ]; then echo 'OK: Handshake and traffic confirmed'; exit 0; else echo 'FAIL: No response'; exit 1; fi
  "

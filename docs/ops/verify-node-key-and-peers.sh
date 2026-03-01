#!/usr/bin/env bash
# Запустить на хосте, где крутится контейнер AmneziaWG (нода amnezia-awg2).
# Подставьте имя/ID контейнера вместо CONTAINER.
set -euo pipefail
IFS=$'\n\t'

command -v docker >/dev/null 2>&1 || { echo "docker not found" >&2; exit 1; }

CONTAINER="${1:-amnezia-awg2}"
echo "=== Server public key (должен совпадать с PublicKey в конфиге) ==="
docker exec "$CONTAINER" awg show awg0 public-key 2>/dev/null || docker exec "$CONTAINER" wg show awg0 public-key
echo ""
echo "=== Peers (должен быть публичный ключ клиента из конфига) ==="
docker exec "$CONTAINER" awg show awg0 2>/dev/null || docker exec "$CONTAINER" wg show awg0
